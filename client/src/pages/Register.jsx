// client/pages/Register.jsx
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
      const res = await fetch("https://uberclone-gocab.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: preselectedRole }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setFormError(data.error || "Signup failed");
        return;
      }

      const userObj = data.user || {};
      const role = preselectedRole || userObj.user_metadata?.role || "";
      const userSession = { user: { id: userObj.id, user_metadata: { name, role } }, role };

      localStorage.setItem("userSession", JSON.stringify(userSession));
      localStorage.setItem("userId", userObj.id);
      localStorage.setItem("userName", name);
      localStorage.setItem("role", role);

      window.dispatchEvent(new Event("storage"));

      if (role === "rider") navigate("/rider");
      else if (role === "driver") navigate("/driver");
      else if (role === "admin") navigate("/admin-dashboard");
      else navigate("/");
    } catch (err) {
      setFormError(err.message || "Signup failed");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Register as {preselectedRole || "User"} - GoCab
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border p-2 pl-10 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border p-2 pl-10 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border p-2 pl-10 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <ArrowRight size={18} /> Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}
