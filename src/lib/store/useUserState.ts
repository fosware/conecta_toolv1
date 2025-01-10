import { create } from "zustand";

interface UserState {
  profileImage: string | null;
  role: string | null; // Nuevo campo para el rol del usuario
  setProfileImage: (image: string | null) => void;
  setRole: (role: string | null) => void; // Nuevo método para actualizar el rol
}

export const useUserStore = create<UserState>((set) => ({
  profileImage: null,
  role: null, // Inicialmente sin rol
  setProfileImage: (image) => set({ profileImage: image }),
  setRole: (role) => set({ role }), // Método para establecer el rol
}));
