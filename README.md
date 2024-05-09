# next-middleware-dev-logger

Extremely simple logger used to debug what your Next.js middleware is rewriting/redirecting.
Useful since it can sometimes be a bit opaque what's happening with possible multiple redirects or rewrites.

:warning: Only use this during development, not sure what the impact is for performance in production.

It compares the request and response and logs what's going to happen:
- The navigation action (redirect, rewrite or next) and the response location
- Changed headers
- Warn for redirect chains excessing 1 redirect

TODO:
- Check for changed cookies
- Check for additional request headers (not sure if possible)
- Check more actions (writing responses and custom status codes)

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.0.36. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
