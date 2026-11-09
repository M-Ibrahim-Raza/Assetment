import Link from "next/link";
import { Suspense } from "react";
import { readJourneys } from "@proto/kit/journeys";
import { screenRoutes } from "@proto/screens";

export default function PrototypeIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Assetment prototype</h1>
        <p className="text-foreground/70">
          Every journey in docs/journeys/, step by step. Open a screen to try
          its variants and scenarios.
        </p>
      </header>

      <Suspense fallback={<p>Loading journeys…</p>}>
        <JourneyList />
      </Suspense>

      <section aria-labelledby="reference" className="space-y-2">
        <h2 id="reference" className="text-lg font-medium">
          Reference
        </h2>
        <p>
          <Link href="/demo" className="underline underline-offset-4">
            Demo screen
          </Link>
          : the shape every prototype screen follows.
        </p>
      </section>
    </main>
  );
}

async function JourneyList() {
  const journeys = await readJourneys();

  return journeys.map((journey) => (
    <section
      key={journey.id}
      aria-labelledby={journey.id}
      className="space-y-3"
    >
      <h2 id={journey.id} className="text-lg font-medium">
        {journey.title}
      </h2>
      <ol className="space-y-2">
        {journey.steps.map((step) => {
          const route = screenRoutes[step.screen];
          return (
            <li
              key={step.number}
              className="flex flex-wrap justify-between gap-x-4"
            >
              <span>
                {step.number}. {step.step}
              </span>
              {route ? (
                <Link href={route} className="underline underline-offset-4">
                  {step.screen}
                </Link>
              ) : (
                <span className="text-foreground/60">
                  {step.screen} · not built
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  ));
}
