export interface ClientCompanyNDAItem {
  id: number;
  clientId: number;
  clientName: string;
  companyId: number;
  companyName: string;
  ndaSignedFileName: string;
  ndaExpirationDate: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
