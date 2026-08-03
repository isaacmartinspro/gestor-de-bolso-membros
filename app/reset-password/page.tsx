import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="dot" />
          Gestor de Bolso
        </div>
        <h1>Redefinir senha</h1>
        <p className="sub">Crie uma nova senha para acessar o Gestor de Bolso.</p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
