'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button } from '@nextui-org/react';

// Datos completos del manual - TODAS las secciones
const manualSections = [
  { id: 'introduccion', title: 'Introducción', icon: '🏠', description: 'Conecta Tool es una plataforma integral para la gestión y certificación de empresas' },
  { id: 'login', title: 'Inicio de Sesión', icon: '🔐', description: 'El primer paso para utilizar Conecta Tool es autenticarte en el sistema' },
  { id: 'proyectos', title: 'Gestión de Proyectos', icon: '🚀', description: 'Torre de control para supervisar todos los proyectos activos' },
  { id: 'solicitudes', title: 'Solicitudes de Proyecto', icon: '📋', description: 'Punto de partida para conectar las necesidades de tus clientes con los asociados ideales' },
  { id: 'asignadas', title: 'Solicitudes Asignadas', icon: '👥', description: 'Visualiza y gestiona la relación entre asociados y solicitudes' },
  { id: 'asociados', title: 'Gestión de Asociados', icon: '🏢', description: 'Corazón del sistema. Gestiona empresas proveedoras, sus capacidades y certificaciones' },
  { id: 'clientes', title: 'Gestión de Clientes', icon: '👤', description: 'Administra tu cartera de clientes y sus diferentes áreas de contacto' },
  { id: 'ndas', title: 'Administración de NDAs', icon: '📄', description: 'Gestiona los Acuerdos de Confidencialidad con empresas asociadas' },
  { id: 'reportes', title: 'Módulo de Reportes', icon: '📈', description: 'Centro de inteligencia de negocio con herramientas avanzadas para análisis' },
  { id: 'catalogos', title: 'Catálogos', icon: '⚙️', description: 'Configuración de especialidades y certificaciones que el sistema reconocerá' },
  { id: 'usuarios', title: 'Gestión de Usuarios', icon: '👥', description: 'Administra las cuentas de usuario y sus roles en el sistema' },
  { id: 'perfil', title: 'Perfil de Usuario', icon: '👤', description: 'Gestiona tu información personal y configuración de cuenta' }
];

// Componentes temporales inline
const SearchBar = ({ onSearchResults, onSectionSelect }: any) => (
  <div className="w-full max-w-2xl mx-auto">
    <input 
      placeholder="Buscar en el manual..."
      className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-blue-500 outline-none"
    />
  </div>
);

const NavigationSidebar = ({ activeSection, sections, onLoadSection }: any) => (
  <Card className="sticky top-4">
    <CardHeader>
      <h3 className="text-lg font-semibold text-blue-600">📋 Índice</h3>
    </CardHeader>
    <CardBody className="p-0">
      <nav className="space-y-1">
        {sections.map((section: any) => (
          <button
            key={section.id}
            onClick={() => {
              if (onLoadSection) onLoadSection(section.id);
              setTimeout(() => {
                const element = document.getElementById(`section-${section.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
            className={`w-full text-left px-4 py-3 rounded-none transition-all duration-200 flex items-center space-x-3 ${
              activeSection === section.id
                ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{section.icon}</span>
            <span className="text-sm">{section.title}</span>
          </button>
        ))}
      </nav>
    </CardBody>
  </Card>
);

const ManualSection = ({ section }: any) => (
  <Card>
    <CardHeader>
      <div className="flex items-center space-x-3">
        <span className="text-3xl">{section?.icon}</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{section?.title}</h1>
          <p className="text-gray-600 mt-2">{section?.description}</p>
        </div>
      </div>
    </CardHeader>
    <CardBody className="p-8">
      <p className="text-gray-700">Contenido de la sección {section?.title}...</p>
    </CardBody>
  </Card>
);

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState('introduccion');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loadedSections, setLoadedSections] = useState(new Set(['introduccion'])); // Solo cargar la primera sección inicialmente
  const [loadingSections, setLoadingSections] = useState(new Set()); // Secciones que se están cargando

  // Intersection Observer para detectar qué sección está visible
  React.useEffect(() => {
    // Esperar a que las secciones se rendericen
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          // Encontrar la sección más visible
          let mostVisible = null;
          let maxRatio = 0;

          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
              maxRatio = entry.intersectionRatio;
              mostVisible = entry.target.id.replace('section-', '');
            }
          });

          if (mostVisible) {
            setActiveSection(mostVisible);
          }
        },
        {
          rootMargin: '-100px 0px -60% 0px', // Activar cuando la sección esté cerca del top
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] // Múltiples thresholds para mejor detección
        }
      );

      // Observar todas las secciones
      manualSections.forEach((section: any) => {
        const element = document.getElementById(`section-${section.id}`);
        if (element) {
          observer.observe(element);
        }
      });

      return () => observer.disconnect();
    }, 100); // Esperar 100ms para que se rendericen las secciones

    return () => clearTimeout(timer);
  }, []);

  // Listener de scroll como respaldo + lazy loading
  React.useEffect(() => {
    const handleScroll = () => {
      const sections = manualSections.map((section: any) => {
        const element = document.getElementById(`section-${section.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: section.id,
            top: rect.top,
            height: rect.height,
            element
          };
        }
        return null;
      }).filter(Boolean);

      // Encontrar la sección que está más cerca del top de la pantalla
      const currentSection = sections.find((section: any) => 
        section && section.top <= 200 && section.top + section.height > 200
      );

      if (currentSection) {
        console.log('Sección activa detectada:', currentSection.id); // Debug
        setActiveSection(currentSection.id);
      }

      // Lazy loading: cargar secciones que están cerca de ser visibles
      sections.forEach((section: any) => {
        if (section && section.top <= window.innerHeight + 800) { // 800px antes de ser visible
          loadSectionIfNeeded(section.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Ejecutar una vez al cargar

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cargar automáticamente las primeras 2-3 secciones al inicio
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Cargar las primeras secciones progresivamente
      const sectionsToPreload = ['login', 'proyectos'];
      sectionsToPreload.forEach((sectionId, index) => {
        setTimeout(() => {
          loadSectionIfNeeded(sectionId);
        }, (index + 1) * 500); // Cargar cada 500ms
      });
    }, 1000); // Esperar 1 segundo después de la carga inicial

    return () => clearTimeout(timer);
  }, []);

  // Función para cargar una sección con control de duplicados
  const loadSectionIfNeeded = (sectionId: string) => {
    if (!loadedSections.has(sectionId) && !loadingSections.has(sectionId)) {
      setLoadingSections(prev => new Set([...prev, sectionId]));
      
      // Simular carga progresiva (en una app real, aquí cargarías el contenido)
      setTimeout(() => {
        setLoadedSections(prev => new Set([...prev, sectionId]));
        setLoadingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });
      }, 300); // 300ms de delay para simular carga
    }
  };

  // Función para cargar una sección específica (para navegación directa)
  const loadSection = (sectionId: string) => {
    loadSectionIfNeeded(sectionId);
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
          <CardBody className="text-center py-8">
            <div className="text-3xl mb-3">{section.icon}</div>
            <h2 className="text-xl font-bold text-gray-600 mb-2">{section.title}</h2>
            <p className="text-gray-500 text-sm mb-4">{section.description}</p>
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-blue-600 text-sm">Cargando contenido...</span>
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                📄 Contenido se carga automáticamente al hacer scroll
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">📚 Manual de Usuario - Conecta Tool</h1>
          <p className="text-xl opacity-90">Guía completa para administradores</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-6 -mt-4 relative z-10">
        <SearchBar 
          onSearchResults={setSearchResults}
          onSectionSelect={setActiveSection}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <NavigationSidebar 
              activeSection={activeSection}
              onSectionChange={() => {}} // No necesario ya que usamos scroll
              sections={manualSections}
              onLoadSection={loadSection}
            />
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {searchResults ? (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">🔍 Resultados de Búsqueda</h2>
                </CardHeader>
                <CardBody>
                  {/* Search Results Component */}
                  <div className="space-y-4">
                    {searchResults.map((result: any, index: number) => (
                      <div 
                        key={index}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          const element = document.getElementById(`section-${result.sectionId}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                          setSearchResults(null);
                        }}
                      >
                        <h3 className="font-semibold text-blue-600">{result.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{result.excerpt}</p>
                        <span className="text-xs text-gray-400">📍 {result.sectionName}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Renderizar secciones con lazy loading */}
                {manualSections.map((section: any) => (
                  <div key={section.id}>
                    {loadedSections.has(section.id) ? (
                      <div id={`section-${section.id}`} className="scroll-mt-20">
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
    </div>
  );
}
