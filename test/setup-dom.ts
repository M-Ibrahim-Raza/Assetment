import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library cleans up automatically only when `afterEach` is a global, which it isn't without `globals: true`.
afterEach(() => {
  cleanup();
});
