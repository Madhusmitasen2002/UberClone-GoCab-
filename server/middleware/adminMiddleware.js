// server/middleware/adminMiddleware.js
import supabase from "../supabaseClient.js";

export async function adminMiddleware(req, res, next) {
  const token = req.cookies["sb-access-token"];
  if (!token) return res.status(401).json({ error: "Not logged in" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  const { data: dbUser, error: dbError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (dbError || !dbUser) return res.status(403).json({ error: "User not found" });
  if (dbUser.role !== "admin") return res.status(403).json({ error: "Admin access required" });

  req.admin = user;
  next();
}
