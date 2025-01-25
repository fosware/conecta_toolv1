export function getToken(): string | null {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  if (!tokenCookie) return null;
  const token = tokenCookie.split('=')[1];
  return token;
}

export function setToken(token: string) {
  document.cookie = `token=${token}; path=/; secure; samesite=strict`;
}

export function removeToken() {
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
