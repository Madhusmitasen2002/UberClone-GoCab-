import { Box, Typography, Button, Paper } from "@mui/material";

export default function RideRequestCard({ ride, driverId }) {
  const acceptRide = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rides/${ride.id}/accept`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driver_id: driverId }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("✅ Ride accepted!");
      // hide the card immediately (before realtime update kicks in)
      document.getElementById(`ride-${ride.id}`)?.remove();
    } catch (err) {
      alert(err.message);
    }
  };

  const declineRide = () => {
    // just remove it from the UI (other drivers will still see it)
    alert("❌ Ride declined");
    document.getElementById(`ride-${ride.id}`)?.remove();
  };

  return (
    <Paper
      id={`ride-${ride.id}`}
      sx={{
        bgcolor: "black",
        color: "white",
        p: 2,
        borderRadius: 2,
        border: "1px solid white",
      }}
    >
      <Typography>
        <b>From:</b> {ride.pickup_location}
      </Typography>
      <Typography>
        <b>To:</b> {ride.dropoff_location}
      </Typography>
      <Typography>
        <b>Fare:</b> ₹{ride.fare}
      </Typography>
      <Typography>
        <b>Pickup Time:</b>{" "}
        {new Date(ride.pickup_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Typography>

      <Box display="flex" gap={2} mt={2}>
        <Button
          variant="contained"
          sx={{
            bgcolor: "white",
            color: "black",
            "&:hover": { bgcolor: "#ddd" },
          }}
          onClick={acceptRide}
        >
          Accept
        </Button>
        <Button
          variant="outlined"
          sx={{
            borderColor: "white",
            color: "white",
            "&:hover": { bgcolor: "#333" },
          }}
          onClick={declineRide}
        >
          Decline
        </Button>
      </Box>
    </Paper>
  );
}
