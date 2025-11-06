// Simple storage API for offline persistence
const StorageAPI = (() => {
    const LS_KEYS = {
        CURRENT_USER: 'glre.currentUser',
        USERS: 'glre.users', // map of userName -> profile
        LEADERBOARD: 'glre.leaderboard',
        LANGUAGE: 'glre.lang',
        SPOCS: 'glre.spocs', // map of spocId -> spoc data
        USAGE: 'glre.usage', // array of { user, type, subject?, cost, ts }
        PAYMENTS: 'glre.payments' // array of { by:'spoc'|'admin', spocId?, amount, note, ts }
    };

    function _read(key, fallback){
        try{
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        }catch(e){ return fallback; }
    }
    function _write(key, value){
        localStorage.setItem(key, JSON.stringify(value));
    }

    function ensureUserProfile(name){
        if (!name) return null;
        const users = _read(LS_KEYS.USERS, {});
        if (!users[name]){
            users[name] = {
                name,
                role: 'student', // 'student' | 'admin' | 'spoc'
                email: '',
                phone: '',
                emailVerified: false,
                currentGrade: '',
                school: '',
                dob: '',
                gender: '',
                location: '',
                spocId: '',
                points: 0,
                badges: [],
                progress: {
                    subjects: {
                        math: { quizzesTaken: 0, bestScore: 0 },
                        science: { quizzesTaken: 0, bestScore: 0 },
                        english: { quizzesTaken: 0, bestScore: 0 },
                    }
                }
            };
            _write(LS_KEYS.USERS, users);
        }
        return users[name];
    }

    function getCurrentUser(){
        const name = _read(LS_KEYS.CURRENT_USER, 'Player');
        ensureUserProfile(name);
        return name;
    }
    function setCurrentUser(name){
        if (!name || !name.trim()) return;
        const cleaned = name.trim().slice(0, 40);
        _write(LS_KEYS.CURRENT_USER, cleaned);
        ensureUserProfile(cleaned);
    }

    function getUserProfile(name){
        const users = _read(LS_KEYS.USERS, {});
        return users[name] || ensureUserProfile(name);
    }
    function saveUserProfile(profile){
        const users = _read(LS_KEYS.USERS, {});
        users[profile.name] = profile;
        _write(LS_KEYS.USERS, users);
    }

    function addPoints(name, points){
        const profile = getUserProfile(name);
        profile.points = Math.max(0, (profile.points || 0) + (points || 0));
        saveUserProfile(profile);
        upsertLeaderboard(profile);
        return profile.points;
    }

    function addBadge(name, badge){
        const profile = getUserProfile(name);
        if (!profile.badges.includes(badge)){
            profile.badges.push(badge);
            saveUserProfile(profile);
            upsertLeaderboard(profile);
        }
        return profile.badges.slice();
    }

    function getUserProgress(name){
        return getUserProfile(name).progress;
    }
    function updateSubjectProgress(name, subjectKey, scorePct){
        const profile = getUserProfile(name);
        const subj = profile.progress.subjects[subjectKey] || { quizzesTaken: 0, bestScore: 0 };
        subj.quizzesTaken += 1;
        subj.bestScore = Math.max(subj.bestScore || 0, Math.round(scorePct));
        profile.progress.subjects[subjectKey] = subj;
        saveUserProfile(profile);
        upsertLeaderboard(profile);
    }

    function upsertLeaderboard(profile){
        const board = _read(LS_KEYS.LEADERBOARD, []);
        const idx = board.findIndex(e => e.name === profile.name);
        const entry = { name: profile.name, points: profile.points, badges: profile.badges.slice(0, 10) };
        if (idx >= 0) board[idx] = entry; else board.push(entry);
        board.sort((a,b) => b.points - a.points);
        _write(LS_KEYS.LEADERBOARD, board);
    }

    function getLeaderboard(){ return _read(LS_KEYS.LEADERBOARD, []); }

    function setLanguage(code){ _write(LS_KEYS.LANGUAGE, code); }
    function getLanguage(){ return _read(LS_KEYS.LANGUAGE, 'en'); }

    // Auth & Verification
    function signup(data){
        const name = (data.name || '').trim();
        if (!name) return null;
        setCurrentUser(name);
        const profile = getUserProfile(name);
        Object.assign(profile, {
            email: data.email || '',
            phone: data.phone || '',
            currentGrade: data.currentGrade || '',
            school: data.school || '',
            dob: data.dob || '',
            gender: data.gender || '',
            location: data.location || '',
            role: data.role || 'student'
        });
        saveUserProfile(profile);
        return profile;
    }
    function login(name){ setCurrentUser(name); return getUserProfile(name); }
    function logout(){ _write(LS_KEYS.CURRENT_USER, 'Player'); }
    function setEmailVerified(name, verified){ const p = getUserProfile(name); p.emailVerified = !!verified; saveUserProfile(p); }

    // SPOC management
    function _readSpocs(){ return _read(LS_KEYS.SPOCS, {}); }
    function _writeSpocs(spocs){ _write(LS_KEYS.SPOCS, spocs); }
    function createSpoc(spoc){
        const spocs = _readSpocs();
        const id = spoc.id || `SPOC-${Date.now()}`;
        spocs[id] = { id, name: spoc.name || id, owner: spoc.owner || '', budget: spoc.budget || 0, spent: spoc.spent || 0, notes: spoc.notes || '' };
        _writeSpocs(spocs);
        return spocs[id];
    }
    function listSpocs(){ return Object.values(_readSpocs()); }
    function updateSpoc(id, update){ const sp = _readSpocs(); if (!sp[id]) return; sp[id] = { ...sp[id], ...update }; _writeSpocs(sp); return sp[id]; }
    function assignUserToSpoc(userName, spocId){ const p = getUserProfile(userName); p.spocId = spocId; saveUserProfile(p); }

    // Usage & Cost tracking
    function trackUsage(entry){
        const arr = _read(LS_KEYS.USAGE, []);
        arr.push({ user: entry.user, type: entry.type, subject: entry.subject || '', cost: Number(entry.cost||0), ts: Date.now() });
        _write(LS_KEYS.USAGE, arr);
        if (entry.cost && entry.spocId){
            const sp = _readSpocs();
            if (sp[entry.spocId]){ sp[entry.spocId].spent = (sp[entry.spocId].spent||0) + Number(entry.cost); _writeSpocs(sp); }
        }
    }
    function getUsageStats(filter={}){
        const arr = _read(LS_KEYS.USAGE, []);
        const out = arr.filter(e => (!filter.spocId || getUserProfile(e.user).spocId === filter.spocId));
        const totalCost = out.reduce((s,e)=>s + (e.cost||0), 0);
        const byType = {};
        out.forEach(e => { byType[e.type] = (byType[e.type]||0)+1; });
        return { totalEvents: out.length, totalCost, byType };
    }

    // Payments
    function addPayment(rec){
        const arr = _read(LS_KEYS.PAYMENTS, []);
        arr.push({ by: rec.by||'spoc', spocId: rec.spocId||'', amount: Number(rec.amount||0), note: rec.note||'', ts: Date.now() });
        _write(LS_KEYS.PAYMENTS, arr);
        if (rec.spocId){ updateSpoc(rec.spocId, { spent: Math.max(0, (updateSpoc(rec.spocId, {}).spent||0) - 0) }); }
        return arr[arr.length-1];
    }
    function listPayments(filter={}){
        const arr = _read(LS_KEYS.PAYMENTS, []);
        return arr.filter(p => (!filter.spocId || p.spocId === filter.spocId));
    }

    function getAnalytics(){
        const users = _read(LS_KEYS.USERS, {});
        const profiles = Object.values(users);
        let totalQuizzes = 0;
        const subTotals = { math: {sum:0, count:0}, science:{sum:0,count:0}, english:{sum:0,count:0} };
        const badgeCounts = {};
        for (const p of profiles){
            for (const b of (p.badges||[])) badgeCounts[b] = (badgeCounts[b]||0)+1;
            for (const [key, s] of Object.entries(p.progress.subjects || {})){
                totalQuizzes += s.quizzesTaken || 0;
                if (s.bestScore > 0){ subTotals[key].sum += s.bestScore; subTotals[key].count += 1; }
            }
        }
        const averageScoreBySubject = {
            math: subTotals.math.count ? (subTotals.math.sum / subTotals.math.count) : 0,
            science: subTotals.science.count ? (subTotals.science.sum / subTotals.science.count) : 0,
            english: subTotals.english.count ? (subTotals.english.sum / subTotals.english.count) : 0,
        };
        const averageScoreAll = (()=>{
            const vals = Object.values(averageScoreBySubject);
            return vals.length ? (vals.reduce((a,b)=>a+b,0) / vals.length) : 0;
        })();
        return { totalQuizzes, averageScoreBySubject, averageScoreAll, badgeCounts };
    }

    return {
        getCurrentUser, setCurrentUser,
        getUserProfile, saveUserProfile,
        addPoints, addBadge,
        getUserProgress, updateSubjectProgress,
        getLeaderboard,
        setLanguage, getLanguage,
        // auth
        signup, login, logout, setEmailVerified,
        // spoc
        createSpoc, listSpocs, updateSpoc, assignUserToSpoc,
        // usage & payments
        trackUsage, getUsageStats, addPayment, listPayments,
        getAnalytics,
    };
})();


