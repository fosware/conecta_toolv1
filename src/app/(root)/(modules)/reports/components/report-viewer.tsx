"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { DateRangeSelector } from "./date-range-selector";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { KpiDashboard } from "./kpi-dashboard";
import { TableSkeleton } from "@/components/table-skeleton";
import { FileSpreadsheet, FileText } from "lucide-react";
import { applySearchFilter, handleDateFilter } from "./search-filter";

interface Report {
  id: number;
  name: string;
  description: string;
  viewName: string;
  icon: React.ReactNode;
  title: string;
}

interface ReportViewerProps {
  report: Report;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Si el reporte es el dashboard KPI, renderizar el componente KpiDashboard
  if (report.viewName === "v_kpi_dashboard") {
    return <KpiDashboard viewName={report.viewName} />;
  }

  // Función para manejar cambios en el rango de fechas
  const handleDateChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1); // Resetear a la primera página cuando cambia el filtro

    // Aplicar filtros combinados
    let filtered = data;
    
    // Si hay término de búsqueda, aplicarlo primero
    if (searchTerm) {
      filtered = applySearchFilter(filtered, searchTerm);
    }
    
    // Luego aplicar filtro de fechas si está activo
    if (start || end) {
      filtered = handleDateFilter(filtered, start, end);
    }

    setFilteredData(filtered);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Calcular los datos paginados
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };
  
  // Calcular el número total de páginas
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  // Función para obtener datos del reporte con filtros de fecha
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir URL con parámetros de fecha si están presentes
      let url = `/api/reports/${report.viewName}`;
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
      setData(result);
      setFilteredData(result);

      // Extraer columnas de los datos
      if (result.length > 0) {
        setColumns(Object.keys(result[0]));
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Error desconocido al cargar los datos");
      setLoading(false);
      toast.error("Error al cargar los datos del reporte");
    }
  };

  // Usar una referencia para evitar peticiones duplicadas en modo de desarrollo
  const lastViewNameRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Solo hacer la petición si el viewName ha cambiado realmente
    if (lastViewNameRef.current !== report.viewName) {
      lastViewNameRef.current = report.viewName;
      fetchReportData();
    }
  }, [report.viewName]);

  // Función para exportar a Excel
  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, report.title);

      // Generar el archivo y descargarlo
      XLSX.writeFile(
        workbook,
        `${report.title}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Reporte exportado a Excel correctamente");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al exportar a Excel");
    }
  };

  // Función para exportar a PDF
  const exportToPDF = () => {
    try {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();

      // Variables para control de páginas
      let totalPages = 1;
      let currentPage = 1;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;

      // Verificar que haya datos y columnas para la tabla
      if (filteredData.length === 0) {
        toast.error("No hay datos disponibles para exportar a PDF");
        return;
      }

      // Si no hay columnas definidas, intentar obtenerlas de los datos
      if (!columns || columns.length === 0) {
        if (filteredData.length > 0) {
          setColumns(Object.keys(filteredData[0]));
        } else {
          toast.error("No se pueden determinar las columnas para el reporte");
          return;
        }
      }

      // Calcular ancho de columnas
      const tableWidth = pageWidth - 2 * margin;
      const colWidth = tableWidth / columns.length;

      // Reducir el tamaño de fuente para las celdas de datos para evitar textos encimados
      const headerFontSize = 9; // Tamaño de fuente para encabezados
      const dataFontSize = 8; // Tamaño de fuente para datos

      // Función para agregar encabezado con logo
      const addHeader = (pageY = 10) => {
        try {
          // Intentar cargar el logo
          const logoUrl = "/logo.png"; // Ruta al logo en carpeta public
          const img = new Image();
          img.src = logoUrl;

          // Dibujar logo con proporciones correctas (cuadrado)
          const logoSize = 20; // Tamaño fijo para mantener proporciones
          doc.addImage(img, "PNG", margin, pageY, logoSize, logoSize);
        } catch (e) {
          console.warn("No se pudo cargar el logo", e);
        }

        // Agregar título del reporte
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text(report.title, margin + 25, pageY + 12);

        // Agregar fecha debajo del título (fuente más pequeña y más cerca del título)
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Fecha: ${new Date().toLocaleDateString("es-MX")}`,
          margin + 25,
          pageY + 18
        );

        return pageY + 35; // Devolver la nueva posición Y
      };

      // Función para agregar pie de página
      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);

        // Nombre de la empresa a la izquierda
        doc.text("ToolingCluster", margin, pageHeight - 10);

        // Número de página a la derecha
        // Asegurarse de que el número de página esté actualizado
        const pageText = `Página ${currentPage} de ${totalPages}`;
        const pageTextWidth =
          (doc.getStringUnitWidth(pageText) * doc.getFontSize()) /
          doc.internal.scaleFactor;
        doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 10);
      };

      // Función para agregar encabezados de tabla
      const addTableHeader = (y: number): number => {
        // Agregar texto "Mostrando N registros" alineado a la derecha
        doc.setFontSize(headerFontSize);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        const registrosText = `Mostrando ${filteredData.length} registros`;
        const registrosTextWidth =
          (doc.getStringUnitWidth(registrosText) * doc.getFontSize()) /
          doc.internal.scaleFactor;
        doc.text(registrosText, pageWidth - margin - registrosTextWidth, y - 5);

        // Dibujar encabezados
        doc.setFillColor(41, 128, 185); // Color azul para encabezados
        doc.setTextColor(255, 255, 255); // Texto blanco
        doc.setFontSize(headerFontSize);
        doc.setFont("helvetica", "bold");

        // Primero dibujamos el fondo completo de la fila de encabezados
        doc.setFillColor(41, 128, 185);
        doc.rect(margin, y, tableWidth, 12, "F");

        // Luego dibujamos cada encabezado de columna
        columns.forEach((col, i) => {
          // Dibujar las líneas divisorias entre columnas (excepto la primera)
          if (i > 0) {
            doc.setDrawColor(255, 255, 255); // Líneas blancas para separar columnas
            doc.line(margin + i * colWidth, y, margin + i * colWidth, y + 12);
          }

          // Preparar el texto para centrar
          const text = col.toString();

          // Dividir el texto en dos líneas si es necesario
          const availableWidth = colWidth - 4;
          const textWidth =
            (doc.getStringUnitWidth(text) * doc.getFontSize()) /
            doc.internal.scaleFactor;

          // Si el texto es demasiado largo, dividirlo en dos líneas
          let line1 = text;
          let line2 = "";

          if (textWidth > availableWidth) {
            // Buscar un espacio para dividir el texto
            const words = text.split(" ");
            if (words.length > 1) {
              // Intentar dividir por palabras
              let currentLine = "";
              for (let j = 0; j < words.length; j++) {
                const testLine =
                  currentLine + (currentLine ? " " : "") + words[j];
                const testWidth =
                  (doc.getStringUnitWidth(testLine) * doc.getFontSize()) /
                  doc.internal.scaleFactor;

                if (testWidth > availableWidth && j > 0) {
                  line1 = currentLine;
                  line2 = words.slice(j).join(" ");
                  break;
                }
                currentLine = testLine;
              }
              if (line2 === "") {
                line1 = currentLine;
              }
            } else {
              // Si es una sola palabra larga, dividir por la mitad
              const midPoint = Math.floor(text.length / 2);
              line1 = text.substring(0, midPoint);
              line2 = text.substring(midPoint);
            }
          }

          // Calcular posición X para centrar cada línea
          const line1Width =
            (doc.getStringUnitWidth(line1) * doc.getFontSize()) /
            doc.internal.scaleFactor;
          const line1X = margin + i * colWidth + (colWidth - line1Width) / 2;

          // Dibujar la primera línea
          doc.text(line1, line1X, y + 4);

          // Si hay segunda línea, dibujarla
          if (line2) {
            const line2Width =
              (doc.getStringUnitWidth(line2) * doc.getFontSize()) /
              doc.internal.scaleFactor;
            const line2X = margin + i * colWidth + (colWidth - line2Width) / 2;
            doc.text(line2, line2X, y + 9); // Reducido de 12 a 9 para disminuir el interlineado
          }
        });

        return y + 12;
      };

      // Calcular cuántas páginas necesitaremos
      const rowHeight = 10; // Aumentado para evitar que el texto se encime con los bordes
      const headerHeight = 30; // Espacio para logo y título (reducido para subir la tabla)
      const tableHeaderHeight = 12; // Reducido aún más para disminuir el interlineado
      const footerHeight = 15;
      const contentHeight =
        pageHeight - headerHeight - tableHeaderHeight - footerHeight;
      const rowsPerPage = Math.floor(contentHeight / rowHeight);

      // Calcular el número total de páginas (asegurarnos de que sea al menos 1)
      // Usamos Math.max para garantizar que siempre sea al menos 1 página
      totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

      // Iniciar con el encabezado
      let y = addHeader();

      // Agregar encabezados de tabla
      y = addTableHeader(y);

      // Configurar estilo para filas de datos
      doc.setTextColor(40, 40, 40); // Texto oscuro
      doc.setFont("helvetica", "normal");
      doc.setFontSize(dataFontSize); // Usar el tamaño más pequeño para datos

      // Primero, hacer un cálculo más preciso del número total de páginas
      // Simular el proceso de generación para contar cuántas páginas se necesitarán
      let simulatedY = headerHeight + tableHeaderHeight;
      let simulatedPages = 1;

      filteredData.forEach(() => {
        simulatedY += rowHeight;
        if (simulatedY > pageHeight - footerHeight - rowHeight) {
          simulatedPages++;
          simulatedY = headerHeight + tableHeaderHeight;
        }
      });

      // Actualizar el número total de páginas con el cálculo más preciso
      totalPages = simulatedPages;

      // Dibujar filas de datos
      filteredData.forEach((row, rowIndex) => {
        // Alternar colores de fondo para filas
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 245, 245); // Gris claro
        } else {
          doc.setFillColor(255, 255, 255); // Blanco
        }

        // Verificar si necesitamos una nueva página
        if (y > pageHeight - footerHeight - rowHeight) {
          // Agregar pie de página a la página actual
          addFooter();

          // Nueva página
          doc.addPage();
          currentPage++;

          // Agregar encabezado y encabezados de tabla en la nueva página
          y = addHeader();
          y = addTableHeader(y);
        }

        // Dibujar fondo de la fila completa
        doc.rect(margin, y, tableWidth, rowHeight, "F");

        // Dibujar las líneas divisorias entre columnas
        for (let i = 1; i < columns.length; i++) {
          doc.setDrawColor(200, 200, 200); // Líneas grises para separar columnas
          doc.line(
            margin + i * colWidth,
            y,
            margin + i * colWidth,
            y + rowHeight
          );
        }

        // Dibujar texto de la fila
        columns.forEach((col, i) => {
          const value =
            row[col] !== null && row[col] !== undefined ? String(row[col]) : "";

          // Ajustar el texto para que quepa en la columna
          const availableWidth = colWidth - 4;

          // Dibujar el texto con límite de ancho y centrado verticalmente
          doc.text(value, margin + i * colWidth + 2, y + 6, {
            maxWidth: availableWidth,
          });
        });

        y += rowHeight;
      });

      // Agregar pie de página a la última página
      addFooter();

      // Guardar el PDF
      doc.save(`${report.title}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Reporte exportado a PDF correctamente");
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      toast.error("Error al exportar a PDF");
    }
  };

  // Este efecto ya existe arriba, lo eliminamos para evitar peticiones duplicadas

  // Actualizar datos filtrados cuando cambian los datos
  useEffect(() => {
    // Solo actualizar los datos filtrados cuando cambian los datos originales
    // y no hay filtros activos (para no interferir con los filtros manuales)
    if (data.length > 0 && !searchTerm && !startDate && !endDate) {
      setFilteredData(data);
    }
  }, [data]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{report.title}</h2>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={exportToExcel}
                  disabled={loading || data.length === 0}
                  title="Exportar a Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={exportToPDF}
                  disabled={loading || data.length === 0}
                  title="Exportar a PDF"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </Button>
              </div>
            </div>
            {report.description && (
              <p className="text-sm text-muted-foreground">{report.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => {
                  const newSearchTerm = e.target.value;
                  setSearchTerm(newSearchTerm);
                  
                  // Aplicar filtro de búsqueda
                  let filtered = data;
                  
                  // Primero aplicar filtro de búsqueda si hay término
                  if (newSearchTerm) {
                    filtered = applySearchFilter(data, newSearchTerm);
                  }
                  
                  // Luego aplicar filtro de fechas si está activo
                  if (startDate || endDate) {
                    filtered = handleDateFilter(filtered, startDate, endDate);
                  }
                  
                  setFilteredData(filtered);
                  setCurrentPage(1); // Resetear a la primera página cuando cambia la búsqueda
                }}
              />
            </div>
            {(report.viewName === "v_quotation_summary" || 
              report.viewName === "v_quotations_vs_projects" || 
              report.viewName === "v_projects_costs_summary" ||
              report.viewName === "v_project_details") && (
              <div className="flex-shrink-0">
                <DateRangeSelector onDateChange={handleDateChange} />
              </div>
            )}
          </div>
          {loading ? (
            <TableSkeleton columns={5} rows={10} />
          ) : data.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No hay datos disponibles para este reporte.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <div className="min-w-[800px]">
                <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead 
                        key={column} 
                        className="whitespace-normal break-words"
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedData().map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column) => (
                        <TableCell
                          key={`${rowIndex}-${column}`}
                          className={column === "Proyecto" ? "whitespace-normal break-words" : "whitespace-normal break-words"}
                        >
                          {row[column] !== null && row[column] !== undefined
                            ? String(row[column])
                            : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              
              {/* Mostrar paginación para los reportes seleccionados */}
              {(report.viewName === "v_quotation_summary" || 
                report.viewName === "v_quotations_vs_projects" || 
                report.viewName === "v_projects_costs_summary" || 
                report.viewName === "v_project_details") && 
                filteredData.length > itemsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
