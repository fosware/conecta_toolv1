import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { showToast } from '@/components/ui/custom-toast';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (!isMounted) return;

        if (!res.ok) {
          setIsAuthenticated(false);
          // Guardar la ruta actual para redireccionar después del login
          if (pathname !== '/login') {
            router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
            showToast({
              message: "Sesión expirada. Por favor, inicie sesión nuevamente.",
              type: "error"
            });
          }
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error verificando autenticación:', error);
        setIsAuthenticated(false);
        if (pathname !== '/login') {
          router.replace('/login');
          showToast({
            message: "Error de conexión. Por favor, inicie sesión nuevamente.",
            type: "error"
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);

  return { isAuthenticated, isLoading };
}
