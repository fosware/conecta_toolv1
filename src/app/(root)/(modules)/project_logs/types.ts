export interface ProjectLog {
  id: number;
  projectId: number;
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
  categoryName?: string;
}

export interface LogFormData {
  message: string;
  projectId: number;
}

export interface CreateLogInput {
  projectId: number;
  message: string;
  userId: number;
  isSystemMessage?: boolean;
}

export enum LogMessageType {
  SYSTEM = "system",
  ADMIN = "admin",
  ASSOCIATE = "associate"
}
