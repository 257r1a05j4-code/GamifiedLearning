(function initDashboard(){
    const container = document.getElementById('subjects');
    const missionList = document.getElementById('missionList');
    const leaguePreview = document.getElementById('leaguePreview');
    const playerNameEl = document.getElementById('playerName');

    const fallbackSubjects = [
        { id: 'math', emoji: '🧮', category: I18n.t('home_card_tier_core'), difficulty: '', description: I18n.t('home_card_math') },
        { id: 'science', emoji: '🔬', category: I18n.t('home_card_tier_lab'), difficulty: '', description: I18n.t('home_card_science') },
        { id: 'english', emoji: '📚', category: I18n.t('home_card_tier_story'), difficulty: '', description: I18n.t('home_card_english') },
        { id: 'social', emoji: '🏛️', category: I18n.t('home_card_tier_new'), difficulty: '', description: I18n.t('home_card_social') },
        { id: 'computers', emoji: '💻', category: I18n.t('home_card_tier_future'), difficulty: '', description: I18n.t('home_card_computers') },
        { id: 'history', emoji: '🏺', category: I18n.t('home_card_tier_legends'), difficulty: '', description: I18n.t('home_card_history') },
        { id: 'geography', emoji: '🌍', category: I18n.t('home_card_tier_world'), difficulty: '', description: I18n.t('home_card_geography') }
    ];

    const currentUser = StorageAPI.getCurrentUser();
    const profile = StorageAPI.getUserProfile(currentUser);
    const subjectsProgress = profile?.progress?.subjects || {};

    if (playerNameEl) {
        playerNameEl.textContent = currentUser;
    }

    function renderStats(){
        const totalPoints = profile.points || 0;
        const badgeCount = (profile.badges || []).length;
        const totalQuizzes = Object.values(subjectsProgress).reduce((sum, subj) => sum + (subj.quizzesTaken || 0), 0);
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        setText('playerPoints', totalPoints);
        setText('playerBadges', badgeCount);
        setText('playerQuizzes', totalQuizzes);
    }

    function subjectMetaToCard(subject){
        const progress = subjectsProgress[subject.id] || { quizzesTaken: 0, bestScore: 0 };
        const categoryLabel = subject.category && subject.difficulty ? `${subject.category} • ${subject.difficulty}` : subject.category || '';
        return `
            <article class="card" data-subject="${subject.id}">
                <div class="card-emoji">${subject.emoji || '🎯'}</div>
                ${categoryLabel ? `<small>${categoryLabel}</small>` : ''}
                <h3>${I18n.t(`subject_${subject.id}`) || subject.title || subject.id}</h3>
                <p>${subject.description || I18n.t(`home_card_${subject.id}`) || ''}</p>
                <div class="progress-row">
                    <span data-i18n="label_quizzes">${I18n.t('label_quizzes')}</span>: <strong>${progress.quizzesTaken || 0}</strong>
                    <span class="spacer"></span>
                    <span data-i18n="label_best">${I18n.t('label_best')}</span>: <strong>${progress.bestScore || 0}%</strong>
                </div>
                <a class="btn btn-secondary" href="quiz.html?subject=${subject.id}" data-i18n="btn_take_quiz">${I18n.t('btn_take_quiz')}</a>
            </article>
        `;
    }

    function renderSubjects(subjectList){
        if (!container) return;
        const list = subjectList && subjectList.length ? subjectList : fallbackSubjects;
        container.innerHTML = list.map(subjectMetaToCard).join('');
        I18n.apply();
    }

    function renderMissions(){
        if (!missionList) return;
        const subjectEntries = Object.entries(subjectsProgress);
        subjectEntries.sort((a, b) => (a[1].bestScore || 0) - (b[1].bestScore || 0));
        const focusSubject = subjectEntries[0]?.[0] || 'math';
        const focusLabel = I18n.t(`subject_${focusSubject}`) || focusSubject;
        const missions = [
            { icon: '🔥', text: `Score 80%+ in ${focusLabel} on Hard difficulty.` },
            { icon: '🤝', text: 'Invite a friend to join your clan and compare badges.' },
            { icon: '🧭', text: 'Review yesterday’s quiz solutions and add one learning note.' }
        ];
        missionList.innerHTML = missions.map(m => `
            <li><span>${m.icon}</span><span>${m.text}</span></li>
        `).join('');
    }

    async function renderLeaguePreview(){
        if (!leaguePreview) return;
        const list = await BackendSync.fetchLeaderboard();
        if (!list.length){
            leaguePreview.innerHTML = `<div class="note">Take a quiz to appear on the global board.</div>`;
            return;
        }
        const topThree = list.slice(0, 3);
        leaguePreview.innerHTML = `
            <ol class="leaderboard-list">
                ${topThree.map((entry, idx) => `
                    <li class="${entry.name === currentUser ? 'me' : ''}">
                        <span class="rank">#${idx + 1}</span>
                        <span class="name">${entry.name}</span>
                        <span class="points">${entry.points} ⭐</span>
                        <span class="badges">${(entry.badges || []).map(b => `<span class="badge">${b}</span>`).join('')}</span>
                    </li>
                `).join('')}
            </ol>
        `;
    }

    renderStats();
    renderMissions();
    renderLeaguePreview();

    BackendSync.fetchSubjects().then(renderSubjects);
})();
