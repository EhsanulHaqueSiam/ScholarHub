import { createStartHandler, defaultStreamHandler } from "@tanstack/start/server";
import { getRouterManifest } from "@tanstack/start/router-manifest";
import { getRouter } from "./router";

export default createStartHandler({
  createRouter: getRouter,
  getRouterManifest,
})(defaultStreamHandler);
