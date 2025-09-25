'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <CardTitle className="text-lg text-primary">📋 Índice</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                // Cargar la sección si no está cargada
                if (onLoadSection) {
                  onLoadSection(section.id);
                }
                
                // Scroll a la sección usando el main container
                setTimeout(() => {
                  const element = document.getElementById(`section-${section.id}`);
                  const mainElement = document.querySelector('main');
                  if (element && mainElement) {
                    const elementTop = element.offsetTop;
                    mainElement.scrollTo({ top: elementTop - 100, behavior: 'smooth' });
                  }
                }, 100);
              }}
              className={`w-full text-left px-4 py-3 rounded-none transition-all duration-200 flex items-center space-x-3 ${
                activeSection === section.id
                  ? 'bg-primary/10 text-primary border-r-4 border-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="text-lg">{section.icon}</span>
              <span className="text-sm">{section.title}</span>
            </button>
          ))}
        </nav>

        {/* Quick Actions para Asociados */}
        <div className="p-4 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">🚀 Acciones Rápidas</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                const element = document.getElementById('section-proyectos');
                const mainElement = document.querySelector('main');
                if (element && mainElement) {
                  const elementTop = element.offsetTop;
                  mainElement.scrollTo({ top: elementTop - 100, behavior: 'smooth' });
                }
              }}
              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              🚀 Mis Proyectos
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('section-solicitudes');
                const mainElement = document.querySelector('main');
                if (element && mainElement) {
                  const elementTop = element.offsetTop;
                  mainElement.scrollTo({ top: elementTop - 100, behavior: 'smooth' });
                }
              }}
              className="w-full text-left text-xs text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 dark:hover:bg-green-950"
            >
              📋 Oportunidades
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('section-perfil');
                const mainElement = document.querySelector('main');
                if (element && mainElement) {
                  const elementTop = element.offsetTop;
                  mainElement.scrollTo({ top: elementTop - 100, behavior: 'smooth' });
                }
              }}
              className="w-full text-left text-xs text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              👤 Mi Perfil
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
