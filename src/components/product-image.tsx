"use client";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

function normalizeDataImageMime(src: string) {
  if (/^data:image\/[^;]+;base64,iVBORw0KGgo/.test(src)) {
    return src.replace(/^data:image\/[^;]+/, "data:image/png");
  }

  if (/^data:image\/[^;]+;base64,\/9j\//.test(src)) {
    return src.replace(/^data:image\/[^;]+/, "data:image/jpeg");
  }

  if (/^data:image\/[^;]+;base64,UklGR/.test(src)) {
    return src.replace(/^data:image\/[^;]+/, "data:image/webp");
  }

  return src;
}

export function ProductImage({ src, alt, className, loading = "lazy" }: ProductImageProps) {
  return <img src={normalizeDataImageMime(src)} alt={alt} className={className} loading={loading} decoding="async" />;
}
