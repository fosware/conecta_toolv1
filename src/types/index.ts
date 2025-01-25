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
