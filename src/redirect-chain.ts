import type { NextRequest, NextResponse } from "next/server";
import { formatLog } from "./lib";

const COOKIE_NAME = "_mdl-requests";

/**
 * Track the response chain and log any excessive request sequences
 *
 * When using middleware, it's possible to create a chain of redirects that can
 * cause a redirect loop or lead to degraded performance and SEO issues.
 * This function tracks the redirect chain and logs a warning if more than 1 redirect happens for a URL.
 *
 * This uses cookies to track the the state in between each middleware request.
 */
export function checkRedirectChain(
  request: NextRequest,
  response: NextResponse
): void {
  let chainUrls: string[] = [];
  const isRedirect = response.headers.has("location");
  const redirectTarget = response.headers.get("location");

  // Check for existing requests from the cookie
  try {
    chainUrls = JSON.parse(request.cookies.get(COOKIE_NAME)?.value ?? "[]");
  } catch (err) {}

  if (
    !Array.isArray(chainUrls) ||
    (request.url !== chainUrls[chainUrls.length - 1] && !isRedirect)
  ) {
    // If the request is not the last response in the chain and the response is not a redirect
    // then the existing chain is invalid and we're not starting a new one, delete cookie and return early
    response.cookies.delete(COOKIE_NAME);
    return;
  }

  // Not a redirect, delete the cookie and return early to reset the chain
  if (!isRedirect) {
    response.cookies.delete(COOKIE_NAME);
    return;
  }

  // If the response is a redirect, push it to the chain
  if (isRedirect && redirectTarget) {
    if (chainUrls.length === 0) {
      // Starting new chain, push the first request
      chainUrls = [request.url, redirectTarget];
    }

    // If the last item in the chain is the same as the current request, push the redirect target
    if (chainUrls[chainUrls.length - 1] === request.url) {
      chainUrls.push(redirectTarget);
    } else {
      // The chain is invalid, so we create a new one
      chainUrls = [request.url, redirectTarget];
    }

    // Update the cookie with the new chain
    response.cookies.set(COOKIE_NAME, JSON.stringify(chainUrls), {
      path: "/",
      httpOnly: true,
    });
  }

  if (chainUrls.length > 2) {
    // The chain is longer than 2, log a warning
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
