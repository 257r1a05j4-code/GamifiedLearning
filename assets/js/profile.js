(function initProfile(){
    const profile = StorageAPI.getUserProfile(StorageAPI.getCurrentUser());
    const subjects = profile.progress?.subjects || {};

    const fieldMap = {
        profileName: profile.name,
        profileEmail: profile.email || '—',
        profilePhone: profile.phone || '—',
        profileRole: (profile.role || 'student').toUpperCase(),
        profileSchool: profile.school || '—',
        profileGrade: profile.currentGrade || '—',
        profileLocation: profile.location || '—'
    };

    Object.entries(fieldMap).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    const pointsEl = document.getElementById('profilePoints');
    if (pointsEl) pointsEl.textContent = profile.points || 0;

    const badgeCountEl = document.getElementById('profileBadgeCount');
    if (badgeCountEl) badgeCountEl.textContent = (profile.badges || []).length;

    const verifyEl = document.getElementById('profileVerified');
    if (verifyEl) verifyEl.textContent = profile.emailVerified ? 'Verified' : 'Pending';

    const badgeCloud = document.getElementById('profileBadges');
    if (badgeCloud){
        if (!profile.badges || !profile.badges.length){
            badgeCloud.innerHTML = '<div class="note">Earn badges by finishing missions.</div>';
        } else {
            badgeCloud.innerHTML = profile.badges.map(b => `<span class="badge">${b}</span>`).join('');
        }
    }

    const progressTable = document.getElementById('profileProgress');
    if (progressTable){
        const rows = Object.entries(subjects).map(([key, info]) => `
            <div class="option">
                <div><strong>${I18n.t(`subject_${key}`) || key}</strong></div>
                <div>Quizzes: ${info.quizzesTaken || 0}</div>
                <div>Best: ${info.bestScore || 0}%</div>
            </div>
        `).join('');
        progressTable.innerHTML = rows || '<div class="note">Take a quiz to see progress.</div>';
    }

    const syncBtn = document.getElementById('syncProfileBtn');
    if (syncBtn){
        syncBtn.addEventListener('click', async () => {
            syncBtn.disabled = true;
            syncBtn.textContent = 'Syncing...';
            await BackendSync.syncProfile({
                name: profile.name,
                points: profile.points,
                badges: profile.badges,
                progress: profile.progress
            });
            syncBtn.textContent = 'Synced!';
            setTimeout(() => {
                syncBtn.textContent = 'Sync to Cloud';
                syncBtn.disabled = false;
            }, 2000);
        });
    }
})();
