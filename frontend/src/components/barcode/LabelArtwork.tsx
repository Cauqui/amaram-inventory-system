import type { ApiProduct, ApiProductVariant } from "../../lib/api";
import { BarcodeSvg } from "./BarcodeSvg";

export function LabelArtwork({ product, variant, preview = false }: { product: ApiProduct; variant: ApiProductVariant; preview?: boolean }) {
  const detail = [variant.color, product.category.usesSizes ? variant.size : null].filter(Boolean).join(" · ");
  return <article className={`product-label${preview ? " label-preview" : ""}`}>
    <section className="label-main-column"><header className="label-brand"><span className="label-brand-name">AMARAM</span><span className="label-slogan">TEJIENDO UN FUTURO MÁS BRILLANTE</span></header><div className="label-product-copy"><h4>{product.name}</h4>{detail && <p>{detail}</p>}<span>{product.category.name.replace(/s$/i, "")} artesanal</span></div><div className="label-barcode"><BarcodeSvg value={variant.sku} /></div><p className="label-sku">{variant.sku}</p></section>
    <aside className="label-side-column"><div className="label-symbol" aria-label="AMARAM">AM</div><p className="label-values">ARTESANÍA<br />COMUNIDAD<br />OPORTUNIDAD</p><div className="label-qr-reserve" aria-hidden="true" /><p className="label-history">CONOCE<br />NUESTRA HISTORIA</p></aside>
  </article>;
}
