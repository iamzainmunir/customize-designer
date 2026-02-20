import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminHelpPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-semibold text-stone-800">Admin Help</h1>

      <section>
        <h2 className="mb-2 text-lg font-medium text-stone-700">Categories</h2>
        <p className="text-sm text-stone-600">
          Categories are product groups (e.g. Baskets, Backpacks, Sweaters). Each category has its own customization options and product variations. Use the main admin page to add categories and click <strong>Edit</strong> to configure each one.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium text-stone-700">Category Editor Tabs</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-stone-600">
          <li><strong>Details</strong> — Name, slug (URL), and display order.</li>
          <li><strong>Design</strong> — Overview of product images per variation. Images are managed in the Variations tab.</li>
          <li><strong>Attributes</strong> — Define what customers can customize (sizes, colors, text, icons).</li>
          <li><strong>Variations</strong> — Add product images for each size/color combination. Use &quot;Generate variations&quot; to auto-create combinations from your attributes.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium text-stone-700">Attribute Types</h2>
        <p className="mb-3 text-sm text-stone-600">
          Add attributes in the Attributes tab. Each type controls how options appear on the storefront:
        </p>
        <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
          <div>
            <h3 className="font-medium text-stone-700">Size</h3>
            <p className="text-sm text-stone-600">Standard sizes (XS, S, M, L, XL, XXL). Add custom sizes as option values. Used for products like clothing or bags.</p>
          </div>
          <div>
            <h3 className="font-medium text-stone-700">Product Color</h3>
            <p className="text-sm text-stone-600">Physical product colors (e.g. Natural, Brown, Green). Each value uses a hex color picker. Creates separate product variations with their own images.</p>
          </div>
          <div>
            <h3 className="font-medium text-stone-700">Text</h3>
            <p className="text-sm text-stone-600">Custom text input (e.g. names, monograms). Set <strong>Max characters</strong> to limit length.</p>
          </div>
          <div>
            <h3 className="font-medium text-stone-700">Popular Colors</h3>
            <p className="text-sm text-stone-600">Predefined color swatches for design elements (e.g. embroidery, print). Uses hex colors.</p>
          </div>
          <div>
            <h3 className="font-medium text-stone-700">Yarn Colors</h3>
            <p className="text-sm text-stone-600">Color options for yarn/thread-style products. Same as Popular Colors but with a different label.</p>
          </div>
          <div>
            <h3 className="font-medium text-stone-700">Multi Colors</h3>
            <p className="text-sm text-stone-600">Options with multiple colors (e.g. Rainbow = red, orange, yellow, green). Add several color swatches per option.</p>
          </div>
          <div>
            <h3 className="font-medium text-stone-700">Icons</h3>
            <p className="text-sm text-stone-600">Upload PNG or SVG icons for customers to add to designs. Set <strong>Max icons</strong> to limit how many can be selected.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium text-stone-700">Variations & Images</h2>
        <p className="text-sm text-stone-600">
          For categories with <strong>Product Color</strong> and/or <strong>Size</strong>, add a variation for each combination. Use &quot;Generate variations&quot; to create all combinations at once, then upload or paste an image URL for each. Each variant shows a different product image when customers select that size/color.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium text-stone-700">Settings</h2>
        <p className="text-sm text-stone-600">
          In <Link href="/admin/settings" className="text-amber-600 hover:text-amber-700 underline">Settings</Link>, configure:
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-stone-600">
          <li><strong>Buy Link</strong> — URL and label for the &quot;Order&quot; button (e.g. Etsy, your shop).</li>
          <li><strong>Company Logo</strong> — Upload or paste a URL. Shown in the admin header and on the storefront.</li>
          <li><strong>Saved designs expiry</strong> — How long saved designs are kept (7–90 days).</li>
          <li><strong>Section order</strong> — Reorder Store, Branding, and Advanced sections with the arrows.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium text-stone-700">Environment Variables</h2>
        <p className="text-sm text-stone-600">
          Admin login uses <code className="rounded bg-stone-100 px-1">ADMIN_EMAIL</code> and <code className="rounded bg-stone-100 px-1">ADMIN_PASSWORD</code> from your environment. Set these in <code className="rounded bg-stone-100 px-1">.env</code> locally or in your deployment config.
        </p>
      </section>
    </div>
  );
}
