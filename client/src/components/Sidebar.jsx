import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import { Menu, Login, AccountCircle, Star, Payment, Home } from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function Sidebar({ setOpenRatings }) {
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen(!open);

  return (
    <>
      <IconButton onClick={toggleDrawer} color="inherit">
        <Menu />
      </IconButton>

      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <List sx={{ width: 250 }}>
          {/* 🏠 Home */}
          <ListItemButton component={Link} to="/" onClick={toggleDrawer}>
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          <ListItemButton component={Link} to="/login" onClick={toggleDrawer}>
            <ListItemIcon>
              <Login />
            </ListItemIcon>
            <ListItemText primary="Login" />
          </ListItemButton>

          <ListItemButton component={Link} to="/signup" onClick={toggleDrawer}>
            <ListItemIcon>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText primary="Signup" />
          </ListItemButton>

          {/* Ratings opens popup instead of page */}
          <ListItemButton
            onClick={() => {
              setOpen(false); // close drawer
              setOpenRatings(true); // open ratings popup
            }}
          >
            <ListItemIcon>
              <Star />
            </ListItemIcon>
            <ListItemText primary="Ratings" />
          </ListItemButton>

          <ListItemButton component={Link} to="/payments" onClick={toggleDrawer}>
            <ListItemIcon>
              <Payment />
            </ListItemIcon>
            <ListItemText primary="Payment History" />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}
