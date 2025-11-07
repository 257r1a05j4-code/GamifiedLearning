const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data', 'db.json');

const DEFAULT_DATA = {
    subjects: [
        { id: 'math', title: 'Math', emoji: '🧮', category: 'STEM', difficulty: 'Core', color: '#7c3aed', description: 'Master mental math, fractions, and geometry puzzles.' },
        { id: 'science', title: 'Science', emoji: '🔬', category: 'STEM', difficulty: 'Core', color: '#10b981', description: 'Explore ecosystems, energy, and everyday experiments.' },
        { id: 'english', title: 'English', emoji: '📚', category: 'Languages', difficulty: 'Story Mode', color: '#ef4444', description: 'Build vocabulary, grammar, and confident speaking skills.' },
        { id: 'social', title: 'Social Science', emoji: '🏛️', category: 'Civics', difficulty: 'New Season', color: '#f97316', description: 'Understand civics, culture, and community problem solving.' },
        { id: 'computers', title: 'Computers', emoji: '💻', category: 'Future Skills', difficulty: 'Labs', color: '#22d3ee', description: 'Learn digital safety, coding basics, and responsible tech use.' },
        { id: 'history', title: 'History', emoji: '🏺', category: 'Humanities', difficulty: 'Legends', color: '#fbbf24', description: 'Relive journeys of leaders, reforms, and ancient cities.' },
        { id: 'geography', title: 'Geography', emoji: '🌍', category: 'Humanities', difficulty: 'World Tour', color: '#34d399', description: 'Discover maps, climates, and sustainable living tips.' }
    ],
    leaderboard: [
        { id: nanoid(6), name: 'Trailblazer', points: 120, badges: ['Starter'] },
        { id: nanoid(6), name: 'Cyber Scholar', points: 95, badges: ['Starter', 'Star'] },
        { id: nanoid(6), name: 'Village Virtuoso', points: 80, badges: ['Starter'] }
    ],
    users: {},
    stats: { totalLearners: 42000, totalMinutes: 3600000 }
};

async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (_) {
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
    }
}

async function readData() {
    await ensureDataFile();
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function upsertLeaderboard(board, name, points, badges = []) {
    const existingIndex = board.findIndex(entry => entry.name === name);
    const entry = {
        id: existingIndex >= 0 ? board[existingIndex].id : nanoid(6),
        name,
        points: Math.max(points || 0, 0),
        badges: Array.from(new Set([...(board[existingIndex]?.badges || []), ...badges])).slice(0, 10)
    };
    if (existingIndex >= 0) {
        board[existingIndex] = entry;
    } else {
        board.push(entry);
    }
    board.sort((a, b) => b.points - a.points);
    return board;
}

function computeStats(data) {
    const learnerCount = Math.max(Object.keys(data.users || {}).length, 0);
    const totalLearners = Math.max(data.stats?.totalLearners || 0, learnerCount);
    const totalMinutes = data.stats?.totalMinutes || learnerCount * 45;
    const totalQuizzes = Object.values(data.users || {}).reduce((sum, user) => {
        const subjects = user.progress?.subjects || {};
        return sum + Object.values(subjects).reduce((s, subj) => s + (subj.quizzesTaken || 0), 0);
    }, 0);
    return {
        totalLearners,
        totalMinutes,
        totalSubjects: data.subjects.length,
        totalQuizzes,
        leaderboardSize: data.leaderboard.length
    };
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/subjects', async (req, res, next) => {
    try {
        const data = await readData();
        res.json({ subjects: data.subjects });
    } catch (error) {
        next(error);
    }
});

app.get('/api/stats', async (req, res, next) => {
    try {
        const data = await readData();
        res.json({ stats: computeStats(data) });
    } catch (error) {
        next(error);
    }
});

app.post('/api/profiles/sync', async (req, res, next) => {
    try {
        const { name, points = 0, badges = [], progress = {}, minutesLearned = 0 } = req.body || {};
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' });
        }
        const cleanedName = name.trim().slice(0, 60);
        const data = await readData();
        const existing = data.users[cleanedName] || { name: cleanedName, badges: [], points: 0, progress: { subjects: {} } };
        const mergedBadges = Array.from(new Set([...(existing.badges || []), ...badges])).slice(0, 20);
        const mergedProgress = { subjects: { ...(existing.progress?.subjects || {}), ...(progress.subjects || {}) } };
        const profile = {
            name: cleanedName,
            points: Math.max(points, existing.points || 0),
            badges: mergedBadges,
            progress: mergedProgress,
            updatedAt: Date.now()
        };
        data.users[cleanedName] = profile;
        const totalMinutes = Number(minutesLearned) || 0;
        if (totalMinutes > 0) {
            data.stats.totalMinutes = (data.stats.totalMinutes || 0) + totalMinutes;
        }
        upsertLeaderboard(data.leaderboard, cleanedName, profile.points, profile.badges);
        await writeData(data);
        res.json({ ok: true, profile });
    } catch (error) {
        next(error);
    }
});

app.get('/api/leaderboard/global', async (req, res, next) => {
    try {
        const data = await readData();
        res.json({ leaderboard: data.leaderboard });
    } catch (error) {
        next(error);
    }
});

app.post('/api/leaderboard/global', async (req, res, next) => {
    try {
        const { name, points = 0, badges = [] } = req.body || {};
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' });
        }
        const cleanedName = name.trim().slice(0, 60);
        const data = await readData();
        upsertLeaderboard(data.leaderboard, cleanedName, Number(points) || 0, badges || []);
        await writeData(data);
        res.json({ ok: true, leaderboard: data.leaderboard.slice(0, 25) });
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, _next) => {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

ensureDataFile()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`API server listening on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to start server', err);
        process.exit(1);
    });
