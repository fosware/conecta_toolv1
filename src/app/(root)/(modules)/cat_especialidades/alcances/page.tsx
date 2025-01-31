"use client";

import dynamic from 'next/dynamic'
import { LoadingSpinner } from "@/components/loading-spinner";

// Deshabilitamos SSR para este componente
const AlcancesContent = dynamic(
  () => import('./alcances-content'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

interface Alcance {
  id: number;
  name: string;
  num: number;
  description?: string;
  specialtyId: number;
  isActive: boolean;
}

export default function CatAlcancesPage() {
  return <AlcancesContent />;
}
