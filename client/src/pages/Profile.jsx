import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Profile = () => {
  const { username } = useParams();
  const { user, refresh, t, notify } = useApp();
  const [p, setP] = useState(null);
  const [amount, setAmount] = useState('');
  const load = () => api.get(`/users/${username}`).then(setP).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, [username, user?.id]);
  const act = async (fn) => { try { const d = await fn(); if (d?.message) notify(d.message); await load(); refresh(); } catch (e) { notify(e.message, 'error'); } };
  if (!p) return null;
  return (
    <>
      <div className="card">
        <h2>{p.username}</h2>
        <p><b>{p.points}</b> {t('points')} · {p.plan} · {p.friends} friends</p>
        {user && !p.own && <>
          {!p.relation ? <button onClick={() => act(() => api.post(`/users/${username}/friend`))}>Add friend</button>
            : <p className="muted">Friend status: {p.relation}</p>}
          <h3>{t('transfer_points')}</h3>
          <form onSubmit={(e) => { e.preventDefault(); act(() => api.post(`/users/${username}/transfer`, { amount: Number(amount) })); setAmount(''); }}>
            <input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('points')} />
            <button>{t('transfer_points')}</button>
          </form>
          <p className="muted">You need more than 10 points to transfer.</p>
        </>}
      </div>
      {p.own && <>
        {p.requests.length > 0 && <div className="card"><h3>Friend requests</h3>
          {p.requests.map((n) => <div key={n}>{n} <button onClick={() => act(() => api.post(`/users/${n}/friend/accept`))}>Accept</button></div>)}</div>}
        <div className="card"><h3>{t('login_history')}</h3><div className="scroll"><table>
          <thead><tr><th>Time</th><th>Browser</th><th>OS</th><th>Device</th><th>IP</th><th>Status</th></tr></thead>
          <tbody>{p.history.map((h) => <tr key={h._id}><td>{new Date(h.createdAt).toLocaleString()}</td><td>{h.browser}</td><td>{h.os}</td><td>{h.device}</td><td>{h.ip}</td><td>{h.status}</td></tr>)}</tbody>
        </table></div></div>
      </>}
    </>
  );
};

export default Profile;
