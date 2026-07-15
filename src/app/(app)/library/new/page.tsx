import type { Metadata } from "next";

import { AddWorkView } from "@/features/works/components/add-work-view";

export const metadata: Metadata = {
  title: "Adicionar obra | Procrastibook",
};

export default function AddWorkPage() {
  return <AddWorkView />;
}
