import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryCacheProbe } from "@/test/query-cache-probe";
import { Providers } from "./providers";

describe("Providers in the browser", () => {
  it("renders the page", () => {
    render(
      <Providers>
        <p>Page content</p>
      </Providers>,
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("keeps one query cache, so data survives a remount", () => {
    const tree = (
      <Providers>
        <QueryCacheProbe queryKey="browser" />
      </Providers>
    );

    const first = render(tree);
    expect(screen.getByText("new")).toBeInTheDocument();
    first.unmount();

    render(tree);
    expect(screen.getByText("cached")).toBeInTheDocument();
  });
});
