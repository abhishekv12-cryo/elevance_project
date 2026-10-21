import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { api } from './api';
import { LANGUAGES } from './i18n';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Forgot from './pages/Forgot';
import Home from './pages/Home';
import Question from './pages/Question';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Public from './pages/Public';
import Plans from './pages/Plans';

const App = () => {
  const { user, setUser, t, toast, setToast, notify } = useApp();
  const nav = useNavigate();
  if (user === undefined) return <p className="muted">Loading…</p>;

  const changeLang = async (lang) => {
    try {
      const d = await api.post('/users/language', { lang });
      if (d.otpRequired) {
        notify(`Verification code sent to your ${d.channel === 'email' ? 'email' : 'mobile number'}.`);
        nav('/verify', { state: { challengeId: d.challengeId, channel: d.channel, purpose: 'language' } });
      }
    } catch (e) { notify(e.message, 'error'); }
  };
  const logout = async () => { await api.post('/auth/logout'); setUser(null); nav('/login'); };

  return (
    <>
      <nav>
        <b>{t('app_title')}</b>
        <Link to="/">{t('home')}</Link><Link to="/public">{t('public_space')}</Link>
        <Link to="/plans">{t('plans')}</Link><Link to="/users">{t('search_users')}</Link><span className="sp" />
        {user ? (<>
          <select value={user.lang} onChange={(e) => changeLang(e.target.value)} aria-label={t('language')}>
            {Object.entries(LANGUAGES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
          <Link to={`/profile/${user.username}`}>{t('profile')} ({user.points} {t('points')})</Link>
          <button className="link" onClick={logout}>{t('logout')}</button>
        </>) : (<><Link to="/login">{t('login')}</Link><Link to="/register">{t('register')}</Link></>)}
      </nav>
      {toast && <div className={`flash ${toast.type}`} onClick={() => setToast(null)}>{toast.text}</div>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/questions/:id" element={<Question />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/public" element={<Public />} />
        <Route path="/plans" element={<Plans />} />
      </Routes>
    </>
  );
};

export default App;
