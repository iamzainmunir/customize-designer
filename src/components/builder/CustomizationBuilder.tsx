"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SIZE_SCALE: Record<string, number> = {
  XXS: 0.5,
  XS: 0.6,
  S: 0.75,
  M: 0.9,
  L: 1,
  XL: 1.1,
  XXL: 1.2,
};
const DEFAULT_SCALE = 1;
const CANVAS_CENTER_X = 200;
const CANVAS_CENTER_Y = 250;
import dynamic from "next/dynamic";
import { CategoryTabs } from "./CategoryTabs";
import { OptionsPanel } from "./OptionsPanel";
import type { CanvasElement } from "./ProductCanvas";

const ProductCanvas = dynamic(() => import("./ProductCanvas").then((m) => m.ProductCanvas), {
  ssr: false,
});

interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  productVariants: Array<{
    id: string;
    imageUrl: string;
    optionValues: Record<string, string>;
  }>;
  optionGroups: Array<{
    id: string;
    type: string;
    label: string;
    config: Record<string, unknown> | null;
    optionValues: Array<{ id: string; label: string; value: string; displayOrder: number }>;
  }>;
}

interface CustomizationBuilderProps {
  initialCategory?: string;
  initialCustomization?: {
    categoryId: string;
    productVariantId: string;
    selectedOptions: Record<string, string | string[]>;
    canvasElements: CanvasElement;
  };
  settings?: { buyLinkUrl: string | null; buyLinkLabel: string | null; companyLogoUrl: string | null };
}

export function CustomizationBuilder({
  initialCategory,
  initialCustomization,
  settings,
}: CustomizationBuilderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSlug, setActiveSlug] = useState(initialCategory || "");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [canvasElements, setCanvasElements] = useState<CanvasElement>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ slug: string } | null>(null);
  const stageRef = useRef<{ toDataURL: (config?: object) => string } | null>(null);
  const lastSizeRef = useRef<string | null>(null);
  const textPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [typography, setTypography] = useState({
    fontSize: 28,
    fontFamily: "system-ui",
    fontStyle: "normal",
  });

  const activeCategory = categories.find((c) => c.slug === activeSlug);
  const sizeGroup = activeCategory?.optionGroups.find((g) => g.type === "size");
  const selectedSize = sizeGroup ? (selectedOptions[sizeGroup.id] as string) : null;

  // Resolve variant from selectedOptions (size, productColor) so clicking size/color updates canvas
  const resolvedVariant = activeCategory?.productVariants.find((v) => {
    const ov = v.optionValues as Record<string, string>;
    return activeCategory.optionGroups.every((g) => {
      if (g.type === "size" && selectedOptions[g.id]) {
        return ov.size === selectedOptions[g.id];
      }
      if (g.type === "productColor" && selectedOptions[g.id]) {
        return ov.color === selectedOptions[g.id];
      }
      return true;
    });
  });

  const productImageUrl =
    resolvedVariant?.imageUrl ||
    activeCategory?.productVariants.find((v) => v.id === selectedVariantId)?.imageUrl ||
    activeCategory?.productVariants[0]?.imageUrl ||
    "/placeholder-product.svg";

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0 && !activeSlug) {
          setActiveSlug(data[0].slug);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initialCustomization) {
      setActiveSlug(
        categories.find((c) => c.id === initialCustomization.categoryId)?.slug || activeSlug
      );
      setSelectedOptions(initialCustomization.selectedOptions);
      setSelectedVariantId(initialCustomization.productVariantId);
      setCanvasElements(initialCustomization.canvasElements);
      if (initialCustomization.canvasElements.text) {
        const t = initialCustomization.canvasElements.text;
        setTypography({
          fontSize: t.fontSize,
          fontFamily: t.fontFamily,
          fontStyle: t.fontStyle ?? "normal",
        });
      }
    }
  }, [initialCustomization, categories]);

  useEffect(() => {
    lastSizeRef.current = selectedSize;
  }, [activeSlug]);

  useEffect(() => {
    if (activeCategory && !selectedVariantId && activeCategory.productVariants.length > 0) {
      setSelectedVariantId(activeCategory.productVariants[0].id);
    }
    if (activeCategory) {
      setSelectedOptions((prev) => {
        const next = { ...prev };
        activeCategory.optionGroups.forEach((g) => {
          if (g.type === "productColor" && !next[g.id]) {
            const firstVariant = activeCategory.productVariants[0];
            if (firstVariant) {
              const colorVal = (firstVariant.optionValues as Record<string, string>).color;
              const colorOpt = g.optionValues.find((o) => o.value === colorVal);
              if (colorOpt) next[g.id] = colorOpt.value;
            }
          }
          if (g.type === "size" && !next[g.id] && g.optionValues[0]) {
            next[g.id] = g.optionValues[0].value;
          }
          if (g.type === "text" && next[g.id] === undefined) next[g.id] = "";
          if (["popularColor", "yarnColor", "multiColor"].includes(g.type) && !next[g.id] && g.optionValues[0]) {
            const colorTypes = ["popularColor", "yarnColor", "multiColor"];
            const hasAnyTextColor = colorTypes.some((t) => {
              const grp = activeCategory.optionGroups.find((og) => og.type === t);
              return grp && next[grp.id];
            });
            if (!hasAnyTextColor) next[g.id] = g.optionValues[0].value;
          }
          if (g.type === "icons" && !next[g.id]) next[g.id] = [];
        });
        return next;
      });
    }
  }, [activeCategory, selectedVariantId]);

  // Keep selectedVariantId in sync when resolved from selectedOptions (e.g. after size change)
  useEffect(() => {
    if (resolvedVariant && resolvedVariant.id !== selectedVariantId) {
      setSelectedVariantId(resolvedVariant.id);
    }
  }, [resolvedVariant?.id, selectedVariantId]);

  // Scale text and icons when user changes product size
  useEffect(() => {
    if (!selectedSize || !sizeGroup) return;
    const prevSize = lastSizeRef.current;
    lastSizeRef.current = selectedSize;
    if (prevSize == null) return;

    const scalePrev = SIZE_SCALE[prevSize] ?? DEFAULT_SCALE;
    const scaleNext = SIZE_SCALE[selectedSize] ?? DEFAULT_SCALE;
    const ratio = scaleNext / scalePrev;
    if (Math.abs(ratio - 1) < 0.001) return;

    setCanvasElements((prev) => {
      const next: CanvasElement = { ...prev };
      if (prev.text) {
        const newX = CANVAS_CENTER_X + (prev.text.x - CANVAS_CENTER_X) * ratio;
        const newY = CANVAS_CENTER_Y + (prev.text.y - CANVAS_CENTER_Y) * ratio;
        textPositionRef.current = { x: newX, y: newY };
        next.text = {
          ...prev.text,
          fontSize: Math.round(prev.text.fontSize * ratio),
          x: newX,
          y: newY,
        };
      }
      if (prev.icons?.length) {
        next.icons = prev.icons.map((icon) => ({
          ...icon,
          width: Math.round(icon.width * ratio),
          height: Math.round(icon.height * ratio),
          x: CANVAS_CENTER_X + (icon.x - CANVAS_CENTER_X) * ratio,
          y: CANVAS_CENTER_Y + (icon.y - CANVAS_CENTER_Y) * ratio,
        }));
      }
      return next;
    });
  }, [selectedSize, sizeGroup?.id]);

  const handleOptionChange = useCallback((optionGroupId: string, value: string | string[]) => {
    setSelectedOptions((prev) => {
      const next = { ...prev, [optionGroupId]: value };
      if (!activeCategory) return next;
      const colorGroupIds = activeCategory.optionGroups
        .filter((g) => ["popularColor", "yarnColor", "multiColor"].includes(g.type))
        .map((g) => g.id);
      if (colorGroupIds.includes(optionGroupId) && value) {
        colorGroupIds.forEach((id) => {
          if (id !== optionGroupId) next[id] = id === "icons" ? [] : "";
        });
      }
      return next;
    });
  }, [activeCategory]);

  const handleVariantChange = useCallback(
    (variantId: string) => {
      setSelectedVariantId(variantId);
      const variant = activeCategory?.productVariants.find((v) => v.id === variantId);
      if (variant && activeCategory) {
        const ov = variant.optionValues as Record<string, string>;
        setSelectedOptions((prev) => {
          const next = { ...prev };
          activeCategory.optionGroups.forEach((g) => {
            if (g.type === "productColor" && ov.color) next[g.id] = ov.color;
            if (g.type === "size" && ov.size) next[g.id] = ov.size;
          });
          return next;
        });
      }
    },
    [activeCategory]
  );

  const textOptionGroup = activeCategory?.optionGroups.find((g) => g.type === "text");
  const yarnOptionGroup = activeCategory?.optionGroups.find((g) => g.type === "yarnColor");
  const popularColorGroup = activeCategory?.optionGroups.find((g) => g.type === "popularColor");
  const multiColorGroup = activeCategory?.optionGroups.find((g) => g.type === "multiColor");
  const iconsOptionGroup = activeCategory?.optionGroups.find((g) => g.type === "icons");

  useEffect(() => {
    const textContent = textOptionGroup ? (selectedOptions[textOptionGroup.id] as string) || "" : "";
    let textFill: string | string[] = "#171717";
    if (multiColorGroup && selectedOptions[multiColorGroup.id]) {
      const multiVal = selectedOptions[multiColorGroup.id] as string;
      try {
        const arr = JSON.parse(multiVal) as string[];
        if (Array.isArray(arr) && arr.length > 0) textFill = arr;
      } catch {
        textFill = multiVal;
      }
    } else if (popularColorGroup && selectedOptions[popularColorGroup.id]) {
      textFill = selectedOptions[popularColorGroup.id] as string;
    } else if (yarnOptionGroup && selectedOptions[yarnOptionGroup.id]) {
      textFill = selectedOptions[yarnOptionGroup.id] as string;
    }
    const iconUrls = iconsOptionGroup
      ? (selectedOptions[iconsOptionGroup.id] as string[]) || []
      : [];

    setCanvasElements((prev) => {
      const next: CanvasElement = { ...prev };
      if (textContent) {
        const x = textPositionRef.current?.x ?? prev.text?.x ?? 120;
        const y = textPositionRef.current?.y ?? prev.text?.y ?? 200;
        textPositionRef.current = { x, y };
        next.text = {
          content: textContent,
          x,
          y,
          fontSize: prev.text?.fontSize ?? typography.fontSize,
          fontFamily: prev.text?.fontFamily ?? typography.fontFamily,
          fontStyle: prev.text?.fontStyle ?? typography.fontStyle,
          fill: textFill,
        };
      } else {
        textPositionRef.current = null;
        delete next.text;
      }

      next.icons = iconUrls.map((url, i) => {
        const existing = prev.icons?.find((ic) => ic.imageUrl === url);
        return {
          id: existing?.id ?? `icon-${i}-${url}`,
          optionValueId: "",
          imageUrl: url,
          x: existing?.x ?? 150 + i * 60,
          y: existing?.y ?? 250,
          width: 48,
          height: 48,
        };
      });

      return next;
    });
  }, [
    selectedOptions,
    typography.fontSize,
    typography.fontFamily,
    typography.fontStyle,
    textOptionGroup?.id,
    yarnOptionGroup?.id,
    popularColorGroup?.id,
    multiColorGroup?.id,
    iconsOptionGroup?.id,
  ]);

  const handleElementsChange = useCallback((elements: CanvasElement) => {
    if (elements.text) {
      textPositionRef.current = { x: elements.text.x, y: elements.text.y };
    }
    setCanvasElements(elements);
  }, []);

  const handleDownload = useCallback(() => {
    const dataUrl = stageRef.current?.toDataURL?.({ pixelRatio: 2 });
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `custom-design-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeCategory) return;
    setSaving(true);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: activeCategory.id,
          customization: {
            categoryId: activeCategory.id,
            productVariantId: selectedVariantId,
            productImageUrl,
            selectedOptions,
            canvasElements,
          },
        }),
      });
      const data = await res.json();
      if (data.slug) {
        setSaveResult({ slug: data.slug });
        window.history.replaceState(null, "", `/design/${data.slug}`);
      }
    } finally {
      setSaving(false);
    }
  }, [activeCategory, selectedVariantId, productImageUrl, selectedOptions, canvasElements]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-stone-500">No categories yet. Add some in the admin panel.</p>
      </div>
    );
  }

  const textContent = textOptionGroup ? (selectedOptions[textOptionGroup.id] as string)?.trim() : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {settings?.companyLogoUrl ? (
            <a href="/" className="flex items-center">
              <img src={settings.companyLogoUrl} alt="Logo" className="h-10 object-contain" />
            </a>
          ) : (
            <h1 className="text-xl font-semibold text-stone-800">Product Customizer</h1>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <CategoryTabs categories={categories} activeSlug={activeSlug} onSelect={setActiveSlug} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProductCanvas
              productImageUrl={productImageUrl}
              elements={canvasElements}
              onElementsChange={handleElementsChange}
              stageRef={stageRef}
            />
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-stone-800">Customize</h2>
              <OptionsPanel
                optionGroups={activeCategory?.optionGroups ?? []}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
                productVariants={activeCategory?.productVariants ?? []}
                selectedVariantId={selectedVariantId}
                onVariantChange={handleVariantChange}
              />
              {textContent && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-4">
                  <span className="text-sm font-medium text-stone-700">Typography:</span>
                  <select
                    value={typography.fontFamily}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTypography((t) => ({ ...t, fontFamily: v }));
                      setCanvasElements((prev) =>
                        prev.text ? { ...prev, text: { ...prev.text, fontFamily: v } } : prev
                      );
                    }}
                    className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                  >
                    <option value="system-ui">System</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="cursive">Cursive</option>
                  </select>
                  <select
                    value={typography.fontSize}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setTypography((t) => ({ ...t, fontSize: v }));
                      setCanvasElements((prev) =>
                        prev.text ? { ...prev, text: { ...prev.text, fontSize: v } } : prev
                      );
                    }}
                    className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                  >
                    <option value={18}>Small</option>
                    <option value={24}>Medium</option>
                    <option value={28}>Large</option>
                    <option value={36}>X-Large</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        typography.fontStyle === "bold" || typography.fontStyle === "bold italic"
                          ? typography.fontStyle === "bold italic"
                            ? "italic"
                            : "normal"
                          : typography.fontStyle === "italic"
                            ? "bold italic"
                            : "bold";
                      setTypography((t) => ({ ...t, fontStyle: next }));
                      setCanvasElements((prev) =>
                        prev.text ? { ...prev, text: { ...prev.text, fontStyle: next } } : prev
                      );
                    }}
                    className={`rounded border px-3 py-1.5 text-sm font-medium ${
                      typography.fontStyle === "bold" || typography.fontStyle === "bold italic"
                        ? "border-amber-500 bg-amber-100 text-amber-800"
                        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        typography.fontStyle === "italic" || typography.fontStyle === "bold italic"
                          ? typography.fontStyle === "bold italic"
                            ? "bold"
                            : "normal"
                          : typography.fontStyle === "bold"
                            ? "bold italic"
                            : "italic";
                      setTypography((t) => ({ ...t, fontStyle: next }));
                      setCanvasElements((prev) =>
                        prev.text ? { ...prev, text: { ...prev.text, fontStyle: next } } : prev
                      );
                    }}
                    className={`rounded border px-3 py-1.5 text-sm italic ${
                      typography.fontStyle === "italic" || typography.fontStyle === "bold italic"
                        ? "border-amber-500 bg-amber-100 text-amber-800"
                        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    I
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDownload}
                className="w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-white hover:bg-amber-600"
              >
                Download Design
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Design"}
              </button>
              {saveResult && (
                <p className="text-sm text-green-600">
                  Saved! Share: <a href={`/design/${saveResult.slug}`} className="underline">/design/{saveResult.slug}</a>
                </p>
              )}
              {settings?.buyLinkUrl && (
                <a
                  href={settings.buyLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg border border-amber-500 bg-amber-50 px-4 py-3 text-center font-medium text-amber-800 hover:bg-amber-100"
                >
                  {settings.buyLinkLabel || "Order Now"}
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
