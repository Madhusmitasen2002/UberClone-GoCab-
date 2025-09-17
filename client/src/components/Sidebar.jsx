import React, { useState, useContext } from "react";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, IconButton } from "@mui/material";
import { Menu, Login, AccountCircle, Star, Payment, Home, Logout } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function Sidebar({ setOpenRatings }) {
  const [open, setOpen] = useState(false);
  const { session, online, logout, toggleOnline } = useContext(UserContext);
  const navigate = useNavigate();

  const displayRole = session?.role || session?.user?.user_metadata?.role || "";
  const displayName = session?.user?.user_metadata?.name || "User";

  const toggleDrawer = () => setOpen(!open);

  return (
    <>
      <IconButton onClick={toggleDrawer} color="inherit">
        <Menu />
      </IconButton>

      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <List sx={{ width: 260 }}>
          <ListItemButton component={Link} to="/" onClick={toggleDrawer}>
            <ListItemIcon><Home /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          {!session ? (
            <>
              <ListItemButton component={Link} to="/login" onClick={toggleDrawer}>
                <ListItemIcon><Login /></ListItemIcon>
                <ListItemText primary="Login" />
              </ListItemButton>

              <ListItemButton component={Link} to="/signup" onClick={toggleDrawer}>
                <ListItemIcon><AccountCircle /></ListItemIcon>
                <ListItemText primary="Signup" />
              </ListItemButton>
            </>
          ) : (
            <>
              <ListItemButton component={Link} to="/payments" onClick={toggleDrawer}>
                <ListItemIcon><Payment /></ListItemIcon>
                <ListItemText primary={displayRole === "rider" ? "Payment History" : "Earnings"} />
              </ListItemButton>

              <ListItemButton onClick={() => { setOpen(false); setOpenRatings(true); }}>
                <ListItemIcon><Star /></ListItemIcon>
                <ListItemText primary="Ratings" />
              </ListItemButton>

              {displayRole === "driver" && (
                <ListItemButton onClick={toggleOnline}>
                  <ListItemIcon>{online ? "🟢" : "🔴"}</ListItemIcon>
                  <ListItemText primary={online ? "Online" : "Offline"} />
                </ListItemButton>
              )}

              <ListItemButton onClick={() => { logout(); navigate("/login"); }}>
                <ListItemIcon><Logout /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
}
