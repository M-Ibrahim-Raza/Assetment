import { ProtoBar } from "./proto-bar";
import { pick, type Scenarios, type Variants } from "./scenarios";

interface ProtoScreenProps<Props extends object> {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  variants: Variants<Props>;
  scenarios: Scenarios<Props>;
}

/**
 * Renders the variant and scenario named in the URL (`?variant=`, `?scenario=`), plus the ProtoBar.
 * Every prototype route renders its screen through this, inside <Suspense>.
 */
export async function ProtoScreen<Props extends object>({
  searchParams,
  variants,
  scenarios,
}: ProtoScreenProps<Props>) {
  const params = await searchParams;
  const variant = pick(variants, params.variant);
  const scenario = pick(scenarios, params.scenario);
  const { View } = variant.value;

  return (
    <>
      {/* The key resets in-memory state when the variant or scenario changes. */}
      <View key={`${variant.key}:${scenario.key}`} {...scenario.value} />
      <ProtoBar
        variants={Object.entries(variants).map(([key, { name }]) => ({
          key,
          name,
        }))}
        scenarios={Object.keys(scenarios)}
        currentVariant={variant.key}
        currentScenario={scenario.key}
      />
    </>
  );
}
