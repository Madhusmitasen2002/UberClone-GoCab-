import { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

export default function DriverListModal({ open, handleClose, from, to, time, rideId, fare }) {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/drivers");
        const data = await res.json();
        setDrivers(data || []);
      } catch (e) {
        console.error("fetch drivers error", e);
      }
    })();
  }, [open]);

  const selectDriver = async (driverId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/rides/${rideId}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      alert("✅ Driver assigned");
      handleClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePay = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ride_id: rideId, amount: fare }), // 👈 use real fare
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url; // ✅ redirect to Stripe checkout
      else throw new Error(data.error || "Checkout creation failed");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 420,
          bgcolor: "black",
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
          color: "white",
        }}
      >
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Available Drivers
        </Typography>
        <Typography variant="body2" mb={2}>
          From: <b>{from}</b> <br />
          To: <b>{to}</b> <br />
          Time: <b>{time || "Now"}</b> <br />
          Fare: <b>₹{fare}</b>
        </Typography>
        <List>
          {drivers.map((d) => (
            <ListItem
              key={d.id}
              secondaryAction={
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "white",
                    color: "black",
                    "&:hover": { bgcolor: "#ddd" },
                  }}
                  onClick={() => selectDriver(d.id)}
                >
                  Select
                </Button>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "white", color: "black" }}>
                  <DirectionsCarIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${d.name}`}
                secondary={`⭐ ${d.average_rating || "—"}`}
              />
            </ListItem>
          ))}
        </List>
        <Box textAlign="center" mt={2}>
          <Button
            variant="contained"
            fullWidth
            onClick={handlePay}
            sx={{
              bgcolor: "white",
              color: "black",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#ddd" },
            }}
          >
            Proceed to Pay ₹{fare}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
