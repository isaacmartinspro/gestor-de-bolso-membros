import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="dot" />
          Gestor de Bolso
        </div>
        <h1>Esqueci minha senha</h1>
        <p className="sub">
          Digite o e-mail da sua compra e enviaremos um link para você
          criar uma nova senha.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
