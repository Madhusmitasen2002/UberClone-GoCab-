import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch
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
import { UserContext } from "../context/UserContext";

export default function Navbar({ setOpenRatings }) {
  const [openSidebar, setOpenSidebar] = useState(false);
  const { session, online, logout, toggleOnline } = useContext(UserContext);
  const navigate = useNavigate();

  const displayName = session?.user?.user_metadata?.name || "User";
  const displayRole = session?.user?.user_metadata?.role || "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <AppBar position="fixed" color="primary">
        <Toolbar className="flex justify-between">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton color="inherit" onClick={() => setOpenSidebar(true)}>
              <MenuIcon />
            </IconButton>
            <Link
              to="/"
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: 20,
                textDecoration: "none",
              }}
            >
              🚖 GoCab
            </Link>
          </Box>

          <Box display={{ xs: "none", md: "flex" }} alignItems="center" gap={2}>
            <Button color="inherit" component={Link} to="/" startIcon={<HomeIcon />}>
              Home
            </Button>

            {!session ? (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  startIcon={<LoginIcon />}
                >
                  Login
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/signup"
                  startIcon={<AccountCircle />}
                >
                  Signup
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/payments"
                  startIcon={<Payment />}
                >
                  {displayRole === "rider" ? "Payment History" : "Earnings"}
                </Button>

                <Button
                  color="inherit"
                  onClick={() => setOpenRatings(true)}
                  startIcon={<Star />}
                >
                  Ratings
                </Button>

                {displayRole === "driver" && (
                  <Box display="flex" alignItems="center" sx={{ color: "white" }}>
                    <Switch
                      checked={online}
                      onChange={toggleOnline}
                      color="success"
                    />
                    <span style={{ marginLeft: 8 }}>
                      {online ? "Online" : "Offline"}
                    </span>
                  </Box>
                )}

                <span style={{ color: "white", margin: "0 8px" }}>
                  Hi, {displayName} ({displayRole})
                </span>

                <Button
                  color="secondary"
                  variant="contained"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer anchor="left" open={openSidebar} onClose={() => setOpenSidebar(false)}>
        <Box width={260} role="presentation" onClick={() => setOpenSidebar(false)}>
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>

            {!session ? (
              <>
                <ListItem button component={Link} to="/login">
                  <ListItemIcon>
                    <LoginIcon />
                  </ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItem>

                <ListItem button component={Link} to="/signup">
                  <ListItemIcon>
                    <AccountCircle />
                  </ListItemIcon>
                  <ListItemText primary="Signup" />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button component={Link} to="/payments">
                  <ListItemIcon>
                    <Payment />
                  </ListItemIcon>
                  <ListItemText
                    primary={displayRole === "rider" ? "Payment History" : "Earnings"}
                  />
                </ListItem>

                <ListItem button onClick={() => setOpenRatings(true)}>
                  <ListItemIcon>
                    <Star />
                  </ListItemIcon>
                  <ListItemText primary="Ratings" />
                </ListItem>

                {displayRole === "driver" && (
                  <ListItem>
                    <ListItemIcon>{online ? "🟢" : "🔴"}</ListItemIcon>
                    <ListItemText primary={online ? "Online" : "Offline"} />
                    <Switch
                      checked={online}
                      onChange={toggleOnline}
                      color="success"
                    />
                  </ListItem>
                )}

                <ListItem button onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
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