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

export interface Associate {
  id: number;
  companyName: string;
  contactName: string;
  street: string;
  externalNumber: string;
  internalNumber?: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  stateId: number;
  phone: string;
  email: string;
  logo?: string;
  companyLogo?: string;
  machineCount: number;
  employeeCount: number;
  shifts: string;
  achievementDescription?: string;
  profile?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId?: number;
  dateCreated?: Date;
  dateUpdated?: Date | null;
}
