import { environmentManager, type QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { afterEach, describe, expect, it } from "vitest";
import { getQueryClient } from "./get-query-client";

const runsOnServer = environmentManager.isServer();

afterEach(() => {
  environmentManager.setIsServer(() => runsOnServer);
});

function inBrowser() {
  environmentManager.setIsServer(() => false);
}

function retryOf(client: QueryClient) {
  const retry = client.getDefaultOptions().queries?.retry;
  if (typeof retry !== "function") {
    throw new Error("retry should be a function");
  }
  return retry;
}

function trpcError(httpStatus?: number) {
  return TRPCClientError.from({
    error: {
      message: "Request failed",
      code: -32600,
      data: httpStatus === undefined ? {} : { httpStatus },
    },
  });
}

describe("getQueryClient on the server", () => {
  it("gives every call its own client, so users never share a cache", () => {
    expect(getQueryClient()).not.toBe(getQueryClient());
  });

  it("never retries, so a failed request doesn't hold up the page", () => {
    expect(retryOf(getQueryClient())(0, new Error("Network error"))).toBe(
      false,
    );
  });

  it("keeps data fresh for a minute", () => {
    expect(getQueryClient().getDefaultOptions().queries?.staleTime).toBe(
      60_000,
    );
  });
});

describe("getQueryClient in the browser", () => {
  it("keeps one client for the whole session", () => {
    inBrowser();

    expect(getQueryClient()).toBe(getQueryClient());
  });

  it.each([400, 404, 499])(
    "doesn't retry a tRPC error with status %i",
    (status) => {
      inBrowser();

      expect(retryOf(getQueryClient())(0, trpcError(status))).toBe(false);
    },
  );

  it.each([500, 503])("retries a tRPC error with status %i", (status) => {
    inBrowser();

    expect(retryOf(getQueryClient())(0, trpcError(status))).toBe(true);
  });

  it("treats a tRPC error without a status as a server error", () => {
    inBrowser();

    expect(retryOf(getQueryClient())(0, trpcError())).toBe(true);
  });

  it("retries a network error up to 3 times", () => {
    inBrowser();
    const retry = retryOf(getQueryClient());

    expect(retry(2, new Error("Network error"))).toBe(true);
    expect(retry(3, new Error("Network error"))).toBe(false);
  });
});
