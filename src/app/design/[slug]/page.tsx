import { CustomizationBuilder } from "@/components/builder/CustomizationBuilder";
import { getBaseUrl } from "@/lib/env";
import type { CanvasElement } from "@/components/builder/ProductCanvas";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DesignPage({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = getBaseUrl();

  const [designRes, settingsRes] = await Promise.all([
    fetch(`${baseUrl}/api/designs/${slug}`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/settings`, { cache: "no-store" }),
  ]);

  if (!designRes.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">Design not found.</p>
      </div>
    );
  }

  const design = await designRes.json();
  const settings = settingsRes.ok ? await settingsRes.json() : { buyLinkUrl: null, buyLinkLabel: null, companyLogoUrl: null };

  const raw = design.customization as Record<string, unknown>;
  const customization = {
    categoryId: raw.categoryId as string,
    productVariantId: raw.productVariantId as string,
    productImageUrl: raw.productImageUrl as string,
    selectedOptions: raw.selectedOptions as Record<string, string | string[]>,
    canvasElements: raw.canvasElements as CanvasElement,
  };

  return (
    <CustomizationBuilder
      initialCategory={design.category?.slug}
      initialCustomization={customization}
      settings={{
        buyLinkUrl: settings.buyLinkUrl,
        buyLinkLabel: settings.buyLinkLabel,
        companyLogoUrl: settings.companyLogoUrl,
      }}
    />
  );
}
