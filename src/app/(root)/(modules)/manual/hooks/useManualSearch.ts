'use client';

import { useState, useCallback } from 'react';
import { searchIndex } from '../data/search-index';
import { manualSections } from '../data/manual-content';

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  sectionId: string;
  sectionName: string;
  relevance: number;
}

interface Suggestion {
  text: string;
  type: 'term' | 'section' | 'action';
  sectionId?: string;
  sectionName?: string;
}

export function useManualSearch() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Función para obtener sugerencias en tiempo real
  const getSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const newSuggestions: Suggestion[] = [];

    // Buscar en términos del índice
    Object.entries(searchIndex.terms).forEach(([term, data]) => {
      if (term.toLowerCase().includes(queryLower)) {
        newSuggestions.push({
          text: term,
          type: 'term',
          sectionId: data.sections[0],
          sectionName: manualSections.find(s => s.id === data.sections[0])?.title || ''
        });
      }
    });

    // Buscar en secciones
    manualSections.forEach(section => {
      if (section.title.toLowerCase().includes(queryLower)) {
        newSuggestions.push({
          text: section.title,
          type: 'section',
          sectionId: section.id,
          sectionName: section.title
        });
      }
    });

    // Buscar en acciones comunes
    searchIndex.actions.forEach(action => {
      if (action.text.toLowerCase().includes(queryLower)) {
        newSuggestions.push({
          text: action.text,
          type: 'action',
          sectionId: action.sectionId,
          sectionName: manualSections.find(s => s.id === action.sectionId)?.title || ''
        });
      }
    });

    // Ordenar por relevancia y limitar resultados
    const sortedSuggestions = newSuggestions
      .sort((a, b) => {
        const aIndex = a.text.toLowerCase().indexOf(queryLower);
        const bIndex = b.text.toLowerCase().indexOf(queryLower);
        return aIndex - bIndex;
      })
      .slice(0, 8);

    setSuggestions(sortedSuggestions);
  }, []);

  // Función principal de búsqueda
  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    setIsSearching(true);
    
    try {
      const queryLower = query.toLowerCase();
      const results: SearchResult[] = [];

      // Buscar en contenido de secciones
      manualSections.forEach(section => {
        let relevance = 0;
        let excerpt = '';

        // Buscar en título
        if (section.title.toLowerCase().includes(queryLower)) {
          relevance += 10;
          excerpt = section.title;
        }

        // Buscar en descripción
        if (section.description?.toLowerCase().includes(queryLower)) {
          relevance += 8;
          excerpt = section.description;
        }

        // Buscar en contenido
        section.content?.forEach(item => {
          if (item.text?.toLowerCase().includes(queryLower)) {
            relevance += 5;
            if (!excerpt) {
              excerpt = item.text.substring(0, 150) + '...';
            }
          }

          // Buscar en pasos
          item.steps?.forEach(step => {
            if (step.toLowerCase().includes(queryLower)) {
              relevance += 3;
              if (!excerpt) {
                excerpt = step.substring(0, 150) + '...';
              }
            }
          });
        });

        // Buscar en FAQ
        section.faq?.forEach(faqItem => {
          if (faqItem.question.toLowerCase().includes(queryLower) || 
              faqItem.answer.toLowerCase().includes(queryLower)) {
            relevance += 6;
            if (!excerpt) {
              excerpt = faqItem.question;
            }
          }
        });

        if (relevance > 0) {
          results.push({
            id: `${section.id}-${Date.now()}`,
            title: section.title,
            excerpt: excerpt || section.description || 'Contenido relacionado encontrado',
            sectionId: section.id,
            sectionName: section.title,
            relevance
          });
        }
      });

      // Buscar en términos específicos
      Object.entries(searchIndex.terms).forEach(([term, data]) => {
        if (term.toLowerCase().includes(queryLower)) {
          data.sections.forEach(sectionId => {
            const section = manualSections.find(s => s.id === sectionId);
            if (section) {
              results.push({
                id: `term-${term}-${sectionId}`,
                title: `${term} - ${section.title}`,
                excerpt: data.description || `Información sobre ${term}`,
                sectionId,
                sectionName: section.title,
                relevance: 7
              });
            }
          });
        }
      });

      // Ordenar por relevancia
      const sortedResults = results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 20);

      setSearchResults(sortedResults);
      return sortedResults;

    } catch (error) {
      console.error('Error en búsqueda:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    suggestions,
    searchResults,
    isSearching,
    search,
    getSuggestions
  };
}
