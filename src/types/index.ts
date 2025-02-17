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

export interface CompanySpecialty {
  id: number;
  companyId: number;
  specialtyId: number;
  specialty?: Especialidad;
  scopeId?: number;
  scope?: Alcance;
  subscopeId?: number;
  subscope?: Subalcance;
  materials?: string;
  machineCapacity?: string;
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
