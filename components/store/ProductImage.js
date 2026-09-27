"use client";

import { useState } from "react";

const FALLBACK = "/placeholder-shoe.svg";

/** <img> with a branded fallback if the image URL fails to load */
export default function ProductImage({ src, alt = "", className, loading = "lazy", ...rest }) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={!src || failed ? FALLBACK : src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
