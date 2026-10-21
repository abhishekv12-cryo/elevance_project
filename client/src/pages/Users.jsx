import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Users = () => {
  const { t, notify } = useApp();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const search = async (e) => {
    e.preventDefault();
    try { setRows((await api.get(`/users?q=${encodeURIComponent(q)}`)).users); } catch (err) { notify(err.message, 'error'); }
  };
  return (
    <>
      <form className="card" onSubmit={search}>
        <h2>{t('search_users')}</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('username')} />
        <button>{t('search_users')}</button>
      </form>
      {rows.map((u) => <div className="card" key={u.username}><Link to={`/profile/${u.username}`}>{u.username}</Link> · {u.points} {t('points')}</div>)}
    </>
  );
};

export default Users;
