import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Register = () => {
  const { t, notify } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', email: '', phone: '', password: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/auth/register', f); notify('Registered. Please log in.'); nav('/login'); }
    catch (err) { notify(err.message, 'error'); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>{t('register')}</h2>
      <input placeholder={t('username')} value={f.username} onChange={set('username')} required />
      <input type="email" placeholder={t('email')} value={f.email} onChange={set('email')} required />
      <input placeholder={`${t('phone')} (+91XXXXXXXXXX)`} value={f.phone} onChange={set('phone')} required />
      <input type="password" minLength={8} placeholder={`${t('password')} (8+)`} value={f.password} onChange={set('password')} required />
      <button>{t('register')}</button>
    </form>
  );
};

export default Register;
