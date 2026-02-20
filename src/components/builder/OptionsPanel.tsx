"use client";

interface OptionValue {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
}

interface OptionGroup {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown> | null;
  optionValues: OptionValue[];
}

interface OptionsPanelProps {
  optionGroups: OptionGroup[];
  selectedOptions: Record<string, string | string[]>;
  onOptionChange: (optionGroupId: string, value: string | string[]) => void;
  productVariants: Array<{ id: string; imageUrl: string; optionValues: Record<string, string> }>;
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
}

export function OptionsPanel({
  optionGroups,
  selectedOptions,
  onOptionChange,
  productVariants,
  selectedVariantId,
  onVariantChange,
}: OptionsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Product color / variant selector - show product image thumbnails */}
      {optionGroups.find((g) => g.type === "productColor") && productVariants.length > 1 && (
        <div>
          <h3 className="mb-3 font-medium text-stone-800">
            {optionGroups.find((g) => g.type === "productColor")?.label}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const productColorGroup = optionGroups.find((g) => g.type === "productColor");
              const sizeGroup = optionGroups.find((g) => g.type === "size");
              const currentSize = sizeGroup ? selectedOptions[sizeGroup.id] : undefined;
              const variantsToShow = currentSize
                ? productVariants.filter((v) => (v.optionValues as Record<string, string>).size === currentSize)
                : productVariants;
              const displayVariants = variantsToShow.length > 0 ? variantsToShow : productVariants;
              return displayVariants.map((v) => {
                const colorValue = (v.optionValues as Record<string, string>).color ?? "default";
                const colorLabel =
                  productColorGroup?.optionValues.find((o) => o.value === colorValue)?.label ?? colorValue;
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onVariantChange(v.id)}
                    className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-lg border-2 p-1 transition-colors ${
                      isSelected ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <img src={v.imageUrl} alt={colorLabel} className="h-14 w-14 object-cover" />
                    {isSelected && (
                      <span className="absolute right-1 top-1 text-amber-600">✓</span>
                    )}
                    <span className="text-xs text-stone-600 capitalize">{colorLabel}</span>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {optionGroups.map((group) => {
        if (group.type === "productColor") return null;

        if (group.type === "size") {
          const productColorGroup = optionGroups.find((g) => g.type === "productColor");
          const currentColor = productColorGroup ? selectedOptions[productColorGroup.id] : undefined;
          return (
            <div key={group.id}>
              <h3 className="mb-3 font-medium text-stone-800">{group.label}</h3>
              <div className="flex flex-wrap gap-2">
                {group.optionValues.map((opt) => {
                  const isSelected = selectedOptions[group.id] === opt.value;
                  const variantForThumb = productVariants.find((v) => {
                    const ov = v.optionValues as Record<string, string>;
                    if (ov.size !== opt.value) return false;
                    if (currentColor && ov.color !== currentColor) return false;
                    return true;
                  });
                  const thumbUrl = variantForThumb?.imageUrl;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onOptionChange(group.id, opt.value)}
                      className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-lg border-2 p-1 transition-colors ${
                        isSelected ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={opt.label} className="h-14 w-14 object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">
                          {opt.label}
                        </div>
                      )}
                      <span className="text-xs text-stone-600">{opt.label}</span>
                      {isSelected && (
                        <span className="absolute right-1 top-1 text-amber-600">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (group.type === "text") {
          const maxLength = (group.config?.maxLength as number) ?? 50;
          const value = (selectedOptions[group.id] as string) ?? "";
          return (
            <div key={group.id}>
              <h3 className="mb-3 font-medium text-stone-800">{group.label}</h3>
              <input
                type="text"
                value={value}
                onChange={(e) => onOptionChange(group.id, e.target.value.slice(0, maxLength))}
                placeholder="Enter text..."
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-stone-500">
                {value.length}/{maxLength} characters
              </p>
            </div>
          );
        }

        if (group.type === "popularColor" || group.type === "yarnColor") {
          const isPopular = group.type === "popularColor";
          return (
            <div key={group.id}>
              <h3 className="mb-3 font-medium text-stone-800">{group.label}</h3>
              <div className={`grid gap-2 ${isPopular ? "grid-cols-6" : "grid-cols-6"}`}>
                {group.optionValues.map((opt) => {
                  const isSelected = selectedOptions[group.id] === opt.value;
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        onOptionChange(group.id, isSelected ? "" : opt.value)
                      }
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected ? "border-amber-500 ring-2 ring-amber-200" : "border-stone-300"
                      }`}
                      style={{ backgroundColor: opt.value }}
                      title={opt.label}
                    />
                  );
                })}
              </div>
            </div>
          );
        }

        if (group.type === "multiColor") {
          return (
            <div key={group.id}>
              <h3 className="mb-3 font-medium text-stone-800">{group.label}</h3>
              <div className="space-y-3">
                {group.optionValues.map((opt) => {
                  const isSelected = selectedOptions[group.id] === opt.value;
                  let colors: string[] = [];
                  try {
                    colors = JSON.parse(opt.value) as string[];
                  } catch {
                    colors = opt.value.startsWith("#") ? [opt.value] : [];
                  }
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                        isSelected ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name={group.id}
                        checked={isSelected}
                        onChange={() =>
                          onOptionChange(group.id, isSelected ? "" : opt.value)
                        }
                        className="h-4 w-4 text-amber-500"
                      />
                      <span className="text-sm font-medium text-stone-700">{opt.label}</span>
                      <div className="flex gap-1">
                        {colors.map((c, i) => (
                          <div
                            key={i}
                            className="h-5 w-5 rounded-full border border-stone-300"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }

        if (group.type === "icons") {
          const maxIcons = (group.config?.maxIcons as number) ?? 2;
          const selected = (selectedOptions[group.id] as string[]) ?? [];
          return (
            <div key={group.id}>
              <h3 className="mb-3 font-medium text-stone-800">{group.label}</h3>
              <div className="grid grid-cols-4 gap-2">
                {group.optionValues.map((opt) => {
                  const isSelected = selected.includes(opt.value);
                  const canSelect = isSelected || selected.length < maxIcons;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (isSelected) {
                          onOptionChange(
                            group.id,
                            selected.filter((v) => v !== opt.value)
                          );
                        } else if (canSelect) {
                          onOptionChange(group.id, [...selected, opt.value]);
                        }
                      }}
                      disabled={!canSelect && !isSelected}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                        isSelected ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                      } ${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <img
                        src={opt.value}
                        alt={opt.label}
                        className="h-8 w-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-xs text-stone-600">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
