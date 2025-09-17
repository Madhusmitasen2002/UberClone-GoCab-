console.log("✅ App loaded");
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PaymentHistory from "./pages/PaymentHistory";
import Rider from "./pages/Rider";
import Driver from "./pages/Driver";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import RatingsModal from "./components/RatingsModal"; // ✅ Import modal

export default function App() {
  const [showRatings, setShowRatings] = useState(false); // ✅ control popup

  return (
    <div className="flex flex-col min-h-screen w-screen">
      <ToastContainer position="top-center" autoClose={3000} />
      <Navbar />

      <main className="flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/payments" element={<PaymentHistory />} />
          <Route path="/rider" element={<Rider />} /> 
          <Route path="/driver" element={<Driver />} /> 
        </Routes>
      </main>

      <Footer />

      {/* ✅ Ratings Modal */}
       <RatingsModal open={showRatings} onClose={() => setShowRatings(false)} />

      {/* ✅ Floating button to open modal */}
      <button
        onClick={() => setShowRatings(true)}
        className="fixed bottom-6 right-6 bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-yellow-600 transition"
      >
        Rate Us ⭐
      </button>
    </div>
  );
}
