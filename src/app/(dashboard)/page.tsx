"use client";

import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (res.ok) {
      // Redirigir al login después de cerrar sesión
      router.push("/login");
    } else {
      alert("Error al cerrar sesión");
    }
  };

  return (
    <div>
      <h1>Bienvenido al Dashboard</h1>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
};

export default DashboardPage;
