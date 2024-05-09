# next-middleware-dev-logger

Extremely simple logger used to debug what your Next.js middleware is rewriting/redirecting.
Useful since it can sometimes be a bit opaque what's happening with possible multiple redirects or rewrites.

You should only r

It compares the request and response and logs what's going to happen:
- Whether it redirects or rewrites the URL and where to
- Changed headers
- (TODO): Changed cookies
- Warn for request


To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.0.36. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
