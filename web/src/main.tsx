import { createRouter, RouterProvider } from "@tanstack/react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ConvexProvider client={convex}>
        <RouterProvider router={router} />
      </ConvexProvider>
    </React.StrictMode>,
  );
}
