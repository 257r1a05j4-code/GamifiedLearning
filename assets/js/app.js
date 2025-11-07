(function initCommon(){
    // Footer year
    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());

    // Language select
    const langSelect = document.getElementById('langSelect');
    if (langSelect){
        langSelect.value = StorageAPI.getLanguage();
        langSelect.addEventListener('change', () => {
            StorageAPI.setLanguage(langSelect.value);
            I18n.apply();
        });
    }

    // User box
    const nameInput = document.getElementById('userNameInput');
    const saveUserBtn = document.getElementById('saveUserBtn');
    if (nameInput && saveUserBtn){
        nameInput.value = StorageAPI.getCurrentUser();
        saveUserBtn.addEventListener('click', () => {
            StorageAPI.setCurrentUser(nameInput.value);
            nameInput.value = StorageAPI.getCurrentUser();
            renderTotalPoints();
        });
    }

    function renderTotalPoints(){
        const el = document.getElementById('totalPoints');
        if (!el) return;
        const p = StorageAPI.getUserProfile(StorageAPI.getCurrentUser()).points || 0;
        el.textContent = String(p);
    }
    renderTotalPoints();

    // Initial language render
    I18n.apply();
})();




