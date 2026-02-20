"use client";

import { useState, useEffect } from "react";

interface SettingsFormProps {
  initialData: {
    buyLinkUrl: string;
    buyLinkLabel: string;
    companyLogoUrl: string;
    savedDesignExpiryDays: number;
    sectionOrder: string;
  };
}

const EXPIRY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const DEFAULT_SECTION_ORDER = ["store", "branding", "advanced"] as const;
type SectionId = (typeof DEFAULT_SECTION_ORDER)[number];

function parseSectionOrder(raw: string): SectionId[] {
  try {
    const parsed = JSON.parse(raw) as string[];
    if (Array.isArray(parsed)) {
      return parsed.filter((s) =>
        DEFAULT_SECTION_ORDER.includes(s as SectionId)
      ) as SectionId[];
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_SECTION_ORDER];
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [buyLinkUrl, setBuyLinkUrl] = useState(initialData.buyLinkUrl);
  const [buyLinkLabel, setBuyLinkLabel] = useState(initialData.buyLinkLabel);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(initialData.companyLogoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [savedDesignExpiryDays, setSavedDesignExpiryDays] = useState(
    initialData.savedDesignExpiryDays
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(() =>
    parseSectionOrder(initialData.sectionOrder)
  );
  const [saved, setSaved] = useState(false);

  const isDirty =
    buyLinkUrl !== initialData.buyLinkUrl ||
    buyLinkLabel !== initialData.buyLinkLabel ||
    companyLogoUrl !== initialData.companyLogoUrl ||
    savedDesignExpiryDays !== initialData.savedDesignExpiryDays ||
    JSON.stringify(sectionOrder) !== initialData.sectionOrder;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function moveSection(index: number, direction: "up" | "down") {
    const next = [...sectionOrder];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSectionOrder(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyLinkUrl: buyLinkUrl || null,
        buyLinkLabel: buyLinkLabel || null,
        companyLogoUrl: companyLogoUrl || null,
        savedDesignExpiryDays,
        sectionOrder: JSON.stringify(sectionOrder),
      }),
    });
    if (res.ok) setSaved(true);
  }

  const sectionLabels: Record<SectionId, string> = {
    store: "Store",
    branding: "Branding",
    advanced: "Advanced",
  };

  const storeCard = (
    <div key="store" className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-800">Store</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">Buy Link</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={buyLinkUrl}
              onChange={(e) => setBuyLinkUrl(e.target.value)}
              placeholder="https://www.etsy.com/..."
              className="flex-1 rounded-lg border border-stone-300 px-4 py-2"
            />
            <input
              type="text"
              value={buyLinkLabel}
              onChange={(e) => setBuyLinkLabel(e.target.value)}
              placeholder="Order on Etsy"
              className="w-36 rounded-lg border border-stone-300 px-4 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const brandingCard = (
    <div key="branding" className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-800">Branding</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">Company Logo</label>
          <div className="flex items-start gap-4">
            {companyLogoUrl && (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                <img
                  src={companyLogoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-4 py-2 text-sm hover:bg-stone-100 disabled:opacity-50">
                {logoUploading ? "Uploading..." : "Upload logo"}
                <input
                  type="file"
                  accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setLogoUploading(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.url) setCompanyLogoUrl(data.url);
                    } finally {
                      setLogoUploading(false);
                      e.target.value = "";
                    }
                  }}
                  disabled={logoUploading}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                className="text-xs text-stone-500 underline hover:text-stone-700"
              >
                {showLogoUrlInput ? "Hide" : "Or paste URL"}
              </button>
              {showLogoUrlInput && (
                <input
                  type="text"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  placeholder="/uploads/logo.png or https://example.com/logo.png"
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const advancedCard = (
    <div key="advanced" className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-medium text-stone-600">Advanced</span>
        <span className="text-stone-400">{showAdvanced ? "−" : "+"}</span>
      </button>
      {showAdvanced && (
        <div className="border-t border-stone-200 px-6 py-4">
          <label className="mb-2 block text-sm font-medium text-stone-600">
            How long to keep saved designs
          </label>
          <select
            value={savedDesignExpiryDays}
            onChange={(e) =>
              setSavedDesignExpiryDays(parseInt(e.target.value, 10))
            }
            className="rounded-lg border border-stone-300 px-4 py-2"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const sectionCards: Record<SectionId, React.ReactNode> = {
    store: storeCard,
    branding: brandingCard,
    advanced: advancedCard,
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      {sectionOrder.map((sectionId, index) => (
        <div key={sectionId} className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-2">
            <button
              type="button"
              onClick={() => moveSection(index, "up")}
              disabled={index === 0}
              className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-30"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveSection(index, "down")}
              disabled={index === sectionOrder.length - 1}
              className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-30"
              title="Move down"
            >
              ↓
            </button>
          </div>
          <div className="flex-1">{sectionCards[sectionId]}</div>
        </div>
      ))}

      <button
        type="submit"
        className="rounded-lg bg-amber-500 px-6 py-2 font-medium text-white hover:bg-amber-600"
      >
        Save Settings
      </button>
      {saved && <p className="text-sm text-green-600">Settings saved.</p>}
    </form>
  );
}
