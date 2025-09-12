import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import DriverListModal from "./DriverListModal";

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Recenter helper
function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center]);
  return null;
}


// Geocoding
async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await res.json();
    if (data?.length > 0)
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    return null;
  } catch (e) {
    console.error("geocode error", e);
    return null;
  }
}

// Get route + distance
async function getRoute(pickup, drop) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes?.[0]) {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distance = data.routes[0].distance || 0; // in meters
      const duration = data.routes[0].duration || 0; // in seconds
      return { coords, distance, duration };
    }
    return { coords: [], distance: 0, duration: 0 };
  } catch (e) {
    console.error("route error", e);
    return { coords: [], distance: 0, duration: 0 };
  }
}


export default function Rider() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [ride, setRide] = useState(null);
  const [showDrivers, setShowDrivers] = useState(false);

  const [center, setCenter] = useState([27.3314, 88.6138]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [route, setRoute] = useState([]);

  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [fare, setFare] = useState(0);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) =>
        setCenter([pos.coords.latitude, pos.coords.longitude])
      );
    }
  }, []);

  // Geocode from
  useEffect(() => {
    if (!from) return setPickupCoords(null);
    (async () => {
      const coords = await geocodeAddress(from);
      if (coords) {
        setPickupCoords(coords);
        setCenter(coords);
      }
    })();
  }, [from]);

  // Geocode to
  useEffect(() => {
    if (!to) return setDropCoords(null);
    (async () => {
      const coords = await geocodeAddress(to);
      if (coords) setDropCoords(coords);
    })();
  }, [to]);

  // Build route
  useEffect(() => {
    async function buildRoute() {
      if (!pickupCoords || !dropCoords) {
        setRoute([]);
        setDistanceKm(0);
        setDurationMin(0);
        setFare(0);
        return;
      }
      const r = await getRoute(pickupCoords, dropCoords);
      setRoute(r.coords || []);
      const km = (r.distance || 0) / 1000;
      const mins = (r.duration || 0) / 60;
      setDistanceKm(km);
      setDurationMin(mins);

      // fare formula
      const baseFare = 40;      // ₹ base
const perKm = 10;         // ₹ per km
const perMin = 0.5;       // ₹ per minute
const computed = Math.max(
  baseFare,
  Math.round(baseFare + perKm * km + perMin * mins)
);
setFare(computed);

    }
    buildRoute();
  }, [pickupCoords, dropCoords]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setPickupCoords(dropCoords);
    setDropCoords(pickupCoords);
    setRoute([]);
    setDistanceKm(0);
    setDurationMin(0);
    setFare(0);
  };

  const handleBook = async () => {
    if (!from || !to) return alert("Fill From & To");
    if (!userId) return alert("Please login first");

    try {
      const res = await fetch("http://localhost:5000/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passenger_id: userId,
          pickup_location: from,
          dropoff_location: to,
          pickup_time: time
  ? new Date(`${new Date().toISOString().split("T")[0]}T${time}:00Z`).toISOString()
  : new Date().toISOString(),

          pickup_lat: pickupCoords?.[0] ?? null,
          pickup_lng: pickupCoords?.[1] ?? null,
          dropoff_lat: dropCoords?.[0] ?? null,
          dropoff_lng: dropCoords?.[1] ?? null,
          distance_km: Number(distanceKm.toFixed(3)),
          duration_min: Number(durationMin.toFixed(1)),
          fare,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRide(data);
      setShowDrivers(true);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, width: "100%", p: 3, pt: 10, mx: "auto" }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
        textAlign="center"
        color="black"
      >
        Welcome Rider! 🚖
      </Typography>

      {/* Inputs */}
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <TextField
  label="From"
  value={from}
  onChange={(e) => setFrom(e.target.value)}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <LocationOnIcon sx={{ color: "black" }} />
      </InputAdornment>
    ),
    style: { color: "black" },
  }}
  InputLabelProps={{
    style: { color: "black" },
    shrink: true, // 👈 ensures label moves up even if field has value
  }}
  sx={{
    bgcolor: "white",
    borderRadius: 1,
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "black" },
      "&:hover fieldset": { borderColor: "gray" },
      "&.Mui-focused fieldset": { borderColor: "black" },
    },
    "& .MuiInputBase-input": {
      color: "black !important", // 👈 ensures text always visible
      zIndex: 2,
    },
    "& .MuiInputLabel-root": {
      color: "black",
    },
  }}
  fullWidth
/>

        <Box display="flex" justifyContent="center">
          <IconButton
            onClick={handleSwap}
            sx={{
              bgcolor: "white",
              color: "black",
              boxShadow: 1,
              "&:hover": { bgcolor: "#f0f0f0" },
            }}
          >
            <SwapVertIcon />
          </IconButton>
        </Box>
        <TextField
          label="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationOnIcon sx={{ color: "black" }} />
              </InputAdornment>
            ),
            style: { color: "black" },
          }}
          fullWidth
          InputLabelProps={{ style: { color: "black" },  shrink: true }}
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 2,
            "& .MuiOutlinedInput-root": {
              color: "black",
              "& fieldset": { borderColor: "black" },
              "&:hover fieldset": { borderColor: "gray" },
              "&.Mui-focused fieldset": { borderColor: "black", borderWidth: 2 },
              "& .MuiInputBase-input": {
  color: "black !important",   // 👈 ensures swapped text is visible
  zIndex: 2,                   // keep text above label
},
           },
          }}
        />
      </Box>

      {/* Summary */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography color="white">
          Distance: {distanceKm ? distanceKm.toFixed(2) : "—"} km (
          {durationMin ? Math.round(durationMin) : "—"} min)
        </Typography>
        <Typography variant="h6" color="white">
          Estimated Fare: ₹{fare || "—"}
        </Typography>
      </Box>

      {/* Map */}
      <Box mb={3} sx={{ height: 300, borderRadius: 2, overflow: "hidden" }}>
  <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Recenter center={center} />   {/* 👈 this line added */}
    {pickupCoords && <Marker position={pickupCoords}><Popup>Pickup: {from}</Popup></Marker>}
    {dropCoords && <Marker position={dropCoords}><Popup>Drop: {to}</Popup></Marker>}
    {route.length > 0 && <Polyline positions={route} />}
  </MapContainer>
</Box>


      {/* Actions */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <Button
          variant="contained"
          onClick={handleBook}
          sx={{
            bgcolor: "black",
            color: "white",
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: "bold",
            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
            "&:hover": {
              bgcolor: "#333",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 14px rgba(0,0,0,0.5)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Book Now
        </Button>
        <TextField
          type="time"
          label="Pickup Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccessTimeIcon sx={{ color: "black" }} />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{ style: { color: "black" } }}
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 2,
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "black" },
              "&:hover fieldset": { borderColor: "gray" },
              "&.Mui-focused fieldset": { borderColor: "black", borderWidth: 2 },
            },
          }}
        />
      </Box>

      {ride && (
        <DriverListModal
          open={showDrivers}
          handleClose={() => setShowDrivers(false)}
          from={from}
          to={to}
          time={time}
          rideId={ride.id}
          fare={fare}
        />
      )}
    </Box>
  );
}
