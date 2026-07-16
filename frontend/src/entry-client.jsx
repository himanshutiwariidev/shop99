import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { HelmetProvider } from "react-helmet-async";
import { SSRDataContext } from "./context/SSRDataContext.jsx";

const initialData = typeof window !== "undefined" ? window.__SSR_DATA__ || {} : {};

hydrateRoot(
  document.getElementById("root"),
  <HelmetProvider>
    <StrictMode>
      <SSRDataContext.Provider value={initialData}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <App />
              <ToastContainer position="top-right" autoClose={2000} />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </SSRDataContext.Provider>
    </StrictMode>
  </HelmetProvider>,
);
