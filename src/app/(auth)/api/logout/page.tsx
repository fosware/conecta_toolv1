"use client";

import { useRouter } from "next/navigation";

const LogoutPage = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const res = await fetch("/auth/api/logout", { method: "POST" });

    if (res.ok) {
      router.push("/auth/login"); // Redirige al login después del logout
    } else {
      alert("Error al cerrar sesión");
    }
  };

  return (
    <div>
      <h1>Cerrar Sesión</h1>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
};

export default LogoutPage;
