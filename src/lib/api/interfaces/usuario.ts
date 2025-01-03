export interface Profile {
  name: string;
  first_lastname: string;
  second_lastname?: string;
}

export interface Role {
  name: string;
}

export interface Usuario {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  profile: Profile;
  role: Role;
}
