import type { NextResponse } from "next/server";

export type MiddlewareAction =
  (typeof MiddlewareAction)[keyof typeof MiddlewareAction];
export const MiddlewareAction = {
  Redirect: "redirect" as const,
  Rewrite: "rewrite" as const,
  Next: "next" as const,
};

/**
 * Determine the type of response action the middleware is doing
 */
export function determineMiddlewareAction(response: NextResponse | Response) {
  if (response.headers.has("x-middleware-rewrite")) {
    return MiddlewareAction.Rewrite;
  }

  if (response.headers.has("location")) {
    return MiddlewareAction.Redirect;
  }

  return MiddlewareAction.Next;
}

/**
 * Format log messages
 * This adds a whitespace before the message to align with the Next.js console messages
 */
export function formatLog(text: string): string {
  return ` [MDL] ${text}`;
}
