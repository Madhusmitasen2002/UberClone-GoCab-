// client/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
} from "@mui/material";
import { api } from "../../utils/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersData, ridesData, paymentsData] = await Promise.all([
        api.getUsers(),
        api.getRides(),
        api.getAllPayments(),
      ]);
      setUsers(usersData || []);
      setRides(ridesData || []);
      setPayments(paymentsData || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleBlockUser = async (userId, block) => {
    try { await api.updateUserStatus(userId, { blocked: block }); fetchAll(); } 
    catch (err){ console.error(err); }
  };

  const handleCancelRide = async (rideId) => {
    try { await api.cancelRide(rideId); fetchAll(); } 
    catch(err){ console.error(err); }
  };

  const handleMarkPaid = async (rideId) => {
    try { await api.markPaymentPaid(rideId); fetchAll(); } 
    catch(err){ console.error(err); }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ maxWidth:1200, mx:"auto", p:3, pt:10 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>Admin Dashboard</Typography>

      {/* Users Table */}
      <Typography variant="h6" mb={2}>👥 Users</Typography>
      <Paper sx={{ mb:4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.blocked?"Blocked":"Active"}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color={u.blocked?"success":"error"}
                    onClick={()=>handleBlockUser(u.id,!u.blocked)}
                  >
                    {u.blocked?"Unblock":"Block"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Rides Table */}
      <Typography variant="h6" mb={2}>🚖 Rides</Typography>
      <Paper sx={{ mb:4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ride ID</TableCell>
              <TableCell>Passenger</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rides.map(r=>(
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.passenger_id}</TableCell>
                <TableCell>{r.driver_id||"—"}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>
                  <Button variant="contained" color="error" onClick={()=>handleCancelRide(r.id)}>Cancel</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Payments Table */}
      <Typography variant="h6" mb={2}>💳 Payments</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ride ID</TableCell>
              <TableCell>Passenger</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Fare</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map(p=>(
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.passenger_id}</TableCell>
                <TableCell>{p.driver_id||"—"}</TableCell>
                <TableCell style={{ color:p.payment_status==="paid"?"green":"red", fontWeight:"bold" }}>{p.payment_status||"unpaid"}</TableCell>
                <TableCell>₹{p.fare}</TableCell>
                <TableCell>
                  {p.payment_status!=="paid" &&
                    <Button variant="contained" color="success" onClick={()=>handleMarkPaid(p.id)}>Mark as Paid</Button>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
