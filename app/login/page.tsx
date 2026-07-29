import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="dot" />
          Gestor de Bolso
        </div>
        <h1>Entrar na sua conta</h1>
        <p className="sub">
          Use o e-mail e a senha que você criou depois da compra.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
