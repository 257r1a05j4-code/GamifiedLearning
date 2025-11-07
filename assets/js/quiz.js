(function initQuiz(){
    const params = new URLSearchParams(location.search);
    const subject = params.get('subject') || 'math';

    const SUBJECT_META = {
        math:  { title: I18n.t('subject_math'), emoji:'🧮', color:'var(--c-math)' },
        science:{ title: I18n.t('subject_science'), emoji:'🔬', color:'var(--c-science)' },
        english:{ title: I18n.t('subject_english'), emoji:'📚', color:'var(--c-english)' },
        social:  { title: I18n.t('subject_social'), emoji:'🏛️', color:'var(--c-social)' },
        computers:{ title: I18n.t('subject_computers'), emoji:'💻', color:'var(--c-computers)' },
        history:{ title: I18n.t('subject_history'), emoji:'🏺', color:'var(--c-history)' },
        geography:{ title: I18n.t('subject_geography'), emoji:'🌍', color:'var(--c-geography)' },
    };

    // Expanded bank with difficulty, optional hint (h) and explanation (e)
    const QUESTIONS = {
        math: [
            { q:'5 + 3 = ?', a:['6','7','8','9'], c:2, d:'easy', h:'Add 5 and 3', e:'5 + 3 equals 8.' },
            { q:'10 - 4 = ?', a:['4','6','7','5'], c:1, d:'easy', h:'Subtract 4 from 10', e:'10 - 4 equals 6.' },
            { q:'2 × 3 = ?', a:['5','6','7','8'], c:1, d:'easy', h:'Two groups of three', e:'2 × 3 equals 6.' },
            { q:'12 ÷ 3 = ?', a:['3','4','5','6'], c:1, d:'easy', e:'12 divided by 3 equals 4.' },
            { q:'The number after 9 is', a:['8','9','10','11'], c:2, d:'easy' },
            { q:'15 + 27 = ?', a:['32','40','42','44','52'], c:2, d:'medium', h:'Add tens then ones', e:'15+27= (10+20) + (5+7) = 30+12 = 42.' },
            { q:'96 - 38 = ?', a:['48','58','66','68','72'], c:0, d:'medium', h:'Borrow from tens', e:'96-38 = 58.' },
            { q:'7 × 8 = ?', a:['54','56','58','64','72'], c:1, d:'medium', e:'7×8=56 (memory fact).' },
            { q:'(36 ÷ 6) + 9 = ?', a:['12','13','14','15','16'], c:2, d:'medium' },
            { q:'What is the value of x: 3x = 27', a:['6','7','8','9','10'], c:3, d:'medium', e:'Divide both sides by 3 -> x=9.' },
            { q:'Solve: 2x + 5 = 19', a:['5','6','7','8','9'], c:2, d:'hard', e:'2x=14 -> x=7.' },
            { q:'LCM of 6 and 8', a:['12','16','18','24','48'], c:3, d:'hard', e:'Multiples: 6,12,18,24…; 8,16,24… LCM=24.' },
            { q:'Prime number among these', a:['21','33','41','49','51'], c:2, d:'hard', e:'41 is prime.' },
            { q:'Fraction 3/4 equals', a:['0.5','0.6','0.75','0.8','0.9'], c:2, d:'medium' },
            { q:'Area of rectangle 7×5', a:['30','32','35','40','45'], c:2, d:'easy' },
        ],
        science: [
            { q:'Animals need air, water and ___ to live.', a:['rocks','food','plastic','salt'], c:1, d:'easy' },
            { q:'The sun is a', a:['planet','star','comet','cloud'], c:1, d:'easy' },
            { q:'Plants make food using', a:['milk','soil','sunlight','metal'], c:2, d:'easy' },
            { q:'Water turns to vapor when we', a:['freeze it','boil it','shake it','color it'], c:1, d:'easy' },
            { q:'Humans breathe using their', a:['wings','fins','lungs','roots'], c:2, d:'easy' },
            { q:'Which is a mammal?', a:['Frog','Shark','Whale','Eagle','Ant'], c:2, d:'medium', e:'Whales are mammals.' },
            { q:'Process of water cycle: evaporation → ___ → precipitation', a:['melting','condensation','filtration','boiling','freezing'], c:1, d:'medium' },
            { q:'Source of renewable energy', a:['Coal','Oil','Wind','Gas','Diesel'], c:2, d:'medium' },
            { q:'Plants breathe through', a:['stomata','roots','stem','flower','fruit'], c:0, d:'medium' },
            { q:'Part of cell controlling activities', a:['Nucleus','Chlorophyll','Cytoplasm','Membrane','Mitochondria'], c:0, d:'hard' },
            { q:'Boiling point of water (°C)', a:['50','80','90','100','120'], c:3, d:'easy' },
            { q:'Gas most in Earth atmosphere', a:['Oxygen','Carbon Dioxide','Nitrogen','Hydrogen','Argon'], c:2, d:'hard' },
            { q:'Photosynthesis happens in', a:['Roots','Leaves','Stem','Flowers','Seeds'], c:1, d:'easy' },
            { q:'Which causes seasons?', a:['Moon phases','Earth rotation','Earth revolution & tilt','Sunspots','Tides'], c:2, d:'hard' },
            { q:'Animal that lays eggs', a:['Cow','Dog','Bat','Hen','Whale'], c:3, d:'easy' },
        ],
        english: [
            { q:'Opposite of "big" is', a:['small','large','tall','wide'], c:0, d:'easy' },
            { q:'Pick the noun', a:['run','fast','book','very'], c:2, d:'easy' },
            { q:'"I ___ a mango"', a:['eat','eats','eated','eating'], c:0, d:'easy' },
            { q:'Plural of "child" is', a:['childs','childes','children','childrens'], c:2, d:'medium' },
            { q:'Synonym of "happy"', a:['sad','angry','glad','slow'], c:2, d:'easy' },
            { q:'Choose adjective', a:['quickly','beauty','blue','run','near'], c:2, d:'medium' },
            { q:'Correct article: ___ apple', a:['a','an','the','no article'], c:1, d:'easy' },
            { q:'Past tense of "go"', a:['goed','going','went','gone'], c:2, d:'medium' },
            { q:'Antonym of "brave"', a:['cowardly','bold','fearless','strong','mighty'], c:0, d:'medium' },
            { q:'Choose preposition', a:['under','quick','smile','slow','green'], c:0, d:'easy' },
            { q:'Identify the verb: "Birds fly high"', a:['Birds','fly','high','Birds fly'], c:1, d:'easy' },
            { q:'Correct sentence', a:['He do work','He does work','He dids work','He did work'], c:1, d:'hard' },
            { q:'Synonym of "begin"', a:['start','end','finish','close','stop'], c:0, d:'easy' },
            { q:'Choose conjunction', a:['and','blue','quickly','book','ran'], c:0, d:'easy' },
            { q:'Passive voice of "She writes a letter"', a:['A letter is written by her','A letter wrote by her','A letter was write by her','She is written a letter'], c:0, d:'hard' },
        ],
        social: [
            { q:'Who leads a Gram Panchayat?', a:['Sarpanch','Collector','Mayor','Governor'], c:0, d:'easy', e:'The elected head of a Gram Panchayat is the Sarpanch.' },
            { q:'The Constitution of India came into effect in', a:['1945','1947','1950','1952'], c:2, d:'medium' },
            { q:'Public order and police are primarily the responsibility of which government level?', a:['Union','State','District','Municipal'], c:1, d:'medium' },
            { q:'Identify the first step in solving a community issue', a:['Collect money','Identify the problem','Blame others','Call media'], c:1, d:'easy' },
            { q:'How often is the Census of India conducted?', a:['Every 5 years','Every 7 years','Every 10 years','Every 12 years'], c:2, d:'medium' },
            { q:'Which programme provides cooked meals to school children in India?', a:['Ayushman Bharat','Mid-Day Meal Scheme','Digital India','Skill India'], c:1, d:'easy' },
            { q:'The Panchayati Raj system has how many tiers in most states?', a:['1','2','3','4'], c:2, d:'medium', h:'Think village, block, district.' },
            { q:'A citizen-led clean-up drive is an example of', a:['Passive citizenship','Community participation','Judicial order','Private business'], c:1, d:'easy' },
            { q:'United Nations Sustainable Development Goals count to', a:['10','12','15','17'], c:3, d:'hard' },
            { q:'Article 21 of the Indian Constitution protects the right to', a:['Education','Freedom of speech','Life and personal liberty','Form associations'], c:2, d:'hard' },
        ],
        computers: [
            { q:'CPU stands for', a:['Central Processing Unit','Computer Personal Unit','Central Program Utility','Core Power Unit'], c:0, d:'easy' },
            { q:'Which is an input device?', a:['Monitor','Keyboard','Printer','Speaker'], c:1, d:'easy' },
            { q:'Strong password should include', a:['name only','123456','mix of letters, numbers, symbols','only symbols'], c:2, d:'easy' },
            { q:'Internet safety: never share', a:['favorite color','home address','pet name','hobby'], c:1, d:'medium' },
            { q:'File extension for an image', a:['.jpg','.exe','.mp3','.txt'], c:0, d:'easy' },
        ],
        history: [
            { q:'The Taj Mahal was built by', a:['Akbar','Shah Jahan','Aurangzeb','Babur'], c:1, d:'easy' },
            { q:'Ancient script in India', a:['Devanagari','Brahmi','Latin','Arabic'], c:1, d:'medium' },
            { q:'Mahatma Gandhi led the', a:['Green Revolution','Dandi March','Industrial Revolution','French Revolution'], c:1, d:'easy' },
            { q:'Harappa civilization is also called', a:['Indus Valley','Roman','Mayan','Greek'], c:0, d:'easy' },
            { q:'Ashoka’s emblem has how many lions?', a:['1','2','3','4'], c:3, d:'medium' },
        ],
        geography: [
            { q:'Largest continent', a:['Africa','Asia','Europe','Antarctica'], c:1, d:'easy' },
            { q:'The Nile is a', a:['Desert','Mountain','River','Lake'], c:2, d:'easy' },
            { q:'Capital of India', a:['Mumbai','Delhi','Kolkata','Chennai'], c:1, d:'easy' },
            { q:'Earth has how many oceans?', a:['3','4','5','6'], c:2, d:'medium' },
            { q:'A map key explains', a:['distance','symbols','weather','time'], c:1, d:'easy' },
        ]
    };

    const meta = SUBJECT_META[subject] || SUBJECT_META.math;
    const title = document.getElementById('quizTitle');
    const pill = document.getElementById('quizSubjectPill');
    if (title) title.textContent = `${meta.emoji} ${meta.title}`;
    if (pill){ pill.textContent = meta.title; pill.style.borderColor = meta.color; }

    const list = document.getElementById('quizContainer');
    const diffSel = document.getElementById('difficultySelect');
    const numSel = document.getElementById('numQuestions');

    function shuffle(arr){
        const a = arr.slice();
        for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
        return a;
    }

    function buildQuiz(){
        const all = QUESTIONS[subject] || QUESTIONS.math;
        const diff = (diffSel && diffSel.value) || 'easy';
        const count = Number((numSel && numSel.value) || 5);
        const pool = all.filter(q => q.d === diff);
        const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
        list.innerHTML = picked.map((item, idx) => `
            <div class="question">
                <h3>Q${idx+1}. ${item.q}</h3>
                <div class="options">
                    ${item.a.map((opt, i) => `
                        <label class="option"><input type="radio" name="q${idx}" value="${i}"> <span>${opt}</span></label>
                    `).join('')}
                </div>
                ${item.h ? `<div class="note"><strong>${I18n.t('label_hint')}:</strong> ${item.h}</div>` : ''}
            </div>
        `).join('');
        return picked;
    }

    let qs = buildQuiz();
    if (diffSel) diffSel.addEventListener('change', ()=>{ qs = buildQuiz(); });
    if (numSel) numSel.addEventListener('change', ()=>{ qs = buildQuiz(); });

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
        // Scale points by difficulty
        const diff = (diffSel && diffSel.value) || 'easy';
        const perCorrect = diff === 'hard' ? 10 : diff === 'medium' ? 7 : 5;
        const pointsGained = correct * perCorrect;
        StorageAPI.addPoints(user, pointsGained);
        StorageAPI.updateSubjectProgress(user, subject, pct);

        // Badges
        const earned = [];
        if (pct === 100){ earned.push('🏆 Perfect'); }
        if (correct >= Math.ceil(qs.length * 0.8)) { earned.push('🌟 Star'); }
        if (pct >= 80 && ((diffSel && diffSel.value) === 'hard')) { earned.push('💡 Scholar'); }
        const profile = StorageAPI.getUserProfile(user);
        const subj = profile.progress.subjects[subject];
        if (subj && subj.quizzesTaken === 1) { earned.push('🎯 First Quiz'); }
        earned.forEach(b => StorageAPI.addBadge(user, b));

        const refreshedProfile = StorageAPI.getUserProfile(user);
        BackendSync.syncProfile({
            name: refreshedProfile.name,
            points: refreshedProfile.points,
            badges: refreshedProfile.badges,
            progress: refreshedProfile.progress,
            minutesLearned: qs.length * 5
        });
        BackendSync.submitLeaderboard({
            name: refreshedProfile.name,
            points: refreshedProfile.points,
            badges: refreshedProfile.badges
        });

        // UI Result
        scoreEl.textContent = `${pct}%`;
        pointsEl.textContent = String(pointsGained);
        badgesEl.innerHTML = earned.map(b => `<span class="badge">${b}</span>`).join(' ');
        resultCard.hidden = false;

        // Review
        const review = document.getElementById('review');
        review.innerHTML = `
            <h3>${I18n.t('label_review')}</h3>
            ${qs.map((item, idx) => {
                const chosen = document.querySelector(`input[name="q${idx}"]:checked`);
                const chosenIdx = chosen ? Number(chosen.value) : -1;
                const correctIdx = item.c;
                const ok = chosenIdx === correctIdx;
                return `
                    <div class="option" style="${ok?'border-color:#bbf7d0;background:#ecfccb':'border-color:#fecaca;background:#fee2e2'}">
                        <div><strong>Q${idx+1}.</strong> ${item.q}</div>
                        <div>Chosen: ${chosenIdx>=0?item.a[chosenIdx]:'—'} | Correct: ${item.a[correctIdx]}</div>
                        ${item.e ? `<div><strong>${I18n.t('label_explanation')}:</strong> ${item.e}</div>` : ''}
                    </div>
                `;
            }).join('')}
        `;

        // Update footer points
        const p = StorageAPI.getUserProfile(user).points;
        const totalPointsEl = document.getElementById('totalPoints');
        if (totalPointsEl) totalPointsEl.textContent = String(p);
    });
})();




