// client/src/App.jsx
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PaymentHistory from "./pages/PaymentHistory";
import Rider from "./pages/Rider";
import Driver from "./pages/Driver";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RatingsModal from "./components/RatingsModal";

export default function App() {
  const [showRatings, setShowRatings] = useState(false);

  return (
    <div className="flex flex-col min-h-screen w-screen">
      <ToastContainer position="top-center" autoClose={3000} />
      <Navbar setOpenRatings={setShowRatings} />
      <main className="flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route
            path="/payment-history"
            element={
              <PaymentHistory
                userId={localStorage.getItem("userId")}
                role={localStorage.getItem("userRole")}
              />
            }
          />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/rider" element={<Rider />} />
          <Route path="/driver" element={<Driver />} />
        </Routes>
      </main>
      <Footer />
      <RatingsModal open={showRatings} onClose={() => setShowRatings(false)} />
      <button
        onClick={() => setShowRatings(true)}
        className="fixed bottom-6 right-6 bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-yellow-600 transition"
      >
        Rate Us ⭐
      </button>
    </div>
  );
}
