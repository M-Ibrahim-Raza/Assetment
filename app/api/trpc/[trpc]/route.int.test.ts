import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("tRPC route handler", () => {
  // The same requests the tRPC client sends: queries as GET, mutations as a JSON POST.
  const json = { "content-type": "application/json" };

  it.each([
    ["GET", GET, {}],
    ["POST", POST, { method: "POST", headers: json, body: "{}" }],
  ])(
    "answers a %s request for an unknown procedure with 404",
    async (_method, handler, init: RequestInit) => {
      const response = await handler(
        new Request("http://localhost/api/trpc/missing", init),
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { data: { code: "NOT_FOUND", path: "missing" } },
      });
    },
  );
});
