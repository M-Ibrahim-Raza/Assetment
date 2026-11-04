import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

// next/font only works inside the Next.js compiler.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

function renderLayout() {
  render(
    <RootLayout params={Promise.resolve({})}>
      <p>Page content</p>
    </RootLayout>,
    { container: document },
  );
}

describe("Root layout", () => {
  it("marks the page as English for screen readers", () => {
    renderLayout();

    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("renders the page inside the body", () => {
    renderLayout();

    expect(document.body).toContainElement(screen.getByText("Page content"));
  });
});
