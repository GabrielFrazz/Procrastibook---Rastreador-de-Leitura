export type ActionResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{
      ok: false;
      code: string;
      message: string;
      fieldErrors?: Readonly<Record<string, readonly string[]>>;
    }>;
