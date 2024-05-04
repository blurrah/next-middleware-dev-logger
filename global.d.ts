declare module NodeJS {
  interface Global {
    Headers: Headers & {
      // This is a workaround for the fact that Headers.entries() is not yet implemented in Bun (or .entries() might not be spec compliant)
      entries: () => IterableIterator<[string, string]>;
    };
  }
}
