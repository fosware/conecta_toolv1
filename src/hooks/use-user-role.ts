import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/auth";

interface UserRoleInfo {
  role: string | null;
  loading: boolean;
  isStaff: boolean;
  isAsociado: boolean;
  hasCompany: boolean;
  refresh: () => Promise<void>;
}

export function useUserRole(): UserRoleInfo {
  const [role, setRole] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setRole(null);
        setHasCompany(false);
        return;
      }

      const response = await fetch("/profile/api/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        const userRole = data.user?.role;

        // Verificar si el usuario tiene una empresa asociada
        const companyUser = data.user?.CompanyUser;
        const hasAssociatedCompany =
          Array.isArray(companyUser) && companyUser.length > 0;

        setRole(userRole || null);
        setHasCompany(hasAssociatedCompany);
      } else {
        console.error("Error response:", await response.text());
        setRole(null);
        setHasCompany(false);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole(null);
      setHasCompany(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const normalizedRole = role?.toLowerCase() || null;

  return {
    role: normalizedRole,
    loading,
    isStaff: normalizedRole === "staff",
    isAsociado: normalizedRole === "asociado",
    hasCompany,
    refresh: fetchUserRole,
  };
}
