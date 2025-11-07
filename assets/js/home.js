(function initHomePage(){
    const numberCompact = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
    const SUBJECT_META = {
        math: { label: 'Math', colorClass: 'math', emoji: '🧮' },
        science: { label: 'Science', colorClass: 'science', emoji: '🔬' },
        english: { label: 'English', colorClass: 'english', emoji: '📚' },
        social: { label: 'Social Science', colorClass: 'social', emoji: '🏛️' },
        computers: { label: 'Computers', colorClass: 'computers', emoji: '💻' },
        history: { label: 'History', colorClass: 'history', emoji: '🏺' },
        geography: { label: 'Geography', colorClass: 'geography', emoji: '🌍' }
    };
    const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const state = {
        session: {
            active: false,
            subject: 'math',
            startedAt: null,
            timerId: null
        },
        analytics: null,
        preferences: StorageAPI.updatePreferences ? StorageAPI.getUserProfile(StorageAPI.getCurrentUser()).preferences : {},
        recognition: null,
        listening: false
    };

    function $(selector){ return document.querySelector(selector); }
    function resolveVoiceLang(code){
        switch(code){
            case 'hi': return 'hi-IN';
            case 'kn': return 'kn-IN';
            case 'te': return 'te-IN';
            case 'ml': return 'ml-IN';
            default: return 'en-IN';
        }
    }
    function setText(id, value){
        const el = typeof id === 'string' ? document.getElementById(id) : id;
        if (el && value !== undefined && value !== null){
            el.textContent = value;
        }
    }
    function safeHtml(str){ return String(str || '').replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch])); }

    function capitalize(key){ return key ? key.charAt(0).toUpperCase() + key.slice(1) : ''; }

    function renderSubjectProgress(){
        const name = StorageAPI.getCurrentUser();
        const profile = StorageAPI.getUserProfile(name);
        const subjects = profile?.progress?.subjects || {};
        Object.entries(subjects).forEach(([key, info]) => {
            const prefix = capitalize(key);
            setText(`stat${prefix}Quizzes`, info.quizzesTaken ?? 0);
            setText(`stat${prefix}Best`, `${info.bestScore ?? 0}%`);
        });
    }

    function renderStats(stats){
        if (!stats) return;
        if (stats.totalLearners !== undefined){ setText('statLearners', `${numberCompact.format(stats.totalLearners)}+`); }
        if (stats.totalSubjects !== undefined){ setText('statSubjects', String(stats.totalSubjects)); }
        if (stats.totalMinutes !== undefined){ setText('statMinutes', numberCompact.format(stats.totalMinutes)); }
    }

    function applySubjectMeta(list){
        if (!Array.isArray(list)) return;
        list.forEach(subject => {
            const card = document.querySelector(`article.card[data-subject="${subject.id}"]`);
            if (!card) return;
            const ribbon = card.querySelector('small');
            if (ribbon){ ribbon.textContent = `${subject.category} • ${subject.difficulty}`; }
            const descriptionEl = card.querySelector('p');
            if (descriptionEl){ descriptionEl.textContent = subject.description; }
        });
    }

    function loadAnalytics(){
        state.analytics = StorageAPI.getStudyAnalytics(StorageAPI.getCurrentUser());
    }

    function renderStreak(){
        if (!state.analytics) return;
        const streak = state.analytics.streak || { current: 0, best: 0, lastDate: '' };
        setText('streakCurrent', streak.current || 0);
        setText('streakBest', streak.best || 0);
        setText('streakBadge', `${streak.current || 0} day${streak.current === 1 ? '' : 's'} 🔄`);
        setText('streakLast', streak.lastDate ? new Date(streak.lastDate).toLocaleDateString() : '—');
    }

    function renderSubjectAnalytics(){
        const container = $('#subjectAnalytics');
        if (!container) return;
        container.innerHTML = '';
        if (!state.analytics) return;
        Object.entries(state.analytics.subjects).forEach(([key, data]) => {
            const meta = SUBJECT_META[key] || { label: capitalize(key), emoji: '🎯' };
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'subject-pill';
            button.dataset.subject = key;
            button.innerHTML = `<span>${meta.emoji}</span><strong>${meta.label}</strong><span>${Math.round(data.bestScore)}% best • ${Math.round(data.timeMinutes)} min</span>`;
            button.addEventListener('click', () => {
                state.session.subject = key;
                const subjectSelect = $('#sessionSubject');
                if (subjectSelect) subjectSelect.value = key;
            });
            container.appendChild(button);
        });
    }

    function buildRecommendations(){
        if (!state.analytics) return [];
        const entries = Object.entries(state.analytics.subjects);
        if (!entries.length) return [];
        const weakest = entries.reduce((min, curr) => curr[1].bestScore < min[1].bestScore ? curr : min, entries[0]);
        const lowestTime = entries.reduce((min, curr) => curr[1].timeMinutes < min[1].timeMinutes ? curr : min, entries[0]);
        const strongest = entries.reduce((max, curr) => curr[1].bestScore > max[1].bestScore ? curr : max, entries[0]);

        const list = [];
        list.push({
            text: `You’re strong in ${SUBJECT_META[strongest[0]]?.label || strongest[0]}. Try Level 3 ${SUBJECT_META[weakest[0]]?.label || weakest[0]} next!`,
            type: 'challenge'
        });
        if (weakest[1].bestScore < 70){
            list.push({
                text: `Redo a quick quiz on ${SUBJECT_META[weakest[0]]?.label || weakest[0]} to push your best score above 70%.`,
                type: 'remedial'
            });
        }
        if (lowestTime[1].timeMinutes < 20){
            list.push({
                text: `You’ve only spent ${Math.round(lowestTime[1].timeMinutes)} mins on ${SUBJECT_META[lowestTime[0]]?.label || lowestTime[0]}. Schedule a 15 min practice today.`,
                type: 'time'
            });
        }
        return list.slice(0, 4);
    }

    function renderRecommendations(){
        const listEl = $('#recommendationsList');
        if (!listEl) return;
        listEl.innerHTML = '';
        const recos = buildRecommendations();
        if (!recos.length){
            const li = document.createElement('li');
            li.textContent = 'Complete a quiz to unlock personalised recommendations.';
            listEl.appendChild(li);
            return;
        }
        recos.forEach(reco => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="highlight">${reco.text}</span>`;
            listEl.appendChild(li);
        });
    }

    function updateTeacherAlerts(){
        const list = $('#teacherAlerts');
        if (!list) return;
        list.innerHTML = '';
        if (!state.analytics) return;
        const alertSubjects = Object.entries(state.analytics.subjects)
            .filter(([, data]) => data.bestScore < 60 || data.timeMinutes < 15)
            .slice(0, 3);
        if (!alertSubjects.length){
            const li = document.createElement('li');
            li.textContent = 'All learners are on track. Check back after new quizzes.';
            list.appendChild(li);
            return;
        }
        alertSubjects.forEach(([key, data]) => {
            const li = document.createElement('li');
            li.textContent = `${SUBJECT_META[key]?.label || key}: boost practice (${Math.round(data.timeMinutes)} mins, best ${Math.round(data.bestScore)}%).`;
            list.appendChild(li);
        });
    }

    function refreshInsights(){
        loadAnalytics();
        renderStreak();
        renderSubjectAnalytics();
        renderRecommendations();
        updateTeacherAlerts();
        renderCalendar();
        renderEventsList();
        renderJournal();
    }

    function formatTimer(ms){
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    function startSession(){
        if (state.session.active) return;
        state.session.subject = $('#sessionSubject')?.value || state.session.subject || 'math';
        state.session.startedAt = Date.now();
        state.session.active = true;
        $('#startSessionBtn')?.setAttribute('disabled', 'disabled');
        $('#stopSessionBtn')?.removeAttribute('disabled');
        state.session.timerId = setInterval(() => {
            setText('sessionTimer', formatTimer(Date.now() - state.session.startedAt));
        }, 1000);
    }

    function stopSession(){
        if (!state.session.active) return;
        const elapsed = Date.now() - (state.session.startedAt || Date.now());
        clearInterval(state.session.timerId);
        state.session.timerId = null;
        state.session.active = false;
        $('#startSessionBtn')?.removeAttribute('disabled');
        $('#stopSessionBtn')?.setAttribute('disabled', 'disabled');
        setText('sessionTimer', '00:00');
        const minutes = Math.max(1, Math.round(elapsed / 60000));
        StorageAPI.logStudySession(StorageAPI.getCurrentUser(), state.session.subject, minutes);
        refreshInsights();
        TutorBot.enqueueTutorMessage(`Logged ${minutes} minutes of ${SUBJECT_META[state.session.subject]?.label || state.session.subject}. Great job!`);
    }

    function resetStreak(){
        StorageAPI.resetLearningStreak(StorageAPI.getCurrentUser());
        refreshInsights();
    }

    const TutorBot = (() => {
        const chatWindow = $('#chatWindow');
        const ttsSupported = 'speechSynthesis' in window;

        function appendMessage(role, text){
            if (!chatWindow) return;
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${role}`;
            bubble.innerHTML = `<span class="chat-meta">${role === 'user' ? 'You' : 'Tutor'}</span><p>${safeHtml(text)}</p>`;
            chatWindow.appendChild(bubble);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            if (role === 'tutor') speak(text);
        }

        function speak(text){
            if (!state.preferences?.ttsEnabled || !ttsSupported) return;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = resolveVoiceLang(state.preferences.preferredLanguage);
            window.speechSynthesis.speak(utterance);
        }

        function generateReply(message){
            const lower = message.toLowerCase();
            if (!state.analytics){ loadAnalytics(); }
            const weakest = state.analytics ? Object.entries(state.analytics.subjects).reduce((min,curr) => curr[1].bestScore < min[1].bestScore ? curr : min) : null;
            if (lower.includes('hello') || lower.includes('hi')){
                return 'Namaskara! 👋 Ready for today’s quest? Ask for a subject, a story hint, or say “Plan my day”.';
            }
            if (lower.includes('plan') || lower.includes('day')){
                if (weakest){
                    const subjectLabel = SUBJECT_META[weakest[0]]?.label || weakest[0];
                    return `Let’s dedicate 15 mins to ${subjectLabel}. I have scheduled a practice event for you on the calendar.`;
                }
                return 'Let’s start with a warm-up quiz, then a story mission. I’ve added both to your calendar.';
            }
            if (lower.includes('voice')){
                return 'Voice help is on standby. Tap the mic button and say “Start Math lesson” or “Explain in Kannada”.';
            }
            if (weakest && lower.includes('weak')){
                const subjectLabel = SUBJECT_META[weakest[0]]?.label || weakest[0];
                return `Your lowest score is in ${subjectLabel}. Try the revision deck I’ve queued for you.`;
            }
            if (lower.includes('story')){
                return 'Launching the story quest: “Save the village lake”. Listen to the narration and answer the riddles!';
            }
            return 'Got it! I will analyse your progress and ping you with a new quest. You can also ask in हिन्दी or ಕನ್ನಡ.';
        }

        function handleSubmit(e){
            e.preventDefault();
            const input = $('#chatMessage');
            if (!input || !input.value.trim()) return;
            const message = input.value.trim();
            appendMessage('user', message);
            input.value = '';
            setTimeout(() => {
                const reply = generateReply(message);
                appendMessage('tutor', reply);
            }, 300);
        }

        function enqueueTutorMessage(text){ appendMessage('tutor', text); }

        function init(){
            $('#chatForm')?.addEventListener('submit', handleSubmit);
            if (chatWindow){
                appendMessage('tutor', 'Hello! I am your AI tutor. Ask me for a study plan or press Start Timer to begin focused practice.');
            }
        }

        return { init, enqueueTutorMessage };
    })();

    function initSessionControls(){
        $('#startSessionBtn')?.addEventListener('click', startSession);
        $('#stopSessionBtn')?.addEventListener('click', stopSession);
        $('#sessionSubject')?.addEventListener('change', (e) => { state.session.subject = e.target.value; });
        $('#resetStreakBtn')?.addEventListener('click', resetStreak);
    }

    function initPreferences(){
        const prefs = state.preferences || {};
        const ttsToggle = $('#toggleTts');
        const voiceToggle = $('#toggleVoiceInput');
        if (ttsToggle){
            ttsToggle.checked = !!prefs.ttsEnabled;
            ttsToggle.addEventListener('change', () => {
                state.preferences = StorageAPI.updatePreferences(StorageAPI.getCurrentUser(), { ttsEnabled: ttsToggle.checked });
            });
        }
        if (voiceToggle){
            voiceToggle.checked = !!prefs.voiceInputEnabled;
            voiceToggle.addEventListener('change', () => {
                state.preferences = StorageAPI.updatePreferences(StorageAPI.getCurrentUser(), { voiceInputEnabled: voiceToggle.checked });
            });
        }
        initVoiceInput();
    }

    function initVoiceInput(){
        const voiceBtn = $('#voiceRecordBtn');
        if (!voiceBtn) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition){
            voiceBtn.disabled = true;
            voiceBtn.title = 'Voice input not supported on this device';
            return;
        }
        state.recognition = new SpeechRecognition();
        state.recognition.lang = resolveVoiceLang(state.preferences?.preferredLanguage);
        state.recognition.interimResults = false;
        state.recognition.addEventListener('result', (event) => {
            const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
            const input = $('#chatMessage');
            if (input){
                input.value = `${input.value ? `${input.value} ` : ''}${transcript}`.trim();
                input.focus();
            }
            state.listening = false;
            voiceBtn.setAttribute('aria-pressed', 'false');
            voiceBtn.textContent = '🎙️ Voice';
        });
        state.recognition.addEventListener('end', () => {
            state.listening = false;
            voiceBtn.setAttribute('aria-pressed', 'false');
            voiceBtn.textContent = '🎙️ Voice';
        });
        voiceBtn.addEventListener('click', () => {
            if (!state.preferences?.voiceInputEnabled){
                TutorBot.enqueueTutorMessage('Enable voice input toggle to start listening.');
                return;
            }
            if (state.listening){
                state.recognition.stop();
                state.listening = false;
                return;
            }
            try{
                state.recognition.start();
                state.listening = true;
                voiceBtn.setAttribute('aria-pressed', 'true');
                voiceBtn.textContent = '🔴 Listening…';
            }catch(err){
                console.warn(err);
            }
        });
    }

    function initOfflineFeatures(){
        const indicator = $('#offlineIndicator');
        const tutorStatus = $('#tutorStatus');
        const updateStatus = () => {
            const online = navigator.onLine;
            if (indicator){ indicator.textContent = online ? 'You are online ⚡' : 'Offline mode active • syncing soon'; }
            if (tutorStatus){ tutorStatus.textContent = online ? 'Online • Sync ready' : 'Offline • Stored locally'; }
        };
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();

        const downloadList = $('#downloadQueue');
        if (downloadList){
            const packs = [
                { name: 'Grade 6 Math Basics', size: '12 MB', status: 'Ready' },
                { name: 'Science Story Pack (Kannada)', size: '18 MB', status: 'Downloaded' },
                { name: 'English Audio Flashcards', size: '8 MB', status: 'Queued' }
            ];
            downloadList.innerHTML = packs.map(pack => `<li>${safeHtml(pack.name)} • ${pack.size} • ${pack.status}</li>`).join('');
        }

        $('#installPwaBtn')?.addEventListener('click', () => {
            alert('Open in Chrome and tap “Add to Home screen” to install offline.');
        });

        $('#downloadDialectBtn')?.addEventListener('click', () => {
            alert('Dialect packs queued. They will download fully when you are on Wi-Fi.');
        });
    }

    function initCommunity(){
        const stories = $('#successStories');
        if (stories){
            const data = [
                { name: 'Lakshmi • Tumakuru', story: 'Improved Math score by 30% using voice quests.' },
                { name: 'Ayaan • Bidar', story: 'Built a STEM club with recycled materials.' }
            ];
            stories.innerHTML = data.map(item => `<li><strong>${safeHtml(item.name)}</strong>: ${safeHtml(item.story)}</li>`).join('');
        }
        const fame = $('#wallOfFame');
        if (fame){
            const board = StorageAPI.getLeaderboard().slice(0, 5);
            if (!board.length){
                fame.innerHTML = '<li>Complete a mission to enter the Wall of Fame!</li>';
            } else {
                fame.innerHTML = board.map((entry, idx) => `<li>#${idx+1} ${safeHtml(entry.name)} — ${entry.points} pts</li>`).join('');
            }
        }
    }

    function initCalendar(){
        $('#addEventBtn')?.addEventListener('click', () => {
            const subject = prompt('Which subject? (math/science/english/etc)') || 'general';
            const date = prompt('Enter date (YYYY-MM-DD)', new Date().toISOString().slice(0,10));
            const type = prompt('Type (practice/assessment/community)', 'practice') || 'practice';
            if (!date) return;
            StorageAPI.upsertCalendarEvent(StorageAPI.getCurrentUser(), { subject, date, type, title: `${capitalize(subject)} session`, duration: 20 });
            refreshInsights();
        });
    }

    function renderCalendar(){
        const grid = $('#calendarGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const events = StorageAPI.getCalendarEvents(StorageAPI.getCurrentUser());
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const first = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        DAY_LABELS.forEach(label => {
            const cell = document.createElement('div');
            cell.className = 'day header';
            cell.textContent = label;
            grid.appendChild(cell);
        });
        for (let i = 0; i < first.getDay(); i++){
            const empty = document.createElement('div');
            empty.className = 'day';
            grid.appendChild(empty);
        }
        for (let day = 1; day <= daysInMonth; day++){
            const cellDate = new Date(year, month, day);
            const iso = cellDate.toISOString().slice(0,10);
            const dayEvents = events.filter(evt => evt.date === iso);
            const cell = document.createElement('div');
            cell.className = 'day';
            if (iso === today.toISOString().slice(0,10)) cell.classList.add('today');
            cell.innerHTML = `<strong>${day}</strong>`;
            dayEvents.forEach(evt => {
                const dot = document.createElement('span');
                dot.className = `event-dot ${evt.type}`;
                cell.appendChild(dot);
            });
            grid.appendChild(cell);
        }
    }

    function renderEventsList(){
        const list = $('#eventList');
        if (!list) return;
        const events = StorageAPI.getCalendarEvents(StorageAPI.getCurrentUser());
        list.innerHTML = '';
        events.slice(0, 6).forEach(evt => {
            const li = document.createElement('li');
            li.innerHTML = `<div><strong>${safeHtml(evt.title || 'Learning session')}</strong><div class="event-meta">${evt.date} • ${evt.subject || 'general'}</div></div>`;
            const action = document.createElement('button');
            action.className = 'btn btn-ghost';
            action.type = 'button';
            action.textContent = evt.completed ? 'Completed' : 'Mark done';
            if (evt.completed) action.setAttribute('disabled', 'disabled');
            action.addEventListener('click', () => {
                StorageAPI.markCalendarEventComplete(StorageAPI.getCurrentUser(), evt.id, true);
                refreshInsights();
            });
            li.appendChild(action);
            list.appendChild(li);
        });
    }

    function initJournal(){
        $('#journalForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const subject = $('#journalSubject')?.value || '';
            const mood = $('#journalMood')?.value || 'neutral';
            const text = $('#journalText')?.value.trim();
            if (!text) return;
            StorageAPI.addJournalEntry(StorageAPI.getCurrentUser(), { text, subject, mood });
            $('#journalText').value = '';
            refreshInsights();
        });
    }

    function renderJournal(){
        const list = $('#journalList');
        const chip = $('#journalCount');
        if (!list) return;
        const entries = StorageAPI.listJournalEntries(StorageAPI.getCurrentUser()).slice(0, 8);
        if (chip) chip.textContent = `${entries.length} entries`;
        list.innerHTML = '';
        if (!entries.length){
            const li = document.createElement('li');
            li.className = 'journal-entry';
            li.textContent = 'Write your first reflection to build a habit!';
            list.appendChild(li);
            return;
        }
        entries.forEach(entry => {
            const li = document.createElement('li');
            li.className = 'journal-entry';
            const header = document.createElement('header');
            header.innerHTML = `<span>${new Date(entry.ts).toLocaleString()}</span><strong>${entry.subject || 'General'} • ${entry.mood}</strong>`;
            const body = document.createElement('p');
            body.textContent = entry.text;
            const actions = document.createElement('div');
            actions.className = 'journal-actions';
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-ghost';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                StorageAPI.deleteJournalEntry(StorageAPI.getCurrentUser(), entry.id);
                refreshInsights();
            });
            actions.appendChild(deleteBtn);
            li.appendChild(header);
            li.appendChild(body);
            li.appendChild(actions);
            list.appendChild(li);
        });
    }

    function initForms(){
        $('#partnerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thanks! We will reach out with partnership details.');
            e.target.reset();
        });
        $('#contactForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Message sent. Expect a callback within 24 hours.');
            e.target.reset();
        });
    }

    function seedDefaultEvents(){
        const events = StorageAPI.getCalendarEvents(StorageAPI.getCurrentUser());
        if (!events.length){
            const today = new Date();
            StorageAPI.upsertCalendarEvent(StorageAPI.getCurrentUser(), { title: 'Math practice', subject: 'math', type: 'practice', date: today.toISOString().slice(0,10), duration: 20 });
            const tomorrow = new Date(today.getTime() + 86400000);
            StorageAPI.upsertCalendarEvent(StorageAPI.getCurrentUser(), { title: 'Science story quest', subject: 'science', type: 'community', date: tomorrow.toISOString().slice(0,10), duration: 25 });
        }
    }

    function seedStories(){ refreshInsights(); }

    function init(){
    renderSubjectProgress();
        seedDefaultEvents();
        refreshInsights();
        initSessionControls();
        initPreferences();
        initOfflineFeatures();
        initCommunity();
        initCalendar();
        initJournal();
        initForms();
        TutorBot.init();
        seedStories();
    }

    document.addEventListener('language-change', (event) => {
        state.preferences = StorageAPI.getUserProfile(StorageAPI.getCurrentUser()).preferences;
        if (state.recognition){
            state.recognition.lang = resolveVoiceLang(state.preferences?.preferredLanguage);
        }
    });

    BackendSync.fetchStats().then(renderStats);
    BackendSync.fetchSubjects().then(applySubjectMeta);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.session.active){ stopSession(); }
    });

    init();
})();
