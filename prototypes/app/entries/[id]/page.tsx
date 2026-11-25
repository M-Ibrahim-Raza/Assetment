import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/entry-detail/scenarios";
import { variants } from "@proto/screens/entry-detail/variants";

/**
 * One entry open. The View reads the id from the path itself, so it stays the same screen as
 * the list: opening another entry there adds a Back step without leaving the page.
 */
export default function EntryDetailPage({
  searchParams,
}: PageProps<"/entries/[id]">) {
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
