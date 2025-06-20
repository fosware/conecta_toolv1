import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function GET(
  request: NextRequest,
  context: { params: { viewName: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener y esperar los parámetros de ruta
    const params = await context.params;
    const viewName = params.viewName;

    // Lista de vistas permitidas para consulta
    const allowedViews = [
      "v_quotation_summary",
      "v_quotations_vs_projects",
      "v_projects_costs_summary",
      "v_project_details",
      "v_kpi_dashboard",
      "v_reincidencia_empresas"
    ];

    // Verificar que la vista solicitada esté en la lista de permitidas
    if (!allowedViews.includes(viewName)) {
      return NextResponse.json(
        { error: `Vista '${viewName}' no permitida` },
        { status: 400 }
      );
    }

    // Obtener parámetros de consulta para filtrado por fechas
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Construir la consulta SQL base
    let sqlQuery = `SELECT * FROM ${viewName}`;
    
    // Agregar condiciones de filtrado por fecha si es necesario
    if ((startDate || endDate) && viewName === 'v_kpi_dashboard') {
      const whereConditions = [];
      
      if (startDate) {
        whereConditions.push(`fecha >= '${startDate}'`);
      }
      
      if (endDate) {
        whereConditions.push(`fecha <= '${endDate}'`);
      }
      
      if (whereConditions.length > 0) {
        sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    // Consultar la vista
    const data = await prisma.$queryRawUnsafe(sqlQuery);

    // Si es el dashboard KPI, necesitamos datos adicionales
    if (viewName === 'v_kpi_dashboard') {
      // Calcular KPIs agregados
      let whereClause = '';
      if (startDate || endDate) {
        const conditions = [];
        if (startDate) conditions.push(`fecha >= '${startDate}'`);
        if (endDate) conditions.push(`fecha <= '${endDate}'`);
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // Definir interfaz para los resultados agregados
      interface AggregatedKpis {
        tasa_exito: number;
        promedio_tiempo_respuesta: number;
        porcentaje_entregas_tiempo: number;
        precio_promedio_proyecto: number;
        total_proyectos_asignados: number;
        desviacion_promedio_dias: number;
      }
      
      // Obtener métricas agregadas
      const aggregatedKpis = await prisma.$queryRawUnsafe<AggregatedKpis[]>(`
        SELECT
          -- Tasa de éxito
          ROUND(
            (COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END)::numeric / 
            NULLIF(COUNT(*)::numeric, 0) * 100)::numeric, 
            2
          ) AS tasa_exito,
          
          -- Promedio tiempo respuesta
          ROUND(AVG(tiempo_respuesta_dias)::numeric, 1) AS promedio_tiempo_respuesta,
          
          -- Entregas a tiempo
          ROUND(
            (COUNT(CASE WHEN entrega_a_tiempo = true THEN 1 ELSE NULL END)::numeric / 
            NULLIF(COUNT(CASE WHEN entrega_a_tiempo IS NOT NULL THEN 1 ELSE NULL END)::numeric, 0) * 100)::numeric,
            2
          ) AS porcentaje_entregas_tiempo,
          
          -- Precio promedio por proyecto
          ROUND(AVG(monto_cotizado)::numeric, 2) AS precio_promedio_proyecto,
          
          -- Proyectos asignados
          COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END) AS total_proyectos_asignados,
          
          -- Desviación promedio en tiempo de entrega (días)
          ROUND(COALESCE(AVG(desviacion_dias), 0)::numeric, 1) AS desviacion_promedio_dias
        FROM 
          v_kpi_dashboard
        ${whereClause}
      `);

      // Definir interfaz para ranking de empresas
      interface RankingEmpresa {
        empresa: string;
        total_proyectos: number;
        proyectos_exitosos: number;
        tasa_exito: number;
      }
      
      // Obtener ranking de empresas
      const rankingEmpresas = await prisma.$queryRawUnsafe<RankingEmpresa[]>(`
        SELECT
          company_name,
          COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END) AS proyectos_asignados,
          ROUND(
            (COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END)::numeric / 
            NULLIF((SELECT COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END) FROM v_kpi_dashboard ${whereClause}), 0) * 100)::numeric,
            2
          ) AS porcentaje_asignacion
        FROM 
          v_kpi_dashboard
        ${whereClause}
        GROUP BY 
          company_name
        HAVING 
          COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END) > 0
        ORDER BY 
          proyectos_asignados DESC
        LIMIT 10
      `);

      // Definir interfaz para comparativa de cotizaciones
      interface ComparativaCotizacion {
        mes: string;
        total_cotizaciones: number;
        cotizaciones_adjudicadas: number;
        tasa_conversion: number;
      }
      
      // Comparativa cotizaciones vs adjudicación
      const comparativaCotizaciones = await prisma.$queryRawUnsafe<ComparativaCotizacion[]>(`
        SELECT
          company_name,
          COUNT(*) AS total_cotizaciones,
          COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END) AS proyectos_ganados,
          ROUND(
            (COUNT(CASE WHEN proyecto_asignado = true THEN 1 ELSE NULL END)::numeric / 
            NULLIF(COUNT(*)::numeric, 0) * 100)::numeric,
            2
          ) AS tasa_exito
        FROM 
          v_kpi_dashboard
        ${whereClause}
        GROUP BY 
          company_name
        HAVING 
          COUNT(*) > 0
        ORDER BY 
          tasa_exito DESC
        LIMIT 10
      `);

      // Definir interfaz para cumplimiento de entregas
      interface CumplimientoEntrega {
        mes: string;
        total_entregas: number;
        entregas_a_tiempo: number;
        porcentaje_cumplimiento: number;
      }
      
      // Cumplimiento de entregas
      const cumplimientoEntregas = await prisma.$queryRawUnsafe<CumplimientoEntrega[]>(`
        SELECT
          company_name,
          COUNT(CASE WHEN entrega_a_tiempo = true THEN 1 ELSE NULL END) AS entregas_a_tiempo,
          COUNT(CASE WHEN entrega_a_tiempo = false THEN 1 ELSE NULL END) AS entregas_tardias,
          ROUND(
            (COUNT(CASE WHEN entrega_a_tiempo = true THEN 1 ELSE NULL END)::numeric / 
            NULLIF(COUNT(CASE WHEN entrega_a_tiempo IS NOT NULL THEN 1 ELSE NULL END)::numeric, 0) * 100)::numeric,
            2
          ) AS porcentaje_cumplimiento
        FROM 
          v_kpi_dashboard
        ${whereClause}
        GROUP BY 
          company_name
        HAVING 
          COUNT(CASE WHEN entrega_a_tiempo IS NOT NULL THEN 1 ELSE NULL END) > 0
        ORDER BY 
          porcentaje_cumplimiento DESC
        LIMIT 10
      `);

      // Índice de reincidencia
      const reincidenciaEmpresas = await prisma.$queryRawUnsafe(`
        SELECT * FROM v_reincidencia_empresas
        LIMIT 10
      `);

      // Convertir datos a formato JSON seguro
      const jsonSafeData = {
        rawData: JSON.parse(JSON.stringify(data, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        )),
        aggregatedKpis: JSON.parse(JSON.stringify(aggregatedKpis[0] || {}, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        )),
        rankingEmpresas: JSON.parse(JSON.stringify(rankingEmpresas, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        )),
        comparativaCotizaciones: JSON.parse(JSON.stringify(comparativaCotizaciones, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        )),
        cumplimientoEntregas: JSON.parse(JSON.stringify(cumplimientoEntregas, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        )),
        reincidenciaEmpresas: JSON.parse(JSON.stringify(reincidenciaEmpresas, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        ))
      };
      
      // Devolver todos los datos del dashboard
      return NextResponse.json(jsonSafeData);
    }

    // Para otros reportes, devolver solo los datos
    // Convertir BigInt a String para que pueda ser serializado a JSON
    const result = JSON.parse(JSON.stringify(data, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al consultar el reporte:", error);
    return NextResponse.json(
      { error: "Error al consultar el reporte" },
      { status: 500 }
    );
  }
}
