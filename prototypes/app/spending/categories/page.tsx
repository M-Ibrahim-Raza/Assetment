import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenarios } from "@proto/screens/categories/scenarios";
import { variants } from "@proto/screens/categories/variants";

export default function CategoriesPage({
  searchParams,
}: PageProps<"/spending/categories">) {
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
