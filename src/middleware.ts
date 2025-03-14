import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { MiddlewareAction, determineMiddlewareAction, formatLog } from "./lib";
import { checkRedirectChain } from "./redirect-chain";

type Options = {
  /**
   * Enable the middleware
   * @default `process.env.NODE_ENV === "development"` will be used to log in development mode
   * @warning This middleware can negatively impact performance when enabled in production, use with care!
   */
  enabled?: boolean;
};

export const createDevLoggerMiddleware = ({
  enabled = process.env.NODE_ENV === "development",
}: Options = {}) => {
  return (middleware: NextMiddleware) =>
    async (request: NextRequest, event: NextFetchEvent) => {
      // Save request pathname before running middlewareChain
      const requestUrl = request.nextUrl.toString(); // Need to copy the URL otherwise it stays the same

      // Just always await the middleware for now (will wrap non-thenable function in Promise.resolve())
      const response = await middleware(request, event);

      // Return the response if disabled or if we can't deduce any information from the response object
      if (!enabled || response === null || response === undefined) {
        return response;
      }

      const responseAction = determineMiddlewareAction(response);

      if (responseAction === MiddlewareAction.Rewrite) {
        console.info(
          formatLog(
            `Rewrite: ${requestUrl} -> ${response.headers.get(
              "x-middleware-rewrite"
            )}`
          )
        );
      } else if (responseAction === MiddlewareAction.Redirect) {
        console.info(
          formatLog(
            `Redirect: ${requestUrl} -> ${response.headers.get("location")}`
          )
        );
      } else {
        console.info(formatLog(`Response ${requestUrl}`));
      }

      let isFirstHeader = true;
      for (const [key, value] of response.headers.entries()) {
        if (isFirstHeader) {
          console.info(formatLog("Headers added to response:"));
          isFirstHeader = false;
        }
        console.info(formatLog(`  ${key}: "${value}"`));
      }

      // Extra check to make sure it's a NextResponse (can be a Response object, which doesn't have cookies)
      if ("cookies" in response) {
        // Check for excessive redirects
        checkRedirectChain(request, response);
      } else {
        console.debug(
          formatLog(
            "Response is not a NextResponse object, cannot check redirect chain"
          )
        );
      }

      // Do response stuff here
      return response;
    };
};
