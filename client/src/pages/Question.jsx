import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Question = () => {
  const { id } = useParams();
  const { user, refresh, t, notify } = useApp();
  const [d, setD] = useState(null);
  const [body, setBody] = useState('');
  const load = () => api.get(`/questions/${id}`).then(setD).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, [id]);
  // run an action, then reload the thread and the points shown in the navbar
  const act = async (fn) => { try { await fn(); await load(); refresh(); } catch (e) { notify(e.message, 'error'); } };
  if (!d) return null;
  return (
    <>
      <div className="card"><h2>{d.question.title}</h2><p>{d.question.body}</p><div className="muted">{d.question.user?.username}</div></div>
      <h3>{d.answers.length} {t('answers')}</h3>
      {d.answers.map((a) => (
        <div className="card" key={a._id}>
          <p>{a.body}</p>
          <div className="muted"><Link to={`/profile/${a.user?.username}`}>{a.user?.username}</Link> · ▲{a.upvotes} ▼{a.downvotes}</div>
          {user && <>
            <button onClick={() => act(() => api.post(`/answers/${a._id}/vote`, { value: 'up' }))}>▲</button>{' '}
            <button onClick={() => act(() => api.post(`/answers/${a._id}/vote`, { value: 'down' }))}>▼</button>{' '}
            {a.user?.username === user.username && <button className="danger" onClick={() => act(() => api.del(`/answers/${a._id}`))}>Delete</button>}
          </>}
        </div>
      ))}
      {user && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); act(async () => { await api.post(`/questions/${id}/answers`, { body }); setBody(''); }); }}>
          <textarea rows={4} required value={body} onChange={(e) => setBody(e.target.value)} placeholder={`${t('answers')} (+5 ${t('points')})`} />
          <button>{t('submit')}</button>
        </form>
      )}
    </>
  );
};

export default Question;
