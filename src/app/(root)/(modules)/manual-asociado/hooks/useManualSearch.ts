'use client';

import { useState, useCallback } from 'react';
import { manualSections } from '../data/manual-content';

// Índice de búsqueda para asociados
const searchIndex = [
  // Términos relacionados con proyectos
  { term: 'proyecto', description: 'Gestión de proyectos asignados', section: 'proyectos', type: 'term' },
  { term: 'mis proyectos', description: 'Ver proyectos asignados a mi empresa', section: 'proyectos', type: 'action' },
  { term: 'estado proyecto', description: 'Actualizar estado de proyectos', section: 'proyectos', type: 'action' },
  { term: 'documentos proyecto', description: 'Subir documentos del proyecto', section: 'proyectos', type: 'action' },
  
  // Términos relacionados con oportunidades
  { term: 'oportunidad', description: 'Nuevas oportunidades de negocio', section: 'solicitudes', type: 'term' },
  { term: 'solicitud', description: 'Solicitudes de proyecto disponibles', section: 'solicitudes', type: 'term' },
  { term: 'oportunidades disponibles', description: 'Ver nuevas oportunidades', section: 'solicitudes', type: 'action' },
  { term: 'aplicar proyecto', description: 'Cómo aplicar a oportunidades', section: 'solicitudes', type: 'action' },
  
  // Términos relacionados con perfil
  { term: 'perfil', description: 'Gestión del perfil empresarial', section: 'perfil', type: 'term' },
  { term: 'actualizar perfil', description: 'Actualizar información empresarial', section: 'perfil', type: 'action' },
  { term: 'certificaciones', description: 'Gestionar certificaciones', section: 'perfil', type: 'term' },
  { term: 'especialidades', description: 'Actualizar especialidades', section: 'perfil', type: 'term' },
  { term: 'información empresarial', description: 'Datos de la empresa', section: 'perfil', type: 'term' },
  
  // Términos relacionados con login
  { term: 'login', description: 'Iniciar sesión en el sistema', section: 'login', type: 'term' },
  { term: 'iniciar sesión', description: 'Acceder al sistema', section: 'login', type: 'action' },
  { term: 'contraseña', description: 'Problemas con contraseña', section: 'login', type: 'term' },
  { term: 'acceso', description: 'Acceso al sistema', section: 'login', type: 'term' },
  
  // Términos generales
  { term: 'asociado', description: 'Información para asociados', section: 'introduccion', type: 'term' },
  { term: 'empresa', description: 'Gestión empresarial', section: 'perfil', type: 'term' },
  { term: 'cliente', description: 'Información sobre clientes', section: 'proyectos', type: 'term' },
];

export const useManualSearch = () => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const matchedTerms = searchIndex
      .filter(item => 
        item.term.toLowerCase().includes(queryLower) ||
        item.description.toLowerCase().includes(queryLower)
      )
      .slice(0, 8)
      .map(item => ({
        text: item.term,
        description: item.description,
        type: 'term',
        sectionId: item.section,
        sectionName: manualSections.find(s => s.id === item.section)?.title || ''
      }));

    // Agregar sugerencias de secciones
    const matchedSections = manualSections
      .filter(section => 
        section.title.toLowerCase().includes(queryLower) ||
        section.description?.toLowerCase().includes(queryLower)
      )
      .slice(0, 3)
      .map(section => ({
        text: section.title,
        description: section.description,
        type: 'section',
        sectionId: section.id,
        sectionName: section.title
      }));

    setSuggestions([...matchedTerms, ...matchedSections]);
  }, []);

  const search = useCallback(async (query: string) => {
    setIsSearching(true);
    
    // Simular delay de búsqueda
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const queryLower = query.toLowerCase();
    const results: any[] = [];

    // Buscar en contenido de secciones
    manualSections.forEach(section => {
      const sectionMatches: any[] = [];
      
      // Buscar en título y descripción
      if (section.title.toLowerCase().includes(queryLower) ||
          section.description?.toLowerCase().includes(queryLower)) {
        sectionMatches.push({
          type: 'section',
          title: section.title,
          description: section.description,
          sectionId: section.id,
          icon: section.icon,
          relevance: 10
        });
      }

      // Buscar en contenido
      section.content?.forEach((item, itemIndex) => {
        let matchFound = false;
        let matchText = '';

        if (item.text?.toLowerCase().includes(queryLower)) {
          matchFound = true;
          matchText = item.text;
        }

        if (item.title?.toLowerCase().includes(queryLower)) {
          matchFound = true;
          matchText = item.title;
        }

        if (item.steps?.some(step => step.toLowerCase().includes(queryLower))) {
          matchFound = true;
          matchText = item.steps.find(step => step.toLowerCase().includes(queryLower)) || '';
        }

        if (matchFound) {
          sectionMatches.push({
            type: 'content',
            title: item.title || `${section.title} - Contenido`,
            description: matchText.substring(0, 150) + '...',
            sectionId: section.id,
            sectionTitle: section.title,
            icon: section.icon,
            relevance: 5
          });
        }
      });

      // Buscar en FAQ
      section.faq?.forEach(faq => {
        if (faq.question.toLowerCase().includes(queryLower) ||
            faq.answer.toLowerCase().includes(queryLower)) {
          sectionMatches.push({
            type: 'faq',
            title: faq.question,
            description: faq.answer.substring(0, 150) + '...',
            sectionId: section.id,
            sectionTitle: section.title,
            icon: '❓',
            relevance: 7
          });
        }
      });

      results.push(...sectionMatches);
    });

    // Ordenar por relevancia
    results.sort((a, b) => b.relevance - a.relevance);

    setSearchResults(results.slice(0, 20));
    setIsSearching(false);
    
    return results.slice(0, 20);
  }, []);

  return {
    suggestions,
    searchResults,
    isSearching,
    getSuggestions,
    search
  };
};
