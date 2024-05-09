import { NextFetchEvent } from "next/dist/server/web/spec-extension/fetch-event";
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { formatLog } from "./lib";
import { createDevLoggerMiddleware } from "./middleware";

const consoleInfoSpy = vi.spyOn(console, "info");

// Stub for NextResponse.next as a middleware
const nextMiddleware = () => NextResponse.next();

beforeEach(() => {
  consoleInfoSpy.mockClear();
});

test("middleware logs request", async () => {
  // Middleware only runs in development
  const request = new NextRequest("http://localhost:3000");

  const middleware = createDevLoggerMiddleware({ enabled: true });

  const bla = new NextFetchEvent({ request, page: "/" });

  const response = await middleware(nextMiddleware)(request, bla);

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Response http://localhost:3000/")
  );
});

test("middleware is enabled in development mode by default", async () => {
  // Set NODE_ENV to development to enable middleware when no options are given
  process.env.NODE_ENV = "development";

  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({});

  const bla = new NextFetchEvent({ request, page: "/" });

  const response = await middleware(nextMiddleware)(request, bla);

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Response http://localhost:3000/")
  );
});

test("middleware logs request with headers", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const bla = new NextFetchEvent({ request, page: "/" });
  const nextMiddlewareWithHeaders = () => {
    const response = NextResponse.next();
    response.headers.set("x-custom-header", "test");
    return response;
  };

  const response = await middleware(nextMiddlewareWithHeaders)(request, bla);

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledTimes(3);
  // Indented header change log
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog('  x-custom-header: null -> "test"')
  );
});

test("middleware logs rewrite", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const bla = new NextFetchEvent({ request, page: "/" });
  const nextMiddlewareRewrite = () =>
    NextResponse.rewrite(new URL("/bla", request.url));

  const response = await middleware(nextMiddlewareRewrite)(request, bla);

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Rewrite: http://localhost:3000/ -> http://localhost:3000/bla")
  );
});

test("middleware logs redirect", async () => {
  const request = new NextRequest("http://localhost:3000");
  const middleware = createDevLoggerMiddleware({ enabled: true });

  const bla = new NextFetchEvent({ request, page: "/" });
  const nextMiddlewareRedirect = () =>
    NextResponse.redirect(new URL("/bla", request.url));

  const response = await middleware(nextMiddlewareRedirect)(request, bla);

  expect(response).toBeInstanceOf(NextResponse);
  expect(consoleInfoSpy).toHaveBeenCalledWith(
    formatLog("Redirect: http://localhost:3000/ -> http://localhost:3000/bla")
  );
});
