export interface ClientCompanyNDAItem {
  id: number;
  clientId: number;
  clientName: string;
  companyId: number;
  companyName: string;
  comercialName?: string;
  ndaSignedFileName: string;
  ndaExpirationDate: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
