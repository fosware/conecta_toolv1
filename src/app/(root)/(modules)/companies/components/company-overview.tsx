import { Card, CardContent } from "@/components/ui/card";
import { Certificacion } from "@/lib/schemas/cat_certifications";
import {
  Building2,
  Users,
  Phone,
  Mail,
  Globe,
  Award,
  Cog,
  Factory,
  Calendar,
  Trophy,
  FileBadge,
} from "lucide-react";
import Image from "next/image";

interface Certificaciones {
  certificacion: string;
  fecha_vencimiento: string;
}

interface Especialidad {
  especialidad: string;
  alcance: string;
  subalcance: string;
  materiales: string;
  capacidades_maquinas: string;
}

interface CompanyData {
  id: number;
  nombre_comercial: string;
  razon_social: string;
  logros: string | null;
  semblanza: string | null;
  contato_ventas: string | null;
  maquinas_principales: number | null;
  total_empleados: number | null;
  telefono: string | null;
  correo: string | null;
  liga_semblanza: string | null;
  sitio_web: string | null;
  certificaciones: Certificaciones[];
  especialidades: Especialidad[];
  logo_empresa: string | null;
}

interface CompanyOverviewProps {
  data: CompanyData;
}

export function CompanyOverview({ data }: CompanyOverviewProps) {
  // Función para convertir base64 a data URL
  const getImageUrl = (base64String: string | null) => {
    if (!base64String) return null;
    if (
      base64String.startsWith("http://") ||
      base64String.startsWith("https://") ||
      base64String.startsWith("data:")
    ) {
      return base64String;
    }
    return `data:image/png;base64,${base64String}`;
  };

  return (
    <div className="p-6 bg-card rounded-lg shadow-lg mt-4">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Columna 1: Información General y Logo */}
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            {data.logo_empresa ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                <Image
                  src={getImageUrl(data.logo_empresa) || ""}
                  alt={data.nombre_comercial}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{data.nombre_comercial}</h2>
              <p className="text-sm text-muted-foreground">
                {data.razon_social}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>{data.total_empleados} empleados</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Factory className="w-4 h-4 text-primary" />
              <span>{data.maquinas_principales} máquinas principales</span>
            </div>
          </div>
        </div>

        {/* Columna 2: Contacto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Información de Contacto</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="w-4 h-4 text-primary" />
              <a href={`mailto:${data.correo}`} className="hover:underline">
                {data.correo}
              </a>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="w-4 h-4 text-primary" />
              <span>{data.telefono}</span>
            </div>
            {data.sitio_web && (
              <div className="flex items-center space-x-2 text-sm">
                <Globe className="w-4 h-4 text-primary" />
                <a
                  href={data.sitio_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Sitio Web
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Columna 3: Certificaciones */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Certificaciones ({data.certificaciones.length})</span>
          </h3>
          <div className="space-y-3">
            {data.certificaciones.length > 0 ? (
              data.certificaciones.map(
                (cert: Certificaciones, index: number) => (
                  <div
                    key={`${cert.certificacion}-${index}`}
                    className="flex items-start space-x-2 text-sm"
                  >
                    <Award className="w-4 h-4 text-primary mt-1" />
                    <div>
                      <p className="font-medium">{cert.certificacion}</p>
                      <div className="flex items-center text-muted-foreground text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Vence: {cert.fecha_vencimiento}</span>
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay certificaciones registradas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Especialidades */}
      {data.especialidades.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-medium flex items-center space-x-2 mb-4">
            <Cog className="w-5 h-5" />
            <span>Especialidades</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.especialidades.map((esp, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">{esp.especialidad}</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Alcance:</span>{" "}
                    {esp.alcance}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Subalcance:</span>{" "}
                    {esp.subalcance}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Materiales:</span>{" "}
                    {esp.materiales}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Capacidad:</span>{" "}
                    {esp.capacidades_maquinas}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium flex items-center space-x-2 mb-4">
              <Trophy className="w-5 h-5" />
              <span>Logros</span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

            <div className="space-y-1 text-sm">
              <p>{data.logros}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium flex items-center space-x-2 mb-4">
              <FileBadge className="w-5 h-5" />
              <span>Semplanza</span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

            <div className="space-y-1 text-sm">
              <p>{data.semblanza}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
