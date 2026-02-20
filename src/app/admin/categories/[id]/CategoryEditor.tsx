"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const OPTION_TYPES = [
  { value: "size", label: "Size" },
  { value: "productColor", label: "Product Color" },
  { value: "text", label: "Text" },
  { value: "popularColor", label: "Popular Colors" },
  { value: "yarnColor", label: "Yarn Colors" },
  { value: "multiColor", label: "Multi Colors" },
  { value: "icons", label: "Icons" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

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
  displayOrder: number;
  optionValues: OptionValue[];
}

interface ProductVariant {
  id: string;
  imageUrl: string;
  optionValues: Record<string, string>;
}

interface CategoryEditorProps {
  category: {
    id: string;
    name: string;
    slug: string;
    displayOrder: number;
    productVariants: ProductVariant[];
    optionGroups: OptionGroup[];
  };
}

type TabId = "details" | "design" | "attributes" | "variations";

export function CategoryEditor({ category }: CategoryEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [displayOrder, setDisplayOrder] = useState(category.displayOrder);
  const [saving, setSaving] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);
  const saveEventId = "category-editor-save";

  const detailsDirty =
    name !== category.name ||
    slug !== category.slug ||
    displayOrder !== category.displayOrder;

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "design", label: "Design" },
    { id: "attributes", label: "Attributes" },
    { id: "variations", label: "Variations" },
  ];

  function handleTabClick(tabId: TabId) {
    if (tabId === activeTab) return;
    if (activeTab === "details" && detailsDirty) {
      setPendingTab(tabId);
    } else {
      setActiveTab(tabId);
    }
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (detailsDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [detailsDirty]);

  async function saveCategory() {
    setSaving(true);
    await fetch(`/api/admin/categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, displayOrder }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Unsaved changes modal */}
      {pendingTab !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <p className="mb-4 text-stone-700">You have unsaved changes. Leave anyway?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingTab(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  if (pendingTab !== null) setActiveTab(pendingTab);
                  setPendingTab(null);
                }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-stone-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-amber-500 text-amber-700"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "details" && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-stone-800">Category Details</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (slug === category.slug)
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
          </div>
          <button
            onClick={saveCategory}
            disabled={saving}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {activeTab === "design" && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-stone-800">Product Images</h2>
          <p className="mb-4 text-sm text-stone-500">
            Product images are configured in the Variations tab. Add attributes (e.g. Product Color, Size) first, then upload an image for each variation.
          </p>
          {category.productVariants.length > 0 ? (
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
              {category.productVariants.map((v) => (
                <div key={v.id} className="flex flex-col items-center gap-1">
                  <img
                    src={v.imageUrl}
                    alt=""
                    className="h-20 w-20 rounded-lg border border-stone-200 object-cover"
                  />
                  <span className="text-xs text-stone-500">
                    {Object.values(v.optionValues).join(" / ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400">No variants yet. Add them in the Variations tab.</p>
          )}
          <button
            onClick={() => setActiveTab("variations")}
            className="mt-4 text-sm text-amber-600 hover:text-amber-700"
          >
            Go to Variations →
          </button>
        </div>
      )}

      {activeTab === "attributes" && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-stone-800">Attributes</h2>
          <p className="mb-4 text-sm text-stone-500">
            Define what customers can customize: sizes, colors, text, icons, etc.
          </p>
          <div className="space-y-4">
            {category.optionGroups.map((g) => (
              <OptionGroupRow
                key={g.id}
                group={g}
                category={category}
                onUpdate={() => router.refresh()}
                saveEventId={saveEventId}
              />
            ))}
            <AddOptionGroup categoryId={category.id} onAdd={() => router.refresh()} />
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(saveEventId))}
            className="mt-6 rounded-lg bg-amber-500 px-6 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
        </div>
      )}

      {activeTab === "variations" && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-stone-800">Variations</h2>
          <p className="mb-4 text-sm text-stone-500">
            Upload a product image for each color and size combination. Add Product Color and Size options in the Attributes tab first.
          </p>
          <GenerateVariationsButton category={category} onAdd={() => router.refresh()} />
          <div className="mt-6 space-y-4">
            {category.productVariants.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                category={category}
                onUpdate={() => router.refresh()}
                saveEventId={saveEventId}
              />
            ))}
            <AddVariantRow category={category} onAdd={() => router.refresh()} />
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(saveEventId))}
            className="mt-6 rounded-lg bg-amber-500 px-6 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function GenerateVariationsButton({
  category,
  onAdd,
}: {
  category: CategoryEditorProps["category"];
  onAdd: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const sizeGroup = category.optionGroups.find((g) => g.type === "size");
  const colorGroup = category.optionGroups.find((g) => g.type === "productColor");

  const sizes = sizeGroup?.optionValues.map((o) => o.value) ?? [];
  const colors = colorGroup?.optionValues.map((o) => o.value) ?? [];

  const canGenerate =
    (sizes.length > 0 || colors.length > 0) &&
    !(sizes.length === 0 && colors.length === 0);

  async function generate() {
    if (!canGenerate) return;
    const combinations: Record<string, string>[] = [];
    if (sizes.length > 0 && colors.length > 0) {
      for (const size of sizes) {
        for (const color of colors) {
          combinations.push({ size, color });
        }
      }
    } else if (sizes.length > 0) {
      for (const size of sizes) {
        combinations.push({ size });
      }
    } else {
      for (const color of colors) {
        combinations.push({ color });
      }
    }

    setGenerating(true);
    for (const optionValues of combinations) {
      await fetch("/api/admin/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          imageUrl: "/placeholder-product.svg",
          optionValues,
        }),
      });
    }
    setGenerating(false);
    onAdd();
  }

  if (!canGenerate) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="mb-2 text-sm text-stone-600">
        {sizes.length > 0 && colors.length > 0
          ? `Generate ${sizes.length} × ${colors.length} = ${sizes.length * colors.length} variations`
          : sizes.length > 0
            ? `Generate ${sizes.length} size variations`
            : `Generate ${colors.length} color variations`}
      </p>
      <button
        type="button"
        onClick={generate}
        disabled={generating}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {generating ? "Generating..." : "Generate variations"}
      </button>
    </div>
  );
}

function VariantRow({
  variant,
  category,
  onUpdate,
  saveEventId,
}: {
  variant: ProductVariant;
  category: CategoryEditorProps["category"];
  onUpdate: () => void;
  saveEventId: string;
}) {
  const [imageUrl, setImageUrl] = useState(variant.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sizeGroup = category.optionGroups.find((g) => g.type === "size");
  const colorGroup = category.optionGroups.find((g) => g.type === "productColor");

  const ov = variant.optionValues as Record<string, string>;
  const [selectedSize, setSelectedSize] = useState(ov.size || "");
  const [selectedColor, setSelectedColor] = useState(ov.color || "");

  const optionValues: Record<string, string> = {};
  if (sizeGroup && selectedSize) optionValues.size = selectedSize;
  if (colorGroup && selectedColor) optionValues.color = selectedColor;

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/variants/${variant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, optionValues }),
    });
    setSaving(false);
    onUpdate();
  }

  useEffect(() => {
    const handler = () => save();
    window.addEventListener(saveEventId, handler);
    return () => window.removeEventListener(saveEventId, handler);
  }, [saveEventId, imageUrl, selectedSize, selectedColor]);

  async function remove() {
    if (!confirm("Delete this variant?")) return;
    await fetch(`/api/admin/variants/${variant.id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <div className="flex items-start gap-4 rounded-lg border border-stone-200 p-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-stone-400">No image</span>
        )}
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-3">
          {sizeGroup && (
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="rounded border border-stone-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {sizeGroup.optionValues.map((o) => (
                  <option key={o.id} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {colorGroup && (
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Color</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="rounded border border-stone-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                {colorGroup.optionValues.map((o) => (
                  <option key={o.id} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-50">
            {uploading ? "..." : "Upload image"}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.url) setImageUrl(data.url);
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Or paste image URL"
            className="flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={remove}
            className="rounded bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AddVariantRow({
  category,
  onAdd,
}: {
  category: CategoryEditorProps["category"];
  onAdd: () => void;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);

  const sizeGroup = category.optionGroups.find((g) => g.type === "size");
  const colorGroup = category.optionGroups.find((g) => g.type === "productColor");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const optionValues: Record<string, string> = {};
  if (sizeGroup && selectedSize) optionValues.size = selectedSize;
  if (colorGroup && selectedColor) optionValues.color = selectedColor;

  async function add() {
    if (!imageUrl.trim()) return;
    setAdding(true);
    await fetch("/api/admin/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: category.id,
        imageUrl,
        optionValues: Object.keys(optionValues).length > 0 ? optionValues : { color: "default" },
      }),
    });
    setImageUrl("");
    setSelectedSize("");
    setSelectedColor("");
    setAdding(false);
    onAdd();
  }

  return (
    <div className="flex items-start gap-4 rounded-lg border border-dashed border-stone-300 p-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
        +
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-3">
          {sizeGroup && (
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="rounded border border-stone-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {sizeGroup.optionValues.map((o) => (
                  <option key={o.id} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {colorGroup && (
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">Color</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="rounded border border-stone-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                {colorGroup.optionValues.map((o) => (
                  <option key={o.id} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-50">
            {uploading ? "..." : "Upload image"}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.url) setImageUrl(data.url);
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Or paste image URL"
            className="flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={add}
          disabled={adding || !imageUrl.trim()}
          className="rounded bg-stone-200 px-3 py-1.5 text-sm hover:bg-stone-300 disabled:opacity-50"
        >
          Add Variation
        </button>
      </div>
    </div>
  );
}

function OptionGroupRow({
  group,
  category,
  onUpdate,
  saveEventId,
}: {
  group: OptionGroup;
  category: CategoryEditorProps["category"];
  onUpdate: () => void;
  saveEventId: string;
}) {
  const [label, setLabel] = useState(group.label);
  const [maxLength, setMaxLength] = useState(
    (group.config?.maxLength as number) ?? 50
  );
  const [maxIcons, setMaxIcons] = useState(
    (group.config?.maxIcons as number) ?? 2
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const config: Record<string, unknown> = {};
    if (group.type === "text") config.maxLength = maxLength;
    if (group.type === "icons") config.maxIcons = maxIcons;
    await fetch(`/api/admin/option-groups/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, config }),
    });
    setSaving(false);
    onUpdate();
  }

  useEffect(() => {
    const handler = () => save();
    window.addEventListener(saveEventId, handler);
    return () => window.removeEventListener(saveEventId, handler);
  }, [saveEventId, label, maxLength, maxIcons]);

  async function remove() {
    if (!confirm("Delete this attribute and all its values?")) return;
    await fetch(`/api/admin/option-groups/${group.id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
          {group.type}
        </span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm"
        />
        <button
          onClick={remove}
          className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
        >
          Delete
        </button>
      </div>
      {group.type === "text" && (
        <div className="mb-3">
          <label className="text-xs text-stone-500">Max characters</label>
          <input
            type="number"
            value={maxLength}
            onChange={(e) => setMaxLength(parseInt(e.target.value, 10) || 50)}
            min={1}
            max={200}
            className="ml-2 w-20 rounded border border-stone-300 px-2 py-1 text-sm"
          />
        </div>
      )}
      {group.type === "icons" && (
        <div className="mb-3">
          <label className="text-xs text-stone-500">Max icons</label>
          <input
            type="number"
            value={maxIcons}
            onChange={(e) => setMaxIcons(parseInt(e.target.value, 10) || 2)}
            min={1}
            max={10}
            className="ml-2 w-20 rounded border border-stone-300 px-2 py-1 text-sm"
          />
        </div>
      )}
      <OptionValuesList group={group} onUpdate={onUpdate} saveEventId={saveEventId} />
    </div>
  );
}

function OptionValuesList({
  group,
  onUpdate,
  saveEventId,
}: {
  group: OptionGroup;
  onUpdate: () => void;
  saveEventId: string;
}) {
  const isColorType = ["yarnColor", "popularColor", "productColor"].includes(group.type);
  const isMultiColor = group.type === "multiColor";
  const isIconType = group.type === "icons";

  return (
    <div className="space-y-2 pl-4">
      {group.optionValues.map((opt) => (
        <OptionValueRow
          key={opt.id}
          option={opt}
          groupType={group.type}
          isColorType={isColorType}
          isMultiColor={isMultiColor}
          isIconType={isIconType}
          onUpdate={onUpdate}
          saveEventId={saveEventId}
        />
      ))}
      <AddOptionValue groupId={group.id} groupType={group.type} onAdd={onUpdate} />
    </div>
  );
}

function OptionValueRow({
  option,
  groupType,
  isColorType,
  isMultiColor,
  isIconType,
  onUpdate,
  saveEventId,
}: {
  option: OptionValue;
  groupType: string;
  isColorType: boolean;
  isMultiColor: boolean;
  isIconType: boolean;
  onUpdate: () => void;
  saveEventId: string;
}) {
  const [label, setLabel] = useState(option.label);
  const [value, setValue] = useState(option.value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/option-values/${option.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, value }),
    });
    setSaving(false);
    onUpdate();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !/\.(png|svg)$/i.test(file.name)) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setValue(data.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  useEffect(() => {
    const handler = () => save();
    window.addEventListener(saveEventId, handler);
    return () => window.removeEventListener(saveEventId, handler);
  }, [saveEventId, label, value]);

  async function remove() {
    if (!confirm("Delete this option?")) return;
    await fetch(`/api/admin/option-values/${option.id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <div className="flex items-center gap-2 rounded border border-stone-100 p-2">
      {isColorType && (
        <input
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-stone-300 p-0"
        />
      )}
      {isMultiColor && (
        <MultiColorPicker value={value} onChange={setValue} />
      )}
      {isIconType && (
        <>
          <img
            src={value}
            alt=""
            className="h-6 w-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <label className="cursor-pointer rounded bg-stone-200 px-2 py-1 text-xs hover:bg-stone-300 disabled:opacity-50">
            {uploading ? "..." : "Upload"}
            <input
              type="file"
              accept=".png,.svg,image/png,image/svg+xml"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </>
      )}
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
        className="w-32 rounded border border-stone-300 px-2 py-1 text-sm"
      />
      {!isColorType && !isIconType && (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="flex-1 rounded border border-stone-300 px-2 py-1 text-sm"
        />
      )}
      {isColorType && (
        <span className="text-xs text-stone-400">{value}</span>
      )}
      <button
        onClick={remove}
        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
      >
        Del
      </button>
    </div>
  );
}

function MultiColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  let colors: string[] = [];
  try {
    colors = JSON.parse(value) as string[];
  } catch {
    if (value.startsWith("#")) colors = [value];
  }
  if (!Array.isArray(colors)) colors = [];

  function updateColors(next: string[]) {
    onChange(JSON.stringify(next));
  }

  function addColor() {
    updateColors([...colors, "#000000"]);
  }

  function removeColor(i: number) {
    updateColors(colors.filter((_, j) => j !== i));
  }

  function setColor(i: number, hex: string) {
    const next = [...colors];
    next[i] = hex;
    updateColors(next);
  }

  return (
    <div className="flex items-center gap-1">
      {colors.map((c, i) => (
        <div key={i} className="flex items-center gap-1">
          <input
            type="color"
            value={c.startsWith("#") ? c : "#000000"}
            onChange={(e) => setColor(i, e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border border-stone-300 p-0"
          />
          <button
            type="button"
            onClick={() => removeColor(i)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addColor}
        className="rounded border border-dashed border-stone-300 px-2 py-1 text-xs text-stone-500 hover:border-stone-400"
      >
        + Color
      </button>
    </div>
  );
}

function AddOptionValue({
  groupId,
  groupType,
  onAdd,
}: {
  groupId: string;
  groupType: string;
  onAdd: () => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("#000000");
  const [multiColors, setMultiColors] = useState<string[]>(["#000000"]);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isColorType = ["yarnColor", "popularColor", "productColor"].includes(groupType);
  const isMultiColor = groupType === "multiColor";
  const isIconType = groupType === "icons";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !/\.(png|svg)$/i.test(file.name)) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setValue(data.url);
        setLabel(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function add() {
    if (!label.trim()) return;
    if (isColorType && !value) return;
    if (isIconType && !value) return;
    if (isMultiColor && multiColors.length === 0) return;
    if (!isColorType && !isIconType && !isMultiColor && !value.trim()) return;
    setAdding(true);
    const finalValue = isMultiColor ? JSON.stringify(multiColors) : value;
    await fetch("/api/admin/option-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionGroupId: groupId, label, value: finalValue }),
    });
    setLabel("");
    setValue("#000000");
    setMultiColors(["#000000"]);
    setAdding(false);
    onAdd();
  }

  if (isMultiColor) {
    return (
      <div className="space-y-2 rounded border border-dashed border-stone-300 p-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Rainbow)"
          className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          {multiColors.map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="color"
                value={c.startsWith("#") ? c : "#000000"}
                onChange={(e) => {
                  const next = [...multiColors];
                  next[i] = e.target.value;
                  setMultiColors(next);
                }}
                className="h-7 w-7 cursor-pointer rounded border border-stone-300 p-0"
              />
              <button
                type="button"
                onClick={() => setMultiColors(multiColors.filter((_, j) => j !== i))}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMultiColors([...multiColors, "#000000"])}
            className="rounded border border-dashed border-stone-300 px-2 py-1 text-xs text-stone-500"
          >
            + Color
          </button>
        </div>
        <button
          onClick={add}
          disabled={adding || !label.trim()}
          className="rounded bg-stone-200 px-2 py-1 text-xs hover:bg-stone-300 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded border border-dashed border-stone-300 p-2">
      {isColorType && (
        <input
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-stone-300 p-0"
        />
      )}
      {isIconType && (
        <label className="cursor-pointer rounded bg-stone-200 px-2 py-1 text-xs hover:bg-stone-300 disabled:opacity-50">
          {uploading ? "..." : "Upload PNG/SVG"}
          <input
            type="file"
            accept=".png,.svg,image/png,image/svg+xml"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
        className="w-32 rounded border border-stone-300 px-2 py-1 text-sm"
      />
      {!isColorType && !isIconType && (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="flex-1 rounded border border-stone-300 px-2 py-1 text-sm"
        />
      )}
      <button
        onClick={add}
        disabled={
          adding ||
          !label.trim() ||
          (isColorType && !value) ||
          (isIconType && !value) ||
          (!isColorType && !isIconType && !value.trim())
        }
        className="rounded bg-stone-200 px-2 py-1 text-xs hover:bg-stone-300 disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}

function AddOptionGroup({ categoryId, onAdd }: { categoryId: string; onAdd: () => void }) {
  const [type, setType] = useState("text");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!label.trim()) return;
    setAdding(true);
    await fetch("/api/admin/option-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, type, label }),
    });
    setLabel("");
    setAdding(false);
    onAdd();
  }

  return (
    <div className="flex gap-2 rounded-lg border border-dashed border-stone-300 p-4">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded border border-stone-300 px-3 py-2 text-sm"
      >
        {OPTION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Attribute label"
        className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm"
      />
      <button
        onClick={add}
        disabled={adding || !label.trim()}
        className="rounded bg-stone-200 px-4 py-2 text-sm hover:bg-stone-300 disabled:opacity-50"
      >
        Add Attribute
      </button>
    </div>
  );
}
