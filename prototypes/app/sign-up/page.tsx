import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/sign-up/scenarios";
import { variants } from "@proto/screens/sign-up/variants";

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
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
