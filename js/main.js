document.addEventListener('DOMContentLoaded', () => {
    Game.init();
    Game.selectedChar = 0;
    Game.selectedMap = 'city';

    const mainMenu = document.getElementById('mainMenu');
    const charMenu = document.getElementById('charMenu');
    const mapMenu = document.getElementById('mapMenu');
    const gameOver = document.getElementById('gameOverScreen');
    const pauseScreen = document.getElementById('pauseScreen');
    const controls = document.getElementById('controlsHint');

    function showScreen(screen) {
        [mainMenu, charMenu, mapMenu, gameOver, pauseScreen].forEach(s => s.classList.add('hidden'));
        controls.style.display = 'none';
        if (screen === 'main') { mainMenu.classList.remove('hidden'); controls.style.display = 'block'; }
        if (screen === 'char') charMenu.classList.remove('hidden');
        if (screen === 'map') mapMenu.classList.remove('hidden');
        if (screen === 'gameover') gameOver.classList.remove('hidden');
        if (screen === 'pause') pauseScreen.classList.remove('hidden');
        if (screen === 'playing') { controls.style.display = 'block'; setTimeout(()=>controls.style.display='none', 4000); }
    }

    function updatePreview() {
        const cvs = document.getElementById('previewCanvas');
        drawCharacter(cvs, CHARACTERS[Game.selectedChar]);
        document.getElementById('charPreviewName').textContent = CHARACTERS[Game.selectedChar].name;
        document.getElementById('menuHighscore').textContent = Game.highscore.wave;
        document.getElementById('menuKills').textContent = Game.highscore.kills;
    }

    function buildCharGrid() {
        const grid = document.getElementById('charGrid');
        grid.innerHTML = '';
        CHARACTERS.forEach((c, i) => {
            const card = document.createElement('div');
            card.className = 'character-card' + (i === Game.selectedChar ? ' selected' : '');
            const av = document.createElement('div'); av.className = 'avatar';
            const cvs = document.createElement('canvas'); cvs.width = 128; cvs.height = 128;
            drawCharacter(cvs, c);
            av.appendChild(cvs);
            const nm = document.createElement('div'); nm.className = 'character-name'; nm.textContent = c.name;
            card.appendChild(av); card.appendChild(nm);
            card.onclick = () => {
                Game.selectedChar = i;
                document.querySelectorAll('.character-card').forEach(x => x.classList.remove('selected'));
                card.classList.add('selected');
                updatePreview();
            };
            grid.appendChild(card);
        });
    }

    document.getElementById('btnPlay').onclick = () => { showScreen('playing'); Game.startGame(); };
    document.getElementById('btnChars').onclick = () => { showScreen('char'); buildCharGrid(); };
    document.getElementById('btnBackChars').onclick = () => showScreen('main');
    document.getElementById('btnMaps').onclick = () => showScreen('map');
    document.getElementById('btnBackMaps').onclick = () => showScreen('main');
    document.getElementById('btnRestart').onclick = () => { showScreen('playing'); Game.startGame(); };
    document.getElementById('btnMenu').onclick = () => { Game.state = 'MENU'; showScreen('main'); updatePreview(); };
    document.getElementById('btnResume').onclick = () => Game.togglePause();
    document.getElementById('btnQuit').onclick = () => { Game.state = 'MENU'; document.exitPointerLock(); showScreen('main'); updatePreview(); };

    document.querySelectorAll('.map-card').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            Game.selectedMap = card.dataset.map;
            setTimeout(() => { showScreen('playing'); Game.startGame(); }, 300);
        };
    });

    updatePreview();
    showScreen('main');
});