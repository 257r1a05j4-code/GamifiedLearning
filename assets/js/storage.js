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

    const SUBJECT_KEYS = ['math','science','english','social','computers','history','geography'];

    function normalizeSubjectProgress(subject){
        return {
            quizzesTaken: subject?.quizzesTaken || 0,
            bestScore: subject?.bestScore || 0,
            timeMinutes: subject?.timeMinutes || 0,
            sessions: Array.isArray(subject?.sessions) ? subject.sessions : []
        };
    }

    function normalizeProfile(profile, name){
        const normalized = {
            name: profile?.name || name || 'Player',
            role: profile?.role || 'student',
            email: profile?.email || '',
            phone: profile?.phone || '',
            emailVerified: !!profile?.emailVerified,
            currentGrade: profile?.currentGrade || '',
            school: profile?.school || '',
            dob: profile?.dob || '',
            gender: profile?.gender || '',
            location: profile?.location || '',
            spocId: profile?.spocId || '',
            points: profile?.points || 0,
            badges: Array.isArray(profile?.badges) ? profile.badges : [],
            streak: profile?.streak ? {
                current: profile.streak.current || 0,
                best: profile.streak.best || 0,
                lastDate: profile.streak.lastDate || ''
            } : { current: 0, best: 0, lastDate: '' },
            preferences: {
                ttsEnabled: typeof profile?.preferences?.ttsEnabled === 'boolean' ? profile.preferences.ttsEnabled : false,
                voiceInputEnabled: typeof profile?.preferences?.voiceInputEnabled === 'boolean' ? profile.preferences.voiceInputEnabled : false,
                preferredLanguage: profile?.preferences?.preferredLanguage || 'en'
            },
            progress: { subjects: {} },
            journal: Array.isArray(profile?.journal) ? profile.journal : [],
            calendarEvents: Array.isArray(profile?.calendarEvents) ? profile.calendarEvents : []
        };

        const subjects = profile?.progress?.subjects || {};
        SUBJECT_KEYS.forEach(key => {
            normalized.progress.subjects[key] = normalizeSubjectProgress(subjects[key]);
        });
        return normalized;
    }

    function ensureUserProfile(name){
        if (!name) return null;
        const users = _read(LS_KEYS.USERS, {});
        if (!users[name]){
            users[name] = normalizeProfile({ name }, name);
            _write(LS_KEYS.USERS, users);
            return users[name];
        }
        const normalized = normalizeProfile(users[name], name);
        if (JSON.stringify(normalized) !== JSON.stringify(users[name])){
            users[name] = normalized;
            _write(LS_KEYS.USERS, users);
        }
        return normalized;
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
        const profile = users[name];
        if (!profile) return ensureUserProfile(name);
        const normalized = normalizeProfile(profile, name);
        if (JSON.stringify(normalized) !== JSON.stringify(profile)){
            users[name] = normalized;
            _write(LS_KEYS.USERS, users);
        }
        return normalized;
    }
    function saveUserProfile(profile){
        if (!profile?.name) return null;
        const users = _read(LS_KEYS.USERS, {});
        const normalized = normalizeProfile(profile, profile.name);
        users[normalized.name] = normalized;
        _write(LS_KEYS.USERS, users);
        return normalized;
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
        if (!SUBJECT_KEYS.includes(subjectKey)) return;
        const profile = getUserProfile(name);
        const subj = normalizeSubjectProgress(profile.progress.subjects[subjectKey]);
        subj.quizzesTaken += 1;
        if (scorePct !== undefined && scorePct !== null){
            subj.bestScore = Math.max(subj.bestScore || 0, Math.round(scorePct));
        }
        profile.progress.subjects[subjectKey] = subj;
        const updated = saveUserProfile(profile);
        upsertLeaderboard(updated);
    }

    function _dateKey(dateLike){
        const date = dateLike ? new Date(dateLike) : new Date();
        return !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    }

    function _applyLearningStreak(profile, dateLike){
        const streak = profile.streak || { current: 0, best: 0, lastDate: '' };
        const todayKey = _dateKey(dateLike);
        if (streak.lastDate === todayKey) return streak;
        if (!streak.lastDate){
            streak.current = 1;
        } else {
            const last = new Date(streak.lastDate);
            const today = new Date(todayKey);
            const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
            if (diffDays === 0){
                // already marked today
            } else if (diffDays === 1){
                streak.current = (streak.current || 0) + 1;
            } else if (diffDays > 1){
                streak.current = 1;
            }
        }
        streak.best = Math.max(streak.best || 0, streak.current || 1);
        streak.lastDate = todayKey;
        profile.streak = streak;
        return streak;
    }

    function logStudySession(name, subjectKey, durationMinutes, options = {}){
        if (!SUBJECT_KEYS.includes(subjectKey)) return null;
        const duration = Math.max(0, Number(durationMinutes) || 0);
        const profile = getUserProfile(name);
        const subj = normalizeSubjectProgress(profile.progress.subjects[subjectKey]);
        if (duration > 0){
            subj.timeMinutes = (subj.timeMinutes || 0) + duration;
            subj.sessions = subj.sessions || [];
            const session = {
                duration: Math.round(duration * 100) / 100,
                ts: Date.now(),
                note: options.note || '',
                mode: options.mode || 'self'
            };
            subj.sessions.push(session);
            if (subj.sessions.length > 200){
                subj.sessions = subj.sessions.slice(-200);
            }
            _applyLearningStreak(profile, options.date || session.ts);
        }
        if (typeof options.bestScore === 'number'){
            subj.bestScore = Math.max(subj.bestScore || 0, Math.round(options.bestScore));
        }
        profile.progress.subjects[subjectKey] = subj;
        const updated = saveUserProfile(profile);
        upsertLeaderboard(updated);
        return { ...subj };
    }

    function getStudyAnalytics(name){
        const profile = getUserProfile(name);
        const subjects = profile.progress.subjects;
        const analytics = {};
        SUBJECT_KEYS.forEach(key => {
            const subj = normalizeSubjectProgress(subjects[key]);
            const totalSessions = subj.sessions.length;
            const averageSession = totalSessions ? subj.timeMinutes / totalSessions : 0;
            analytics[key] = {
                quizzesTaken: subj.quizzesTaken,
                bestScore: subj.bestScore,
                timeMinutes: subj.timeMinutes,
                sessions: subj.sessions.slice(-20),
                averageSession: Number(averageSession.toFixed(1))
            };
        });
        return {
            streak: profile.streak,
            subjects: analytics
        };
    }

    function updatePreferences(name, preferences = {}){
        const profile = getUserProfile(name);
        profile.preferences = {
            ...profile.preferences,
            ...preferences
        };
        return saveUserProfile(profile).preferences;
    }

    function addJournalEntry(name, entry){
        const profile = getUserProfile(name);
        const journal = Array.isArray(profile.journal) ? profile.journal : [];
        const item = {
            id: entry?.id || `jr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: (entry?.text || '').trim(),
            mood: entry?.mood || 'neutral',
            subject: entry?.subject || '',
            ts: entry?.ts || Date.now()
        };
        if (!item.text && !entry?.allowEmpty) return null;
        journal.push(item);
        if (journal.length > 200){
            journal.splice(0, journal.length - 200);
        }
        profile.journal = journal;
        saveUserProfile(profile);
        return item;
    }

    function updateJournalEntry(name, entryId, update){
        const profile = getUserProfile(name);
        const journal = Array.isArray(profile.journal) ? profile.journal : [];
        const idx = journal.findIndex(e => e.id === entryId);
        if (idx === -1) return null;
        journal[idx] = { ...journal[idx], ...update, id: journal[idx].id };
        profile.journal = journal;
        saveUserProfile(profile);
        return journal[idx];
    }

    function deleteJournalEntry(name, entryId){
        const profile = getUserProfile(name);
        const journal = Array.isArray(profile.journal) ? profile.journal : [];
        const filtered = journal.filter(entry => entry.id !== entryId);
        if (filtered.length === journal.length) return false;
        profile.journal = filtered;
        saveUserProfile(profile);
        return true;
    }

    function listJournalEntries(name){
        return getUserProfile(name).journal.slice().sort((a,b)=> b.ts - a.ts);
    }

    function _generateEventId(){
        return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }

    function upsertCalendarEvent(name, event){
        const profile = getUserProfile(name);
        const events = Array.isArray(profile.calendarEvents) ? profile.calendarEvents : [];
        const id = event.id || _generateEventId();
        const normalized = {
            id,
            title: event.title || 'Learning session',
            date: _dateKey(event.date || Date.now()),
            subject: event.subject || '',
            type: event.type || 'practice',
            duration: Number(event.duration || 0),
            completed: !!event.completed
        };
        const idx = events.findIndex(e => e.id === id);
        if (idx >= 0){
            events[idx] = { ...events[idx], ...normalized };
        } else {
            events.push(normalized);
        }
        profile.calendarEvents = events;
        saveUserProfile(profile);
        return normalized;
    }

    function getCalendarEvents(name){
        const events = getUserProfile(name).calendarEvents.slice();
        events.sort((a,b) => a.date.localeCompare(b.date));
        return events;
    }

    function removeCalendarEvent(name, eventId){
        const profile = getUserProfile(name);
        const events = Array.isArray(profile.calendarEvents) ? profile.calendarEvents : [];
        const filtered = events.filter(evt => evt.id !== eventId);
        if (filtered.length === events.length) return false;
        profile.calendarEvents = filtered;
        saveUserProfile(profile);
        return true;
    }

    function markCalendarEventComplete(name, eventId, completed = true){
        const profile = getUserProfile(name);
        const events = Array.isArray(profile.calendarEvents) ? profile.calendarEvents : [];
        const idx = events.findIndex(evt => evt.id === eventId);
        if (idx === -1) return null;
        events[idx].completed = !!completed;
        profile.calendarEvents = events;
        saveUserProfile(profile);
        return events[idx];
    }

    function resetLearningStreak(name){
        const profile = getUserProfile(name);
        profile.streak = { current: 0, best: profile.streak?.best || 0, lastDate: '' };
        saveUserProfile(profile);
        return profile.streak;
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

    function setLanguage(code){
        _write(LS_KEYS.LANGUAGE, code);
        try {
            const name = getCurrentUser();
            const profile = getUserProfile(name);
            profile.preferences = {
                ...profile.preferences,
                preferredLanguage: code
            };
            saveUserProfile(profile);
        } catch (err) {
            // ignore storage write failures silently
        }
    }
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
        const subjectAgg = {}; // key -> {sum, count}
        const badgeCounts = {};
        for (const p of profiles){
            for (const b of (p.badges||[])) badgeCounts[b] = (badgeCounts[b]||0)+1;
            for (const [key, s] of Object.entries(p.progress.subjects || {})){
                totalQuizzes += s.quizzesTaken || 0;
                if (s.bestScore > 0){
                    if (!subjectAgg[key]) subjectAgg[key] = { sum:0, count:0 };
                    subjectAgg[key].sum += s.bestScore;
                    subjectAgg[key].count += 1;
                }
            }
        }
        const averageScoreBySubject = Object.fromEntries(Object.entries(subjectAgg).map(([k,v])=>[k, v.count ? (v.sum / v.count) : 0]));
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
        logStudySession, getStudyAnalytics,
        updatePreferences,
        addJournalEntry, updateJournalEntry, deleteJournalEntry, listJournalEntries,
        upsertCalendarEvent, getCalendarEvents, removeCalendarEvent, markCalendarEventComplete,
        resetLearningStreak,
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


