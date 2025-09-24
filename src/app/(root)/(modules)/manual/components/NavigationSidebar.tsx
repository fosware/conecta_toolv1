'use client';

import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { ManualSection } from '../data/manual-content';

interface NavigationSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  sections: ManualSection[];
  onLoadSection?: (sectionId: string) => void;
}

export default function NavigationSidebar({ 
  activeSection, 
  onSectionChange, 
  sections,
  onLoadSection 
}: NavigationSidebarProps) {
  
  return (
    <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <CardHeader>
        <h3 className="text-lg font-semibold text-blue-600">📋 Índice</h3>
      </CardHeader>
      <CardBody className="p-0">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                // Cargar la sección si no está cargada
                if (onLoadSection) {
                  onLoadSection(section.id);
                }
                
                // Scroll a la sección
                setTimeout(() => {
                  const element = document.getElementById(`section-${section.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100); // Pequeño delay para que se cargue la sección
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

        {/* Quick Actions */}
        <div className="p-4 border-t">
          <h4 className="text-xs font-semibold text-gray-600 mb-3">🚀 Acciones Rápidas</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                const element = document.getElementById('section-solicitudes');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
            >
              ➕ Crear Solicitud
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('section-asociados');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full text-left text-xs text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
            >
              🏢 Nuevo Asociado
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('section-proyectos');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full text-left text-xs text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-50"
            >
              📊 Ver Proyectos
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
