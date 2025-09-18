// client/components/PaymentHistory.jsx
import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
} from "@mui/material";
import { api } from "../../utils/api";

export default function PaymentHistory({ userId, role }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        let data = [];
        if (role === "rider") {
          data = await api.getPaymentsByUser(userId);
        } else if (role === "driver") {
          data = await api.getPaymentsByDriver(userId);
        } else if (role === "admin") {
          data = await api.getAllPayments();
        }
        console.log("💳 Payments fetched:", data);
        setPayments(data || []);
      } catch (err) {
        console.error("❌ Payment fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, role]);

  if (loading) return <CircularProgress />;
return (
  <Paper sx={{ p: 3, mt: 3, bgcolor: "white", color: "black", border: "1px solid #ccc" }}>
    <Typography variant="h6" gutterBottom>
      💳 Payment History
    </Typography>

    {loading ? (
      <Typography>⏳ Loading payments...</Typography>
    ) : payments.length === 0 ? (
      <Typography>No payment records found yet.</Typography>
    ) : (
      <Table>
        <TableHead>
          <TableRow>
            {role === "admin" && <TableCell>Rider</TableCell>}
            {role === "admin" && <TableCell>Driver</TableCell>}
            <TableCell>Status</TableCell>
            <TableCell>Payment</TableCell>
            <TableCell>Fare</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.length === 0 && (
  <TableRow>
    <TableCell colSpan={5} style={{ textAlign: "center" }}>
      No records found (showing demo row)
    </TableCell>
  </TableRow>
)}
          {payments.map((p) => (
            <TableRow key={p.id}>
              {role === "admin" && <TableCell>{p.passenger_id}</TableCell>}
              {role === "admin" && <TableCell>{p.driver_id || "—"}</TableCell>}
              <TableCell>{p.status || "unknown"}</TableCell>
              <TableCell
                style={{
                  color: p.payment_status === "paid" ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {p.payment_status || "unpaid"}
              </TableCell>
              <TableCell>₹{p.fare || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Paper>
);
}
