import { CustomizationBuilder } from "@/components/builder/CustomizationBuilder";
import { getBaseUrl } from "@/lib/env";

export default async function Home() {
  const settingsRes = await fetch(`${getBaseUrl()}/api/settings`, {
    cache: "no-store",
  });
  const settings = settingsRes.ok ? await settingsRes.json() : { buyLinkUrl: null, buyLinkLabel: null, companyLogoUrl: null };

  return (
    <CustomizationBuilder
      settings={{
        buyLinkUrl: settings.buyLinkUrl,
        buyLinkLabel: settings.buyLinkLabel,
        companyLogoUrl: settings.companyLogoUrl,
      }}
    />
  );
}
