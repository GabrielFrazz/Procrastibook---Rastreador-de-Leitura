type FormStatusMessageProps = Readonly<{
  className?: string;
  message: string | null;
  status: "error" | "idle" | "success";
}>;

function StatusIcon({ status }: Readonly<{ status: "error" | "success" }>) {
  return status === "error" ? (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6.5v4.25m0 2.75v.1" />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.25" />
      <path d="m6.75 10 2.1 2.1 4.4-4.45" />
    </svg>
  );
}

export function FormStatusMessage({
  className,
  message,
  status,
}: FormStatusMessageProps) {
  if (!message || status === "idle") {
    return null;
  }

  return (
    <p
      className={["ui-form-status", `ui-form-status--${status}`, className]
        .filter(Boolean)
        .join(" ")}
      role={status === "error" ? "alert" : "status"}
    >
      <span className="ui-form-status__icon">
        <StatusIcon status={status} />
      </span>
      <span>{message}</span>
    </p>
  );
}
