"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/login/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      document.cookie = `token=${data.token}; path=/`;
      router.push("/dashboard");
    } else {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark">
      <Card className="w-full max-w-md bg-card dark:bg-card-dark border border-border dark:border-border-dark shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-foreground dark:text-foreground-dark">
            Iniciar Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full"
              />
            </div>
            <div>
              <Label htmlFor="password" className=" ">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full hover:bg-primary-dark text-background focus:ring-2 focus:ring-offset-2"
            >
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
