import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SSRDataContext } from "./context/SSRDataContext.jsx";
import { runLoaderForUrl } from "./ssr/routeLoaders.js";

export async function render(url) {
  const initialData = await runLoaderForUrl(url);
  const helmetContext = {};

  const html = renderToString(
    <StrictMode>
      <HelmetProvider context={helmetContext}>
        <SSRDataContext.Provider value={initialData}>
          <StaticRouter location={url}>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </StaticRouter>
        </SSRDataContext.Provider>
      </HelmetProvider>
    </StrictMode>,
  );

  return { html, helmet: helmetContext.helmet, initialData };
}
