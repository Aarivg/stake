  /* ---------- color theme: system, light or dark ---------- */
  const TKEY = 'stake.theme';
  const THEMES = ['system', 'light', 'dark'];
  const THEME_ICON = {
    system: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>',
    dark: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>'
  };
  const THEME_LABEL = { system: 'Match my device', light: 'Light', dark: 'Dark' };
  let theme = (() => { try { const t = localStorage.getItem(TKEY); return THEMES.includes(t) ? t : 'system'; } catch (e) { return 'system'; } })();
  function applyTheme(t, announce) {
    theme = THEMES.includes(t) ? t : 'system';
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
    const b = $('#themeBtn');
    if (b) {
      b.innerHTML = THEME_ICON[theme];
      b.setAttribute('aria-label', `Color theme: ${THEME_LABEL[theme]}. Click to change.`);
      b.title = `Theme: ${THEME_LABEL[theme]} (T)`;
    }
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = dark ? '#0f1412' : '#0b5d47';
    try { localStorage.setItem(TKEY, theme); } catch (e) { /* ignore */ }
    if (announce) toast(`Theme: ${THEME_LABEL[theme]}`);
  }
  const nextTheme = () => applyTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length], true);
  $('#themeBtn').addEventListener('click', nextTheme);
  applyTheme(theme);
