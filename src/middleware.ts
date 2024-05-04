import type { NextRequest, NextResponse } from "next/server";
import { headersDiff } from "./lib";

export function createDevLoggerMiddleware(options: {}) {
  return async function (request: NextRequest, response: NextResponse) {
    if (process.env.NODE_ENV !== "development") {
      // TODO: Use enabled statement in options for this
      return response;
    }

    if (
      request.headers.has("x-mdl-request-count") &&
      Number(request.headers.get("x-mdl-request-count")) > 1
    ) {
      console.warn(
        "!!!!!!!!!!!!!!!!!!! Multiple middleware calls for the same request !!!!!!!!!!!!!!!!!!!"
      );
    }

    console.info("\n");
    if (response.headers.has("x-middleware-rewrite")) {
      console.info(
        `[MDL] Response rewritten ${request.url} -> ${response.headers.get(
          "x-middleware-rewrite"
        )}`
      );
      // Response.redirected doesn't actually work
    } else if (response.headers.has("location")) {
      console.info(
        `[MDL] Response redirected ${request.url} -> ${response.headers.get(
          "location"
        )}`
      );
    } else {
      console.log(`[MDL] Response ${request.url}`);
    }
    const headerDifferences = headersDiff(request.headers, response.headers);

    if (headerDifferences.size > 0) {
      console.info("[MDL] Headers changed");

      for (const key of headerDifferences) {
        console.info(
          `[MDL] ${key}: ${request.headers.get(key)} -> ${response.headers.get(
            key
          )}`
        );
      }
    }

    // Set up chain in headers to track how many times this middleware has been called for a specific request
    // This is used to detect multiple middleware calls for the same request

    // We add this to the request headers for a possible incoming request, add it to the list of headers to override
    if (response.headers.has("x-middleware-override-headers")) {
      const overrideHeaders = response.headers.get(
        "x-middleware-override-headers"
      );
      if (!overrideHeaders?.includes("x-mdl-response-count"))
        response.headers.set(
          "x-middleware-override-headers",
          `${response.headers.get(
            "x-middleware-override-headers"
          )},x-mdl-response-count`
        );
    } else {
      response.headers.set(
        "x-middleware-override-headers",
        "x-mdl-response-count"
      );
    }

    response.headers.set(
      "x-middleware-request-mdl-response-count",
      // Increment the count by 1 or use 1 if it doesn't exist
      String(Number(request.headers.get("x-mdl-response-count")) + 1) || "1"
    );

    console.log("response.headers", response.headers);

    console.log(
      "[MDL] Request count",
      request.headers.get("x-mdl-request-count")
    );

    return response;
  };
}
