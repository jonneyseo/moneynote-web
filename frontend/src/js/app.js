import { redirect_to_login } from './auth.js';

const login_button = document.getElementById('login_button');
const status_text = document.getElementById('status_text');

if (login_button) {
  login_button.addEventListener('click', () => {
    redirect_to_login();
  });
}

const url_params = new URLSearchParams(window.location.search);
const code = url_params.get('code');

if (code && status_text) {
  status_text.textContent = '로그인 성공: authorization code를 받았습니다.';
}