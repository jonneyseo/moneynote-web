import { useSelector } from 'react-redux';

export default function OcrResult() {
  const { status, result } = useSelector((state) => state.upload);

  if (status !== 'done' || !result) return null;

  return (
    <div className="ocr-result">
      <h2>OCR 결과</h2>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
