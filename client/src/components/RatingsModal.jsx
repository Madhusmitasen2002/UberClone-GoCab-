import React, { useState } from "react";
import { Button, Modal, Box, Typography, Rating } from "@mui/material";

export default function RatingsModal({ open, onClose, rideId, driverId }) {
  const [value, setValue] = useState(5);

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: rideId || 1,
          rater_id: localStorage.getItem("userId"),
          ratee_id: driverId || localStorage.getItem("driverId"),
          rating: value,
          comment: "Great ride!",
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      alert("Rating submitted ✅");
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          p: 3,
          backgroundColor: "black",
          borderRadius: 3,
          maxWidth: 400,
          mx: "auto",
          mt: "15%",
          textAlign: "center",
          color: "white",
        }}
      >
        <Typography variant="h6" mb={2}>
          Rate your driver
        </Typography>
        <Rating
          name="simple-controlled"
          value={value}
          onChange={(e, newValue) => setValue(newValue)}
          size="large"
        />
        <Box mt={3}>
          <Button
            onClick={handleSubmit}
            sx={{
              bgcolor: "white",
              color: "black",
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: "bold",
              "&:hover": { bgcolor: "#ddd" },
            }}
          >
            Submit Rating
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
