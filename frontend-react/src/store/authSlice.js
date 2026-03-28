import { createSlice } from '@reduxjs/toolkit';

const COGNITO_DOMAIN = 'https://ca-central-1ko6qmzcu2.auth.ca-central-1.amazoncognito.com';
const CLIENT_ID = '3k1uempvlqv2uai348aurmcfcd';
const REDIRECT_URI = 'http://localhost:5173/';
const SCOPE = 'email openid';

export function buildLoginUrl() {
  return (
    `${COGNITO_DOMAIN}/login` +
    `?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
  );
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    authCode: null,
    isLoggedIn: false,
  },
  reducers: {
    setAuthCode(state, action) {
      state.authCode = action.payload;
      state.isLoggedIn = !!action.payload;
    },
    logout(state) {
      state.authCode = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setAuthCode, logout } = authSlice.actions;
export default authSlice.reducer;
