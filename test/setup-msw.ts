import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw-server";

const unhandled: string[] = [];

beforeAll(() => {
  server.listen({
    // 'error' alone fails the request, but code that catches network errors can turn that into a passing test.
    // Record every unhandled request and fail the test in afterEach as well.
    onUnhandledFrame: async ({ frame, defaults }) => {
      unhandled.push(await frame.getUnhandledMessage());
      defaults.error();
    },
  });
});

afterEach(() => {
  server.resetHandlers();
  const messages = unhandled.splice(0);
  if (messages.length > 0) {
    throw new Error(`Requests without an MSW handler:\n${messages.join("\n")}`);
  }
});

afterAll(() => {
  server.close();
});
