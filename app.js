/* =========================================================
   Panel de Desempeño — Seguimiento de Trabajadores
   App estática (GitHub Pages). Datos en localStorage.
   ========================================================= */

const STORE_KEY = 'panel_desempeno_v1';
const AVATAR_COLORS = ['#2f81f7','#8957e5','#2ea043','#d29922','#e5534b','#1ab7c4','#db61a2','#bf8700'];

const STATUS_LABEL = { pendiente: 'Pendiente', en_progreso: 'En progreso', cumplida: 'Cumplida' };
const PRIORITY_LABEL = { alta: 'Alta', media: 'Media', baja: 'Baja' };

/* ---------- Tema (claro/oscuro) ---------- */
const THEME_KEY = 'panel_tema';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
}
function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
}
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}
initTheme();

/* ---------- Supabase (modo nube) ---------- */
const CLOUD = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
const SUPA = CLOUD ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

/* ---------- Estado ---------- */
let state = { workers: [], activities: [] };

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.error('Error al leer datos', e); }
  return seed();
}
function saveLocal() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------- Mapeo entre la app (camelCase) y la BD (snake_case) ---------- */
const wToDb = w => ({ id: w.id, name: w.name, role: w.role || '', color: w.color });
const wFromDb = r => ({ id: r.id, name: r.name, role: r.role || '', color: r.color });
const aToDb = a => ({ id: a.id, worker_id: a.workerId, title: a.title, objective: a.objective || '',
  priority: a.priority, status: a.status, progress: a.progress, due: a.due || null, created_at: a.createdAt || null });
const aFromDb = r => ({ id: r.id, workerId: r.worker_id, title: r.title, objective: r.objective || '',
  priority: r.priority, status: r.status, progress: r.progress, due: r.due || '', createdAt: r.created_at || '' });

/* ---------- Adaptador de datos: nube o local según configuración ---------- */
const DB = {
  async load() {
    if (!CLOUD) return loadLocal();
    const [w, a] = await Promise.all([
      SUPA.from('workers').select('*'),
      SUPA.from('activities').select('*'),
    ]);
    if (w.error) throw w.error;
    if (a.error) throw a.error;
    return { workers: w.data.map(wFromDb), activities: a.data.map(aFromDb) };
  },
  async saveWorker(w) {
    if (!CLOUD) return saveLocal();
    const { error } = await SUPA.from('workers').upsert(wToDb(w));
    if (error) throw error;
  },
  async deleteWorker(id) {
    if (!CLOUD) return saveLocal();
    let r = await SUPA.from('activities').delete().eq('worker_id', id);
    if (r.error) throw r.error;
    r = await SUPA.from('workers').delete().eq('id', id);
    if (r.error) throw r.error;
  },
  async saveActivity(a) {
    if (!CLOUD) return saveLocal();
    const { error } = await SUPA.from('activities').upsert(aToDb(a));
    if (error) throw error;
  },
  async deleteActivity(id) {
    if (!CLOUD) return saveLocal();
    const { error } = await SUPA.from('activities').delete().eq('id', id);
    if (error) throw error;
  },
  async replaceAll(data) {
    if (!CLOUD) { state = data; saveLocal(); return; }
    let r = await SUPA.from('activities').delete().neq('id', '');
    if (r.error) throw r.error;
    r = await SUPA.from('workers').delete().neq('id', '');
    if (r.error) throw r.error;
    if (data.workers.length) {
      r = await SUPA.from('workers').upsert(data.workers.map(wToDb));
      if (r.error) throw r.error;
    }
    if (data.activities.length) {
      r = await SUPA.from('activities').upsert(data.activities.map(aToDb));
      if (r.error) throw r.error;
    }
    state = data;
  },
};

function seed() {
  // Datos de ejemplo para que se vea cómo funciona en el primer uso.
  const w1 = uid(), w2 = uid(), w3 = uid();
  const today = new Date();
  const d = (days) => { const x = new Date(today); x.setDate(x.getDate() + days); return x.toISOString().slice(0,10); };
  return {
    workers: [
      { id: w1, name: 'Juan Pérez', role: 'Maestro de obra', color: AVATAR_COLORS[0] },
      { id: w2, name: 'María López', role: 'Residente', color: AVATAR_COLORS[1] },
      { id: w3, name: 'Carlos Ruiz', role: 'Ayudante', color: AVATAR_COLORS[2] },
    ],
    activities: [
      { id: uid(), workerId: w1, title: 'Cimentación zona A', objective: 'Terminar colado de zapatas', priority: 'alta', status: 'en_progreso', progress: 60, due: d(3), createdAt: d(-5) },
      { id: uid(), workerId: w1, title: 'Reporte de avance semanal', objective: 'Entregar reporte fotográfico', priority: 'media', status: 'pendiente', progress: 0, due: d(-1), createdAt: d(-3) },
      { id: uid(), workerId: w2, title: 'Revisión de planos', objective: 'Validar planos estructurales', priority: 'alta', status: 'cumplida', progress: 100, due: d(-2), createdAt: d(-8) },
      { id: uid(), workerId: w2, title: 'Control de calidad concreto', objective: 'Tomar muestras y registrar', priority: 'media', status: 'en_progreso', progress: 40, due: d(5), createdAt: d(-2) },
      { id: uid(), workerId: w3, title: 'Limpieza de área', objective: 'Despejar zona de trabajo', priority: 'baja', status: 'pendiente', progress: 0, due: d(2), createdAt: d(-1) },
    ],
  };
}

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

/* ---------- Helpers de dominio ---------- */
function today0() { const t = new Date(); t.setHours(0,0,0,0); return t; }

function isOverdue(a) {
  if (a.status === 'cumplida' || !a.due) return false;
  return new Date(a.due) < today0();
}

function effectiveStatus(a) {
  if (a.status === 'cumplida') return 'cumplida';
  return isOverdue(a) ? 'atrasada' : a.status;
}

function workerById(id) { return state.workers.find(w => w.id === id); }
function activitiesOf(id) { return state.activities.filter(a => a.workerId === id); }

function workerScore(id) {
  const acts = activitiesOf(id);
  if (!acts.length) return { pct: 0, total: 0, done: 0, pending: 0, overdue: 0, avg: 0 };
  const done = acts.filter(a => a.status === 'cumplida').length;
  const overdue = acts.filter(a => isOverdue(a)).length;
  const pending = acts.filter(a => a.status !== 'cumplida').length;
  const avg = Math.round(acts.reduce((s,a) => s + (a.status === 'cumplida' ? 100 : a.progress), 0) / acts.length);
  return { pct: Math.round(done / acts.length * 100), total: acts.length, done, pending, overdue, avg };
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function initials(name) {
  return name.trim().split(/\s+/).slice(0,2).map(p => p[0]).join('').toUpperCase();
}
function fmtDate(iso) {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function barColor(pct) {
  if (pct >= 80) return 'var(--green)';
  if (pct >= 40) return 'var(--primary)';
  if (pct > 0) return 'var(--amber)';
  return 'var(--red)';
}

/* =========================================================
   Render — Resumen
   ========================================================= */
function renderDashboard() {
  const acts = state.activities;
  const total = acts.length;
  const done = acts.filter(a => a.status === 'cumplida').length;
  const overdue = acts.filter(a => isOverdue(a)).length;
  const inProgress = acts.filter(a => effectiveStatus(a) === 'en_progreso').length;
  const pendiente = acts.filter(a => effectiveStatus(a) === 'pendiente').length;
  const pct = total ? Math.round(done / total * 100) : 0;

  // Stat cards
  document.getElementById('statsGrid').innerHTML = `
    ${statCard('Trabajadores', state.workers.length, 'var(--purple)', '')}
    ${statCard('Cumplimiento global', pct + '%', 'var(--green)', done + ' de ' + total + ' cumplidas')}
    ${statCard('En progreso', inProgress, 'var(--primary)', '')}
    ${statCard('Atrasadas', overdue, 'var(--red)', overdue ? 'Requieren atención' : 'Sin atrasos 🎉')}
  `;

  // Performance por trabajador
  const perf = state.workers.map(w => ({ w, s: workerScore(w.id) }))
    .sort((a,b) => b.s.avg - a.s.avg);
  const pe = document.getElementById('workerPerformance');
  pe.innerHTML = perf.length ? perf.map(({w,s}) => `
    <div class="perf-row">
      <div class="perf-top">
        <span class="perf-name">
          <span class="avatar" style="background:${w.color}">${initials(w.name)}</span>
          ${escapeHtml(w.name)}
        </span>
        <span class="perf-pct" style="color:${barColor(s.avg)}">${s.avg}%</span>
      </div>
      <div class="bar"><span style="width:${s.avg}%;background:${barColor(s.avg)}"></span></div>
      <div class="perf-meta">${s.done} cumplidas · ${s.pending} pendientes${s.overdue ? ' · <span style="color:#ff8077">'+s.overdue+' atrasadas</span>' : ''} · ${s.total} en total</div>
    </div>
  `).join('') : emptyBox('Agrega trabajadores para ver su desempeño.');

  // Donut
  renderDonut(done, inProgress, pendiente, overdue);

  // Pendientes y atrasadas
  const pend = acts.filter(a => a.status !== 'cumplida')
    .sort((a,b) => (isOverdue(b)?1:0) - (isOverdue(a)?1:0) || (a.due||'').localeCompare(b.due||''));
  document.getElementById('pendingCount').textContent = pend.length + ' actividad(es)';
  document.getElementById('pendingList').innerHTML = pend.length
    ? pend.map(taskRow).join('')
    : emptyBox('No hay pendientes. ¡Todo al día! 🎉');
}

function statCard(label, value, color, sub) {
  return `<div class="stat-card">
    <div class="label"><span class="dot" style="background:${color}"></span>${label}</div>
    <div class="value">${value}</div>
    ${sub ? `<div class="sub">${sub}</div>` : ''}
  </div>`;
}

function renderDonut(done, prog, pend, overdue) {
  const parts = [
    { label: 'Cumplidas', val: done, color: 'var(--green)' },
    { label: 'En progreso', val: prog, color: 'var(--primary)' },
    { label: 'Pendientes', val: pend, color: 'var(--muted)' },
    { label: 'Atrasadas', val: overdue, color: 'var(--red)' },
  ];
  const total = done + prog + pend + overdue;
  let acc = 0;
  const stops = parts.map(p => {
    const start = total ? acc / total * 360 : 0;
    acc += p.val;
    const end = total ? acc / total * 360 : 0;
    return `${p.color} ${start}deg ${end}deg`;
  }).join(', ');
  const bg = total ? `conic-gradient(${stops})` : 'var(--bg)';
  document.getElementById('donutChart').innerHTML = `
    <div style="position:absolute;inset:0;border-radius:50%;background:${bg}"></div>
    <div style="position:absolute;inset:22px;border-radius:50%;background:var(--panel)"></div>
    <div class="center"><div><b>${total}</b><br><small>actividades</small></div></div>
  `;
  document.getElementById('donutLegend').innerHTML = parts.map(p => `
    <div class="row"><span class="dot" style="background:${p.color}"></span>${p.label}<b>${p.val}</b></div>
  `).join('');
}

function taskRow(a) {
  const w = workerById(a.workerId);
  const est = effectiveStatus(a);
  return `<div class="task ${isOverdue(a) ? 'overdue' : ''}" data-act="${a.id}">
    <span class="avatar" style="background:${w ? w.color : '#555'}" title="${w ? escapeHtml(w.name) : ''}">${w ? initials(w.name) : '?'}</span>
    <div class="task-main">
      <div class="task-title ${a.status==='cumplida'?'done':''}">${escapeHtml(a.title)} <span class="badge ${a.priority}">${PRIORITY_LABEL[a.priority]}</span></div>
      ${a.objective ? `<div class="task-obj">🎯 ${escapeHtml(a.objective)}</div>` : ''}
      <div class="task-sub">
        <span>${w ? escapeHtml(w.name) : 'Sin asignar'}</span>
        <span>📅 ${fmtDate(a.due)}</span>
      </div>
    </div>
    <div class="task-right">
      <div class="task-progress">
        <div class="pp">${a.status==='cumplida'?100:a.progress}%</div>
        <div class="bar"><span style="width:${a.status==='cumplida'?100:a.progress}%;background:${barColor(a.status==='cumplida'?100:a.progress)}"></span></div>
      </div>
      <span class="badge ${est}">${est==='atrasada'?'Atrasada':STATUS_LABEL[a.status]}</span>
    </div>
  </div>`;
}

function emptyBox(msg) {
  return `<div class="empty"><div class="big">📋</div>${msg}</div>`;
}

/* =========================================================
   Render — Trabajadores
   ========================================================= */
function renderWorkers() {
  const grid = document.getElementById('workersGrid');
  if (!state.workers.length) {
    grid.innerHTML = emptyBox('Aún no hay trabajadores. Agrega el primero con el botón de arriba.');
    return;
  }
  grid.innerHTML = state.workers.map(w => {
    const s = workerScore(w.id);
    return `<div class="worker-card" data-worker="${w.id}">
      <div class="wc-head">
        <span class="avatar lg" style="background:${w.color}">${initials(w.name)}</span>
        <div>
          <div class="wc-name">${escapeHtml(w.name)}</div>
          <div class="wc-role">${escapeHtml(w.role || 'Sin puesto')}</div>
        </div>
      </div>
      <div class="wc-stats">
        <div><b>${s.total}</b>Actividades</div>
        <div><b>${s.done}</b>Cumplidas</div>
        <div><b style="color:${s.overdue?'#ff8077':'inherit'}">${s.overdue}</b>Atrasadas</div>
      </div>
      <div class="perf-pct" style="color:${barColor(s.avg)};font-size:13px;margin-bottom:4px">Desempeño: ${s.avg}%</div>
      <div class="bar"><span style="width:${s.avg}%;background:${barColor(s.avg)}"></span></div>
    </div>`;
  }).join('');
}

/* =========================================================
   Render — Actividades
   ========================================================= */
function renderActivities() {
  // poblar filtro de trabajadores
  const fw = document.getElementById('filterWorker');
  const cur = fw.value;
  fw.innerHTML = '<option value="">Todos los trabajadores</option>' +
    state.workers.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
  fw.value = cur;

  const wFilter = fw.value;
  const sFilter = document.getElementById('filterStatus').value;
  const q = document.getElementById('filterSearch').value.toLowerCase().trim();

  let list = state.activities.slice();
  if (wFilter) list = list.filter(a => a.workerId === wFilter);
  if (sFilter) list = list.filter(a => a.status === sFilter);
  if (q) list = list.filter(a => (a.title + ' ' + (a.objective||'')).toLowerCase().includes(q));
  list.sort((a,b) => (isOverdue(b)?1:0)-(isOverdue(a)?1:0) || (a.due||'').localeCompare(b.due||''));

  const el = document.getElementById('activitiesList');
  el.innerHTML = list.length ? list.map(taskRow).join('')
    : emptyBox(state.activities.length ? 'Ninguna actividad coincide con el filtro.' : 'Aún no hay actividades. Crea la primera.');
}

/* =========================================================
   Modales / Formularios
   ========================================================= */
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove('hidden');
}
function closeModal() { modal.classList.add('hidden'); modalBody.innerHTML = ''; }

document.getElementById('modalClose').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

/* ----- Worker form ----- */
function workerForm(worker) {
  const w = worker || { name: '', role: '' };
  openModal(worker ? 'Editar trabajador' : 'Nuevo trabajador', `
    <div class="field">
      <label>Nombre completo *</label>
      <input id="f-name" value="${escapeHtml(w.name)}" placeholder="Ej. Juan Pérez" />
    </div>
    <div class="field">
      <label>Puesto / cargo</label>
      <input id="f-role" value="${escapeHtml(w.role||'')}" placeholder="Ej. Maestro de obra" />
    </div>
    <div class="modal-actions">
      ${worker ? `<button class="btn danger" id="f-del">Eliminar</button>` : '<span></span>'}
      <div class="right">
        <button class="btn" id="f-cancel">Cancelar</button>
        <button class="btn primary" id="f-save">Guardar</button>
      </div>
    </div>
  `);
  document.getElementById('f-cancel').onclick = closeModal;
  document.getElementById('f-save').onclick = async () => {
    const name = document.getElementById('f-name').value.trim();
    const role = document.getElementById('f-role').value.trim();
    if (!name) return toast('El nombre es obligatorio', true);
    let w;
    if (worker) {
      worker.name = name; worker.role = role; w = worker;
    } else {
      w = { id: uid(), name, role, color: AVATAR_COLORS[state.workers.length % AVATAR_COLORS.length] };
      state.workers.push(w);
    }
    try {
      await DB.saveWorker(w);
      closeModal(); renderAll(); toast('Trabajador guardado');
    } catch (e) { toast('Error al guardar: ' + (e.message || e), true); }
  };
  if (worker) {
    document.getElementById('f-del').onclick = async () => {
      if (!confirm(`¿Eliminar a ${worker.name} y todas sus actividades?`)) return;
      state.workers = state.workers.filter(x => x.id !== worker.id);
      state.activities = state.activities.filter(a => a.workerId !== worker.id);
      try {
        await DB.deleteWorker(worker.id);
        closeModal(); renderAll(); toast('Trabajador eliminado');
      } catch (e) { toast('Error al eliminar: ' + (e.message || e), true); }
    };
  }
}

/* ----- Activity form ----- */
function activityForm(activity, presetWorker) {
  if (!state.workers.length) { toast('Primero agrega un trabajador', true); return; }
  const a = activity || { title:'', objective:'', priority:'media', status:'pendiente', progress:0, due:'', workerId: presetWorker || state.workers[0].id };
  openModal(activity ? 'Editar actividad' : 'Nueva actividad', `
    <div class="field">
      <label>Actividad / tarea *</label>
      <input id="f-title" value="${escapeHtml(a.title)}" placeholder="Ej. Cimentación zona A" />
    </div>
    <div class="field">
      <label>Objetivo</label>
      <textarea id="f-obj" placeholder="¿Qué se espera lograr?">${escapeHtml(a.objective||'')}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Trabajador asignado *</label>
        <select id="f-worker">${state.workers.map(w => `<option value="${w.id}" ${w.id===a.workerId?'selected':''}>${escapeHtml(w.name)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label>Prioridad</label>
        <select id="f-priority">
          ${['alta','media','baja'].map(p => `<option value="${p}" ${p===a.priority?'selected':''}>${PRIORITY_LABEL[p]}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Estado</label>
        <select id="f-status">
          ${['pendiente','en_progreso','cumplida'].map(s => `<option value="${s}" ${s===a.status?'selected':''}>${STATUS_LABEL[s]}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Fecha límite</label>
        <input type="date" id="f-due" value="${a.due||''}" />
      </div>
    </div>
    <div class="field">
      <label>Progreso</label>
      <div class="range-row">
        <input type="range" id="f-progress" min="0" max="100" step="5" value="${a.progress}" />
        <span class="range-val" id="f-progress-val">${a.progress}%</span>
      </div>
    </div>
    <div class="modal-actions">
      ${activity ? `<button class="btn danger" id="f-del">Eliminar</button>` : '<span></span>'}
      <div class="right">
        <button class="btn" id="f-cancel">Cancelar</button>
        <button class="btn primary" id="f-save">Guardar</button>
      </div>
    </div>
  `);

  const range = document.getElementById('f-progress');
  const rangeVal = document.getElementById('f-progress-val');
  const statusSel = document.getElementById('f-status');
  range.oninput = () => {
    rangeVal.textContent = range.value + '%';
    if (range.value === '100') statusSel.value = 'cumplida';
    else if (range.value > '0' && statusSel.value === 'pendiente') statusSel.value = 'en_progreso';
  };
  statusSel.onchange = () => {
    if (statusSel.value === 'cumplida') { range.value = 100; rangeVal.textContent = '100%'; }
  };

  document.getElementById('f-cancel').onclick = closeModal;
  document.getElementById('f-save').onclick = async () => {
    const title = document.getElementById('f-title').value.trim();
    if (!title) return toast('El nombre de la actividad es obligatorio', true);
    const data = {
      title,
      objective: document.getElementById('f-obj').value.trim(),
      workerId: document.getElementById('f-worker').value,
      priority: document.getElementById('f-priority').value,
      status: statusSel.value,
      due: document.getElementById('f-due').value,
      progress: statusSel.value === 'cumplida' ? 100 : parseInt(range.value, 10),
    };
    let a;
    if (activity) { Object.assign(activity, data); a = activity; }
    else { a = { id: uid(), createdAt: new Date().toISOString().slice(0,10), ...data }; state.activities.push(a); }
    try {
      await DB.saveActivity(a);
      closeModal(); renderAll(); toast('Actividad guardada');
    } catch (e) { toast('Error al guardar: ' + (e.message || e), true); }
  };
  if (activity) {
    document.getElementById('f-del').onclick = async () => {
      if (!confirm('¿Eliminar esta actividad?')) return;
      state.activities = state.activities.filter(x => x.id !== activity.id);
      try {
        await DB.deleteActivity(activity.id);
        closeModal(); renderAll(); toast('Actividad eliminada');
      } catch (e) { toast('Error al eliminar: ' + (e.message || e), true); }
    };
  }
}

/* ----- Worker detail ----- */
function workerDetail(id) {
  const w = workerById(id);
  if (!w) return;
  const s = workerScore(id);
  const acts = activitiesOf(id).sort((a,b) => (isOverdue(b)?1:0)-(isOverdue(a)?1:0) || (a.due||'').localeCompare(b.due||''));
  openModal('Detalle del trabajador', `
    <div class="detail-head">
      <span class="avatar lg" style="background:${w.color}">${initials(w.name)}</span>
      <div>
        <div style="font-weight:700;font-size:18px">${escapeHtml(w.name)}</div>
        <div class="muted">${escapeHtml(w.role||'Sin puesto')}</div>
      </div>
      <button class="btn ghost" id="d-edit" style="margin-left:auto">Editar</button>
    </div>
    <div class="detail-stats">
      <div class="ds"><b style="color:${barColor(s.avg)}">${s.avg}%</b><span>Desempeño</span></div>
      <div class="ds"><b>${s.done}/${s.total}</b><span>Cumplidas</span></div>
      <div class="ds"><b style="color:${s.overdue?'#ff8077':'inherit'}">${s.overdue}</b><span>Atrasadas</span></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3 style="font-size:15px">Actividades</h3>
      <button class="btn primary" id="d-add" style="padding:6px 12px">+ Asignar</button>
    </div>
    <div class="task-list" id="d-list">
      ${acts.length ? acts.map(taskRow).join('') : emptyBox('Sin actividades asignadas.')}
    </div>
  `);
  document.getElementById('d-edit').onclick = () => workerForm(w);
  document.getElementById('d-add').onclick = () => activityForm(null, id);
  // permitir abrir actividades desde el detalle
  document.getElementById('d-list').addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (t) { const a = state.activities.find(x => x.id === t.dataset.act); if (a) activityForm(a); }
  });
}

/* =========================================================
   Respaldo (export / import)
   ========================================================= */
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `respaldo-desempeno-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Respaldo descargado');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    let data;
    try {
      data = JSON.parse(reader.result);
      if (!Array.isArray(data.workers) || !Array.isArray(data.activities)) throw new Error('formato');
    } catch (e) { return toast('Archivo no válido', true); }
    if (!confirm('Esto reemplazará todos los datos actuales. ¿Continuar?')) return;
    try {
      await DB.replaceAll(data);
      renderAll(); toast('Datos importados');
    } catch (e) { toast('Error al importar: ' + (e.message || e), true); }
  };
  reader.readAsText(file);
}

/* =========================================================
   Toast
   ========================================================= */
let toastTimer;
function toast(msg, isErr) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

/* =========================================================
   Navegación + eventos
   ========================================================= */
function switchView(view) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-' + view).classList.remove('hidden');
  renderAll();
}

function renderAll() {
  renderDashboard();
  renderWorkers();
  renderActivities();
}

document.querySelectorAll('.tab').forEach(t => t.onclick = () => switchView(t.dataset.view));
document.getElementById('btnAddWorker').onclick = () => workerForm(null);
document.getElementById('btnAddActivity').onclick = () => activityForm(null);
document.getElementById('btnTheme').onclick = toggleTheme;
document.getElementById('btnExport').onclick = exportData;
document.getElementById('btnImport').onclick = () => document.getElementById('fileImport').click();
document.getElementById('fileImport').onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value=''; };

['filterWorker','filterStatus','filterSearch'].forEach(id =>
  document.getElementById(id).addEventListener('input', renderActivities));

// Delegación: abrir tarjetas de trabajador y actividades
document.getElementById('workersGrid').addEventListener('click', e => {
  const c = e.target.closest('[data-worker]');
  if (c) workerDetail(c.dataset.worker);
});
document.getElementById('pendingList').addEventListener('click', openActFromClick);
document.getElementById('activitiesList').addEventListener('click', openActFromClick);
function openActFromClick(e) {
  const t = e.target.closest('[data-act]');
  if (t) { const a = state.activities.find(x => x.id === t.dataset.act); if (a) activityForm(a); }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* =========================================================
   Autenticación (Supabase) + arranque
   ========================================================= */
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function showLogin() {
  loginOverlay.classList.remove('hidden');
}
function hideLogin() {
  loginOverlay.classList.add('hidden');
}
function showSessionUI(email) {
  const pill = document.getElementById('userEmail');
  pill.textContent = email;
  pill.classList.remove('hidden');
  document.getElementById('btnLogout').classList.remove('hidden');
}

async function reload() {
  try {
    state = await DB.load();
    renderAll();
  } catch (e) {
    toast('Error al cargar datos: ' + (e.message || e), true);
  }
}

async function boot() {
  if (!CLOUD) {
    // Modo local: sin login, datos en este navegador.
    hideLogin();
    state = loadLocal();
    renderAll();
    return;
  }
  // Modo nube: requiere iniciar sesión.
  const { data: { session } } = await SUPA.auth.getSession();
  if (session) {
    hideLogin();
    showSessionUI(session.user.email);
    await reload();
  } else {
    showLogin();
  }
  // Reaccionar a cierres de sesión (p. ej. desde otra pestaña).
  SUPA.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') { showLogin(); }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!CLOUD) return;
    loginError.classList.add('hidden');
    const btn = document.getElementById('loginBtn');
    btn.disabled = true; btn.textContent = 'Entrando…';
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    const { data, error } = await SUPA.auth.signInWithPassword({ email, password });
    btn.disabled = false; btn.textContent = 'Entrar';
    if (error) {
      loginError.textContent = 'Correo o contraseña incorrectos.';
      loginError.classList.remove('hidden');
      return;
    }
    hideLogin();
    showSessionUI(data.user.email);
    await reload();
  });
}

document.getElementById('btnLogout').onclick = async () => {
  if (CLOUD) { await SUPA.auth.signOut(); }
  location.reload();
};

// Arranque
boot();
