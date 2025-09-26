"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronUp } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// Importar datos de ambos manuales
import { manualSections as adminManualSections } from "./data/admin-content";
import { getManualImage, hasManualImage } from "./data/images-mapping";
import { manualSections as asociadoManualSections } from "./data/asociado-content";

// Componente de búsqueda funcional
const SearchBar = ({ onSearchResults, onSectionSelect, sections }: any) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      onSearchResults(null);
      return;
    }

    // Búsqueda simple en el contenido de las secciones
    const results = sections
      .filter(
        (section: any) =>
          section.title.toLowerCase().includes(query.toLowerCase()) ||
          section.description?.toLowerCase().includes(query.toLowerCase()) ||
          section.content?.some(
            (item: any) =>
              item.text?.toLowerCase().includes(query.toLowerCase()) ||
              item.title?.toLowerCase().includes(query.toLowerCase())
          )
      )
      .map((section: any) => ({
        title: section.title,
        excerpt: section.description,
        sectionId: section.id,
        sectionName: section.title,
      }));

    onSearchResults(results.length > 0 ? results : []);
  };

  return (
    <div className="relative">
      <Input
        placeholder="Buscar en el manual... (ej: 'cómo crear asociado', 'gestionar certificaciones')"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          onClick={() => {
            setSearchQuery("");
            onSearchResults(null);
          }}
        >
          ✕
        </Button>
      )}
    </div>
  );
};

const NavigationSidebar = ({ activeSection, sections, onLoadSection }: any) => (
  <Card className="lg:sticky lg:top-4 h-fit">
    <CardHeader className="flex-shrink-0 pb-3">
      <CardTitle className="text-lg font-semibold">📋 Índice</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-2">
        <nav className="space-y-1">
          {sections.map((section: any) => (
            <button
              key={section.id}
              onClick={() => {
                if (onLoadSection) onLoadSection(section.id);
                setTimeout(() => {
                  const element = document.getElementById(
                    `section-${section.id}`
                  );
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
              }}
              className={`w-full text-left px-4 py-2 lg:py-3 rounded-none transition-all duration-200 flex items-center space-x-3 ${
                activeSection === section.id
                  ? "bg-primary/10 dark:bg-primary/20 text-primary border-r-4 border-primary font-medium"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="text-lg flex-shrink-0">{section.icon}</span>
              <span className="text-sm flex-1 text-left">{section.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </CardContent>
  </Card>
);

const ManualSection = ({ section }: any) => {
  if (!section) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-2">Selecciona una sección</h2>
          <p className="text-muted-foreground">
            Usa el menú lateral o el buscador para navegar por el manual
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderContentItem = (item: any, index: number) => {
    switch (item.type) {
      case "text":
        return (
          <div key={index} className="mb-6">
            {item.title && (
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
            )}
            <p className="text-foreground/90 leading-relaxed">{item.text}</p>
          </div>
        );
      case "steps":
        return (
          <div key={index} className="mb-6">
            {item.title && (
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
            )}
            <ol className="list-decimal list-inside space-y-2">
              {item.steps?.map((step: string, stepIndex: number) => (
                <li
                  key={stepIndex}
                  className="text-foreground/90 leading-relaxed"
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        );
      case "alert":
        return (
          <div
            key={index}
            className={`mb-6 p-4 rounded-lg border ${
              item.alertType === "info"
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                : item.alertType === "success"
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : item.alertType === "warning"
                    ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            }`}
          >
            {item.title && <h4 className="font-semibold mb-2">{item.title}</h4>}
            <p className="text-sm">{item.text}</p>
          </div>
        );
      case "grid":
        return (
          <div key={index} className="mb-6">
            {item.title && (
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.gridItems?.map((gridItem: any, gridIndex: number) => (
                <div
                  key={gridIndex}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {gridItem.icon && (
                      <span className="text-lg">{gridItem.icon}</span>
                    )}
                    <h4 className="font-semibold">{gridItem.title}</h4>
                  </div>
                  <p className="text-sm text-foreground/80">
                    {gridItem.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case "image":
        const imageExists = hasManualImage(item.imageId);
        const imageSrc = imageExists ? getManualImage(item.imageId) : null;

        return (
          <div key={index} className="mb-6">
            {item.title && (
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
            )}
            <div className="bg-muted/30 p-4 rounded-lg border">
              {imageExists && imageSrc ? (
                <>
                  <img
                    src={imageSrc}
                    alt={item.imageCaption || `Imagen ${item.imageId}`}
                    className="w-full h-auto rounded-lg shadow-sm border"
                  />
                  {item.imageCaption && (
                    <p className="text-sm text-center text-muted-foreground mt-3 italic">
                      {item.imageCaption}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🖼️</div>
                  <h4 className="font-semibold mb-2">
                    {item.imageCaption || `Imagen ${item.imageId}`}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Imagen no disponible:{" "}
                    <code className="bg-muted px-1 rounded">
                      {item.imageId}
                    </code>
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{section?.icon}</span>
          <div>
            <CardTitle className="text-3xl font-bold">
              {section?.title}
            </CardTitle>
            <CardDescription className="text-foreground/80 mt-2 text-lg">
              {section?.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Renderizar contenido estructurado */}
          {section?.content?.map((item: any, index: number) =>
            renderContentItem(item, index)
          )}

          {/* FAQ Section */}
          {section?.faq && section.faq.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">
                ❓ Preguntas Frecuentes
              </h3>
              <div className="space-y-4">
                {section.faq.map((faqItem: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{faqItem.question}</h4>
                    <p className="text-foreground/80 text-sm">
                      {faqItem.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ManualPage() {
  const { role, isLoading } = useCurrentUser();

  // Determinar qué manual mostrar basado en el rol
  const isAdmin = role?.toLowerCase() === "admin";
  const manualSections = isAdmin ? adminManualSections : asociadoManualSections;
  const manualTitle = isAdmin
    ? "📚 Manual del Administrador"
    : "📚 Manual del Asociado";
  const manualDescription = isAdmin
    ? "Guía completa para administradores del sistema Conecta Tool"
    : "Guía completa para asociados del sistema Conecta Tool";

  const [activeSection, setActiveSection] = useState("introduccion");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loadedSections, setLoadedSections] = useState(
    new Set(manualSections.map((s: any) => s.id))
  ); // Cargar todas las secciones para tener contenido
  const [loadingSections, setLoadingSections] = useState(new Set()); // Secciones que se están cargando
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Intersection Observer para detectar qué sección está visible - DESACTIVADO TEMPORALMENTE
  React.useEffect(() => {
    // COMENTADO: Este observer está interfiriendo con el scroll to top
    // Lo reactivaremos después de arreglar el botón
    /*
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          let mostVisible = null;
          let maxRatio = 0;

          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
              maxRatio = entry.intersectionRatio;
              mostVisible = entry.target.id.replace('section-', '');
            }
          });

          if (mostVisible) {
            console.log('Sección activa detectada:', mostVisible, maxRatio);
            setActiveSection(mostVisible);
          }
        },
        {
          rootMargin: '-100px 0px -60% 0px',
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5]
        }
      );

      manualSections.forEach((section: any) => {
        const element = document.getElementById(`section-${section.id}`);
        if (element) {
          observer.observe(element);
        }
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
    */
  }, []);

  // Listener de scroll mejorado para lazy loading y detección de secciones
  React.useEffect(() => {
    const handleScroll = () => {
      // Obtener todas las secciones (tanto cargadas como placeholders)
      const allSectionElements = manualSections
        .map((section: any) => {
          const element = document.getElementById(`section-${section.id}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            return {
              id: section.id,
              top: rect.top,
              height: rect.height,
              element,
              isLoaded: loadedSections.has(section.id),
            };
          }
          return null;
        })
        .filter(Boolean);

      // Encontrar la sección que está más cerca del top de la pantalla
      const currentSection = allSectionElements.find(
        (section: any) =>
          section && section.top <= 200 && section.top + section.height > 200
      );

      if (currentSection) {
        // console.log('Sección activa detectada:', currentSection.id); // DESACTIVADO - DEMASIADO SPAM
        setActiveSection(currentSection.id); // REACTIVADO - NECESARIO PARA SIDEBAR
      }

      // Lazy loading: cargar secciones que están cerca de ser visibles
      allSectionElements.forEach((section: any) => {
        if (section && section.top <= window.innerHeight + 600) {
          // 600px antes de ser visible
          if (!section.isLoaded) {
            // console.log('🔄 Cargando sección por scroll:', section.id); // DESACTIVADO - DEMASIADO SPAM
            loadSectionIfNeeded(section.id);
          }
        }
      });
    };

    // Ejecutar cada 100ms para mejor detección
    const scrollInterval = setInterval(handleScroll, 100);
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Ejecutar una vez al cargar

    return () => {
      clearInterval(scrollInterval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loadedSections]); // Dependencia en loadedSections para re-evaluar

  // Cargar automáticamente las primeras secciones al inicio
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Cargar las primeras secciones progresivamente
      const sectionsToPreload = ["login", "proyectos", "solicitudes"];
      sectionsToPreload.forEach((sectionId, index) => {
        setTimeout(
          () => {
            // console.log('🚀 Precargando sección:', sectionId); // DESACTIVADO - SPAM
            loadSectionIfNeeded(sectionId);
          },
          (index + 1) * 300
        ); // Cargar cada 300ms (más rápido)
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
        // Cargar más secciones después de 2 segundos de inactividad
        const sectionsToLoad = ["asociados", "clientes", "reportes"];
        sectionsToLoad.forEach((sectionId, index) => {
          setTimeout(() => {
            if (!loadedSections.has(sectionId)) {
              console.log("⏰ Cargando sección por inactividad:", sectionId);
              loadSectionIfNeeded(sectionId);
            }
          }, index * 200);
        });
      }, 2000);
    };

    window.addEventListener("scroll", resetTimer);
    window.addEventListener("mousemove", resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("mousemove", resetTimer);
    };
  }, [loadedSections]);

  // Control del botón "ir arriba" - Usando el main container
  useEffect(() => {
    const handleScroll = () => {
      // El scroll está en el elemento main, no en window
      const mainElement = document.querySelector("main");
      if (mainElement) {
        const scrolled = mainElement.scrollTop > 300;
        setShowScrollTop(scrolled);
      }
    };

    // Agregar listener al elemento main
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll);
      return () => mainElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Función para ir arriba - Usando el main container
  const scrollToTop = () => {
    // El scroll está en el elemento main, no en window
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Función para cargar una sección con control de duplicados
  const loadSectionIfNeeded = (sectionId: string, immediate = false) => {
    if (!loadedSections.has(sectionId) && !loadingSections.has(sectionId)) {
      setLoadingSections((prev) => new Set([...prev, sectionId]));

      // Carga inmediata para navegación directa, o con delay para lazy loading
      const delay = immediate ? 50 : 300;

      setTimeout(() => {
        setLoadedSections((prev) => new Set([...prev, sectionId]));
        setLoadingSections((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });
      }, delay);
    }
  };

  // Función para cargar una sección específica (para navegación directa)
  const loadSection = (sectionId: string) => {
    loadSectionIfNeeded(sectionId, true); // Carga inmediata
  };

  // Componente placeholder para secciones no cargadas
  const SectionPlaceholder = ({ section }: { section: any }) => {
    const isLoading = loadingSections.has(section.id);

    return (
      <div
        id={`section-${section.id}`}
        className="scroll-mt-20 min-h-[300px] flex items-center justify-center"
      >
        <Card className="w-full">
          <CardContent className="text-center py-8">
            <div className="text-3xl mb-3">{section.icon}</div>
            <CardTitle className="text-xl font-bold mb-2">
              {section.title}
            </CardTitle>
            <CardDescription className="text-foreground/80 text-sm mb-4">
              {section.description}
            </CardDescription>
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-primary text-sm font-medium">
                  Cargando contenido...
                </span>
              </div>
            ) : (
              <div className="text-xs text-foreground/70">
                📄 Contenido se carga automáticamente al hacer scroll
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Mostrar loading mientras se obtiene el rol
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando manual...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* Header Card - Consistente con otros módulos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">
                  {manualTitle}
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  {manualDescription}
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
                    onSectionSelect={setActiveSection}
                    sections={manualSections}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
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
                  <CardTitle className="text-2xl font-bold">
                    🔍 Resultados de Búsqueda
                  </CardTitle>
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
                            const element = document.getElementById(
                              `section-${result.sectionId}`
                            );
                            if (element) {
                              element.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                              setActiveSection(result.sectionId);
                            }
                          }, 100);
                        }}
                      >
                        <h3 className="font-semibold text-primary">
                          {result.title}
                        </h3>
                        <p className="text-foreground/70 text-sm mt-1">
                          {result.excerpt}
                        </p>
                        <span className="text-xs text-foreground/60">
                          📍 {result.sectionName}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Renderizar secciones con lazy loading */}
                {manualSections.map((section: any) => (
                  <div key={section.id}>
                    {loadedSections.has(section.id) ? (
                      <div
                        id={`section-${section.id}`}
                        className="scroll-mt-20"
                      >
                        <ManualSection section={section} />
                      </div>
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
