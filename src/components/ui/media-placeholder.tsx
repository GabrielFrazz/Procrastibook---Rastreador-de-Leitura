"use client";

import { useState, type HTMLAttributes, type ImgHTMLAttributes } from "react";

export type PlaceholderTone = "linen" | "oat" | "peach";

export function getPlaceholderTone(seed: string): PlaceholderTone {
  const normalized = seed.trim().toLocaleLowerCase("pt-BR");
  const hash = Array.from(normalized).reduce(
    (total, character) => total + (character.codePointAt(0) ?? 0),
    0,
  );
  const tones: PlaceholderTone[] = ["oat", "linen", "peach"];

  return tones[hash % tones.length] ?? "oat";
}

function getInitial(value: string) {
  return Array.from(value.trim())[0]?.toLocaleUpperCase("pt-BR") ?? "L";
}

type BookCoverProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "title"
> &
  Readonly<{
    alt?: string;
    loading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
    size?: "sm" | "md" | "lg";
    src?: string | null;
    title: string;
  }>;

export function BookCover({
  alt,
  className,
  loading = "lazy",
  size = "md",
  src,
  title,
  ...props
}: BookCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = Boolean(src && failedSrc !== src);
  const fallbackLabel = alt ?? `Capa não disponível para ${title}`;

  return (
    <span
      {...props}
      {...(!hasImage
        ? alt === ""
          ? { "aria-hidden": true }
          : { "aria-label": fallbackLabel, role: "img" }
        : {})}
      className={[
        "ui-book-cover",
        `ui-book-cover--${size}`,
        `ui-placeholder--${getPlaceholderTone(title)}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasImage ? (
        /* eslint-disable-next-line @next/next/no-img-element -- URLs de capas são definidas pelo usuário e precisam de fallback local em onError. */
        <img
          alt={alt ?? `Capa de ${title}`}
          decoding="async"
          loading={loading}
          onError={() => setFailedSrc(src ?? null)}
          src={src ?? undefined}
        />
      ) : (
        <span aria-hidden="true" className="ui-book-cover__fallback">
          <span className="ui-book-cover__initial">{getInitial(title)}</span>
        </span>
      )}
    </span>
  );
}

type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> &
  Readonly<{
    alt?: string;
    name: string;
    size?: "sm" | "md" | "lg";
    src?: string | null;
  }>;

export function Avatar({
  alt = "",
  className,
  name,
  size = "md",
  src,
  ...props
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = Boolean(src && failedSrc !== src);

  return (
    <span
      {...props}
      {...(!hasImage
        ? alt
          ? { "aria-label": alt, role: "img" }
          : { "aria-hidden": true }
        : {})}
      className={[
        "ui-avatar",
        `ui-avatar--${size}`,
        `ui-placeholder--${getPlaceholderTone(name)}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasImage ? (
        /* eslint-disable-next-line @next/next/no-img-element -- Avatares aceitam origens dinâmicas e precisam de fallback local em onError. */
        <img
          alt={alt}
          decoding="async"
          onError={() => setFailedSrc(src ?? null)}
          src={src ?? undefined}
        />
      ) : (
        <span className="ui-avatar__fallback">{getInitial(name)}</span>
      )}
    </span>
  );
}
