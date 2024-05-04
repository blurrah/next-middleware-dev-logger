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
