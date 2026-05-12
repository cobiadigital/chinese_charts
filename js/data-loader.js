// Fetch JSON data files with friendly error UI.

const cache = new Map();

export async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(path).then((r) => {
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return r.json();
  });
  cache.set(path, p);
  return p;
}

export function showError(containerId, err) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.classList.add('chart-error');
  el.innerHTML = `<div>Could not load chart data.<br><small>${(err && err.message) || err}</small></div>`;
}

export function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.classList.add('chart-loading');
  el.textContent = 'Loading…';
}

export function clearState(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.classList.remove('chart-loading', 'chart-error');
  el.textContent = '';
}
