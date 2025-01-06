// Interfaz para representar a un usuario completo con su perfil y rol
export interface Usuario {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  isDeleted: boolean;
  dateDeleted: string | null;
  createdAt: string;
  updatedAt: string;
  role: Rol;
  profile: Perfil | null; // Puede ser null si no tiene perfil asociado
}

// Interfaz para el perfil de usuario
export interface Perfil {
  id: number;
  name: string;
  first_lastname: string;
  second_lastname: string | null;
  phone: string | null;
  image_profile: string | null;
  userId: number;
}

// Interfaz para el rol del usuario
export interface Rol {
  id: number;
  name: string;
  prefix: string;
  createdAt: string;
  updatedAt: string;
}
