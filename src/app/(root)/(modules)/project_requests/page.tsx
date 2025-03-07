"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProjectRequestsTable } from "./components/project-requests-table";

export default function ProjectRequestsPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Aquí se cargarían los datos iniciales cuando sea necesario
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Solicitud de Proyectos</h1>
        <Button
          onClick={() =>
            toast.info("Esta funcionalidad estará disponible próximamente", {
              description: "Módulo en desarrollo",
            })
          }
        >
          Nueva Solicitud
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Solicitud de Proyectos</CardTitle>
          <CardDescription>
            Gestiona las solicitudes de proyectos de tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectRequestsTable />
        </CardContent>
      </Card>
    </div>
  );
}
