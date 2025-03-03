export function getToken(): string | null {
  // Verificar si estamos en el cliente
  if (typeof window === 'undefined') {
    console.log("getToken llamado en el servidor, devolviendo null");
    return null;
  }
  
  try {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    
    if (!tokenCookie) {
      console.log("No se encontró cookie de token");
      return null;
    }
    
    const token = tokenCookie.split('=')[1];
    console.log("Token encontrado:", token.substring(0, 15) + "...");
    return token;
  } catch (error) {
    console.error("Error al obtener el token:", error);
    return null;
  }
}

export function setToken(token: string) {
  document.cookie = `token=${token}; path=/; secure; samesite=strict`;
}

export function removeToken() {
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
