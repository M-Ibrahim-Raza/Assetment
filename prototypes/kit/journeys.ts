import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface JourneyStep {
  number: string;
  step: string;
  screen: string;
}

export interface Journey {
  id: string;
  title: string;
  steps: JourneyStep[];
}

// `pnpm proto` runs from the repo root.
const journeysDir = path.join(process.cwd(), "docs", "journeys");

const journeyNumber = (file: string) => Number.parseInt(file.slice(1), 10);

/** Reads every docs/journeys/J*.md file, so the index always matches the docs. */
export async function readJourneys(): Promise<Journey[]> {
  const files = (await readdir(journeysDir))
    .filter((file) => /^J\d+-.+\.md$/.test(file))
    .sort((a, b) => journeyNumber(a) - journeyNumber(b));

  return Promise.all(
    files.map(async (file) =>
      parseJourney(await readFile(path.join(journeysDir, file), "utf8")),
    ),
  );
}

// The heading gives the title; each numbered row of the steps table gives a step.
function parseJourney(markdown: string): Journey {
  const lines = markdown.split("\n");
  const title =
    lines
      .find((line) => line.startsWith("# "))
      ?.slice(2)
      .trim() ?? "Untitled journey";
  const steps = lines
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((row) => {
      const [number = "", step = "", screen = ""] = row
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      return { number, step, screen };
    });

  return { id: title.split(" ")[0] ?? title, title, steps };
}
