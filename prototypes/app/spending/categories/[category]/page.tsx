import { Suspense } from "react";
import { ProtoScreen } from "@proto/kit/proto-screen";
import { scenariosFor } from "@proto/screens/category-detail/scenarios";
import { variants } from "@proto/screens/category-detail/variants";

/** The slug is runtime data, so it is read inside Suspense. */
async function CategoryScreen({
  params,
  searchParams,
}: PageProps<"/spending/categories/[category]">) {
  const { category } = await params;
  return (
    <ProtoScreen
      searchParams={searchParams}
      variants={variants}
      scenarios={scenariosFor(category)}
    />
  );
}

export default function CategoryDetailPage(
  props: PageProps<"/spending/categories/[category]">,
) {
  return (
    <Suspense>
      <CategoryScreen {...props} />
    </Suspense>
  );
}
