export interface SubMenuItem {
  name: string;
  path: string;
  icon: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  subItems?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
  { name: "Proyectos", path: "/proyectos", icon: "/icons/folder.svg" },
  { name: "Asociados", path: "/asociados", icon: "/icons/users.svg" },
  { name: "Clientes", path: "/clientes", icon: "/icons/user-circle.svg" },
  { name: "Especialidades", path: "/especialidades", icon: "/icons/cog.svg" },
  {
    name: "Certificaciones",
    path: "/certificaciones",
    icon: "/icons/clipboard-document-check.svg",
  },
  {
    name: "Administración",
    path: "/administracion",
    icon: "/icons/admin.svg",
    subItems: [
      { name: "Usuarios Staff", path: "/staff", icon: "/icons/users.svg" },
    ],
  },
];
