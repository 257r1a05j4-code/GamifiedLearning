const BackendSync = (() => {
    const API_BASE = window.__GL_API_BASE__ || 'http://localhost:4000/api';

    async function request(path, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || 6000);
        try {
            const res = await fetch(`${API_BASE}${path}`, {
                headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
                ...options,
                signal: controller.signal
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const text = await res.text();
            return text ? JSON.parse(text) : null;
        } finally {
            clearTimeout(timeout);
        }
    }

    async function fetchSubjects() {
        try {
            const data = await request('/subjects');
            return data?.subjects || [];
        } catch (err) {
            console.warn('Subject fetch failed', err);
            return [];
        }
    }

    async function fetchStats() {
        try {
            const data = await request('/stats');
            return data?.stats || null;
        } catch (err) {
            console.warn('Stats fetch failed', err);
            return null;
        }
    }

    async function syncProfile(payload) {
        try {
            if (!payload || !payload.name) return null;
            return await request('/profiles/sync', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn('Profile sync failed', err);
            return null;
        }
    }

    async function submitLeaderboard(entry) {
        try {
            if (!entry || !entry.name) return null;
            return await request('/leaderboard/global', {
                method: 'POST',
                body: JSON.stringify(entry)
            });
        } catch (err) {
            console.warn('Leaderboard sync failed', err);
            return null;
        }
    }

    async function fetchLeaderboard() {
        try {
            const data = await request('/leaderboard/global');
            return data?.leaderboard || [];
        } catch (err) {
            console.warn('Leaderboard fetch failed', err);
            return [];
        }
    }

    return {
        API_BASE,
        fetchSubjects,
        fetchStats,
        syncProfile,
        submitLeaderboard,
        fetchLeaderboard
    };
})();
