'use client';

import { Card, CardBody, CardHeader, Chip, Alert } from '@nextui-org/react';
import { ManualSection, ContentItem } from '../data/manual-content';
import { imagesMapping } from '../data/images-mapping';

interface ManualSectionProps {
  section?: ManualSection;
}

export default function ManualSectionComponent({ section }: ManualSectionProps) {
  if (!section) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Selecciona una sección</h2>
          <p className="text-gray-500">Usa el menú lateral o el buscador para navegar por el manual</p>
        </CardBody>
      </Card>
    );
  }

  const renderContentItem = (item: ContentItem, index: number) => {
    switch (item.type) {
      case 'text':
        return (
          <div key={index} className="mb-6">
            {item.title && <h3 className="text-xl font-semibold mb-3 text-gray-800">{item.title}</h3>}
            <p className="text-gray-600 leading-relaxed">{item.text}</p>
          </div>
        );

      case 'steps':
        return (
          <div key={index} className="mb-6">
            {item.title && <h3 className="text-xl font-semibold mb-4 text-gray-800">{item.title}</h3>}
            <ol className="space-y-3">
              {item.steps?.map((step, stepIndex) => (
                <li key={stepIndex} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {stepIndex + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );

      case 'alert':
        return (
          <Alert 
            key={index}
            color={item.alertType === 'info' ? 'primary' : item.alertType === 'success' ? 'success' : item.alertType === 'warning' ? 'warning' : 'danger'}
            className="mb-6"
          >
            {item.text}
          </Alert>
        );

      case 'grid':
        return (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {item.gridItems?.map((gridItem, gridIndex) => (
              <Card key={gridIndex} className="border-l-4 border-blue-500">
                <CardBody className="p-4">
                  <h4 className="font-semibold text-blue-600 mb-2">{gridItem.title}</h4>
                  <p className="text-gray-600 text-sm">{gridItem.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        );

      case 'image':
        const imageData = item.imageId ? imagesMapping[item.imageId] : null;
        return (
          <div key={index} className="mb-6">
            <Card className="bg-gray-50">
              <CardBody className="text-center p-6">
                {imageData ? (
                  <div>
                    <img 
                      src={imageData} 
                      alt={item.imageCaption || 'Imagen del manual'}
                      className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                    />
                    {item.imageCaption && (
                      <p className="text-sm text-gray-500 mt-3 italic">{item.imageCaption}</p>
                    )}
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-gray-500">{item.imageCaption || 'Imagen no disponible'}</p>
                    <p className="text-xs text-gray-400 mt-1">ID: {item.imageId}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{section.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{section.title}</h1>
              {section.description && (
                <p className="text-gray-600 mt-2">{section.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenido de la sección */}
      <Card>
        <CardBody className="p-8">
          {section.content?.map((item, index) => renderContentItem(item, index))}
        </CardBody>
      </Card>

      {/* FAQ de la sección */}
      {section.faq && section.faq.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">❓ Preguntas Frecuentes</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {section.faq.map((faqItem, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                  <h4 className="font-semibold text-blue-700 mb-2">{faqItem.question}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{faqItem.answer}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Navegación entre secciones */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              💡 <strong>Tip:</strong> Usa el buscador para encontrar información específica rápidamente
            </div>
            <Chip size="sm" variant="flat" color="primary">
              Sección: {section.title}
            </Chip>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
