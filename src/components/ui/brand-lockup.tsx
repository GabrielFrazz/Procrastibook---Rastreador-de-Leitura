type BrandLockupProps = Readonly<{
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}>;

export function BrandMark() {
  return <span aria-hidden="true" className="brand-lockup__mark" />;
}

export function BrandLockup({
  className,
  showTagline = false,
  size = "md",
}: BrandLockupProps) {
  return (
    <span
      className={[
        "brand-lockup",
        `brand-lockup--${size}`,
        showTagline ? "brand-lockup--with-tagline" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <BrandMark />
      <span className="brand-lockup__copy">
        <strong className="brand-lockup__name">Procrastibook</strong>
        {showTagline ? (
          <span className="brand-lockup__tagline">Rastreador de leitura</span>
        ) : null}
      </span>
    </span>
  );
}
