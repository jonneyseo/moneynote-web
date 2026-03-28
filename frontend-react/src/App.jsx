import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthCode } from './store/authSlice';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import './App.css';

export default function App() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      dispatch(setAuthCode(code));
      window.history.replaceState({}, '', '/');
    }
  }, [dispatch]);

  return isLoggedIn ? <HomePage /> : <LoginPage />;
}
