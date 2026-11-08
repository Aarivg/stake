  /* ---------- state ---------- */
  let state, model, ui = { tab: 'cap', stage: null, exitStage: null, exit: null, cmp: null, cmpExit: null, seek: { target: 50, roundId: null, varKey: '' } };
  const KEY = 'stake.v1';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(course ? { state: JSON.parse(course.backup), ui: JSON.parse(course.backupUi), dirty: course.backupDirty } : { state, ui, dirty })); } catch (e) { /* storage unavailable */ } }
  function fromHash() {
    const h = location.hash;
    if (!h || h.length < 4 || h[1] !== 's') return null;
    try {
      const b = h.slice(2).replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) { return null; }
  }
  function toHash() {
    const b = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    return '#s' + b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function valid(s) { return s && Array.isArray(s.holders) && Array.isArray(s.instruments) && Array.isArray(s.rounds) && s.runway; }
  function bumpIds() {
    const ids = [...state.holders, ...state.instruments, ...state.rounds].map(x => +x.id || 0);
    uid = Math.max(uid, ...ids, 1000);
  }
