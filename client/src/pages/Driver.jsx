import { Box, Typography } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import RideRequestCard from "../components/RideRequestCard";
import EarningSummary from "../components/EarningSummary";

export default function Driver() {
  return (
    <Box
      className="mx-auto"
      sx={{
        maxWidth: 600, // ✅ match Rider page width
        width: "100%",
        p: 3,
      }}
    >
      {/* Header */}
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
        textAlign="center"
      >
        Welcome Driver! 🚖
      </Typography>

      {/* Live Map */}
      <Box mb={3} sx={{ height: 300, borderRadius: 2, overflow: "hidden" }}>
        <MapContainer
          center={[51.505, -0.09]} // default London
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[51.505, -0.09]}>
            <Popup>Your Location</Popup>
          </Marker>
        </MapContainer>
      </Box>

      {/* Ride Requests Section */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Incoming Ride Requests
      </Typography>
      <RideRequestCard
        pickup="MG Marg"
        drop="Tadong"
        price="₹180"
        time="15 min"
        showActions // ✅ ensure buttons show
      />

      {/* Earnings Summary */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Earnings Summary
        </Typography>
        <EarningSummary todayEarnings="₹450" totalRides={3} />
      </Box>
    </Box>
  );
}
