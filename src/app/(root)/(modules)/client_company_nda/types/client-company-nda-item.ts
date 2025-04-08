export interface ClientCompanyNDAItem {
  id: number;
  clientId: number;
  clientName: string;
  companyId: number;
  companyName: string;
  ndaFileName: string | null;
  ndaDateUploaded: string;
  ndaSignedFileName: string | null;
  ndaSignedAt: string | null;
  ndaExpirationDate: string | null;
  isActive: boolean;
}
