// client/pages/Driver.jsx
import { useEffect, useState } from "react";
import { Box, Typography, Paper, Button, Divider } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { api } from "../../utils/api";
import EarningSummary from "../components/EarningSummary";

export default function Driver() {
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [coords, setCoords] = useState({ lat: 27.33, lng: 88.61 });
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalRides, setTotalRides] = useState(0);

  const storedSession = (() => {
    try {
      return JSON.parse(localStorage.getItem("userSession"));
    } catch {
      return null;
    }
  })();
  const driverId = storedSession?.user?.id || localStorage.getItem("userId");
  const driverName =
    storedSession?.user?.user_metadata?.name || localStorage.getItem("userName") || "Driver";

  const fetchRides = async () => {
    try {
      const data = await api.getRides();
      if (Array.isArray(data)) {
        setRideRequests(data.filter((r) => r.status === "requested"));
        const myActive = data.find((r) => String(r.driver_id) === String(driverId) && r.status !== "completed");
        setActiveRide(myActive || null);
      }
    } catch (err) {
      console.error("fetch rides error", err);
    }
  };

  const fetchEarnings = async () => {
    if (!driverId) return;
    try {
      const data = await api.getDriverEarnings(driverId);
      setTodayEarnings(data.todayEarnings || 0);
      setTotalRides(data.totalRides || 0);
    } catch (err) {
      console.error("earnings fetch error", err);
    }
  };

  const handleAccept = async (rideId) => {
    try {
      const data = await api.acceptRide(rideId, { driver_id: driverId });
      setRideRequests((prev) => prev.filter((r) => r.id !== rideId));
      setActiveRide(data);
      fetchEarnings();
    } catch (err) {
      alert(err.message || "Accept failed");
    }
  };

  const handleDecline = async (rideId) => {
    try {
      // NOTE: Decline not implemented in backend, optional to add
      setRideRequests((prev) => prev.filter((r) => r.id !== rideId));
    } catch (err) {
      alert(err.message || "Decline failed");
    }
  };

  const startRide = async (rideId) => {
    try {
      const data = await api.startRide(rideId);
      setActiveRide(data);
    } catch (err) {
      alert(err.message || "Start failed");
    }
  };

  const completeRide = async (rideId) => {
    try {
      const data = await api.completeRide(rideId);
      setActiveRide(null);
      fetchRides();
      fetchEarnings();
    } catch (err) {
      alert(err.message || "Complete failed");
    }
  };

  // Update live driver location
  useEffect(() => {
    if (!driverId) return;
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          try {
            await api.updateDriverStatus(driverId, {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              is_online: true,
            });
          } catch (err) {
            console.error("location update failed", err);
          }
        },
        (err) => console.error("GPS error", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [driverId]);

  useEffect(() => {
    fetchRides();
    fetchEarnings();
    const channel = supabase
      .channel("rides-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rides" }, (payload) => {
        if (payload.new.status === "requested") setRideRequests((prev) => [...prev, payload.new]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides" }, (payload) => {
        if (String(payload.new.driver_id) === String(driverId)) setActiveRide(payload.new);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [driverId]);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3, pt: 10 }}>
      <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center" sx={{ color: "#222" }}>
        Welcome, {driverName} 🚖
      </Typography>

      <EarningSummary todayEarnings={todayEarnings} totalRides={totalRides} />

      {/* Map */}
      <Box sx={{ height: 400, borderRadius: 3, overflow: "hidden", mb: 3 }}>
        <MapContainer center={[coords.lat, coords.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[coords.lat, coords.lng]}>
            <Popup>📍 You (Driver)</Popup>
          </Marker>
        </MapContainer>
      </Box>

      {/* Active ride */}
      {activeRide && (
        <Paper sx={{ p: 3, bgcolor: "#fff9c4", mb: 3 }}>
          <Typography variant="h6">🚖 Active Ride</Typography>
          <Typography><b>Pickup:</b> {activeRide.pickup_location}</Typography>
          <Typography><b>Dropoff:</b> {activeRide.dropoff_location}</Typography>
          <Typography><b>Fare:</b> ₹{activeRide.fare}</Typography>
          <Divider sx={{ my: 2 }} />
          {activeRide.status === "accepted" && <Button variant="contained" onClick={() => startRide(activeRide.id)}>Start Ride</Button>}
          {activeRide.status === "in_progress" && <Button variant="contained" color="success" onClick={() => completeRide(activeRide.id)}>Complete Ride</Button>}
        </Paper>
      )}

      {/* Pending requests */}
      <Typography variant="h6" mb={2}>🆕 Ride Requests</Typography>
      {rideRequests.length === 0 && <Paper sx={{ p: 3, bgcolor: "#eee" }}>No new ride requests</Paper>}
      {rideRequests.map((ride) => (
        <Paper key={ride.id} sx={{ p: 3, mb: 2 }}>
          <Typography><b>From:</b> {ride.pickup_location}</Typography>
          <Typography><b>To:</b> {ride.dropoff_location}</Typography>
          <Typography><b>Fare:</b> ₹{ride.fare}</Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button variant="contained" color="primary" onClick={() => handleAccept(ride.id)}>Accept</Button>
            <Button variant="outlined" color="error" onClick={() => handleDecline(ride.id)}>Decline</Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
