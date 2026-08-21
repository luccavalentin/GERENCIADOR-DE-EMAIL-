import { createStartHandler, createRequestHandler, defaultRenderHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

const router = getRouter();

export default createStartHandler({
  createCallback: (router) => {
    return createRequestHandler({
      router,
      renderHandler: defaultRenderHandler,
    });
  },
})(router);
