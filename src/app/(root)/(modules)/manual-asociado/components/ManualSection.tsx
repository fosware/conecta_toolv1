'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ManualSection as ManualSectionType, ContentItem } from '../data/manual-content';
import { getImageUrl } from '../data/images-mapping';
import Image from 'next/image';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ManualSectionProps {
  section: ManualSectionType;
}

export default function ManualSection({ section }: ManualSectionProps) {
  const renderContent = (item: ContentItem, index: number) => {
    switch (item.type) {
      case 'text':
        return (
          <div key={index} className="prose prose-sm max-w-none">
            {item.title && <h4 className="font-semibold mb-2">{item.title}</h4>}
            <p className="text-muted-foreground leading-relaxed">{item.text}</p>
          </div>
        );

      case 'steps':
        return (
          <div key={index} className="space-y-3">
            {item.title && <h4 className="font-semibold mb-3">{item.title}</h4>}
            <ol className="space-y-2">
              {item.steps?.map((step, stepIndex) => (
                <li key={stepIndex} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {stepIndex + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );

      case 'alert':
        const alertIcons = {
          info: Info,
          success: CheckCircle,
          warning: AlertTriangle,
          error: XCircle
        };
        const AlertIcon = alertIcons[item.alertType || 'info'];
        
        return (
          <div key={index} className={`border-l-4 p-4 rounded-r-lg ${
            item.alertType === 'success' ? 'border-l-green-500 bg-green-50 dark:bg-green-950' :
            item.alertType === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
            item.alertType === 'error' ? 'border-l-red-500 bg-red-50 dark:bg-red-950' :
            'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                {item.text}
              </p>
            </div>
          </div>
        );

      case 'grid':
        return (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.gridItems?.map((gridItem, gridIndex) => (
              <Card key={gridIndex} className="p-4">
                <div className="flex items-start space-x-3">
                  {gridItem.icon && <span className="text-2xl">{gridItem.icon}</span>}
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1">{gridItem.title}</h5>
                    <p className="text-xs text-muted-foreground">{gridItem.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'image':
        if (!item.imageId) return null;
        
        return (
          <div key={index} className="space-y-2">
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border">
              <Image
                src={getImageUrl(item.imageId)}
                alt={item.imageCaption || 'Imagen del manual'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            {item.imageCaption && (
              <p className="text-sm text-muted-foreground text-center italic">
                {item.imageCaption}
                {item.imageCaption.includes('<<cambiar>>') && (
                  <Badge variant="destructive" className="ml-2">CAMBIAR</Badge>
                )}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

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
      <CardContent className="space-y-6">
        {section.content?.map((item, index) => renderContent(item, index))}
        
        {/* FAQ Section */}
        {section.faq && section.faq.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold mb-4 flex items-center">
              <span className="mr-2">❓</span>
              Preguntas Frecuentes
            </h4>
            <div className="space-y-4">
              {section.faq.map((faq, faqIndex) => (
                <Card key={faqIndex} className="p-4">
                  <h5 className="font-medium text-sm mb-2">{faq.question}</h5>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  {faq.relatedSections && faq.relatedSections.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {faq.relatedSections.map((relatedSection, relIndex) => (
                        <Badge key={relIndex} variant="outline" className="text-xs">
                          {relatedSection}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
