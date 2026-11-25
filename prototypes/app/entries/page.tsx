import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/entries/scenarios";
import { variants } from "@proto/screens/entries/variants";

export default function EntriesPage({ searchParams }: PageProps<"/entries">) {
  return (
    <Suspense>
      <ProtoScreen
        searchParams={searchParams}
        variants={variants}
        scenarios={scenarios}
      />
    </Suspense>
  );
}
