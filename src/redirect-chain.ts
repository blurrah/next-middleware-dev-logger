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

  if (!isRedirect || !redirectTarget) {
    // If it's not a valid array or a redirect we can delete the cookie and return early
    response.cookies.delete(COOKIE_NAME);
    return;
  }

  if (
    !Array.isArray(chainUrls) ||
    chainUrls.length === 0 ||
    chainUrls[chainUrls.length - 1] !== request.url
  ) {
    // Either the chain is empty/broken or the last item is not the current request URL
    // In both cases we can start a new chain
    chainUrls = [request.url, redirectTarget];
  } else if (chainUrls[chainUrls.length - 1] === request.url) {
    // Continuing the chain, push the redirect target
    chainUrls.push(redirectTarget);
  }

  // Update the cookie with the new chain
  response.cookies.set(COOKIE_NAME, JSON.stringify(chainUrls), {
    path: "/",
    httpOnly: true,
  });

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
