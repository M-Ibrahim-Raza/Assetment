import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/demo/scenarios";
import { variants } from "@proto/screens/demo/variants";

// Reference only: not a production URL. Real screens use the same URL as production.
export default function DemoPage({ searchParams }: PageProps<"/demo">) {
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
