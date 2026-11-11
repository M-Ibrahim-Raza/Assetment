import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/setup/scenarios";
import { variants } from "@proto/screens/setup/variants";

export default function SetupPage({ searchParams }: PageProps<"/setup">) {
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
