import Link from "next/link";

type GoogleSignInLinkProps = Readonly<{
  enabled: boolean;
  nextPath: string;
}>;

export function GoogleSignInLink({ enabled, nextPath }: GoogleSignInLinkProps) {
  const content = (
    <>
      <span aria-hidden="true" className="auth-google__mark">
        G
      </span>
      {enabled ? "Continuar com Google" : "Google indisponível neste ambiente"}
    </>
  );

  return (
    <div className="auth-provider">
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
      <div className="auth-divider">
        <span>ou continue com e-mail</span>
      </div>
    </div>
  );
}
