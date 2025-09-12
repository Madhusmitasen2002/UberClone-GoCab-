import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedRole = location.state?.role || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: preselectedRole }),
      });
      // after signup success
localStorage.setItem("userId", res.user.id);
localStorage.setItem("role", role);   // role is what the user selected in signup form


      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Sign`up failed");
        return;
      }

      // Navigate based on role
      const role = preselectedRole.toLowerCase();
      if (role === "rider") navigate("/rider");
      else if (role === "driver") navigate("/driver");
      else navigate("/");
    } catch (err) {
      setFormError(err.message || "Sign-up failed");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Register as {preselectedRole || "User"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>
          </div>

          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-white font-semibold hover:bg-blue-700 transition"
          >
            <ArrowRight size={18} /> Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
