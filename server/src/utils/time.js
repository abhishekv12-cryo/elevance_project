// All business windows/days use IST (Asia/Kolkata).
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function istParts(now = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
export const istDay = (now = new Date()) => istParts(now).day;

/** true if current IST time is within [startH:00, endH:00) */
export function inWindow(startH, endH, now = new Date(), bypass = false) {
  if (bypass) return true;
  const { minutes } = istParts(now);
  return minutes >= startH * 60 && minutes < endH * 60;
}
