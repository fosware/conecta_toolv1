export interface ProjectRequestCompanyStatusLog {
  id: number;
  projectRequestCompanyId: number;
  dateTimeMessage: Date;
  message: string;
  isActive: boolean;
  isDeleted: boolean;
  dateDeleted?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  userName?: string;
  userRole?: string;
  isSystemMessage: boolean;
  companyName?: string;
}

export interface LogFormData {
  message: string;
  projectRequestCompanyId: number;
}

export interface CreateLogInput {
  projectRequestCompanyId: number;
  message: string;
  userId: number;
  isSystemMessage?: boolean;
}

export enum LogMessageType {
  SYSTEM = "system",
  ADMIN = "admin",
  ASSOCIATE = "associate"
}
