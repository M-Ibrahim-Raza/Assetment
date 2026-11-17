import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/sign-in/scenarios";
import { variants } from "@proto/screens/sign-in/variants";

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
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
