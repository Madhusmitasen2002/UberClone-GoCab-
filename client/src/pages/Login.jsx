import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setFormError(data.error || "Login failed");
        toast.error(data.error || "Login failed");
        return;
      }

      const userObj = data.user || {};
      const role = userObj.user_metadata?.role || localStorage.getItem("role") || "";
      const name = userObj.user_metadata?.name || localStorage.getItem("userName") || "";

      localStorage.setItem("role", role || "");
      localStorage.setItem("userName", name || "");

      toast.success("✅ Login successful");

      const lower = (role || "").toLowerCase();
      if (lower === "rider") navigate("/rider");
      else if (lower === "driver") navigate("/driver");
      else if (lower === "admin") navigate("/admin-dashboard");
      else navigate("/");
    } catch (err) {
      setFormError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setFormError("Enter your email first");
      toast.error("Enter your email first");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) {
        setFormError(data.error);
        toast.error(data.error);
      } else {
        toast.success("✅ Password reset link sent to your email!");
      }
    } catch (err) {
      setFormError(err.message || "Password reset failed");
      toast.error(err.message || "Password reset failed");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Login to GoCab
        </h2>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>
          </div>

          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          <div className="space-y-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 px-4 text-white font-semibold hover:bg-blue-700 transition"
            >
              <ArrowRight size={18} /> Login
            </button>

            <p className="text-center">
              <span
                onClick={handleForgotPassword}
                className="cursor-pointer text-sm text-indigo-600 hover:underline"
              >
                Forgot Password?
              </span>
            </p>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="/signup" className="text-indigo-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
