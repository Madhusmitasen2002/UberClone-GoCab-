// client/pages/Driver.jsx
import { useEffect, useState } from "react";
import DriverMap from "./DriverMap";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { api } from "../../utils/api";
import EarningSummary from "../components/EarningSummary";

export default function Driver() {
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [coords, setCoords] = useState({ lat: 27.33, lng: 88.61 });
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalRides, setTotalRides] = useState(0);
  const [online, setOnline] = useState(localStorage.getItem("onlineStatus")==="true");

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const driverId = localStorage.getItem("userId");
  const driverName = localStorage.getItem("userName") || "Driver";

  const fetchRides = async () => {
    if (!driverId) return;
    try {
      const data = await api.getRides();
      setRideRequests(Array.isArray(data) ? data.filter(r => r.status==="requested") : []);
      const myActive = data?.find(r => String(r.driver_id)===String(driverId) && r.status!=="completed");
      setActiveRide(myActive || null);
    } catch(err){ console.error(err); }
  };

  const fetchEarnings = async () => {
    if (!driverId) return;
    try {
      const data = await api.getDriverEarnings(driverId);
      setTodayEarnings(data?.todayEarnings || 0);
      setTotalRides(data?.totalRides || 0);
    } catch(err){ console.error(err); }
  };

  const fetchPayments = async () => {
    if (!driverId) return;
    try { const data = await api.getPaymentsByDriver(driverId); setPayments(data||[]); }
    catch(err){ console.error(err); }
    finally{ setLoadingPayments(false); }
  };

  const handleToggleOnline = async (e) => {
    const newStatus = e.target.checked;
    setOnline(newStatus);
    localStorage.setItem("onlineStatus", newStatus?"true":"false");
    if (!driverId) return;
    try { await api.updateDriverStatus(driverId,{ lat:coords.lat, lng:coords.lng, is_online:newStatus }); fetchRides(); }
    catch(err){ console.error(err); }
  };

  const handleLogout = async () => { try{ await api.logout(); } catch{} localStorage.clear(); window.location.href="/login"; };

  const handleAccept = async (rideId) => {
    try {
      const data = await api.acceptRide(rideId, { driver_id: driverId });
      setRideRequests(prev => prev.filter(r=>r.id!==rideId));
      setActiveRide(data);
      fetchEarnings();
      fetchPayments();
    } catch(err){ alert(err.message||"Accept failed"); }
  };
  const handleDecline = (rideId) => setRideRequests(prev=>prev.filter(r=>r.id!==rideId));
  const startRide = async (rideId) => { try { setActiveRide(await api.startRide(rideId)); } catch{} };
  const completeRide = async (rideId) => { try { await api.completeRide(rideId); setActiveRide(null); fetchRides(); fetchEarnings(); fetchPayments(); } catch{} };

  useEffect(()=>{ if(!driverId || !navigator.geolocation) return; const watchId = navigator.geolocation.watchPosition(async(pos)=>{ setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); try{ await api.updateDriverStatus(driverId,{ lat: pos.coords.latitude, lng: pos.coords.longitude, is_online:online }); } catch{} }, err=>console.error(err), { enableHighAccuracy:true, maximumAge:10000, timeout:5000 }); return ()=>navigator.geolocation.clearWatch(watchId); }, [driverId, online]);

  useEffect(()=>{ fetchRides(); fetchEarnings(); fetchPayments(); }, [driverId]);

  return (
    <Box sx={{ maxWidth:1000, mx:"auto", p:3, pt:10 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">{driverName} 🚖</Typography>
        <FormControlLabel
          control={<Switch checked={online} onChange={handleToggleOnline} sx={{ "& .MuiSwitch-switchBase.Mui-checked":{ color:"#fff","& + .MuiSwitch-track":{backgroundColor:"green"}}, "& .MuiSwitch-switchBase":{ color:"#fff","& + .MuiSwitch-track":{backgroundColor:"red"}} }} />}
          label={online?"Online":"Offline"}
        />
      </Box>

      <EarningSummary todayEarnings={todayEarnings} totalRides={totalRides} />

      <Box sx={{ height:400, borderRadius:3, overflow:"hidden", mb:3 }}>
        <DriverMap activeRide={activeRide} coords={coords} />
      </Box>

      {activeRide && (
        <Paper sx={{ p:3, mb:3, bgcolor:"#f0f0f0", color:"black", border:"1px solid #ccc", boxShadow:1 }}>
          <Typography variant="h6" mb={1}>🚖 Active Ride</Typography>
          <Typography><b>Pickup:</b> {activeRide.pickup_location}</Typography>
          <Typography><b>Dropoff:</b> {activeRide.dropoff_location}</Typography>
          <Typography><b>Fare:</b> ₹{activeRide.fare}</Typography>
          <Divider sx={{ my:2 }} />
          {activeRide.status==="accepted" && <Button variant="contained" onClick={()=>startRide(activeRide.id)}>Start Ride</Button>}
          {activeRide.status==="in_progress" && <Button variant="contained" color="success" onClick={()=>completeRide(activeRide.id)}>Complete Ride</Button>}
        </Paper>
      )}

      <Typography variant="h6" mb={2}>🆕 Ride Requests</Typography>
      {rideRequests.length===0 && <Paper sx={{p:3,bgcolor:"#eee", color:"black"}}>No new ride requests</Paper>}
      {rideRequests.map(ride=>(
        <Paper key={ride.id} sx={{p:3,mb:2}}>
          <Typography><b>From:</b> {ride.pickup_location}</Typography>
          <Typography><b>To:</b> {ride.dropoff_location}</Typography>
          <Typography><b>Fare:</b> ₹{ride.fare}</Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button variant="contained" color="primary" onClick={()=>handleAccept(ride.id)}>Accept</Button>
            <Button variant="outlined" color="error" onClick={()=>handleDecline(ride.id)}>Decline</Button>
          </Box>
        </Paper>
      ))}

      <Paper sx={{p:3, mt:4, bgcolor:"white", color:"black", border:"1px solid #ccc"}}>
        <Typography variant="h6" gutterBottom>💳 Payment History</Typography>
        {loadingPayments ? <CircularProgress /> :
          payments.length===0 ? <Typography>No payment records found yet.</Typography> :
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ride ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Fare</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map(p=>(
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.status||"—"}</TableCell>
                  <TableCell style={{color:p.payment_status==="paid"?"green":"red", fontWeight:"bold"}}>{p.payment_status||"unpaid"}</TableCell>
                  <TableCell>₹{p.fare||0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>}
      </Paper>

      <Box mt={4} display="flex" justifyContent="center">
        <Button variant="contained" color="error" onClick={handleLogout}>Logout</Button>
      </Box>
    </Box>
  );
}
