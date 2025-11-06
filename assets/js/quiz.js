(function initQuiz(){
    const params = new URLSearchParams(location.search);
    const subject = params.get('subject') || 'math';

    const SUBJECT_META = {
        math:  { title: I18n.t('subject_math'), emoji:'🧮', color:'var(--c-math)' },
        science:{ title: I18n.t('subject_science'), emoji:'🔬', color:'var(--c-science)' },
        english:{ title: I18n.t('subject_english'), emoji:'📚', color:'var(--c-english)' },
    };

    const QUESTIONS = {
        math: [
            { q:'5 + 3 = ?', a:['6','7','8','9'], c:2 },
            { q:'10 - 4 = ?', a:['4','6','7','5'], c:1 },
            { q:'2 × 3 = ?', a:['5','6','7','8'], c:1 },
            { q:'12 ÷ 3 = ?', a:['3','4','5','6'], c:1 },
            { q:'The number after 9 is', a:['8','9','10','11'], c:2 },
        ],
        science: [
            { q:'Animals need air, water and ___ to live.', a:['rocks','food','plastic','salt'], c:1 },
            { q:'The sun is a', a:['planet','star','comet','cloud'], c:1 },
            { q:'Plants make food using', a:['milk','soil','sunlight','metal'], c:2 },
            { q:'Water turns to vapor when we', a:['freeze it','boil it','shake it','color it'], c:1 },
            { q:'Humans breathe using their', a:['wings','fins','lungs','roots'], c:2 },
        ],
        english: [
            { q:'Opposite of "big" is', a:['small','large','tall','wide'], c:0 },
            { q:'Pick the noun', a:['run','fast','book','very'], c:2 },
            { q:'"I ___ a mango"', a:['eat','eats','eated','eating'], c:0 },
            { q:'Plural of "child" is', a:['childs','childes','children','childrens'], c:2 },
            { q:'Synonym of "happy"', a:['sad','angry','glad','slow'], c:2 },
        ]
    };

    const meta = SUBJECT_META[subject] || SUBJECT_META.math;
    const title = document.getElementById('quizTitle');
    const pill = document.getElementById('quizSubjectPill');
    if (title) title.textContent = `${meta.emoji} ${meta.title}`;
    if (pill){ pill.textContent = meta.title; pill.style.borderColor = meta.color; }

    const list = document.getElementById('quizContainer');
    const qs = QUESTIONS[subject] || QUESTIONS.math;
    list.innerHTML = qs.map((item, idx) => `
        <div class="question">
            <h3>Q${idx+1}. ${item.q}</h3>
            <div class="options">
                ${item.a.map((opt, i) => `
                    <label class="option"><input type="radio" name="q${idx}" value="${i}"> <span>${opt}</span></label>
                `).join('')}
            </div>
        </div>
    `).join('');

    const submitBtn = document.getElementById('submitQuizBtn');
    const resultCard = document.getElementById('quizResult');
    const scoreEl = document.getElementById('scorePct');
    const pointsEl = document.getElementById('pointsGained');
    const badgesEl = document.getElementById('badgesEarned');

    submitBtn.addEventListener('click', () => {
        // Calculate score
        let correct = 0;
        qs.forEach((item, idx) => {
            const chosen = document.querySelector(`input[name="q${idx}"]:checked`);
            if (chosen && Number(chosen.value) === item.c) correct += 1;
        });
        const pct = Math.round((correct / qs.length) * 100);
        const user = StorageAPI.getCurrentUser();

        // Award points
        const pointsGained = correct * 5; // 5 points per correct answer
        StorageAPI.addPoints(user, pointsGained);
        StorageAPI.updateSubjectProgress(user, subject, pct);

        // Badges
        const earned = [];
        if (pct === 100){ earned.push('🏆 Perfect'); }
        if (correct >= Math.ceil(qs.length * 0.8)) { earned.push('🌟 Star'); }
        const profile = StorageAPI.getUserProfile(user);
        const subj = profile.progress.subjects[subject];
        if (subj && subj.quizzesTaken === 1) { earned.push('🎯 First Quiz'); }
        earned.forEach(b => StorageAPI.addBadge(user, b));

        // UI Result
        scoreEl.textContent = `${pct}%`;
        pointsEl.textContent = String(pointsGained);
        badgesEl.innerHTML = earned.map(b => `<span class="badge">${b}</span>`).join(' ');
        resultCard.hidden = false;

        // Update footer points
        const p = StorageAPI.getUserProfile(user).points;
        const totalPointsEl = document.getElementById('totalPoints');
        if (totalPointsEl) totalPointsEl.textContent = String(p);
    });
})();


