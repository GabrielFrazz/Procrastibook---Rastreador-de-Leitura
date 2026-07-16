import Image from "next/image";
import Link from "next/link";

type GoogleSignInLinkProps = Readonly<{
  dividerPlacement?: "after" | "before";
  enabled: boolean;
  nextPath: string;
}>;

export function GoogleSignInLink({
  dividerPlacement = "after",
  enabled,
  nextPath,
}: GoogleSignInLinkProps) {
  const content = (
    <>
      <span aria-hidden="true" className="auth-google__mark">
        <Image alt="" height={24} src="/google-icon.svg" width={24} />
      </span>
      {enabled ? "Continuar com Google" : "Google indisponível neste ambiente"}
    </>
  );
  const divider = (
    <div className="auth-divider">
      <span>
        {dividerPlacement === "before"
          ? "ou continue com"
          : "ou continue com e-mail"}
      </span>
    </div>
  );

  return (
    <div className={`auth-provider auth-provider--divider-${dividerPlacement}`}>
      {dividerPlacement === "before" ? divider : null}
      {enabled ? (
        <Link
          className="auth-google"
          href={`/auth/google?next=${encodeURIComponent(nextPath)}`}
        >
          {content}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="auth-google auth-google--disabled"
        >
          {content}
        </span>
      )}
      {dividerPlacement === "after" ? divider : null}
    </div>
  );
}
