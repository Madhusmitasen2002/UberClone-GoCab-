// client/src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ffffff"
    },
    background: {
      default: "#000000",
      paper: "#111111"
    },
    text: {
      primary: "#ffffff",
      secondary: "#e0e0e0"
    }
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif'
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: "none",
          textTransform: "none"
        }
      }
    }
  }
});

export default theme;
