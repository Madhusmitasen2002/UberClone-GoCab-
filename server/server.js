// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

dotenv.config();
const app = express();

// We need raw body for Stripe webhook; json for others
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:5173"]
  })
);
app.use(express.json());

// Supabase server client (SERVICE ROLE KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// ----- Health -----
app.get("/", (_, res) => res.send("🚖 Uber Clone Backend Running"));

// ----- AUTH helper routes (signup/login can be client-side too) -----
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (authError) return res.status(400).json({ error: authError.message });

    const userId = authData.user.id;
    const { error: insertError } = await supabase.from("users").insert([{ id: userId, name, email, role }]);
    if (insertError) console.warn("users insert warning:", insertError.message);

    return res.status(201).json({ user: authData.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Login endpoint (server proxy — client can call supabase client directly if you prefer)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all drivers (users with role = driver)
app.get("/api/drivers", async (_, res) => {
  try {
    const { data, error } = await supabase.from("users").select("id, name, phone, average_rating").eq("role", "driver");
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ----- RIDES -----
// Create ride
// Create ride
app.post("/api/rides", async (req, res) => {
  try {
    const {
      passenger_id,
      pickup_location,
      dropoff_location,
      pickup_time,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      distance_km,
      duration_min,
      fare,
    } = req.body;

    const payload = {
      passenger_id,
      pickup_location,
      dropoff_location,
      pickup_time,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      distance_km,
      duration_min,
      fare,
      status: "requested",
      payment_status: "unpaid",
    };

    const { data, error } = await supabase.from("rides").insert([payload]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Get rides (optionally filter by passenger_id or driver_id via query)
app.get("/api/rides", async (req, res) => {
  try {
    const { passenger_id, driver_id } = req.query;
    let q = supabase.from("rides").select("*");
    if (passenger_id) q = q.eq("passenger_id", passenger_id);
    if (driver_id) q = q.eq("driver_id", driver_id);
    const { data, error } = await q;
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Accept ride (assign driver)
app.put("/api/rides/:id/accept", async (req, res) => {
  try {
    const rideId = req.params.id;
    const { driver_id } = req.body;
    const { data, error } = await supabase
      .from("rides")
      .update({ driver_id, status: "accepted" })
      .eq("id", rideId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Cancel ride
app.put("/api/rides/:id/cancel", async (req, res) => {
  try {
    const rideId = req.params.id;
    const { data, error } = await supabase.from("rides").update({ status: "cancelled" }).eq("id", rideId).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ----- STRIPE Checkout session creator -----
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { ride_id, amount } = req.body;
    if (!ride_id || !amount) return res.status(400).json({ error: "ride_id and amount required" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: { name: "Ride payment", description: `Ride ${ride_id}` },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payments?success=true&ride_id=${ride_id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payments?canceled=true&ride_id=${ride_id}`,
      metadata: { ride_id }
    });

    // create pending payment row (optional)
    await supabase.from("payments").insert([{
      ride_id,
      user_id: (await supabase.from("rides").select("passenger_id").eq("id", ride_id).single()).data?.passenger_id,
      amount,
      status: "pending",
      payment_method: "stripe"
    }]);

    return res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ----- Stripe webhook endpoint (raw body required) -----
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const rideId = session.metadata?.ride_id;

    // mark payment as successful and update ride.payment_status
    (async () => {
      try {
        await supabase.from("payments").update({ status: "successful" }).eq("ride_id", rideId);
        await supabase.from("rides").update({ payment_status: "paid" }).eq("id", rideId);
      } catch (e) {
        console.error("Error updating DB after webhook:", e);
      }
    })();
  }

  res.json({ received: true });
});

// ----- RATINGS -----
app.post("/api/ratings", async (req, res) => {
  try {
    const { ride_id, rater_id, ratee_id, rating, comment } = req.body;
    const { data, error } = await supabase.from("ratings").insert([{ ride_id, rater_id, ratee_id, rating, comment }]).select().single();
    if (error) return res.status(400).json({ error: error.message });

    // update average rating for ratee (driver)
    const { data: driverRatings } = await supabase.from("ratings").select("rating").eq("ratee_id", ratee_id);
    if (driverRatings?.length) {
      const avg = driverRatings.reduce((s, r) => s + Number(r.rating), 0) / driverRatings.length;
      await supabase.from("users").update({ average_rating: Number(avg.toFixed(1)) }).eq("id", ratee_id);
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ----- START SERVER -----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
