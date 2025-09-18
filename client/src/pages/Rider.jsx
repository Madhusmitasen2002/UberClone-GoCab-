// client/pages/Rider.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Box, Typography, TextField, IconButton, Button, Paper, CircularProgress, Alert, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../supabaseClient";
import { api } from "../../utils/api";
import RatingsModal from "../components/RatingsModal";

// Leaflet Icons
const driverIcon = new L.Icon({ iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png", shadowUrl: markerShadow, iconSize:[25,41], iconAnchor:[12,41]});
const pickupIcon = new L.Icon({ iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png", shadowUrl: markerShadow, iconSize:[25,41], iconAnchor:[12,41]});
const dropIcon = new L.Icon({ iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png", shadowUrl: markerShadow, iconSize:[25,41], iconAnchor:[12,41]});

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl:null, iconUrl:null, shadowUrl:null });

// Recenter component
function Recenter({ center }) { const map = useMap(); useEffect(()=>{ if(center) map.setView(center,13); }, [center]); return null; }

export default function Rider() {
  const [from,setFrom]=useState(""); const [to,setTo]=useState(""); const [time,setTime]=useState(""); const [ride,setRide]=useState(null); 
  const [showRatings,setShowRatings]=useState(false);
  const [center,setCenter]=useState([27.3314,88.6138]);
  const [pickupCoords,setPickupCoords]=useState(null); const [dropCoords,setDropCoords]=useState(null); const [route,setRoute]=useState([]);
  const [distanceKm,setDistanceKm]=useState(0); const [durationMin,setDurationMin]=useState(0); const [fare,setFare]=useState(0);
  const [availableDrivers,setAvailableDrivers]=useState([]); const [loadingDrivers,setLoadingDrivers]=useState(false); const [errorDrivers,setErrorDrivers]=useState("");
  const [payments,setPayments]=useState([]); const [loadingPayments,setLoadingPayments]=useState(true);
  const userId = localStorage.getItem("userId"); const [userName,setUserName]=useState(localStorage.getItem("userName")||"User");

  useEffect(()=>{ const storedName=localStorage.getItem("userName"); if(storedName)setUserName(storedName); },[]);
  useEffect(()=>{ if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(pos=>setCenter([pos.coords.latitude,pos.coords.longitude])); } },[]);

  const fetchOnlineDrivers=async()=>{ try{ setLoadingDrivers(true); const data=await api.getDriversOnline(); setAvailableDrivers(data||[]); } catch { setErrorDrivers("Failed to fetch drivers"); } finally { setLoadingDrivers(false); } };
  useEffect(()=>{
    fetchOnlineDrivers();
    const interval = setInterval(fetchOnlineDrivers, 10000);
    const channel = supabase.channel("drivers-realtime").on("postgres_changes",{ event:"UPDATE", schema:"public", table:"users"}, payload => {
      if(payload.new.role==="driver"){ setAvailableDrivers(prev=>{ const others=prev.filter(d=>d.id!==payload.new.id); if(payload.new.is_online) return [...others,payload.new]; return others; }); }
    }).subscribe();
    return ()=>{ clearInterval(interval); supabase.removeChannel(channel); }
  },[]);

  const geocodeAddress = async(address)=>{ if(!address) return null; try{ const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`); const data=await res.json(); if(data?.length>0) return [parseFloat(data[0].lat),parseFloat(data[0].lon)]; return null; } catch { return null; } };
  useEffect(()=>{ if(!from) return setPickupCoords(null); (async()=>{ const coords = await geocodeAddress(from); if(coords){ setPickupCoords(coords); setCenter(coords); }})(); }, [from]);
  useEffect(()=>{ if(!to) return setDropCoords(null); (async()=>{ const coords = await geocodeAddress(to); if(coords) setDropCoords(coords); })(); }, [to]);

  const getRoute=async(pickup,drop)=>{ try{ const res=await fetch(`https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`); const data=await res.json(); if(data.routes?.[0]){ const coords=data.routes[0].geometry.coordinates.map(([lng,lat])=>[lat,lng]); return { coords, distance:data.routes[0].distance||0, duration:data.routes[0].duration||0 }; } return { coords:[], distance:0, duration:0 }; } catch { return { coords:[], distance:0, duration:0 }; } };
  useEffect(()=>{ async function buildRoute(){ if(!pickupCoords || !dropCoords){ setRoute([]); setDistanceKm(0); setDurationMin(0); setFare(0); return; } const r=await getRoute(pickupCoords,dropCoords); setRoute(r.coords||[]); const km=(r.distance||0)/1000; const mins=(r.duration||0)/60; setDistanceKm(km); setDurationMin(mins); const baseFare=30, perKm=8, perMin=1; setFare(Math.max(baseFare, Math.round(baseFare+perKm*km+perMin*mins))); } buildRoute(); }, [pickupCoords,dropCoords]);

  const handleSwap=()=>{ setFrom(to); setTo(from); setPickupCoords(dropCoords); setDropCoords(pickupCoords); setRoute([]); setDistanceKm(0); setDurationMin(0); setFare(0); };

  const handleBook=async()=>{ if(!from || !to) return toast.error("⚠️ Fill From & To"); if(!userId) return toast.error("⚠️ Please login first"); try{ const data=await api.createRide({ passenger_id:userId, pickup_location:from, dropoff_location:to, pickup_time:time?new Date(`${new Date().toISOString().split("T")[0]}T${time}:00Z`).toISOString():new Date().toISOString(), pickup_lat:pickupCoords?.[0]??null, pickup_lng:pickupCoords?.[1]??null, dropoff_lat:dropCoords?.[0]??null, dropoff_lng:dropCoords?.[1]??null, distance_km:Number(distanceKm.toFixed(3)), duration_min:Number(durationMin.toFixed(1)), fare }); setRide(data); fetchOnlineDrivers(); toast.info("📍 Ride requested, waiting for drivers..."); } catch(err){ toast.error(err.message); } };

  const handlePay=async()=>{ if(!ride?.id || !fare) return; try{ const data=await api.createPayment({ ride_id:ride.id, amount:fare }); if(data.url) window.location.href=data.url; else toast.error("Payment session failed"); } catch(err){ toast.error("Payment error: "+err.message); } };

  useEffect(()=>{ if(!userId) return; (async()=>{ try{ const data=await api.getPaymentsByUser(userId); setPayments(data||[]); } catch(err){ console.error(err); } finally{ setLoadingPayments(false); } })(); }, [userId]);

  useEffect(()=>{ if(ride?.status==="completed") setShowRatings(true); }, [ride?.status]);

  return (
    <Box sx={{ maxWidth:900, width:"95%", p:3, pt:10, mx:"auto" }}>
      <Typography variant="h4" fontWeight="bold" mb={4} textAlign="center">Welcome, {userName} 🚖</Typography>
      {/* Inputs */}
      <Paper sx={{ display:"flex", alignItems:"center", gap:1.5, p:2, borderRadius:3, mb:3 }}>
        <TextField label="From" value={from} onChange={e=>setFrom(e.target.value)} size="small" fullWidth />
        <IconButton onClick={handleSwap} sx={{ bgcolor:"black", color:"white" }}><SwapVertIcon /></IconButton>
        <TextField label="To" value={to} onChange={e=>setTo(e.target.value)} size="small" fullWidth />
      </Paper>

      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <Typography sx={{ flex:1, minWidth:200 }}>
          Distance: {distanceKm?distanceKm.toFixed(2):"—"} km ({durationMin?Math.round(durationMin):"—"} min) | Fare: ₹{fare||"—"}
        </Typography>
        <TextField type="time" value={time} onChange={e=>setTime(e.target.value)} size="small" sx={{ width:140 }} />
        <Button variant="contained" sx={{ bgcolor:"black", color:"#fff" }} onClick={handleBook}>Book Ride</Button>
      </Box>

      <Box sx={{ height:450, borderRadius:3, overflow:"hidden", mb:3 }}>
        <MapContainer center={center} zoom={13} style={{ height:"100%", width:"100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Recenter center={center} />
          {pickupCoords && <Marker position={pickupCoords} icon={pickupIcon}><Popup>Pickup: {from}</Popup></Marker>}
          {dropCoords && <Marker position={dropCoords} icon={dropIcon}><Popup>Drop: {to}</Popup></Marker>}
          {availableDrivers.map(d=>d.lat && d.lng && <Marker key={d.id} position={[d.lat,d.lng]} icon={driverIcon}><Popup>🚖 {d.name}</Popup></Marker>)}
          {route.length>0 && <Polyline positions={route} color="blue" />}
        </MapContainer>
      </Box>

      {loadingDrivers && <CircularProgress />}
      {errorDrivers && <Alert severity="error">{errorDrivers}</Alert>}

      {ride?.status === "requested" && <Paper sx={{p:3}}>⏳ Looking for drivers...</Paper>}
      {ride?.status === "accepted" && (
        <Paper sx={{ p:3, bgcolor:"#e0f7fa" }}>
          <Typography variant="h6">🚘 Driver Assigned</Typography>
          <Typography><b>Name:</b> {ride.driver_name||"Driver"}</Typography>
          <Button variant="contained" sx={{ mt:2 }} onClick={handlePay}>Pay Now ₹{ride.fare||fare}</Button>
        </Paper>
      )}
      {ride?.status === "in_progress" && <Paper sx={{p:3, bgcolor:"#fff9c4"}}>🚖 Ride in Progress</Paper>}
      {ride?.status === "completed" && <RatingsModal open={showRatings} onClose={()=>setShowRatings(false)} rideId={ride.id} driverId={ride.driver_id} />}

      <Paper sx={{p:3, mt:3, bgcolor:"white", color:"black", border:"1px solid #ccc"}}>
        <Typography variant="h6" gutterBottom>💳 Your Payment History</Typography>
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
                  <TableCell style={{ color:p.payment_status==="paid"?"green":"red", fontWeight:"bold" }}>{p.payment_status||"unpaid"}</TableCell>
                  <TableCell>₹{p.fare||0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>}
      </Paper>

      <Button variant="contained" color="error" sx={{ mt:3 }} onClick={async()=>{ try{ await supabase.auth.signOut(); } catch{} localStorage.clear(); window.location.href="/login"; }}>Logout</Button>
    </Box>
  );
}
