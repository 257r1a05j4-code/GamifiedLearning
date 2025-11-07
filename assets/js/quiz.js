(function initQuiz() {
    const params = new URLSearchParams(location.search);
    const subject = params.get('subject') || 'math';

    const SUBJECT_META = {
        math: { title: I18n.t('subject_math'), emoji: '🧮', color: 'var(--c-math)' },
        science: { title: I18n.t('subject_science'), emoji: '🔬', color: 'var(--c-science)' },
        english: { title: I18n.t('subject_english'), emoji: '📚', color: 'var(--c-english)' },
    };

    const QUESTIONS = {
        math: {
            easy: [
                { q: '5 + 3 = ?', a: ['6', '7', '8', '9'], c: 2 },
                { q: '10 - 4 = ?', a: ['4', '6', '7', '5'], c: 1 },
                { q: 'What is 2+2?', a: ['3', '4', '5', '6'], c: 1 },
                { q: 'How many sides does a triangle have?', a: ['3', '4', '5', '6'], c: 0 },
                { q: 'Which number comes after 5?', a: ['4', '5', '6', '7'], c: 2 }
            ],
            medium: [
                { q: '2 × 3 = ?', a: ['5', '6', '7', '8'], c: 1 },
                { q: '12 ÷ 3 = ?', a: ['3', '4', '5', '6'], c: 1 },
                { q: 'What is 8 * 4?', a: ['28', '30', '32', '34'], c: 2 },
                { q: 'What is 50 / 5?', a: ['5', '10', '15', '20'], c: 1 },
                { q: 'Solve for x: x + 5 = 10', a: ['3', '4', '5', '6'], c: 2 }
            ],
            hard: [
                { q: 'The number after 9 is', a: ['8', '9', '10', '11'], c: 2 },
                { q: 'What is the square root of 81?', a: ['7', '8', '9', '10'], c: 2 },
                { q: 'What is 15% of 200?', a: ['20', '25', '30', '35'], c: 2 },
                { q: 'Solve for x: 2x - 3 = 11', a: ['5', '6', '7', '8'], c: 2 },
                { q: 'What is the area of a circle with radius 5?', a: ['25π', '30π', '35π', '40π'], c: 0 }
            ]
        },
        science: {
            easy: [
                { q: 'Animals need air, water and ___ to live.', a: ['rocks', 'food', 'plastic', 'salt'], c: 1 },
                { q: 'The sun is a', a: ['planet', 'star', 'comet', 'cloud'], c: 1 },
                { q: 'What planet is known as the Red Planet?', a: ['Earth', 'Mars', 'Jupiter', 'Venus'], c: 1 },
                { q: 'Which animal is known as the king of the jungle?', a: ['Tiger', 'Lion', 'Elephant', 'Giraffe'], c: 1 },
                { q: 'What do bees produce?', a: ['Honey', 'Milk', 'Silk', 'Wax'], c: 0 }
            ],
            medium: [
                { q: 'Plants make food using', a: ['milk', 'soil', 'sunlight', 'metal'], c: 2 },
                { q: 'Water turns to vapor when we', a: ['freeze it', 'boil it', 'shake it', 'color it'], c: 1 },
                { q: 'What is the chemical symbol for water?', a: ['H2O', 'CO2', 'O2', 'NaCl'], c: 0 },
                { q: 'How many bones are in the human body?', a: ['206', '208', '210', '212'], c: 0 },
                { q: 'What is the largest mammal in the world?', a: ['Elephant', 'Blue Whale', 'Giraffe', 'Shark'], c: 1 }
            ],
            hard: [
                { q: 'Humans breathe using their', a: ['wings', 'fins', 'lungs', 'roots'], c: 2 },
                { q: 'What is the powerhouse of the cell?', a: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], c: 1 },
                { q: 'What is the speed of light?', a: ['300,000 km/s', '400,000 km/s', '500,000 km/s', '600,000 km/s'], c: 0 },
                { q: 'Who developed the theory of relativity?', a: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Nikola Tesla'], c: 1 },
                { q: 'What is the hardest natural substance on Earth?', a: ['Gold', 'Iron', 'Diamond', 'Platinum'], c: 2 }
            ]
        },
        english: {
            easy: [
                { q: 'Opposite of "big" is', a: ['small', 'large', 'tall', 'wide'], c: 0 },
                { q: 'Pick the noun', a: ['run', 'fast', 'book', 'very'], c: 2 },
                { q: 'Which word is a verb?', a: ['Happy', 'Sing', 'Quickly', 'Blue'], c: 1 },
                { q: 'What is the plural of "cat"?', a: ['Cat', 'Cats', 'Cates', 'Cating'], c: 1 },
                { q: 'Which of these is a color?', a: ['Circle', 'Red', 'Soft', 'Jump'], c: 1 }
            ],
            medium: [
                { q: '"I ___ a mango"', a: ['eat', 'eats', 'eated', 'eating'], c: 0 },
                { q: 'Plural of "child" is', a: ['childs', 'childes', 'children', 'childrens'], c: 2 },
                { q: 'Choose the correct sentence.', a: ['She is go to school.', 'She are going to school.', 'She is going to school.', 'She go to school.'], c: 2 },
                { q: 'What is the past tense of "run"?', a: ['Runned', 'Ran', 'Running', 'Runs'], c: 1 },
                { q: 'Which word is an adjective?', a: ['Play', 'Beautiful', 'Quickly', 'House'], c: 1 }
            ],
            hard: [
                { q: 'Synonym of "happy"', a: ['sad', 'angry', 'glad', 'slow'], c: 2 },
                { q: 'Choose the word that fits: The ___ was beautiful.', a: ['scenery', 'scenary', 'cenery', 'senery'], c: 0 },
                { q: 'Which sentence is grammatically correct?', a: ['They was playing in the park.', 'They were playing in the park.', 'They is playing in the park.', 'They am playing in the park.'], c: 1 },
                { q: 'What is a synonym for "brave"?', a: ['Scared', 'Cowardly', 'Courageous', 'Timid'], c: 2 },
                { q: 'Identify the adverb in the sentence: "She sings beautifully."', a: ['She', 'Sings', 'Beautifully', 'None'], c: 2 }
            ]
        }
    };

    const meta = SUBJECT_META[subject] || SUBJECT_META.math;
    const title = document.getElementById('quizTitle');
    const pill = document.getElementById('quizSubjectPill');
    if (title) title.textContent = `${meta.emoji} ${meta.title}`;
    if (pill) { pill.textContent = meta.title; pill.style.borderColor = meta.color; }

    const list = document.getElementById('quizContainer');
    const difficultyOptions = document.getElementById('difficultyOptions');
    let currentQuestions = [];

    function loadQuestions() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        const questions = QUESTIONS[subject][difficulty] || [];
        currentQuestions = questions;
        list.innerHTML = questions.map((item, idx) => `
            <div class="question">
                <h3>Q${idx + 1}. ${item.q}</h3>
                <div class="options">
                    ${item.a.map((opt, i) => `
                        <label class="option"><input type="radio" name="q${idx}" value="${i}"> <span>${opt}</span></label>
                    `).join('')}
                </div>
            </div>
        `).join('');
        resultCard.hidden = true;
    }

    difficultyOptions.addEventListener('change', loadQuestions);

    const submitBtn = document.getElementById('submitQuizBtn');
    const resultCard = document.getElementById('quizResult');
    const scoreEl = document.getElementById('scorePct');
    const pointsEl = document.getElementById('pointsGained');
    const badgesEl = document.getElementById('badgesEarned');

    submitBtn.addEventListener('click', () => {
        // Calculate score
        let correct = 0;
        currentQuestions.forEach((item, idx) => {
            const chosen = document.querySelector(`input[name="q${idx}"]:checked`);
            if (chosen && Number(chosen.value) === item.c) correct += 1;
        });
        const pct = Math.round((correct / currentQuestions.length) * 100);
        const user = StorageAPI.getCurrentUser();

        // Award points
        const pointsGained = correct * 5; // 5 points per correct answer
        StorageAPI.addPoints(user, pointsGained);
        StorageAPI.updateSubjectProgress(user, subject, pct);

        // Badges
        const earned = [];
        if (pct === 100) { earned.push('🏆 Perfect'); }
        if (correct >= Math.ceil(currentQuestions.length * 0.8)) { earned.push('🌟 Star'); }
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

    loadQuestions(); // Initial load
})();