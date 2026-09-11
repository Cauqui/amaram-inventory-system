import type { ApiProduct, ApiProductVariant } from "../../lib/api";
import { LabelArtwork } from "./LabelArtwork";

export function ProductVariantLabel({ product, variant, copies }: { product: ApiProduct; variant: ApiProductVariant; copies: number }) {
  return <div className="label-print-sheet" aria-hidden="true">{Array.from({ length: copies }, (_, index) => <LabelArtwork key={index} product={product} variant={variant} />)}</div>;
}
