// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FavProvider } from "./context/FavContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";

// CRA/Vite 모두 커버되는 basename
const basename =
  (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ||
  process.env.PUBLIC_URL ||
  "/";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <FavProvider>
      <BrowserRouter basename={basename}>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </BrowserRouter>
    </FavProvider>
  </AuthProvider>
);

reportWebVitals();
