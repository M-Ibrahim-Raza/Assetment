import { Suspense } from "react";
import { LOAN_OPTIONS } from "@proto/components/debts/options";
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
        options={LOAN_OPTIONS}
      />
    </Suspense>
  );
}
