import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../AppContext';

const Public = () => {
  const { user, t, notify } = useApp();
  const [data, setData] = useState({ posts: [], info: null });
  const [body, setBody] = useState('');
  const fileRef = useRef();
  const load = () => api.get('/posts').then(setData).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, [user?.id]);
  const act = async (fn) => { try { await fn(); await load(); } catch (e) { notify(e.message, 'error'); } };
  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('body', body);
    if (fileRef.current.files[0]) fd.append('media', fileRef.current.files[0]);
    act(async () => { await api.post('/posts', fd); setBody(''); fileRef.current.value = ''; });
  };
  const { info } = data;
  const limitText = !info ? '' : info.limit === 0 ? 'blocked — add a friend first' : info.limit === null ? 'unlimited' : `${info.limit} post(s)/day`;
  return (
    <>
      {user && info && (
        <form className="card" onSubmit={submit}>
          <h2>{t('public_space')}</h2>
          <p className="muted">{info.friends} friends · limit: {limitText}</p>
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <input type="file" ref={fileRef} accept="image/*,video/*" />
          <button>{t('post')}</button>
        </form>
      )}
      {data.posts.map((p) => (
        <div className="card" key={p._id}>
          <b><Link to={`/profile/${p.user?.username}`}>{p.user?.username}</Link></b>
          <span className="muted"> {new Date(p.createdAt).toLocaleString()}{p.sharedFrom ? ' · shared a post' : ''}</span>
          {p.sharedFrom?.body && <blockquote>{p.sharedFrom.body}</blockquote>}
          <p>{p.body}</p>
          {p.mediaType === 'image' && <img src={`/uploads/${p.mediaPath}`} alt="" />}
          {p.mediaType === 'video' && <video controls src={`/uploads/${p.mediaPath}`} />}
          {user && <div>
            <button onClick={() => act(() => api.post(`/posts/${p._id}/like`))}>{p.liked ? '👍' : '👍🏻'} {p.likes}</button>{' '}
            <button onClick={() => act(() => api.post(`/posts/${p._id}/share`))}>↗ Share ({p.shares})</button>
          </div>}
          <h4>{t('comments')}</h4>
          {p.comments.map((c) => <div className="muted" key={c._id}><b>{c.user?.username}</b>: {c.body}</div>)}
          {user && <CommentBox onSend={(text) => act(() => api.post(`/posts/${p._id}/comment`, { body: text }))} placeholder={t('comments')} />}
        </div>
      ))}
    </>
  );
};

const CommentBox = ({ onSend, placeholder }) => {
  const [v, setV] = useState('');
  return <form onSubmit={(e) => { e.preventDefault(); onSend(v); setV(''); }}><input value={v} required placeholder={placeholder} onChange={(e) => setV(e.target.value)} /></form>;
};

export default Public;
