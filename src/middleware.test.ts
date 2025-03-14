import { NextFetchEvent } from "next/dist/server/web/spec-extension/fetch-event";
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { formatLog } from "./lib";
import { createDevLoggerMiddleware } from "./middleware";

// Remove mockImplementation if you want to see the log output in the console
const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
const consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
// Stub for NextResponse.next as a middleware
const nextMiddleware = () => NextResponse.next();

const createFetchEvent = (request: NextRequest) =>
  new NextFetchEvent({
    request: new NextRequest("http://localhost:3000"),
    page: "/",
    context: {
      waitUntil: vi.fn(),
    },
  });

beforeEach(() => {
  consoleInfoSpy.mockClear();
});

test("middleware logs response", async () => {
  const request = new NextRequest("http://localhost:3000");

  const middleware = createDevLoggerMiddleware({ enabled: true });

  const response = await middleware(nextMiddleware)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Response http://localhost:3000/")
  );
});

test("middleware is disabled when enabled is false", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: false });

  const response = await middleware(nextMiddleware)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).not.toHaveBeenCalled();
});

test("middleware is enabled in development mode by default", async () => {
  // Set NODE_ENV to development to enable middleware when no options are given
  vi.stubEnv("NODE_ENV", "development");

  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({});

  const response = await middleware(nextMiddleware)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Response http://localhost:3000/")
  );
});

test("middleware logs request with headers", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const nextMiddlewareWithHeaders = () => {
    const response = NextResponse.next();
    response.headers.set("x-custom-header", "test");
    return response;
  };

  const response = await middleware(nextMiddlewareWithHeaders)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledTimes(4);
  // Indented header change log
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog('  x-custom-header: "test"')
  );
});

test("middleware logs rewrite", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const nextMiddlewareRewrite = () =>
    NextResponse.rewrite(new URL("/bla", request.url));

  const response = await middleware(nextMiddlewareRewrite)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Rewrite: http://localhost:3000/ -> http://localhost:3000/bla")
  );
});

test("middleware logs redirect", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const nextMiddlewareRedirect = () =>
    NextResponse.redirect(new URL("/bla", request.url));

  const response = await middleware(nextMiddlewareRedirect)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Redirect: http://localhost:3000/ -> http://localhost:3000/bla")
  );
});

test("middleware saves cookie with request chain when redirecting", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const nextMiddlewareRedirect = () =>
    NextResponse.redirect(new URL("/bla", request.url));

  const response = await middleware(nextMiddlewareRedirect)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect((response as NextResponse).cookies.get("_mdl-requests")).toBeDefined();
  expect((response as NextResponse).cookies.get("_mdl-requests")?.value).toBe(
    JSON.stringify(["http://localhost:3000/", "http://localhost:3000/bla"])
  );
});

test("middleware logs excessive redirect chain", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  // Create a request with a cookie that already has a redirect chain
  request.cookies.set(
    "_mdl-requests",
    JSON.stringify(["http://localhost:3000/bla", "http://localhost:3000/"])
  );

  const nextMiddlewareRedirect = () =>
    NextResponse.redirect(new URL("/bla", request.url));

  // This will be the second redirect in the chain
  const response = await middleware(nextMiddlewareRedirect)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    formatLog("Warning excessive request sequence detected:")
  );
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    formatLog("  http://localhost:3000/bla")
  );
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    formatLog("  -> http://localhost:3000/bla")
  );
});

test("middleware resets redirect chain when not redirecting", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  request.cookies.set(
    "_mdl-requests",
    JSON.stringify(["http://localhost:3000/bla", "http://localhost:3000/"])
  );

  const response = await middleware(nextMiddleware)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  // For some reason getting any cookie value returns an empty string
  expect((response as NextResponse).cookies.get("_mdl-requests")?.value).toBe(
    ""
  );
});

test("middleware works when redirect chain cookie is invalid", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  request.cookies.set("_mdl-requests", "{not valid json");

  const response = await middleware(nextMiddleware)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect((response as NextResponse).cookies.get("_mdl-requests")?.value).toBe(
    ""
  );
});

test("middleware works when response is missing cookies", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const removeCookieMiddleware = () => {
    const nextResponse = NextResponse.next();
    // Create a plain Response object that doesn't have cookies
    // This simulates a non-NextResponse object being returned
    const plainResponse = new Response(null, {
      status: 200,
      headers: nextResponse.headers,
    });

    // Return the plain Response instead of NextResponse
    return plainResponse as unknown as NextResponse;
  };

  const response = await middleware(removeCookieMiddleware)(
    request,
    createFetchEvent(request)
  );

  expect(response?.headers.get("x-middleware-next")).toBe("1");
  expect(consoleDebugSpy).toHaveBeenCalledWith(
    formatLog(
      "Response is not a NextResponse object, cannot check redirect chain"
    )
  );
});
