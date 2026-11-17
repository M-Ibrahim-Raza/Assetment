import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/spending/scenarios";
import { variants } from "@proto/screens/spending/variants";

export default function SpendingPage({ searchParams }: PageProps<"/spending">) {
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
