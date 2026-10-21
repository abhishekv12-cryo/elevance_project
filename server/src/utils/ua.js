/** Detect browser / OS / device from a User-Agent string.
 *  A UA cannot tell desktop from laptop, so the client sends deviceHint ('laptop' | 'desktop'). */
export function parseClient(ua = '', deviceHint = '') {
  let browser = 'Unknown';
  if (/Edg(e|A|iOS)?\//.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox\/|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/Chrome\/|CriOS/.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  let os = 'Unknown';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
  else if (/Linux|X11/.test(ua)) os = 'Linux';

  const device = /Mobi|Android|iPhone|iPad|iPod/.test(ua) ? 'Mobile'
    : deviceHint === 'laptop' ? 'Laptop' : 'Desktop';
  return { browser, os, device };
}
