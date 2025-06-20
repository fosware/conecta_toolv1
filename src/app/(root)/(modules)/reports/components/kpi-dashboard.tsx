"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/table-skeleton";
import { DateRangeSelector } from "./date-range-selector";
import { toast } from "sonner";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface KpiDashboardProps {
  viewName: string;
}

interface AggregatedKpis {
  tasa_exito: number;
  promedio_tiempo_respuesta: number;
  porcentaje_entregas_tiempo: number;
  precio_promedio_proyecto: number;
  total_proyectos_asignados: number;
  desviacion_promedio_dias: number;
}

export function KpiDashboard({ viewName }: KpiDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showNoDataMessage, setShowNoDataMessage] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir URL con parámetros de fecha si están presentes
      let url = `/api/reports/${viewName}`;
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar los datos: ${response.status}`);
      }

      const result = await response.json();
      setDashboardData(result);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Error desconocido al cargar los datos");
      setLoading(false);
      toast.error("Error al cargar los datos del dashboard");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [viewName]);

  // Efecto para verificar si hay datos de entregas disponibles
  useEffect(() => {
    if (dashboardData && dashboardData.aggregatedKpis) {
      const entregasData = dashboardData.aggregatedKpis.porcentaje_entregas_tiempo;
      console.log('Valor de porcentaje_entregas_tiempo:', entregasData);
      
      // Verificar si no hay datos de entregas
      const noData = entregasData === null || 
                    entregasData === undefined || 
                    Number(entregasData) === 0 || 
                    isNaN(Number(entregasData));
      
      setShowNoDataMessage(noData);
    } else {
      setShowNoDataMessage(true);
    }
  }, [dashboardData]);

  const handleDateChange = (
    newStartDate: string | null,
    newEndDate: string | null
  ) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchDashboardData();
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    // Verificar si el valor es un número válido
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
      }).format(0);
    }
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  const formatNumber = (
    value: number | string | null | undefined,
    decimals: number = 1
  ) => {
    // Verificar si el valor es un número válido
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return "0.0";
    }
    return numValue.toFixed(decimals);
  };

  const formatPercentage = (value: number | string | null | undefined) => {
    // Verificar si el valor es un número válido
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return "0.0%";
    }
    return `${numValue.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <DateRangeSelector onDateChange={handleDateChange} />
        </div>
        <TableSkeleton columns={5} rows={10} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <DateRangeSelector onDateChange={handleDateChange} />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <p className="text-destructive">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <DateRangeSelector onDateChange={handleDateChange} />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <p>No hay datos disponibles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    aggregatedKpis,
    rankingEmpresas,
    comparativaCotizaciones,
    cumplimientoEntregas,
    reincidenciaEmpresas,
  } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard KPI</h2>
        <DateRangeSelector onDateChange={handleDateChange} />
      </div>

      {/* Tarjetas de KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Tasa de Éxito</CardTitle>
            <CardDescription className="text-muted-foreground">
              Cotizaciones ganadas vs. totales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {formatPercentage(aggregatedKpis?.tasa_exito || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Entregas a Tiempo</CardTitle>
            <CardDescription className="text-muted-foreground">
              Porcentaje de proyectos entregados en fecha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {formatPercentage(
                aggregatedKpis?.porcentaje_entregas_tiempo || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Proyectos Asignados
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Total de proyectos ganados asignados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">
              {aggregatedKpis?.total_proyectos_asignados || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-foreground">
              Tiempo Promedio de Respuesta
            </CardTitle>
            <CardDescription>
              Días promedio para responder cotizaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {formatNumber(aggregatedKpis?.promedio_tiempo_respuesta)} días
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-foreground">
              Precio Promedio por Proyecto
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Valor promedio de proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {formatCurrency(aggregatedKpis?.precio_promedio_proyecto || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ranking de Empresas */}
        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Top Empresas por Proyectos Asignados
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Empresas con mayor número de proyectos ganados
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={rankingEmpresas?.slice(0, 5) || []}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="company_name"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `${value} proyectos`,
                    "Asignados",
                  ]}
                  wrapperStyle={{ zIndex: 1000 }}
                  contentStyle={{
                    backgroundColor: "#f8f9fa",
                    borderColor: "#8884d8",
                    borderWidth: "2px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "10px",
                  }}
                  labelStyle={{
                    color: "#2c3e50",
                    fontWeight: 600,
                    marginBottom: "5px",
                  }}
                  itemStyle={{
                    color: "#8884d8",
                    fontWeight: 500,
                  }}
                  cursor={{ fill: "transparent" }}
                />
                <Legend />
                <Bar
                  dataKey="proyectos_asignados"
                  fill="#8884d8"
                  name="Proyectos Asignados"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasa de Éxito por Empresa */}
        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Tasa de Éxito por Empresa
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Porcentaje de cotizaciones ganadas
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={comparativaCotizaciones?.slice(0, 5) || []}
                margin={{ top: 10, right: 30, left: 40, bottom: 50 }}
                barCategoryGap={60}
                barSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="company_name"
                  interval={0}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const text = payload.value;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="middle"
                          fill="#666"
                          fontSize={12}
                          fontWeight="500"
                          width={80}
                        >
                          {text.length > 12
                            ? `${text.substring(0, 12)}...`
                            : text}
                        </text>
                      </g>
                    );
                  }}
                  height={70}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, "Tasa de Éxito"]}
                  wrapperStyle={{ zIndex: 1000 }}
                  contentStyle={{
                    backgroundColor: "#f8f9fa",
                    borderColor: "#82ca9d",
                    borderWidth: "2px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "10px",
                  }}
                  labelStyle={{
                    color: "#2c3e50",
                    fontWeight: 600,
                    marginBottom: "5px",
                  }}
                  itemStyle={{
                    color: "#82ca9d",
                    fontWeight: 500,
                  }}
                  cursor={{ fill: "transparent" }}
                />
                <Legend />
                <Bar
                  dataKey="tasa_exito"
                  fill="#82ca9d"
                  name="Tasa de Éxito (%)"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumplimiento de Entregas */}
        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Cumplimiento de Entregas
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Entregas a tiempo vs. entregas tardías
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {showNoDataMessage ? (
              <div className="h-full flex items-center justify-center flex-col text-muted-foreground">
                <p>No hay datos de entregas disponibles</p>
                <p className="text-sm">Se requieren proyectos completados para generar esta métrica</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "A Tiempo",
                        value: aggregatedKpis?.porcentaje_entregas_tiempo || 0,
                      },
                      {
                        name: "Tardías",
                        value:
                          100 - (aggregatedKpis?.porcentaje_entregas_tiempo || 0),
                      },
                    ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${formatNumber(percent * 100)}%`
                  }
                >
                  {[0, 1].map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string) => [
                    `${formatNumber(value)}%`,
                    ""
                  ]}
                  wrapperStyle={{ zIndex: 1000 }}
                  contentStyle={{
                    backgroundColor: "#f8f9fa",
                    borderColor: "#00C49F",
                    borderWidth: "2px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "10px",
                  }}
                  labelStyle={{
                    color: "#2c3e50",
                    fontWeight: 600,
                    marginBottom: "5px",
                  }}
                  itemStyle={{
                    color: "#00C49F",
                    fontWeight: 500,
                  }}
                  cursor={{ fill: "transparent" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Índice de Reincidencia */}
        <Card className="bg-white dark:bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Índice de Reincidencia
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Empresas que repiten proyectos
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={reincidenciaEmpresas?.slice(0, 5) || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company_name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, "auto"]} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [
                    `${value} proyectos`,
                    "Proyectos",
                  ]}
                  wrapperStyle={{ zIndex: 1000 }}
                  contentStyle={{
                    backgroundColor: "#f8f9fa",
                    borderColor: "#0088FE",
                    borderWidth: "2px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "10px",
                  }}
                  labelStyle={{
                    color: "#2c3e50",
                    fontWeight: 600,
                    marginBottom: "5px",
                  }}
                  itemStyle={{
                    color: "#0088FE",
                    fontWeight: 500,
                  }}
                  cursor={{ fill: "transparent" }}
                />
                <Legend />
                <Bar
                  dataKey="total_projects"
                  fill="#0088FE"
                  name="Total Proyectos"
                  minPointSize={3}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
