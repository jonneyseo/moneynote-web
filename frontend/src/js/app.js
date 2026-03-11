import { redirect_to_login, get_auth_code } from './auth.js';

const login_button = document.getElementById('login_button');
const status_text = document.getElementById('status_text');
const receipt_file_input = document.getElementById('receipt_file_input');
const upload_button = document.getElementById('upload_button');
const file_name_text = document.getElementById('file_name_text');
const upload_status_text = document.getElementById('upload_status_text');
const ocr_result_box = document.getElementById('ocr_result_box');

const auth_code = get_auth_code();

if (auth_code) {
  status_text.textContent = '로그인 성공: Cognito authorization code를 받았습니다.';
  login_button.style.display = 'none';
} else {
  status_text.textContent = '아직 로그인되지 않았습니다.';
}

if (login_button) {
  login_button.addEventListener('click', () => {
    redirect_to_login();
  });
}

if (receipt_file_input) {
  receipt_file_input.addEventListener('change', (event) => {
    const selected_file = event.target.files?.[0];

    if (!selected_file) {
      file_name_text.textContent = '';
      return;
    }

    file_name_text.textContent = `선택한 파일: ${selected_file.name}`;
  });
}

if (upload_button) {
  upload_button.addEventListener('click', async () => {
    const selected_file = receipt_file_input.files?.[0];

    if (!selected_file) {
      upload_status_text.textContent = '먼저 영수증 파일을 선택해줘.';
      return;
    }

    upload_status_text.textContent = '업로드 및 OCR 테스트 중...';

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mock_ocr_result = {
      merchant_name: 'STARBUCKS',
      transaction_date: '2026-03-11',
      amount: 6500,
      currency: 'KRW',
      category: 'food',
      source_file_name: selected_file.name
    };

    ocr_result_box.textContent = JSON.stringify(mock_ocr_result, null, 2);
    upload_status_text.textContent = '임시 OCR 결과 표시 완료';
  });
}