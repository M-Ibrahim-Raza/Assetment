import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QueryCacheProbe } from "@/test/query-cache-probe";
import { Providers } from "./providers";

function renderOnServer() {
  return renderToString(
    createElement(
      Providers,
      null,
      createElement(QueryCacheProbe, { queryKey: "server" }),
    ),
  );
}

describe("Providers on the server", () => {
  it("gives each render its own query cache, so one user's data never reaches another", () => {
    expect(renderOnServer()).toContain("new");
    expect(renderOnServer()).toContain("new");
  });
});
