// Lista de e-mails com acesso à área de administração.
// Configurada via variável de ambiente ADMIN_EMAILS (separados por vírgula).
// Ex: ADMIN_EMAILS=isaac@isaacmartins.com.br,outro@exemplo.com
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
