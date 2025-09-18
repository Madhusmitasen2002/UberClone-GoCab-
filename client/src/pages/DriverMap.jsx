import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import { api } from "../../utils/api";

const driverIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const pickupIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const dropIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function DriverMap({ activeRide, coords }) {
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [route, setRoute] = useState([]);

  // Fetch route when activeRide updates
  useEffect(() => {
    if (!activeRide) {
      setPickupCoords(null);
      setDropCoords(null);
      setRoute([]);
      return;
    }

    setPickupCoords([activeRide.pickup_lat, activeRide.pickup_lng]);
    setDropCoords([activeRide.dropoff_lat, activeRide.dropoff_lng]);

    const fetchRoute = async () => {
      if (activeRide.pickup_lat && activeRide.dropoff_lat) {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${activeRide.pickup_lng},${activeRide.pickup_lat};${activeRide.dropoff_lng},${activeRide.dropoff_lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          setRoute(coords);
        }
      }
    };
    fetchRoute();
  }, [activeRide]);

  return (
    <MapContainer center={[coords.lat, coords.lng]} zoom={13} style={{ height: 400, width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {coords.lat && coords.lng && <Marker position={[coords.lat, coords.lng]} icon={driverIcon}><Popup>📍 You (Driver)</Popup></Marker>}
      {pickupCoords && <Marker position={pickupCoords} icon={pickupIcon}><Popup>Pickup</Popup></Marker>}
      {dropCoords && <Marker position={dropCoords} icon={dropIcon}><Popup>Drop</Popup></Marker>}
      {route.length > 0 && <Polyline positions={route} color="blue" />}
    </MapContainer>
  );
}
