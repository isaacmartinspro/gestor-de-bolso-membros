import "./globals.css";

export const metadata = {
  title: "Gestor de Bolso — Área de Membros",
  description: "Acesso exclusivo ao catálogo de frameworks do Gestor de Bolso.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
