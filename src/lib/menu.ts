export interface SubMenuItem {
  name: string;
  path: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  subItems?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
  { name: "Proyectos", path: "/proyectos", icon: "/icons/folder.svg" },
  { name: "Asociados", path: "/companies", icon: "/icons/global-partner.svg" },
  {
    name: "Cat Especialidades",
    path: "/cat_especialidades",
    icon: "/icons/cog.svg",
  },
  {
    name: "Cat Certificaciones",
    path: "/cat_certificaciones",
    icon: "/icons/folder.svg",
  },
  {
    name: "Usuarios",
    path: "/usuarios",
    icon: "/icons/new_user.svg",
  },
];
