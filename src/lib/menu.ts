import {
  FolderIcon,
  UsersIcon,
  UserCircleIcon,
  CogIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

export const menuItems = [
  { name: "Proyectos", path: "/proyectos", icon: FolderIcon },
  { name: "Asociados", path: "/asociados", icon: UsersIcon },
  { name: "Clientes", path: "/clientes", icon: UserCircleIcon },
  { name: "Especialidades", path: "/especialidades", icon: CogIcon },
  {
    name: "Certificaciones",
    path: "/certificaciones",
    icon: ClipboardDocumentCheckIcon,
  },
];
