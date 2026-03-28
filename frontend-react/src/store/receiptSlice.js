import { createSlice } from '@reduxjs/toolkit';
import { parseReceipt } from '../utils/parseReceipt';

const receiptSlice = createSlice({
  name: 'receipt',
  initialState: {
    merchant: '',
    date: '',
    total: '',
    items: [],        // [{ name, price }]
    isParsed: false,
  },
  reducers: {
    loadFromOcr(state, action) {
      const parsed = parseReceipt(action.payload);
      state.merchant = parsed.merchant;
      state.date = parsed.date;
      state.total = parsed.total;
      state.items = parsed.items;
      state.isParsed = true;
    },
    setField(state, action) {
      const { field, value } = action.payload;
      state[field] = value;
    },
    setItemField(state, action) {
      const { index, field, value } = action.payload;
      state.items[index][field] = value;
    },
    addItem(state) {
      state.items.push({ name: '', price: '' });
    },
    removeItem(state, action) {
      state.items.splice(action.payload, 1);
    },
    resetReceipt(state) {
      state.merchant = '';
      state.date = '';
      state.total = '';
      state.items = [];
      state.isParsed = false;
    },
  },
});

export const { loadFromOcr, setField, setItemField, addItem, removeItem, resetReceipt } = receiptSlice.actions;
export default receiptSlice.reducer;
