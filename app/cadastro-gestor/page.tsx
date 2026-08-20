import CadastroForm from "./CadastroForm";

export default function CadastroPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="dot" />
          Gestor de Bolso
        </div>
        <h1>Criar seu acesso</h1>
        <p className="sub">
          Preencha os dados abaixo para liberar seu acesso ao Gestor de Bolso.
        </p>
        <CadastroForm />
      </div>
    </div>
  );
}
