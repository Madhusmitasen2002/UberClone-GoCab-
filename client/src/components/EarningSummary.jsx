import { Card, CardContent, Typography } from "@mui/material";

export default function EarningSummary({ todayEarnings, totalRides }) {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          Earnings Summary 💰
        </Typography>
        <Typography variant="body1" mt={1}>
          Today’s Earnings: {todayEarnings}
        </Typography>
        <Typography variant="body1">
          Rides Completed: {totalRides}
        </Typography>
      </CardContent>
    </Card>
  );
}
