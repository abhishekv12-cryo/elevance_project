import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Forgot = () => {
  const { t, notify } = useApp();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { const d = await api.post('/auth/forgot-password', { identifier }); notify(d.message); nav('/login'); }
    catch (err) { notify(err.message, 'error'); } // e.g. "You can use this option only one time per day."
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>Forgot password</h2>
      <p className="muted">Enter your registered email or phone number. A new random password will be sent (one request per day).</p>
      <input placeholder={`${t('email')} / ${t('phone')}`} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
      <button>{t('submit')}</button>
    </form>
  );
};

export default Forgot;
