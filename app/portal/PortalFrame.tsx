"use client";

import { useEffect, useState } from "react";

export default function PortalFrame() {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/portal-content")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar o conteúdo");
        return res.text();
      })
      .then(setHtml)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="loading-shell">
        Não foi possível carregar o Gestor de Bolso agora. Atualize a página.
      </div>
    );
  }

  if (!html) {
    return <div className="loading-shell">Carregando o Gestor de Bolso...</div>;
  }

  return (
    <div className="portal-frame-wrap">
      <iframe title="Gestor de Bolso" srcDoc={html} />
    </div>
  );
}
