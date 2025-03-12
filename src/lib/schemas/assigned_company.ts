import { z } from "zod";

export const assignedCompanySchema = z.object({
  id: z.number(),
  companyId: z.number(),
  projectRequirementsId: z.number(),
  statusId: z.number().default(1),
  ndaFile: z.string().nullable().optional(),
  ndaFileName: z.string().nullable().optional(),
  ndaSignedFile: z.string().nullable().optional(),
  ndaSignedFileName: z.string().nullable().optional(),
  ndaSignedAt: z.date().nullable().optional(),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false),
  dateDeleted: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
  projectRequestId: z.number().nullable().optional(),
});

// Definición del tipo Status
export interface Status {
  id: number;
  name: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

// Definición del tipo Company
export interface Company {
  id: number;
  name?: string;
  comercialName?: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// Definición del tipo ClientArea
export interface ClientArea {
  id?: number;
  name?: string;
  areaName?: string;
  isDeleted?: boolean;
  client?: {
    id?: number;
    name?: string;
    isDeleted?: boolean;
  };
}

// Definición del tipo ProjectRequest
export interface ProjectRequest {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  clientAreaId?: number;
  clientArea?: ClientArea;
  Client?: {
    id: number;
    name: string;
  };
  ClientArea?: {
    id: number;
    areaName: string;
  };
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  requestDate?: string;
  [key: string]: any;
}

// Definición del tipo Requirement
export interface Requirement {
  id: number;
  name?: string;
  requirementName?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// Tipos para la interfaz de usuario
export interface AssignedCompany {
  id: number;
  companyId: number;
  statusId?: number;
  ndaFile?: string | null;
  ndaFileName?: string | null;
  ndaSignedFile?: string | null;
  ndaSignedFileName?: string | null;
  ndaSignedAt?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  projectRequestId?: number;
  
  // Relaciones
  Company?: Company;
  status?: Status;
  ProjectRequest?: ProjectRequest;
  requirements?: Requirement[];
  Documents?: {
    id: number;
    projectRequestCompanyId: number;
    documentFile?: string | null;
    documentFileName?: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export type AssignedCompanyWithRelations = AssignedCompany;
