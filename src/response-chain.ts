import { NextRequest, NextResponse } from "next/server";

export function checkResponseChain(
  request: NextRequest,
  response: NextResponse
) {
  // Set up chain in cookies to track how many times this middleware has been called for a specific request
  // This is used to detect multiple middleware calls for the same request
  let requests;
  try {
    requests = JSON.parse(request.cookies.get("_mdl-requests")?.value ?? "[]");
  } catch (_) {
    requests = [];
  }

  if (
    response.headers.has("x-middleware-rewrite") ||
    response.headers.has("location")
  ) {
    let paths: string[] = [];
    if (
      Array.isArray(requests) &&
      requests[requests.length - 1] === request.url
    ) {
      paths = requests;
    }

    paths.push(
      response.headers.get("location") ||
        response.headers.get("x-middleware-rewrite") ||
        ""
    );
    // Increment count if the response was rewritten or redirected
    response.cookies.set("_mdl-requests", JSON.stringify(paths), {
      path: "/",
    });
  } else {
    response.cookies.delete("_mdl-requests");
  }
  if (requests.length > 2) {
    console.warn("[MDL] [Warning] Excessive request sequence detected:");
    requests.forEach((item, index) => {
      if (index === 0) {
        console.warn(`[MDL]   ${item}`);
      } else {
        console.warn(`[MDL]   -> ${item}`);
      }
    });
  }
}
