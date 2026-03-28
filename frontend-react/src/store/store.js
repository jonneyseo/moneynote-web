import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uploadReducer from './uploadSlice';
import receiptReducer from './receiptSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    upload: uploadReducer,
    receipt: receiptReducer,
  },
});
