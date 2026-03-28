import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = '/api';
const UPLOAD_BUCKET_NAME = 'moneynote-uploads-dev';

export const uploadReceipt = createAsyncThunk(
  'upload/uploadReceipt',
  async (file, { rejectWithValue }) => {
    try {
      // 1. Presigned URL 요청
      const urlRes = await fetch(`${API_BASE_URL}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, content_type: file.type }),
      });
      if (!urlRes.ok) throw new Error(`Upload URL 요청 실패: ${urlRes.status}`);
      const urlData = await urlRes.json();
      const { upload_url, s3_key, document_id } = urlData.body ? JSON.parse(urlData.body) : urlData;

      // 2. S3 업로드
      const s3Res = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error(`S3 업로드 실패: ${s3Res.status}`);

      // 3. OCR 처리
      const ocrRes = await fetch(`${API_BASE_URL}/ocr/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket_name: UPLOAD_BUCKET_NAME, s3_key }),
      });
      if (!ocrRes.ok) throw new Error(`OCR 처리 실패: ${ocrRes.status}`);
      const ocrData = await ocrRes.json();
      const ocrResult = ocrData.body ? JSON.parse(ocrData.body) : ocrData;

      return { document_id, s3_key, ocrResult };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState: {
    status: 'idle', // idle | uploading | ocr_processing | done | error
    step: '',
    result: null,
    error: null,
  },
  reducers: {
    resetUpload(state) {
      state.status = 'idle';
      state.step = '';
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadReceipt.pending, (state) => {
        state.status = 'uploading';
        state.step = '업로드 중...';
        state.error = null;
        state.result = null;
      })
      .addCase(uploadReceipt.fulfilled, (state, action) => {
        state.status = 'done';
        state.step = 'OCR 완료';
        state.result = action.payload;
      })
      .addCase(uploadReceipt.rejected, (state, action) => {
        state.status = 'error';
        state.step = '';
        state.error = action.payload;
      });
  },
});

export const { resetUpload } = uploadSlice.actions;
export default uploadSlice.reducer;
