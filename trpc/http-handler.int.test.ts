import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { trpcMaxBatchSize } from "./endpoint";
import { createTRPCHandler } from "./http-handler";
import { publicProcedure, router } from "./init";

const testRouter = router({
  ping: publicProcedure.query(() => "pong"),
  crash: publicProcedure.query(() => {
    throw new Error("db 10.0.0.3:5432 refused connection");
  }),
  missing: publicProcedure.query(() => {
    throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  }),
});

const handle = createTRPCHandler(testRouter);

function get(path: string) {
  return handle(new Request(`http://localhost/api/trpc/${path}`));
}

function batchOf(calls: number) {
  const paths = Array.from({ length: calls }, () => "ping").join(",");
  return get(`${paths}?batch=1&input=${encodeURIComponent("{}")}`);
}

function silenceConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

describe("tRPC HTTP handler", () => {
  it("hides the message of an unexpected error and sends no stack trace", async () => {
    silenceConsoleError();

    const response = await get("crash");
    const text = await response.text();
    const body: unknown = JSON.parse(text);

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ error: { message: "Internal server error" } });
    expect(text).not.toContain("10.0.0.3");
    expect(text).not.toContain('"stack"');
  });

  it("logs an unexpected error with its path", async () => {
    const consoleError = silenceConsoleError();

    await get("crash");

    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "tRPC procedure failed",
      expect.objectContaining({ path: "crash", type: "query" }),
    );
  });

  it("keeps the message of an expected error and doesn't log it", async () => {
    const consoleError = silenceConsoleError();

    const response = await get("missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { message: "Task not found" },
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("accepts a batch of up to the limit and rejects a larger one", async () => {
    expect((await batchOf(trpcMaxBatchSize)).status).toBe(200);
    expect((await batchOf(trpcMaxBatchSize + 1)).status).toBe(400);
  });
});
