const DATE_PATTERNS = [
  /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/,   // 2024-01-15
  /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/,   // 15/01/2024
  /\b(\d{2}[-\/]\d{2}[-\/]\d{2})\b/,   // 09/01/12
];

const PRICE_PATTERN = /^(\d+\.\d{2})\s*[XxRrTtNn]?$/;
const TOTAL_KEYWORDS = /^(TOTAL|GRAND TOTAL|AMOUNT DUE|BALANCE DUE)$/i;
const SKIP_KEYWORDS = /^(SUBTOTAL|SUB-TOTAL|TAX|HST|GST|PST|TIP|CASH|CHANGE|DEBIT|CREDIT|VISA|MASTERCARD|EFT|APPROVAL|REF|TERMINAL|ACCOUNT|PAY FROM|RECEIPT|THANK|SAVE|MEMBER)/i;
const UPC_PATTERN = /^\d{8,14}$/;

export function parseReceipt(ocrResult) {
  const { merchant_name, transaction_date, amount, raw_lines = [] } = ocrResult;

  // Date
  let date = transaction_date || null;
  if (!date) {
    for (const line of raw_lines) {
      for (const pattern of DATE_PATTERNS) {
        const match = line.match(pattern);
        if (match) { date = match[1]; break; }
      }
      if (date) break;
    }
  }

  // Total amount
  let total = amount || null;
  if (!total) {
    for (let i = 0; i < raw_lines.length; i++) {
      if (TOTAL_KEYWORDS.test(raw_lines[i].trim())) {
        // total이 같은 줄에 있거나 다음 줄에 있음
        const sameLine = raw_lines[i].match(/(\d+\.\d{2})/);
        if (sameLine) { total = sameLine[1]; break; }
        const nextLine = raw_lines[i + 1]?.match(/^(\d+\.\d{2})$/);
        if (nextLine) { total = nextLine[1]; break; }
      }
    }
  }

  // Items (SUBTOTAL 이전, price 패턴 기준)
  const items = [];
  let subtotalIdx = raw_lines.findIndex(l => /^(SUBTOTAL|SUB-TOTAL)$/i.test(l.trim()));
  const scanLines = subtotalIdx > -1 ? raw_lines.slice(0, subtotalIdx) : raw_lines;

  let i = 0;
  while (i < scanLines.length) {
    const line = scanLines[i].trim();

    // UPC나 스킵 키워드면 넘김
    if (UPC_PATTERN.test(line) || SKIP_KEYWORDS.test(line)) { i++; continue; }

    // 현재 줄이 price면 이전 줄이 item 이름
    const priceMatch = line.match(PRICE_PATTERN);
    if (priceMatch) {
      // 이전 비어있지 않은 줄을 이름으로 사용
      let name = '';
      for (let j = i - 1; j >= 0; j--) {
        const prev = scanLines[j].trim();
        if (prev && !UPC_PATTERN.test(prev) && !PRICE_PATTERN.test(prev)) {
          name = prev; break;
        }
      }
      if (name) {
        items.push({ name, price: parseFloat(priceMatch[1]) });
      }
    }
    i++;
  }

  return {
    merchant: merchant_name || '',
    date: date || '',
    total: total ? parseFloat(total) : '',
    items,
  };
}
