import { NextRequest, NextResponse } from "next/server";
import { formatLog } from "./lib";

/**
 * Track the response chain and log any excessive request sequences
 *
 * When using middleware, it's possible to create a chain of redirects that can
 * cause a redirect loop or lead to degraded SEO performance.
 * This function tracks the redirect chain and logs a warning if more than 1 redirect happens for a URL.
 *
 * This uses cookies to track the the state in between each middleware request.
 */
export function checkRedirectChain(
  request: NextRequest,
  response: NextResponse
): void {
  let chainUrls: string[] = [];

  // Check for existing requests from the cookie
  try {
    chainUrls = JSON.parse(request.cookies.get("_mdl-requests")?.value ?? "[]");
  } catch (err) {}

  if (
    !Array.isArray(chainUrls) ||
    (request.url !== chainUrls[chainUrls.length - 1] &&
      !response.headers.has("location"))
  ) {
    // If the request is not the last response in the chain and the response is not a redirect
    // then the existing chain is invalid and we're not starting a new one, delete cookie and return early
    response.cookies.delete("_mdl-requests");
    return;
  }

  // If the response is a redirect, push it to the chain
  if (response.headers.has("location")) {
    if (chainUrls.length === 0) {
      // Starting new chain, push the first request
      chainUrls.push(request.url);
    }

    const location = response.headers.get("location");

    // If the chain is empty or the last item in the chain is the same as the current request
    if (chainUrls[chainUrls.length - 1] === request.url) {
      if (location) {
        chainUrls.push(location);
      }

      // Update the cookie with the new chain
      response.cookies.set("_mdl-requests", JSON.stringify(chainUrls), {
        path: "/",
        httpOnly: true,
      });
    } else {
      response.cookies.delete("_mdl-requests");
    }
  }

  if (chainUrls.length > 1) {
    console.warn(formatLog("Warning excessive request sequence detected:"));
    chainUrls.forEach((item, index) => {
      if (index === 0) {
        console.warn(formatLog(`  ${item}`));
      } else {
        console.warn(formatLog(`  -> ${item}`));
      }
    });
  }
}
