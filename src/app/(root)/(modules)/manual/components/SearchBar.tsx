'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Card, CardBody, Chip } from '@nextui-org/react';
import { Search, Clock, ArrowRight } from 'lucide-react';
import { useManualSearch } from '../hooks/useManualSearch';

interface SearchBarProps {
  onSearchResults: (results: any) => void;
  onSectionSelect: (sectionId: string) => void;
}

export default function SearchBar({ onSearchResults, onSectionSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { 
    suggestions, 
    searchResults, 
    isSearching, 
    search, 
    getSuggestions 
  } = useManualSearch();

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('manual-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Manejar búsqueda en tiempo real
  useEffect(() => {
    if (query.length >= 2) {
      getSuggestions(query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query, getSuggestions]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) return;

    // Agregar a búsquedas recientes
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('manual-recent-searches', JSON.stringify(newRecent));

    // Realizar búsqueda
    const results = await search(searchQuery);
    onSearchResults(results);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'section') {
      onSectionSelect(suggestion.sectionId);
      onSearchResults(null);
    } else {
      setQuery(suggestion.text);
      handleSearch(suggestion.text);
    }
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const popularSearches = [
    'crear solicitud', 'asociado', 'certificaciones', 'proyecto', 'cotización',
    'requerimientos', 'especialidades', 'cliente', 'actividades', 'etapas'
  ];

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <Input
        placeholder="Buscar en el manual... (ej: 'cómo crear asociado', 'gestionar certificaciones')"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setShowSuggestions(query.length >= 2 || recentSearches.length > 0)}
        startContent={<Search className="w-4 h-4 text-gray-400" />}
        size="lg"
        className="w-full"
        classNames={{
          input: "text-base",
          inputWrapper: "bg-white shadow-lg border-2 border-transparent focus-within:border-blue-500"
        }}
      />

      {/* Sugerencias y resultados */}
      {showSuggestions && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto">
          <CardBody className="p-0">
            {/* Sugerencias de autocompletado */}
            {suggestions.length > 0 && (
              <div className="p-4 border-b">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">💡 Sugerencias</h4>
                <div className="space-y-2">
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="flex-1">{suggestion.text}</span>
                      {suggestion.type === 'section' && (
                        <Chip size="sm" variant="flat" color="primary">
                          {suggestion.sectionName}
                        </Chip>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Búsquedas recientes */}
            {recentSearches.length > 0 && query.length < 2 && (
              <div className="p-4 border-b">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">🕒 Búsquedas recientes</h4>
                <div className="space-y-2">
                  {recentSearches.map((recent, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => {
                        setQuery(recent);
                        handleSearch(recent);
                      }}
                    >
                      <Clock className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="flex-1">{recent}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Búsquedas populares */}
            {query.length < 2 && (
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">🔥 Búsquedas populares</h4>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((popular, index) => (
                    <Chip
                      key={index}
                      size="sm"
                      variant="flat"
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => {
                        setQuery(popular);
                        handleSearch(popular);
                      }}
                    >
                      {popular}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Estado de carga */}
            {isSearching && (
              <div className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Buscando...</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
