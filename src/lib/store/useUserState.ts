import { create } from "zustand";

interface UserState {
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profileImage: null,
  setProfileImage: (image) => set({ profileImage: image }),
}));
