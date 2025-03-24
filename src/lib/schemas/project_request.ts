import { z } from "zod";

export const projectRequestSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "El título es requerido"),
  requestDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
  observation: z.string().nullable(),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
  clientAreaId: z.number({
    required_error: "El área del cliente es requerida",
  }),
});

export const projectRequestCreateSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  observation: z.string().optional(),
  clientAreaId: z.number({
    required_error: "El área del cliente es requerida",
  }),
  requestDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).optional().default(new Date()),
});

export const projectRequestUpdateSchema = projectRequestCreateSchema.partial();

export type ProjectRequest = z.infer<typeof projectRequestSchema>;
export type ProjectRequestCreate = z.infer<typeof projectRequestCreateSchema>;
export type ProjectRequestUpdate = z.infer<typeof projectRequestUpdateSchema>;

// Tipos para la interfaz de usuario
export interface ProjectRequestWithRelations extends Omit<ProjectRequest, "requestDate" | "createdAt" | "updatedAt" | "dateDeleted"> {
  requestDate: string;
  createdAt: string;
  updatedAt: string;
  dateDeleted: string | null;
  statusId: number;
  status?: {
    id: number;
    name: string;
  };
  clientArea: {
    id: number;
    areaName: string;
    clientId: number;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    client: {
      id: number;
      name: string;
    };
  };
  user: {
    id: number;
    username: string;
    email: string;
  };
  ProjectRequirements?: Array<{
    id: number;
    projectRequestId: number;
    requirementName: string;
    statusId: number;
    status: {
      id: number;
      name: string;
    };
    isActive: boolean;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt: string;
    RequirementSpecialty?: Array<{
      id: number;
      projectRequirementsId: number;
      specialtyId: number;
      scopeId?: number | null;
      subscopeId?: number | null;
      isDeleted?: boolean;
      specialty?: {
        id: number;
        name: string;
      } | null;
      scope?: {
        id: number;
        name: string;
      } | null;
      subscope?: {
        id: number;
        name: string;
      } | null;
    }>;
    RequirementCertification?: Array<{
      id: number;
      projectRequirementsId: number;
      certificationId: number;
      isDeleted?: boolean;
      certification?: {
        id: number;
        name: string;
      } | null;
    }>;
    ProjectRequestCompany?: Array<{
      id: number;
      projectRequirementsId: number;
      companyId: number;
      statusId: number;
      isDeleted?: boolean;
      Company?: {
        id: number;
        comercialName: string;
        contactName?: string;
        email?: string;
        phone?: string;
      } | null;
      status?: {
        id: number;
        name: string;
      } | null;
    }>;
  }>;
  ProjectRequestCompany?: Array<{
    id: number;
    projectRequestId: number;
    companyId: number;
    statusId: number;
    ndaFile?: string | null;
    ndaFileName?: string | null;
    ndaSignedFile?: string | null;
    ndaSignedFileName?: string | null;
    ndaSignedAt?: string | null;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    Company?: {
      id: number;
      comercialName: string;
      contactName?: string;
      email?: string;
      phone?: string;
    } | null;
    status?: {
      id: number;
      name: string;
    } | null;
  }>;
}
