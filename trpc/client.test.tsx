import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { QueryCacheProbe } from "@/test/query-cache-probe";
import { TRPCReactProvider } from "./client";

function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithClient(queryClient: QueryClient, children: ReactNode) {
  render(
    <QueryClientProvider client={queryClient}>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </QueryClientProvider>,
  );
}

describe("TRPCReactProvider", () => {
  it("renders its children", () => {
    renderWithClient(testQueryClient(), <p>Page content</p>);

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("uses the app's QueryClient instead of creating a second one", () => {
    const queryClient = testQueryClient();
    queryClient.setQueryData(["app"], "app");

    renderWithClient(queryClient, <QueryCacheProbe queryKey="app" />);

    expect(screen.getByText("cached")).toBeInTheDocument();
  });
});
