// client/components/RatingsModal.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Button, Modal, Box, Typography, Rating, TextField } from "@mui/material";
import { api } from "../../utils/api";

export default function RatingsModal({ open, onClose, rideId, driverId }) {
  const [value, setValue] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    try {
      await api.submitRating({
        ride_id: rideId,
        rater_id: localStorage.getItem("userId"),
        ratee_id: driverId,
        rating: value,
        comment: comment || "Great ride!",
      });

      toast.success("⭐ Rating submitted");
      onClose();
    } catch (err) {
      toast.error(err.message);
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

        <TextField
          label="Leave a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={{
            mt: 2,
            bgcolor: "white",
            borderRadius: 2,
            "& .MuiInputBase-root": { color: "black" },
            "& .MuiInputLabel-root": { color: "#222" },
          }}
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
