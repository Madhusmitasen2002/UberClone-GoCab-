import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Home as HomeIcon,
  Login as LoginIcon,
  AccountCircle,
  Payment,
  Star,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

export default function Navbar({ setOpenRatings }) {
  const [user, setUser] = useState(null);
  const [openSidebar, setOpenSidebar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("userSession"));
    if (session) setUser(session.user);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) return alert(data.error);

      localStorage.removeItem("userSession");
      setUser(null);
      navigate("/login");
    } catch (err) {
      alert(err.message || "Logout failed");
    }
  };

  return (
    <>
      <AppBar position="fixed" color="primary" elevation={3}>
        <Toolbar className="flex justify-between">
          {/* Left side: Logo + Sidebar Toggle */}
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton edge="start" color="inherit" onClick={() => setOpenSidebar(true)}>
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              style={{ textDecoration: "none", color: "white" }}
            >
              🚖 UberClone
            </Typography>
          </Box>

          {/* Right side: Links */}
          <Box display={{ xs: "none", md: "flex" }} alignItems="center" gap={2}>
            <Button color="inherit" component={Link} to="/" startIcon={<HomeIcon />}>
              Home
            </Button>

            {!user ? (
              <>
                <Button color="inherit" component={Link} to="/login" startIcon={<LoginIcon />}>
                  Login
                </Button>
                <Button color="inherit" component={Link} to="/signup" startIcon={<AccountCircle />}>
                  Signup
                </Button>
              </>
            ) : (
              <>
                <>
  <Button
    color="inherit"
    component={Link}
    to="/payments"
    startIcon={<Payment />}
  >
    Payments
  </Button>

  <Button
    color="inherit"
    onClick={() => setOpenRatings(true)}
    startIcon={<Star />}
  >
    Ratings
  </Button>

  <Typography variant="body2" sx={{ mx: 1 }}>
    Hi, {user.user_metadata?.name || "User"}
  </Typography>

  {/* ✅ Always show Logout on AppBar */}
  <Button
    color="secondary"
    variant="contained"
    onClick={handleLogout}
    startIcon={<LogoutIcon />}
  >
    Logout
  </Button>
</>

              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer anchor="left" open={openSidebar} onClose={() => setOpenSidebar(false)}>
        <Box width={250} role="presentation" onClick={() => setOpenSidebar(false)}>
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            {!user ? (
              <>
                <ListItem button component={Link} to="/login">
                  <ListItemIcon><LoginIcon /></ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItem>
                <ListItem button component={Link} to="/signup">
                  <ListItemIcon><AccountCircle /></ListItemIcon>
                  <ListItemText primary="Signup" />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button component={Link} to="/payments">
                  <ListItemIcon><Payment /></ListItemIcon>
                  <ListItemText primary="Payments" />
                </ListItem>
                <ListItem button onClick={() => setOpenRatings(true)}>
                  <ListItemIcon><Star /></ListItemIcon>
                  <ListItemText primary="Ratings" />
                </ListItem>
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
