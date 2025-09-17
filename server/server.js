import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Supabase server client (service role key for admin ops)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// ------------------------
// Middleware
// ------------------------
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/api/stripe-webhook", bodyParser.raw({ type: "application/json" }));
app.use(express.json());

// ------------------------
// Health Check
// ------------------------
app.get("/", (_, res) => res.send("🚖 Uber Clone Backend Running"));

// ==========================
// AUTH ROUTES
// ==========================
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      });
    if (authError) return res.status(400).json({ error: authError.message });

    const userId = authData.user.id;
    await supabase.from("users").insert([{ id: userId, name, email, role }]);

    return res.status(201).json({ user: authData.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });

    // set httpOnly cookie
    res.cookie("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.json({ user: data.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Password reset email sent" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("sb-access-token");
  res.json({ message: "Logged out successfully" });
});

// Middleware: auth check
async function authMiddleware(req, res, next) {
  const token = req.cookies["sb-access-token"];
  if (!token) return res.status(401).json({ error: "Not logged in" });

  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  req.user = user.user;
  next();
}

// Current user
app.get("/api/me", authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// ==========================
// USERS
// ==========================
app.put("/api/users/:id/online", async (req, res) => {
  const { id } = req.params;
  const { is_online, lat, lng } = req.body;

  try {
    const { error } = await supabase
      .from("users")
      .update({
        is_online,
        lat,
        lng,
        last_online_update: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, is_online });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/drivers/online", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, lat, lng")
      .eq("role", "driver")
      .eq("is_online", true);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================
// RIDES
// ==========================
app.post("/api/ratings", async (req, res) => {
  try {
    const { ride_id, user_id, rating, comment } = req.body;
    if (!ride_id || !user_id || !rating)
      return res.status(400).json({ error: "ride_id, user_id, and rating required" });

    const { data, error } = await supabase
      .from("ratings")
      .insert([{ ride_id, user_id, rating, comment }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rides", async (req, res) => {
  try {
    const rideData = req.body;
    rideData.status = "requested";
    rideData.payment_status = "unpaid";
    const { data, error } = await supabase
      .from("rides")
      .insert([rideData])
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/rides", async (req, res) => {
  try {
    const { passenger_id, driver_id } = req.query;
    let q = supabase.from("rides").select("*");
    if (passenger_id) q = q.eq("passenger_id", passenger_id);
    if (driver_id) q = q.eq("driver_id", driver_id);
    const { data, error } = await q;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/rides/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("rides").select("*").eq("id", id).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept ride → also save driver_name
app.put("/api/rides/:id/accept", async (req, res) => {
  try {
    const rideId = req.params.id;
    const { driver_id } = req.body;

    const { data: driver, error: userErr } = await supabase
      .from("users")
      .select("name")
      .eq("id", driver_id)
      .single();
    if (userErr) return res.status(400).json({ error: userErr.message });

    const { data, error } = await supabase
      .from("rides")
      .update({
        driver_id,
        driver_name: driver?.name || null,
        status: "accepted",
      })
      .eq("id", rideId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/rides/:id/start", async (req, res) => {
  try {
    const rideId = req.params.id;
    const { data, error } = await supabase
      .from("rides")
      .update({ status: "in_progress" })
      .eq("id", rideId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/rides/:id/complete", async (req, res) => {
  try {
    const rideId = req.params.id;
    const { data, error } = await supabase
      .from("rides")
      .update({ status: "completed" })
      .eq("id", rideId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// STRIPE PAYMENTS
// ==========================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { ride_id, amount } = req.body;
    if (!ride_id || !amount)
      return res.status(400).json({ error: "ride_id and amount required" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Ride payment",
              description: `Ride ${ride_id}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payments?success=true&ride_id=${ride_id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payments?canceled=true&ride_id=${ride_id}`,
      metadata: { ride_id },
    });

    await supabase.from("payments").insert([
      {
        ride_id,
        user_id: (
          await supabase
            .from("rides")
            .select("passenger_id")
            .eq("id", ride_id)
            .single()
        ).data?.passenger_id,
        amount,
        status: "pending",
        payment_method: "stripe",
      },
    ]);

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/stripe-webhook", (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const rideId = session.metadata?.ride_id;
    (async () => {
      try {
        await supabase
          .from("payments")
          .update({ status: "successful" })
          .eq("ride_id", rideId);
        await supabase
          .from("rides")
          .update({ payment_status: "paid" })
          .eq("id", rideId);
      } catch (e) {
        console.error(e);
      }
    })();
  }
  res.json({ received: true });
});

// Manual verify
app.get("/api/payments/verify/:rideId", async (req, res) => {
  try {
    const { rideId } = req.params;
    const { data: payment } = await supabase
      .from("payments")
      .select("status")
      .eq("ride_id", rideId)
      .single();

    if (payment?.status === "successful") {
      await supabase
        .from("rides")
        .update({ payment_status: "paid" })
        .eq("id", rideId);
      return res.json({ paid: true });
    }
    res.json({ paid: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// DRIVER EARNINGS
// ==========================
app.get("/api/drivers/:id/earnings", async (req, res) => {
  try {
    const driverId = req.params.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data: rides, error } = await supabase
      .from("rides")
      .select("fare, pickup_time")
      .eq("driver_id", driverId)
      .eq("payment_status", "paid");

    if (error) return res.status(400).json({ error: error.message });

    const todayEarnings = rides
      .filter((r) => {
        const rideDate = new Date(r.pickup_time);
        return rideDate >= today && rideDate < tomorrow;
      })
      .reduce((sum, r) => sum + (r.fare || 0), 0);

    const totalRides = rides.length;
    res.json({ todayEarnings, totalRides });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () =>
  console.log(`🚀 API running on port ${PORT}`)
);
