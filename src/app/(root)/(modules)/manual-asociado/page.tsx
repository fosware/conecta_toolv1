'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import SearchBar from './components/SearchBar';
import NavigationSidebar from './components/NavigationSidebar';
import ManualSection from './components/ManualSection';
import { manualSections, ManualSection as ManualSectionType } from './data/manual-content';

// Placeholder component para secciones no cargadas
const SectionPlaceholder = ({ section }: { section: ManualSectionType }) => {
  return (
    <Card id={`section-${section.id}`} className="mb-8">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{section.icon}</span>
          <div>
            <CardTitle className="text-2xl font-bold">{section.title}</CardTitle>
            {section.description && (
              <p className="text-muted-foreground mt-1">{section.description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              📄 Contenido se carga automáticamente al hacer scroll
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ManualAsociadoPage() {
  const [activeSection, setActiveSection] = useState('introduccion');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loadedSections, setLoadedSections] = useState(new Set(manualSections.map(s => s.id))); // Cargar todas las secciones
  const [loadingSections, setLoadingSections] = useState(new Set()); // Secciones que se están cargando
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Control del botón "ir arriba" - Usando el main container
  useEffect(() => {
    const handleScroll = () => {
      // El scroll está en el elemento main, no en window
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const scrolled = mainElement.scrollTop > 300;
        setShowScrollTop(scrolled);
      }
    };

    // Agregar listener al elemento main
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Función para ir arriba - Usando el main container
  const scrollToTop = () => {
    // El scroll está en el elemento main, no en window
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para cargar una sección con control de duplicados
  const loadSectionIfNeeded = (sectionId: string, immediate = false) => {
    if (!loadedSections.has(sectionId) && !loadingSections.has(sectionId)) {
      setLoadingSections(prev => new Set([...prev, sectionId]));
      
      // Carga inmediata para navegación directa, o con delay para lazy loading
      const delay = immediate ? 50 : 300;
      
      setTimeout(() => {
        setLoadedSections(prev => new Set([...prev, sectionId]));
        setLoadingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });
      }, delay);
    }
  };

  // Función para cargar sección (llamada desde sidebar)
  const loadSection = (sectionId: string) => {
    loadSectionIfNeeded(sectionId, true); // Carga inmediata para navegación directa
  };

  // Listener de scroll mejorado para lazy loading y detección de secciones
  React.useEffect(() => {
    const handleScroll = () => {
      // Obtener todas las secciones (tanto cargadas como placeholders)
      const allSectionElements = manualSections.map((section: any) => {
        const element = document.getElementById(`section-${section.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: section.id,
            top: rect.top,
            height: rect.height,
            isLoaded: loadedSections.has(section.id)
          };
        }
        return null;
      }).filter(Boolean);

      // Encontrar la sección que está más cerca del top de la pantalla
      const currentSection = allSectionElements.find((section: any) => 
        section && section.top <= 200 && section.top + section.height > 200
      );

      if (currentSection) {
        // console.log('Sección activa detectada:', currentSection.id); // DESACTIVADO - DEMASIADO SPAM
        setActiveSection(currentSection.id); // REACTIVADO - NECESARIO PARA SIDEBAR
      }

      // Lazy loading: cargar secciones que están cerca de ser visibles
      allSectionElements.forEach((section: any) => {
        if (section && section.top <= window.innerHeight + 600) { // 600px antes de ser visible
          if (!section.isLoaded) {
            // console.log('🔄 Cargando sección por scroll:', section.id); // DESACTIVADO - DEMASIADO SPAM
            loadSectionIfNeeded(section.id);
          }
        }
      });
    };

    // Ejecutar cada 100ms para mejor detección
    const scrollInterval = setInterval(handleScroll, 100);
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }
    handleScroll(); // Ejecutar una vez al cargar

    return () => {
      clearInterval(scrollInterval);
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadedSections]); // Dependencia en loadedSections para re-evaluar

  // Cargar automáticamente las primeras secciones al inicio
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Cargar las primeras secciones progresivamente
      const sectionsToPreload = ['login', 'proyectos', 'solicitudes'];
      sectionsToPreload.forEach((sectionId, index) => {
        setTimeout(() => {
          // console.log('🚀 Precargando sección:', sectionId); // DESACTIVADO - SPAM
          loadSectionIfNeeded(sectionId);
        }, (index + 1) * 300); // Cargar cada 300ms (más rápido)
      });
    }, 500); // Esperar solo 500ms después de la carga inicial

    return () => clearTimeout(timer);
  }, []);

  // Cargar secciones adicionales cuando el usuario está inactivo
  React.useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Cargar secciones restantes después de 2 segundos de inactividad
        manualSections.forEach((section, index) => {
          if (!loadedSections.has(section.id)) {
            setTimeout(() => {
              loadSectionIfNeeded(section.id);
            }, index * 200); // Cargar cada 200ms
          }
        });
      }, 2000);
    };

    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', resetTimer);
    }
    window.addEventListener('mousemove', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      if (mainElement) {
        mainElement.removeEventListener('scroll', resetTimer);
      }
      window.removeEventListener('mousemove', resetTimer);
    };
  }, [loadedSections]);

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* Header Card - Consistente con otros módulos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">📚 Manual del Asociado</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Guía completa para asociados del sistema Conecta Tool
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barra de búsqueda */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <SearchBar 
                    onSearchResults={setSearchResults}
                    onSectionSelect={(sectionId) => {
                      // Cargar la sección si no está cargada
                      loadSectionIfNeeded(sectionId, true);
                      
                      // Limpiar resultados de búsqueda
                      setSearchResults(null);
                      
                      // Hacer scroll con un pequeño delay
                      setTimeout(() => {
                        const element = document.getElementById(`section-${sectionId}`);
                        const mainElement = document.querySelector('main');
                        if (element && mainElement) {
                          const elementTop = element.offsetTop;
                          mainElement.scrollTo({ top: elementTop - 100, behavior: 'smooth' });
                          setActiveSection(sectionId);
                        }
                      }, 100);
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <NavigationSidebar 
              activeSection={activeSection}
              onSectionChange={() => {}} // No necesario ya que usamos scroll
              sections={manualSections}
              onLoadSection={loadSection}
            />
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {searchResults ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">🔍 Resultados de Búsqueda</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Search Results Component */}
                  <div className="space-y-4">
                    {searchResults.map((result: any, index: number) => (
                      <div 
                        key={index}
                        className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => {
                          // Primero cargar la sección si no está cargada (carga inmediata)
                          if (!loadedSections.has(result.sectionId)) {
                            loadSectionIfNeeded(result.sectionId, true);
                          }
                          
                          // Limpiar resultados de búsqueda
                          setSearchResults(null);
                          
                          // Hacer scroll con un pequeño delay para asegurar que la sección se cargue
                          setTimeout(() => {
                            const element = document.getElementById(`section-${result.sectionId}`);
                            const mainElement = document.querySelector('main');
                            if (element && mainElement) {
                              const elementTop = element.offsetTop;
                              mainElement.scrollTo({ top: elementTop - 100, behavior: 'smooth' });
                              setActiveSection(result.sectionId);
                            }
                          }, 100);
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{result.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
                            <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {result.sectionTitle || manualSections.find(s => s.id === result.sectionId)?.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {result.type === 'section' ? 'Sección' : 
                                 result.type === 'faq' ? 'FAQ' : 'Contenido'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {manualSections.map((section) => (
                  <div key={section.id}>
                    {loadedSections.has(section.id) ? (
                      <ManualSection section={section} />
                    ) : (
                      <SectionPlaceholder section={section} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón flotante "ir arriba" */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-sm border border-blue-500/20 text-white"
          size="icon"
          title="Ir arriba"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
