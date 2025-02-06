export interface Profile {
  id: number;
  name: string;
  first_lastname: string;
  second_lastname: string | null;
  phone: string | null;
  image_profile: string | null;
  userId: number;
}

export interface StaffUser {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  profile: Profile | null;
}

export interface StaffMember {
  id: number;
  user: StaffUser;
  userId: number;
  companyId: number;
  role: string;
  isAdmin: boolean;
  position: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
