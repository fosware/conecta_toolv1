export interface SubMenuItem {
  name: string;
  path: string;
}

export interface MenuItem {
  name: string; // Debe coincidir con los privilegios en la BD
  path: string;
  icon: string;
  subItems?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
  { name: "Proyectos", path: "/proyectos", icon: "/icons/folder.svg" },
  { name: "Asociados", path: "/asociados", icon: "/icons/global-partner.svg" },
  { name: "Clientes", path: "/clientes", icon: "/icons/user-circle.svg" },
  { name: "Especialidades", path: "/especialidades", icon: "/icons/cog.svg" },
  {
    name: "Certificaciones",
    path: "/certificaciones",
    icon: "/icons/clipboard-document-check.svg",
  },
  {
    name: "Usuarios", // Nombre que coincida con el privilegio
    path: "/usuarios",
    icon: "/icons/new_user.svg",
  },
];
