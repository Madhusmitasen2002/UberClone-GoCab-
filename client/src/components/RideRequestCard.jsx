import { Card, CardContent, Typography, Button, Stack } from "@mui/material";

export default function RideRequestCard({ pickup, drop, price, time }) {
  return (
    <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          New Ride Request 🚖
        </Typography>

        <Typography variant="body1" mt={1}>
          <b>Pickup:</b> {pickup}
        </Typography>
        <Typography variant="body1">
          <b>Drop:</b> {drop}
        </Typography>
        <Typography variant="body1">
          <b>Price:</b> {price}
        </Typography>
        <Typography variant="body1">
          <b>ETA:</b> {time}
        </Typography>

        <Stack direction="row" spacing={2} mt={2}>
          <Button variant="contained" color="success">
            Accept
          </Button>
          <Button variant="contained"  sx={{ bgcolor: "red",color: "white","&:hover": { bgcolor: "darkred" },}}>
            Decline
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
