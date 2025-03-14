import { NextFetchEvent } from "next/dist/server/web/spec-extension/fetch-event";
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { formatLog } from "./lib";
import { createDevLoggerMiddleware } from "./middleware";

// Remove mockImplementation if you want to see the log output in the console
const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

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

  const nextMiddlewareRedirect = () =>
    NextResponse.redirect(new URL("/bla", request.url));

  const response = await middleware(nextMiddlewareRedirect)(
    request,
    createFetchEvent(request)
  );

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    formatLog("Warning excessive request sequence detected:")
  );
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    formatLog("  http://localhost:3000/")
  );
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    formatLog("  -> http://localhost:3000/bla")
  );
});
