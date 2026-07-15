import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/styles/ui.css";
import "@/styles/auth.css";

export const metadata: Metadata = {
  title: "Procrastibook",
  description: "Rastreador pessoal de leituras.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
