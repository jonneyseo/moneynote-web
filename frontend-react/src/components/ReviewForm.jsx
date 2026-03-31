import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFromOcr, setField, setItemField, addItem, removeItem, resetReceipt } from '../store/receiptSlice';
import { resetUpload } from '../store/uploadSlice';

const CATEGORIES = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'dining', label: 'Dining' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'medical', label: 'Medical' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'amex', label: 'Amex' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'visa', label: 'Visa' },
  { value: 'debit', label: 'Debit' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

export default function ReviewForm() {
  const dispatch = useDispatch();
  const { status, result } = useSelector((state) => state.upload);
  const { merchant, date, total, items, category, payment_method, isParsed } = useSelector((state) => state.receipt);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    if (status === 'done' && result?.ocrResult && !isParsed) {
      dispatch(loadFromOcr(result.ocrResult));
    }
  }, [status, result, isParsed, dispatch]);

  if (status !== 'done' || !isParsed) return null;

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/receipt/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo_user',
          document_id: result.document_id,
          merchant,
          date,
          total,
          items,
          category,
          payment_method,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setSaveStatus('saved');
      setTimeout(() => {
        dispatch(resetReceipt());
        dispatch(resetUpload());
        setSaveStatus('idle');
      }, 2000);
    } catch (e) {
      setSaveStatus('error');
    }
  }

  return (
    <div className="review-form">
      <h2>영수증 확인</h2>

      <div className="review-field">
        <label>가맹점</label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => dispatch(setField({ field: 'merchant', value: e.target.value }))}
          placeholder="가맹점명"
        />
      </div>

      <div className="review-field">
        <label>날짜</label>
        <input
          type="text"
          value={date}
          onChange={(e) => dispatch(setField({ field: 'date', value: e.target.value }))}
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div className="review-field">
        <label>합계</label>
        <input
          type="number"
          value={total}
          onChange={(e) => dispatch(setField({ field: 'total', value: e.target.value }))}
          placeholder="0.00"
          step="0.01"
        />
      </div>

      <div className="review-row">
        <div className="review-field">
          <label>카테고리</label>
          <select
            value={category}
            onChange={(e) => dispatch(setField({ field: 'category', value: e.target.value }))}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="review-field">
          <label>결제수단</label>
          <select
            value={payment_method}
            onChange={(e) => dispatch(setField({ field: 'payment_method', value: e.target.value }))}
          >
            <option value="">선택</option>
            {PAYMENT_METHODS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="review-items">
        <div className="review-items-header">
          <label>항목</label>
          <button className="btn-add" onClick={() => dispatch(addItem())}>+ 추가</button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="review-item-row">
            <input
              type="text"
              value={item.name}
              onChange={(e) => dispatch(setItemField({ index: idx, field: 'name', value: e.target.value }))}
              placeholder="품목명"
              className="item-name"
            />
            <input
              type="number"
              value={item.price}
              onChange={(e) => dispatch(setItemField({ index: idx, field: 'price', value: e.target.value }))}
              placeholder="0.00"
              step="0.01"
              className="item-price"
            />
            <button className="btn-remove" onClick={() => dispatch(removeItem(idx))}>✕</button>
          </div>
        ))}
      </div>

      <button
        className="btn-primary btn-save"
        onClick={handleSave}
        disabled={saveStatus === 'saving' || saveStatus === 'saved'}
      >
        {saveStatus === 'saving' && '저장 중...'}
        {saveStatus === 'saved' && '저장 완료 ✓'}
        {saveStatus === 'error' && '다시 시도'}
        {saveStatus === 'idle' && '저장'}
      </button>
      {saveStatus === 'error' && <p className="status-error">저장 실패. 다시 시도해주세요.</p>}
    </div>
  );
}
