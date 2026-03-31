import React, { useEffect, useState } from 'react';

const CATEGORY_LABELS = {
  grocery: 'Grocery',
  dining: 'Dining',
  entertainment: 'Entertainment',
  medical: 'Medical',
  transport: 'Transport',
  shopping: 'Shopping',
  utilities: 'Utilities',
  other: 'Other',
};

const PAYMENT_LABELS = {
  amex: 'Amex',
  mastercard: 'Mastercard',
  visa: 'Visa',
  debit: 'Debit',
  cash: 'Cash',
  other: 'Other',
};

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => {
    fetch('/receipt/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'demo_user' }),
    })
      .then((r) => r.json())
      .then((data) => {
        const raw = data.body ? JSON.parse(data.body) : data;
        setTransactions(raw.transactions || []);
      })
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false));
  }, []);

  function toggleExpand(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  if (loading) return <div className="history-empty">Loading...</div>;
  if (error) return <div className="history-empty status-error">{error}</div>;
  if (transactions.length === 0) return <div className="history-empty">No transactions yet.</div>;

  const totalSpend = transactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);

  return (
    <div className="history-page">
      <div className="history-summary">
        <span className="history-summary-label">Total spend</span>
        <span className="history-summary-amount">${totalSpend.toFixed(2)}</span>
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Merchant</th>
              <th>Payment</th>
              <th className="col-amount">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const key = t.transaction_key;
              const isOpen = expanded.has(key);
              const hasItems = t.items && t.items.length > 0;

              return (
                <React.Fragment key={key}>
                  <tr className={`transaction-row${isOpen ? ' is-open' : ''}`}>
                    <td className="col-date">{t.date || '—'}</td>
                    <td>
                      <span className={`category-badge cat-${t.category || 'other'}`}>
                        {CATEGORY_LABELS[t.category] || 'Other'}
                      </span>
                    </td>
                    <td className="col-merchant">{t.merchant || '—'}</td>
                    <td className="col-payment">
                      {PAYMENT_LABELS[t.payment_method] || t.payment_method || '—'}
                    </td>
                    <td className="col-amount">${parseFloat(t.total || 0).toFixed(2)}</td>
                    <td className="col-toggle">
                      {hasItems && (
                        <button
                          className={`btn-toggle${isOpen ? ' open' : ''}`}
                          onClick={() => toggleExpand(key)}
                        >
                          ▾
                        </button>
                      )}
                    </td>
                  </tr>

                  {isOpen && hasItems && (
                    <tr className="items-row">
                      <td colSpan={6}>
                        <table className="items-table">
                          <tbody>
                            {t.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="item-name">{item.name}</td>
                                <td className="item-price">${parseFloat(item.price || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
