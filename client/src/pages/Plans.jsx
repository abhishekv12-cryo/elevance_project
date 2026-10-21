import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../AppContext';

const loadScript = (src) => new Promise((ok, fail) => {
  if (document.querySelector(`script[src="${src}"]`)) return ok();
  const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.body.appendChild(s);
});

const Plans = () => {
  const { user, setUser, t, notify } = useApp();
  const [d, setD] = useState(null);
  const [order, setOrder] = useState(null); // pending mock checkout
  const load = () => api.get('/plans').then(setD).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, [user?.id]);

  const verify = async (orderId, paymentId, signature) => {
    try {
      const r = await api.post('/payments/verify', { orderId, paymentId, signature });
      setUser(r.user); notify(r.message); setOrder(null); load();
    } catch (e) { notify(e.message, 'error'); }
  };
  const subscribe = async (plan) => {
    try {
      const o = await api.post('/payments/order', { plan });
      if (o.mock) return setOrder({ plan, ...o });      // dev mode: mock gateway
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      new window.Razorpay({ key: o.keyId, amount: o.amount, currency: 'INR', order_id: o.orderId, name: 'Q&A Platform',
        handler: (r) => verify(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature) }).open();
    } catch (e) { notify(e.message, 'error'); }
  };
  if (!d) return null;
  return (
    <>
      <h2>{t('plans')}</h2>
      {!d.openNow && <div className="flash error">Payments are accepted only between 10:00 AM and 11:00 AM IST.</div>}
      {order && <div className="card"><h3>Mock checkout — {d.plans[order.plan].name} (₹{d.plans[order.plan].price})</h3>
        <p className="muted">Dev mode: no Razorpay keys configured.</p>
        <button onClick={() => verify(order.orderId, order.mock.paymentId, order.mock.signature)}>Pay (mock)</button>{' '}
        <button className="danger" onClick={() => setOrder(null)}>Cancel</button></div>}
      {Object.entries(d.plans).map(([k, p]) => (
        <div className="card" key={k}>
          <h3>{p.name} {d.active === k && '✔'}</h3>
          <p>₹{p.price}/month · {p.limit ?? 'Unlimited'} question(s) per day</p>
          {k !== 'free' && user && <button disabled={!d.openNow} onClick={() => subscribe(k)}>{t('subscribe')}</button>}
        </div>
      ))}
    </>
  );
};

export default Plans;
