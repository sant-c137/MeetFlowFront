import { RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";

// Supports weights 200-900
import "@fontsource-variable/nunito";
import "@fontsource/poppins";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <RouterProvider router={App()} />
  </AuthProvider>
);
