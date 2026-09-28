import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

const domain = import.meta.env.VITE_AUTH0_DOMAIN || "dev-4fy07vc2iti7f4go.us.auth0.com";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "j6h2Ua2hbmyeyI5ZgzN6LwHzS6YkRU3B";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
