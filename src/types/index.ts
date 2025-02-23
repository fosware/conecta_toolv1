export interface Especialidad {
  id: number;
  name: string;
  num: number;
  isActive: boolean;
  isDeleted: boolean;
  userId: number;
  dateCreated: Date;
  dateUpdated: Date | null;
}

export interface Alcance {
  id: number;
  name: string;
  num: number;
  specialtyId: number;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: number;
  dateCreated: Date;
  dateUpdated: Date | null;
}

export interface Subalcance {
  id: number;
  name: string;
  num: number;
  scopeId: number;
  isActive: boolean;
  isDeleted: boolean;
  userId: number;
  dateCreated: Date;
  dateUpdated: Date | null;
}

export interface Specialty {
  id: number;
  name: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scope {
  id: number;
  name: string;
  specialtyId: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscope {
  id: number;
  name: string;
  scopeId: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySpecialty {
  id: number;
  companyId: number;
  specialtyId: number;
  scopeId: number | null;
  subscopeId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: number;
  companyName: string;
  contactName: string;
  street: string;
  externalNumber: string;
  internalNumber: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  stateId: number;
  locationState?: LocationState;
  phone: string;
  email: string;
  companyLogo?: string | null;
  ndaFileName?: string | null;
  nda?: string | Uint8Array | null;
  machineCount: number;
  employeeCount: number;
  shifts: string;
  achievementDescription?: string | null;
  profile?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  userId: number;
  dateCreated: Date;
  dateUpdated: Date | null;
  CompanySpecialties?: CompanySpecialty[];
}

export interface CompanyCertification {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  certificationDate: Date;
  expirationDate?: Date;
  certificationFile?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: number;
  dateCreated: Date;
  dateUpdated: Date | null;
}

export interface LocationState {
  id: number;
  name: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: number;
  dateCreated: Date;
  dateUpdated: Date | null;
}

export interface Client {
  id: number;
  name: string;
  registered_address: string;
  rfc: string;
  isActive: boolean;
  isDeleted: boolean;
  dateDeleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  areas: ClientArea[];
}

export interface ClientArea {
  id: number;
  clientId: number;
  areaName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  terms_and_conditions: string | null;
  isActive: boolean;
  isDeleted: boolean;
  dateDeleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: Client;
}

export interface Project {
  id: number;
  name: string;
  projectTypeId: number;
  clientId: number;
  clientAreaId: number;
  requestDate: Date;
  drawRequest: Uint8Array | null;
  nameDrawRequest: string | null;
  specialRequest: boolean | null;
  descriptionSpecialRequest: string | null;
  generalDescription: string | null;
  isActive: boolean;
  isDeleted: boolean;
  dateDeleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  projectType: ProjectType;
  client: Client;
  clientArea?: ClientArea;
  projectQuote: ProjectQuote[];
}

export interface ProjectType {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  dateDeleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectQuote {
  id: number;
  projectId: number;
  companyId: number;
  deadline: Date;
  itemDescription: string;
  isActive: boolean;
  isDeleted: boolean;
  dateDeleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  project: Project;
  company: Company;
}
