import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    JsBarcode(ref.current, value, { format: "CODE128", displayValue: false, lineColor: "#1A1A1A", background: "#FFFFFF", margin: 4, width: 0.75, height: 36 });
  }, [value]);
  return <svg ref={ref} role="img" aria-label={`Código de barras ${value}`} className="w-full max-w-full h-auto" />;
}
