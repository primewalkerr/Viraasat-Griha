"use client";

import { useMemo, useState } from "react";
import { addToBag } from "@/app/bag/actions";
import type { ShopifyProductDetail } from "@/lib/shopify";

function pickDefaultVariant(variants: ShopifyProductDetail["variants"]) {
  return variants.find((v) => v.availableForSale) ?? variants[0];
}

/** Full product detail: gallery, description, variant/size picker, stock status, quantity, add to bag. */
export default function ProductDetail({ product }: { product: ShopifyProductDetail }) {
  const { title, vendor, descriptionHtml, images, options, variants } = product;
  const defaultVariant = pickDefaultVariant(variants);
  const [selected, setSelected] = useState<Record<string, string>>(defaultVariant?.options ?? {});
  const [mainImage, setMainImage] = useState<string | null>(defaultVariant?.image ?? images[0]?.url ?? null);
  const [qty, setQty] = useState(1);

  const variant = useMemo(
    () => variants.find((v) => options.every((o) => v.options[o.name] === selected[o.name])) ?? defaultVariant,
    [selected, variants, options, defaultVariant],
  );

  const pickOption = (name: string, value: string) => {
    const next = { ...selected, [name]: value };
    setSelected(next);
    const match = variants.find((v) => options.every((o) => v.options[o.name] === next[o.name]));
    if (match?.image) setMainImage(match.image);
  };

  const inStock = variant?.availableForSale ?? false;
  const showCompareAt = variant?.compareAtAmount != null && variant.compareAtAmount > variant.amount;

  return (
    <div className="product-detail">
      <div className="product-gallery">
        {images.length > 1 && (
          <div className="product-thumbs">
            {images.map((img) => (
              <button key={img.url} type="button" className={`product-thumb${mainImage === img.url ? " active" : ""}`}
                aria-label={img.alt || title} onClick={() => setMainImage(img.url)}>
                <img src={img.url} alt="" />
              </button>
            ))}
          </div>
        )}
        <div className="product-img">
          {mainImage ? <img src={mainImage} alt={title} /> : <div className="photo-missing">No photo yet</div>}
        </div>
      </div>

      <div className="product-info">
        {vendor && <p className="eyebrow">{vendor}</p>}
        <h1 className="display h1">{title}</h1>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 16 }}>
          <span className="product-price">{variant?.price}</span>
          {showCompareAt && (
            <span style={{ fontSize: 16, color: "var(--muted)", textDecoration: "line-through" }}>{variant!.compareAtPrice}</span>
          )}
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Inclusive of taxes</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="stock-dot" style={{ background: inStock ? "#3f7a4f" : "var(--madder)" }} aria-hidden="true" />
          <span style={{ fontSize: 14, fontWeight: inStock ? 400 : 600, color: inStock ? "var(--muted)" : "var(--madder)" }}>
            {inStock ? "In stock" : "Sold out"}
          </span>
        </div>

        {/* Shopify-authored product description, same trust level as the title/price; the merchant controls this via Shopify admin. */}
        {descriptionHtml && <div className="lede" style={{ maxWidth: 560 }} dangerouslySetInnerHTML={{ __html: descriptionHtml }} />}

        {/* A product with no real variants still gets one Shopify-generated option, "Title": ["Default Title"] — nothing to choose, so skip it. */}
        {options.filter((opt) => opt.values.length > 1).map((opt) => (
          <div key={opt.name} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{opt.name}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {opt.values.map((v) => (
                <button key={v} type="button" className="chip" aria-pressed={selected[opt.name] === v} onClick={() => pickOption(opt.name, v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <div className="qty-stepper">
            <button type="button" aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button type="button" aria-label="More" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>

          {inStock && variant ? (
            <form action={addToBag}>
              <input type="hidden" name="variantId" value={variant.id} />
              <input type="hidden" name="quantity" value={qty} />
              <button type="submit" className="btn">Add to bag</button>
            </form>
          ) : (
            <a className="btn" href="/contact">Sold out — ask us</a>
          )}
        </div>
      </div>
    </div>
  );
}
