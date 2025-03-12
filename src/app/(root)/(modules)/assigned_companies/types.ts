// Definición de tipos para el módulo de empresas asignadas

export interface Status {
  id: number;
  name: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface Company {
  id: number;
  name: string;
  comercialName?: string;
  contactName?: string;
  email?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

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

export interface ProjectRequest {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  clientAreaId?: number;
  clientArea?: ClientArea;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  requestDate?: string;
  [key: string]: any;
}

export interface Requirement {
  id: number;
  name: string;
  description?: string;
  observations?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AssignedCompany {
  id: number;
  companyId: number;
  projectRequestId: number;
  statusId?: number;
  ndaFile?: string;
  ndaFileName?: string;
  ndaSignedFile?: string;
  ndaSignedFileName?: string;
  ndaSignedAt?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  Company?: Company;
  ProjectRequest?: ProjectRequest;
  status?: Status;
  requirements?: Requirement[];
  Documents?: any;
  [key: string]: any;
}
