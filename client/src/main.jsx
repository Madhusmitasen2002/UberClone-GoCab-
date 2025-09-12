import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import theme from "./theme";
import { ThemeProvider } from "@emotion/react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
    <ThemeProvider theme={theme}>
      <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
