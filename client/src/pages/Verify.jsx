import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Verify = () => {
  const { state } = useLocation();
  const { t, notify, setUser } = useApp();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  if (!state?.challengeId) return <Navigate to="/login" replace />;
  const submit = async (e) => {
    e.preventDefault();
    try {
      const d = await api.post('/auth/verify-otp', { challengeId: state.challengeId, code });
      setUser(d.user);
      notify(state.purpose === 'language' ? 'Language changed.' : 'Logged in.');
      nav('/');
    } catch (err) { notify(err.message, 'error'); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>Verification</h2>
      <p className="muted">Enter the 6-digit code sent to your registered {state.channel === 'email' ? 'email' : 'mobile number'}.</p>
      <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus required />
      <button>{t('submit')}</button>
    </form>
  );
};

export default Verify;
