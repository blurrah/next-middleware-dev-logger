import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    // We use this to simulate the runtime edge middleware runs in
    environment: "edge-runtime",
  },
});
