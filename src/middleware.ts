import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import {
  MiddlewareAction,
  determineMiddlewareAction,
  formatLog,
  headersDiff,
} from "./lib";

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
      const requestUrl = request.nextUrl;

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

      // Log changed headers
      const headerDifferences = headersDiff(request.headers, response.headers);

      if (headerDifferences.size > 0) {
        console.info(formatLog("Headers changed:"));

        for (const key of headerDifferences) {
          console.info(
            formatLog(
              `  ${key}: ${request.headers.get(key)} -> "${response.headers.get(
                key
              )}"`
            )
          );
        }
      }

      // Do response stuff here
      return response;
    };
};
