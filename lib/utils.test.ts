import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps the later class when two Tailwind classes conflict", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops false, null and undefined", () => {
    expect(cn("text-sm", false, null, undefined, "font-medium")).toBe(
      "text-sm font-medium",
    );
  });
});
