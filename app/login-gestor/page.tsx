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
          Digite seu e-mail e enviaremos um código de acesso. Sem senha.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
