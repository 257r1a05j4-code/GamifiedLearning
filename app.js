const API_BASE = "http://localhost:4000/api";

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); }

async function api(path, method = 'GET', body) {
const res = await fetch(`${API_BASE}${path}`, {
method,
headers: {
'Content-Type': 'application/json',
...(getToken() ? { 'Authorization': 'Bearer ' + getToken() } : {})
},
body: body ? JSON.stringify(body) : undefined
});
if (!res.ok) {
const e = await res.json().catch(() => ({}));
throw new Error(e.error || `HTTP ${res.status}`);
}
return res.json();
}

function renderAuthLinks() {
const el = document.getElementById('auth-links');
if (getToken()) {
el.innerHTML = '<a href="#/me">My Progress</a> <a href="#/logout">Logout</a>';
} else {
el.innerHTML = '<a href="#/login">Login</a> <a href="#/register">Register</a>';
}
}

function html(strings, ...values) { return strings.map((s, i) => s + (values[i] ?? '')).join(''); }

const routes = {
'/': async () => {
return html`
<div class="card">
<h2>Welcome</h2>
<p>Learn with short lessons and earn points. Designed for low bandwidth.</p>
<p><span class="badge">Free</span><span class="badge">Offline-ready (simple)</span></p>
</div>
`;
},
'/login': async () => formAuth('login'),
'/register': async () => formAuth('register'),
'/logout': async () => { clearToken(); location.hash = '#/'; return ''; },
'/lessons': async () => {
const { lessons } = await api('/lessons');
return html`
<div class="card"><h2>Lessons</h2>
<ul class="list">
${lessons.map(l => `<li><strong>${l.title}</strong><br><small>${l.description}</small><br><a href="#/lesson/${l.id}">Open</a></li>`).join('')}
</ul>
</div>`;
},
'/lesson/:id': async (params) => {
const { lesson } = await api(`/lessons/${params.id}`);
return html`
<div class="card">
<h2>${lesson.title}</h2>
<p>${lesson.description}</p>
<form id="quiz-form">
${lesson.quiz.map((q, qi) => html`
<div class="card">
<p><strong>Q${qi+1}.</strong> ${q.question}</p>
${q.options.map((opt, oi) => html`
<label><input type="radio" name="q${qi}" value="${oi}" required> ${opt}</label><br>
`).join('')}
</div>`).join('')}
<button type="submit">Submit Quiz</button>
</form>
</div>
<script>
const form = document.getElementById('quiz-form');
form.addEventListener('submit', async (e) => {
e.preventDefault();
const answers = ${'`'}${'${'}lesson.quiz.map((_, i) => `Number(new FormData(form).get('q${i}'))`).join(',')}${'}'}${'`'}.split(',').map(Number);
try {
const res = await fetch('${API_BASE}/quiz/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { 'Authorization': 'Bearer ' + localStorage.getItem('token') } : {}) }, body: JSON.stringify({ lessonId: '${'${'}lesson.id${'}'}', answers }) });
if (!res.ok) throw new Error((await res.json()).error || res.status);
const data = await res.json();
alert(`Score: ${'${'}data.score${'}'} / ${'${'}data.maxScore${'}'}`);
location.hash = '#/me';
} catch (err) {
alert(err.message || 'Submit failed');
}
});
</script>
`;
},
'/leaderboard': async () => {
const { leaderboard } = await api('/leaderboard');
return html`
<div class="card"><h2>Leaderboard</h2>
<ol>
${leaderboard.map(r => `<li>${r.username} — <strong>${r.points}</strong> pts</li>`).join('')}
</ol>
</div>`;
},
'/me': async () => {
try {
const { progress } = await api('/me/progress');
const total = progress.reduce((a, b) => a + (b.score||0), 0);
const badges = [ total >= 10 ? 'Starter' : null, total >= 30 ? 'Achiever' : null, total >= 50 ? 'Scholar' : null ].filter(Boolean);
return html`
<div class="card"><h2>My Progress</h2>
<p>Total points: <strong>${total}</strong></p>
<p>${badges.map(b => `<span class="badge">${b}</span>`).join(' ') || '<em>No badges yet</em>'}</p>
<ul class="list">
${progress.map(p => `<li><strong>${p.lessonId}</strong>: ${p.score}/${p.maxScore}</li>`).join('')}
</ul>
</div>`;
} catch (e) {
return html`<div class="card"><p>Please <a href="#/login">login</a> to view progress.</p></div>`;
}
}
};

function parseRoute(hash) {
const raw = (hash || '#/').replace('#', '');
const parts = raw.split('/').filter(Boolean);
if (parts.length === 0) return { path: '/', params: {} };
if (parts[0] === 'lesson' && parts[1]) return { path: '/lesson/:id', params: { id: parts[1] } };
return { path: '/' + parts.join('/'), params: {} };
}

async function formAuth(kind) {
return html`
<div class="card">
<h2>${kind === 'login' ? 'Login' : 'Register'}</h2>
<form id="auth-form">
<div class="row">
<div class="grow">
<label>Username</label>
<input name="username" required />
</div>
<div class="grow">
<label>Password</label>
<input type="password" name="password" required />
</div>
</div>
<button type="submit">${kind === 'login' ? 'Login' : 'Create Account'}</button>
</form>
</div>
<script>
const form = document.getElementById('auth-form');
form.addEventListener('submit', async (e) => {
e.preventDefault();
const fd = new FormData(form);
const payload = { username: fd.get('username'), password: fd.get('password') };
try {
const res = await fetch(`${API_BASE}/auth/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
if (!res.ok) throw new Error((await res.json()).error || res.status);
const data = await res.json();
localStorage.setItem('token', data.token);
location.hash = '#/lessons';
} catch (err) {
alert(err.message || 'Failed');
}
});
</script>
`;
}

async function router() {
renderAuthLinks();
const { path, params } = parseRoute(location.hash);
const view = routes[path] || routes['/'];
const htmlStr = await view(params);
document.getElementById('app').innerHTML = htmlStr;
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
