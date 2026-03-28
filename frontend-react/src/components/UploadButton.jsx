import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadReceipt, resetUpload } from '../store/uploadSlice';

export default function UploadButton() {
  const dispatch = useDispatch();
  const { status, step, error } = useSelector((state) => state.upload);
  const inputRef = useRef(null);

  const isLoading = status === 'uploading' || status === 'ocr_processing';

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch(uploadReceipt(file));
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = '';
  }

  return (
    <div className="upload-section">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        className="btn-primary btn-large"
        onClick={() => {
          dispatch(resetUpload());
          inputRef.current?.click();
        }}
        disabled={isLoading}
      >
        {isLoading ? step : '영수증 촬영 / 업로드'}
      </button>
      {error && <p className="status-error">{error}</p>}
    </div>
  );
}
