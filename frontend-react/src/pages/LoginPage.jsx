import { buildLoginUrl } from '../store/authSlice';

export default function LoginPage() {
  return (
    <div className="login-page">
      <h1>Oh My Money</h1>
      <p>영수증 스캔 가계부</p>
      <button
        className="btn-primary"
        onClick={() => { window.location.href = buildLoginUrl(); }}
      >
        로그인
      </button>
    </div>
  );
}
