import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/quick-add/scenarios";
import { variants } from "@proto/screens/quick-add/variants";

export default function QuickAddPage({ searchParams }: PageProps<"/add">) {
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
