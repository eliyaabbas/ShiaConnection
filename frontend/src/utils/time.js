/**
 * Utility: format a timestamp as relative time (e.g. "3 days ago")
 * Works with milliseconds or seconds. No external dependency needed.
 */
export function formatDistanceToNow(ms) {
  const now = Date.now();
  const diffMs = now - ms;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr  / 24);
  const diffMon = Math.floor(diffDay / 30);
  const diffYr  = Math.floor(diffMon / 12);

  if (diffSec < 60)  return 'just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  if (diffDay < 30)  return `${diffDay}d ago`;
  if (diffMon < 12)  return `${diffMon}mo ago`;
  return `${diffYr}y ago`;
}

export function formatDate(ms) {
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function formatTime(ms) {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}
