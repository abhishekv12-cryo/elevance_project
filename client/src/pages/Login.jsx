import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Login = () => {
  const { t, notify, setUser } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', password: '' });
  const [hint, setHint] = useState('desktop');
  // A user-agent can't tell desktop from laptop; the Battery API (Chromium) hints at a laptop.
  useEffect(() => { navigator.getBattery?.().then(() => setHint('laptop')).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const d = await api.post('/auth/login', { ...f, deviceHint: hint });
      if (d.otpRequired) {
        notify('A verification code was sent to your email.');
        nav('/verify', { state: { challengeId: d.challengeId, channel: d.channel, purpose: 'login' } });
      } else { setUser(d.user); notify('Logged in.'); nav('/'); }
    } catch (err) { notify(err.message, 'error'); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>{t('login')}</h2>
      <input placeholder={`${t('username')} / ${t('email')}`} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required />
      <input type="password" placeholder={t('password')} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
      <button>{t('login')}</button>
      <p><Link to="/forgot-password">Forgot password?</Link></p>
    </form>
  );
};

export default Login;
