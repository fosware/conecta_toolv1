"use client";

import * as React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/table-skeleton";
import { BarChart, FileText, PieChart } from "lucide-react";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { ReportViewer } from "./components/report-viewer";

// Definir interfaces para los tipos de datos
interface Report {
  id: number;
  name: string;
  description: string;
  viewName: string;
  icon: React.ReactNode;
  title: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Lista de reportes disponibles
  const reports: Report[] = [
    {
      id: 1,
      name: "Dashboard KPI",
      title: "Dashboard KPI Ejecutivo",
      description: "Panel de control con indicadores clave de rendimiento, métricas de éxito y análisis de tendencias.",
      viewName: "v_kpi_dashboard",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      id: 2,
      name: "Resumen de Cotizaciones",
      title: "Resumen de Cotizaciones",
      description: "Muestra información sobre cotizaciones por asociado, incluyendo invitaciones, respuestas y tasas de respuesta.",
      viewName: "v_quotation_summary",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      id: 3,
      name: "Cotizaciones vs Proyectos",
      title: "Cotizaciones vs Proyectos",
      description: "Compara cotizaciones válidas con proyectos asignados, mostrando tasas de éxito y entregas a tiempo.",
      viewName: "v_quotations_vs_projects",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      id: 4,
      name: "Costos y Ganancias",
      title: "Resumen de Costos y Ganancias",
      description: "Detalla los costos, precios y márgenes de ganancia de los proyectos por asociado.",
      viewName: "v_projects_costs_summary",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      id: 5,
      name: "Detalles de Proyectos",
      title: "Detalles de Proyectos",
      description: "Muestra información detallada de proyectos, incluyendo fechas de cotización, montos y entregas.",
      viewName: "v_project_details",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reportes</h1>
        {selectedReport && (
          <Button 
            variant="outline" 
            onClick={() => setSelectedReport(null)}
          >
            Volver a la lista de reportes
          </Button>
        )}
      </div>

      {selectedReport ? (
        <div className="mb-6">
          <ReportViewer report={selectedReport} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedReport(report)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{report.name}</CardTitle>
                <div className="p-2 bg-primary/10 rounded-full">
                  {report.icon}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <Button 
                  variant="default" 
                  className="mt-4 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReport(report);
                  }}
                >
                  Ver Reporte
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
