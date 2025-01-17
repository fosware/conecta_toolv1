import { User } from "@prisma/client";

export interface Certificacion {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  idUser: User;
}
