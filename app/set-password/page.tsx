import SetPasswordForm from "./SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="dot" />
          Gestor de Bolso
        </div>
        <h1>Bem-vindo(a)!</h1>
        <p className="sub">
          Sua compra foi confirmada. Crie sua senha para acessar o Gestor de Bolso.
        </p>
        <SetPasswordForm />
      </div>
    </div>
  );
}
