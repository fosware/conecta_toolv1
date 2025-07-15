// Función auxiliar para aplicar filtro de búsqueda
export function applySearchFilter(data: any[], searchTerm: string) {
  if (!searchTerm) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(item => 
    Object.values(item).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(term)
    )
  );
}

// Función auxiliar para aplicar filtro de fechas
export function handleDateFilter(data: any[], start: string | null, end: string | null) {
  if (!start && !end) return data;
  
  // Extraer las partes de las fechas de inicio y fin (formato ISO YYYY-MM-DD)
  let startYear = 0, startMonth = 0, startDay = 0;
  let endYear = 0, endMonth = 0, endDay = 0;
  
  if (start) {
    const parts = start.split('-');
    startYear = parseInt(parts[0]);
    startMonth = parseInt(parts[1]) - 1; // Restar 1 porque los meses en JS son 0-11
    startDay = parseInt(parts[2]);
  }
  
  if (end) {
    const parts = end.split('-');
    endYear = parseInt(parts[0]);
    endMonth = parseInt(parts[1]) - 1; // Restar 1 porque los meses en JS son 0-11
    endDay = parseInt(parts[2]);
  }
  
  return data.filter((item) => {
    const rowDateStr = item["Fecha de Cotización"] || item["Fecha Cotización"];
    
    // Si no hay fecha en la fila, no la incluimos cuando hay filtro activo
    if (!rowDateStr) return false;

    // Convertir la fecha de la fila (formato DD/MM/YYYY o DD-MM-YYYY) a partes
    const parts = rowDateStr.includes("/") 
      ? rowDateStr.split("/") 
      : rowDateStr.split("-");
    
    if (parts.length !== 3) return false;
    
    // Extraer partes de la fecha
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Restar 1 porque los meses en JS son 0-11
    const year = parseInt(parts[2]);
    
    // Comparar fechas por componentes para evitar problemas de zona horaria
    if (start && end) {
      // Verificar si está dentro del rango
      const afterOrEqualStart = 
        year > startYear || 
        (year === startYear && month > startMonth) || 
        (year === startYear && month === startMonth && day >= startDay);
      
      const beforeOrEqualEnd = 
        year < endYear || 
        (year === endYear && month < endMonth) || 
        (year === endYear && month === endMonth && day <= endDay);
      
      return afterOrEqualStart && beforeOrEqualEnd;
    } else if (start) {
      // Verificar si es posterior o igual a la fecha de inicio
      return 
        year > startYear || 
        (year === startYear && month > startMonth) || 
        (year === startYear && month === startMonth && day >= startDay);
    } else if (end) {
      // Verificar si es anterior o igual a la fecha de fin
      return 
        year < endYear || 
        (year === endYear && month < endMonth) || 
        (year === endYear && month === endMonth && day <= endDay);
    }
    
    return true;
  });
}
