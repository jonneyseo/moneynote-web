import { redirect_to_login, get_auth_code } from './auth.js';

const api_base_url = 'https://c1e30rr1se.execute-api.ca-central-1.amazonaws.com';

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

async function request_upload_url(selected_file) {
  const response = await fetch(`${api_base_url}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_name: selected_file.name,
      content_type: selected_file.type
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.status}`);
  }

  const response_json = await response.json();

  if (response_json.body) {
    return JSON.parse(response_json.body);
  }

  return response_json;
}

async function upload_file_to_s3(upload_url, selected_file) {
  const response = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': selected_file.type
    },
    body: selected_file
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to S3: ${response.status}`);
  }
}

if (upload_button) {
  upload_button.addEventListener('click', async () => {
    const selected_file = receipt_file_input.files?.[0];

    if (!selected_file) {
      upload_status_text.textContent = '먼저 영수증 파일을 선택해줘.';
      return;
    }

    try {
      upload_status_text.textContent = '업로드 URL 요청 중...';
      ocr_result_box.textContent = '처리 시작';

      const upload_data = await request_upload_url(selected_file);

      upload_status_text.textContent = 'S3 업로드 중...';

      await upload_file_to_s3(upload_data.upload_url, selected_file);

      upload_status_text.textContent = 'S3 업로드 완료';

      ocr_result_box.textContent = JSON.stringify({
        message: '파일이 S3에 업로드되었습니다.',
        document_id: upload_data.document_id,
        s3_key: upload_data.s3_key,
        file_name: selected_file.name,
        content_type: selected_file.type
      }, null, 2);
    } catch (error) {
      upload_status_text.textContent = `에러: ${error.message}`;
      ocr_result_box.textContent = JSON.stringify({
        error: error.message
      }, null, 2);
    }
  });
}