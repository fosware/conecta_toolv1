"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/login/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      document.cookie = `token=${data.token}; path=/`;
      {
        /* toast.success("Bienvenido"); */
      }
      router.push("/dashboard");
    } else {
      toast.error("Credenciales incorrectas");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="px-6 max-w-screen-sm bg-card dark:bg-card-dark border border-border dark:border-border-dark shadow-md">
        <CardHeader className="flex justify-center">
          <Image
            src="/conecta_logo_transparente.png"
            alt="Logo"
            width={220}
            height={200}
            priority
            className="dark:bg-slate-300 m-4 p-2 rounded dark:inverted"
          />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <Label
                htmlFor="username"
                className="block mb-1 text-sm font-medium"
              >
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="pr-10 block w-full"
              />
              <span className="absolute inset-y-10 right-0 flex items-center pr-3">
                <Image
                  src="/icons/user.svg"
                  alt="Usuario"
                  width={20}
                  height={20}
                  className="text-muted"
                />
              </span>
            </div>

            <div className="relative">
              <Label
                htmlFor="password"
                className="block mb-1 text-sm font-medium"
              >
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 block w-full"
              />
              <span className="absolute inset-y-10 right-0 flex items-center pr-3">
                <Image
                  src="/icons/keys.svg"
                  alt="Contraseña"
                  width={20}
                  height={20}
                  className="text-muted"
                />
              </span>
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
