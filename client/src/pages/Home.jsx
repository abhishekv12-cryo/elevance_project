import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Home = () => {
  const { user, t, notify } = useApp();
  const [data, setData] = useState({ questions: [], quota: null });
  const [f, setF] = useState({ title: '', body: '' });
  const load = () => api.get('/questions').then(setData).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, [user?.id]);
  const ask = async (e) => {
    e.preventDefault();
    try { await api.post('/questions', f); setF({ title: '', body: '' }); load(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const { quota } = data;
  return (
    <>
      {user && quota && (
        <form className="card" onSubmit={ask}>
          <h2>{t('ask_question')}</h2>
          <p className="muted">Plan: {quota.plan} · Today: {quota.used}/{quota.limit ?? '∞'}</p>
          <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
          <textarea rows={4} placeholder="Details" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} required />
          <button>{t('post')}</button>
        </form>
      )}
      <h2>{t('questions')}</h2>
      {data.questions.map((q) => (
        <div className="card" key={q._id}>
          <Link to={`/questions/${q._id}`}><b>{q.title}</b></Link>
          <div className="muted">{q.user?.username} · {new Date(q.createdAt).toLocaleString()}</div>
        </div>
      ))}
      {!data.questions.length && <p className="muted">No questions yet.</p>}
    </>
  );
};

export default Home;
