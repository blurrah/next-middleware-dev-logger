import { NextResponse } from "next/server";

/**
 * Headers that are only used for requests should be ignored, as they always get removed
 * from the response.
 *
 * This is just something I quickly whipped up, might be missing most of the information
 */
const requestOnlyHeaders = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "connection",
  "cookie",
  "dnt",
  "if-modified-since",
  "if-none-match",
  "referer",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "sec-fetch-user",
  "upgrade-insecure-requests",
  "user-agent",
  "content-type",
  "host",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
  "x-middleware-next",
]);

export enum MiddlewareAction {
  Redirect,
  Rewrite,
  Next,
}

export function headersDiff(headers1: Headers, headers2: Headers): Set<string> {
  const diffKeys = new Set<string>();

  // Iterate through the first set of headers
  for (const [key, value] of headers1.entries()) {
    if (
      !requestOnlyHeaders.has(key) &&
      (!headers2.has(key) || headers2.get(key) !== value)
    ) {
      diffKeys.add(key);
    }
  }

  // Iterate through the second set of headers and add any missing keys
  for (const [key] of headers2.entries()) {
    if (!requestOnlyHeaders.has(key) && !headers1.has(key)) {
      diffKeys.add(key);
    }
  }

  return diffKeys;
}

/**
 * Determine the type of response action the middleware is doing
 */
export function determineMiddlewareAction(response: NextResponse | Response) {
  if (response.headers.has("x-middleware-rewrite")) {
    return MiddlewareAction.Rewrite;
  } else if (response.headers.has("location")) {
    return MiddlewareAction.Redirect;
  }

  return MiddlewareAction.Next;
}

export function writeToConsole(text: string): void {
  console.info(` [MDL] ${text}`);
}

/**
 * Format log messages
 * This adds a whitespace before the message to align with the Next.js console messages
 */
export function formatLog(text: string): string {
  return ` [MDL] ${text}`;
}
