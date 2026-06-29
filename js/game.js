const Game = {
    state: 'MENU',
    player: null,
    zombies: [],
    pickups: [],
    kills: 0,
    headshots: 0,
    wave: 0,
    waveTimer: 0,
    waveZombiesLeft: 0,
    betweenWaves: false,
    map: null,
    notifications: [],
    damageIndicators: [],
    
    weapons: [
        { name: 'KNIFE', dmg: 30, rate: 500, ammo: Infinity, mag: Infinity, spread: 0, auto: false, recoil: 0, range: 1.5 },
        { name: 'PISTOL', dmg: 25, rate: 250, ammo: 60, mag: 12, spread: 0.02, auto: false, recoil: 0.5, range: 30 },
        { name: 'SHOTGUN', dmg: 15, rate: 900, ammo: 32, mag: 8, spread: 0.12, auto: false, recoil: 1.2, range: 15, pellets: 6 },
        { name: 'RIFLE', dmg: 22, rate: 100, ammo: 180, mag: 30, spread: 0.04, auto: true, recoil: 0.3, range: 40 }
    ],
    
    keys: {},
    mouse: { x: 0, y: 0, down: false, dx: 0, dy: 0 },
    lastTime: 0,
    selectedChar: 0,
    selectedMap: 'city',
    highscore: {
        wave: parseInt(localStorage.getItem('zsWaveHS')) || 0,
        kills: parseInt(localStorage.getItem('zsKillsHS')) || 0
    },
    
    maps: {
        city: {
            theme: 'city', w: 32, h: 32,
            grid: (() => {
                const m = new Array(32*32).fill(0);
                // Border
                for (let i = 0; i < 32; i++) { m[i] = 1; m[31*32+i] = 1; m[i*32] = 1; m[i*32+31] = 1; }
                // Buildings
                const buildings = [
                    {x:4,y:4,w:6,h:6}, {x:14,y:3,w:5,h:7}, {x:23,y:4,w:5,h:5},
                    {x:3,y:14,w:7,h:5}, {x:14,y:13,w:4,h:6}, {x:22,y:12,w:6,h:7},
                    {x:5,y:22,w:5,h:6}, {x:14,y:22,w:6,h:5}, {x:23,y:22,w:5,h:5}
                ];
                buildings.forEach(b => {
                    for (let y = b.y; y < b.y + b.h; y++) {
                        for (let x = b.x; x < b.x + b.w; x++) {
                            m[y*32+x] = 1;
                        }
                    }
                });
                // Alleys - carve paths through buildings
                for (let y = 5; y < 9; y++) { m[y*32+9] = 0; m[y*32+10] = 0; }
                for (let y = 15; y < 18; y++) { m[y*32+6] = 0; m[y*32+7] = 0; }
                for (let y = 24; y < 27; y++) { m[y*32+25] = 0; m[y*32+26] = 0; }
                for (let x = 16; x < 20; x++) { m[15*32+x] = 0; }
                for (let x = 25; x < 28; x++) { m[24*32+x] = 0; }
                // Rubble (type 2 walls)
                m[11*32+3] = 2; m[11*32+4] = 2;
                m[20*32+11] = 2; m[21*32+11] = 2;
                m[29*32+20] = 2;
                return m;
            })(),
            props: [
                {x: 6.5, y: 12.5, propType: 'barrel', size: 0.7},
                {x: 12.5, y: 10.5, propType: 'crate', size: 0.8},
                {x: 20.5, y: 20.5, propType: 'car', size: 1.2},
                {x: 26.5, y: 6.5, propType: 'barrel', size: 0.7},
                {x: 9.5, y: 26.5, propType: 'crate', size: 0.8},
                {x: 15.5, y: 20.5, propType: 'barrel', size: 0.7},
                {x: 28.5, y: 28.5, propType: 'car', size: 1.2},
                {x: 3.5, y: 28.5, propType: 'barrel', size: 0.7},
                {x: 28.5, y: 3.5, propType: 'crate', size: 0.8},
                {x: 17.5, y: 5.5, propType: 'barrel', size: 0.7}
            ],
            spawn: { x: 2.5, y: 2.5 },
            zombieSpawnCount: { normal: 5, runner: 2, brute: 1 }
        },
        forest: {
            theme: 'forest', w: 32, h: 32,
            grid: (() => {
                const m = new Array(32*32).fill(0);
                for (let i = 0; i < 32; i++) { m[i] = 1; m[31*32+i] = 1; m[i*32] = 1; m[i*32+31] = 1; }
                // Maze-like forest with lots of trees
                for (let y = 2; y < 30; y += 3) {
                    for (let x = 2; x < 30; x += 3) {
                        if (Math.random() < 0.55 && !(x === 2 && y === 2)) {
                            m[y*32+x] = 1;
                            // Cluster trees
                            if (Math.random() < 0.4 && x+1 < 31) m[y*32+(x+1)] = 1;
                            if (Math.random() < 0.4 && y+1 < 31) m[(y+1)*32+x] = 1;
                        }
                    }
                }
                // Clearings
                for (let y = 14; y < 18; y++) for (let x = 14; x < 18; x++) m[y*32+x] = 0;
                for (let y = 5; y < 8; y++) for (let x = 24; x < 27; x++) m[y*32+x] = 0;
                for (let y = 24; y < 27; y++) for (let x = 5; x < 8; x++) m[y*32+x] = 0;
                // Ensure path exists from spawn
                m[2*32+2] = 0; m[2*32+3] = 0; m[3*32+2] = 0;
                return m;
            })(),
            props: (() => {
                const p = [];
                for (let i = 0; i < 25; i++) {
                    let x, y, tries = 0;
                    do {
                        x = 2 + Math.random() * 28;
                        y = 2 + Math.random() * 28;
                        tries++;
                    } while (tries < 20);
                    p.push({x, y, propType: 'tree', size: 1.5});
                }
                p.push({x: 16, y: 16, propType: 'crate', size: 0.8});
                p.push({x: 6, y: 6, propType: 'barrel', size: 0.7});
                p.push({x: 25, y: 6, propType: 'barrel', size: 0.7});
                p.push({x: 6, y: 25, propType: 'barrel', size: 0.7});
                return p;
            })(),
            spawn: { x: 2.5, y: 2.5 },
            zombieSpawnCount: { normal: 3, runner: 6, brute: 1 }
        },
        hospital: {
            theme: 'hospital', w: 32, h: 32,
            grid: (() => {
                const m = new Array(32*32).fill(0);
                for (let i = 0; i < 32; i++) { m[i] = 1; m[31*32+i] = 1; m[i*32] = 1; m[i*32+31] = 1; }
                // Hospital with corridors and rooms
                // Main horizontal corridor
                for (let x = 2; x < 30; x++) { m[15*32+x] = 1; m[16*32+x] = 1; }
                // Clear corridor path
                for (let x = 2; x < 30; x++) { m[14*32+x] = 0; m[17*32+x] = 0; }
                // Actually rebuild: rooms with doors
                for (let i = 0; i < 32*32; i++) m[i] = 0;
                for (let i = 0; i < 32; i++) { m[i] = 1; m[31*32+i] = 1; m[i*32] = 1; m[i*32+31] = 1; }
                
                // Room dividers - top half
                for (let x = 2; x < 30; x++) m[7*32+x] = 1;
                for (let x = 2; x < 30; x++) m[24*32+x] = 1;
                // Vertical walls
                for (let y = 2; y < 7; y++) m[y*32+10] = 1;
                for (let y = 2; y < 7; y++) m[y*32+20] = 1;
                for (let y = 8; y < 15; y++) m[y*32+15] = 1;
                for (let y = 17; y < 24; y++) m[y*32+15] = 1;
                for (let y = 25; y < 30; y++) m[y*32+10] = 1;
                for (let y = 25; y < 30; y++) m[y*32+20] = 1;
                
                // Doors (gaps)
                m[7*32+5] = 0; m[7*32+15] = 0; m[7*32+25] = 0;
                m[24*32+5] = 0; m[24*32+15] = 0; m[24*32+25] = 0;
                m[4*32+10] = 0; m[4*32+20] = 0;
                m[11*32+15] = 0; m[20*32+15] = 0;
                m[27*32+10] = 0; m[27*32+20] = 0;
                
                // Interior details
                m[3*32+5] = 2; m[3*32+6] = 2;
                m[3*32+15] = 2; m[3*32+25] = 2;
                m[10*32+5] = 2; m[10*32+25] = 2;
                m[21*32+5] = 2; m[21*32+25] = 2;
                m[28*32+5] = 2; m[28*32+15] = 2; m[28*32+25] = 2;
                
                return m;
            })(),
            props: [
                {x: 5.5, y: 3.5, propType: 'crate', size: 0.7},
                {x: 25.5, y: 3.5, propType: 'barrel', size: 0.7},
                {x: 15.5, y: 11.5, propType: 'crate', size: 0.7},
                {x: 5.5, y: 20.5, propType: 'barrel', size: 0.7},
                {x: 25.5, y: 20.5, propType: 'crate', size: 0.7},
                {x: 15.5, y: 28.5, propType: 'barrel', size: 0.7},
                {x: 8.5, y: 11.5, propType: 'barrel', size: 0.7},
                {x: 22.5, y: 11.5, propType: 'barrel', size: 0.7}
            ],
            spawn: { x: 2.5, y: 2.5 },
            zombieSpawnCount: { normal: 4, runner: 3, brute: 3 }
        }
    },
    
    init() {
        this.hudCanvas = document.getElementById('hudCanvas');
        this.hudCtx = this.hudCanvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        this.player = {
            x: 2.5, y: 2.5, z: 0,
            dirX: 1, dirY: 0, planeX: 0, planeY: 0.66,
            health: 100, maxHealth: 100,
            stamina: 100, maxStamina: 100,
            ammo: [Infinity, 60, 32, 180],
            mag: [Infinity, 12, 8, 30],
            weapon: 0, lastShot: 0, reloading: false,
            currentRecoil: 0, currentSpread: 0,
            bobPhase: 0, bobIntensity: 0,
            stepTimer: 0
        };
        initZombieSprites();
        Sound.init();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    },
    
    resize() {
        const w = window.innerWidth, h = window.innerHeight;
        const rw = Math.min(640, Math.floor(w / 2)), rh = Math.min(400, Math.floor(h / 2));
        document.getElementById('viewCanvas').width = rw;
        document.getElementById('viewCanvas').height = rh;
        this.hudCanvas.width = w;
        this.hudCanvas.height = h;
        Raycast.init(document.getElementById('viewCanvas'));
    },
    
    setupInput() {
        document.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') this.togglePause();
            if (e.code === 'KeyR') this.reload();
            if (e.code === 'Digit1') this.switchWeapon(0);
            if (e.code === 'Digit2') this.switchWeapon(1);
            if (e.code === 'Digit3') this.switchWeapon(2);
            if (e.code === 'Digit4') this.switchWeapon(3);
        });
        document.addEventListener('keyup', e => this.keys[e.code] = false);
        
        document.addEventListener('mousedown', e => {
            if (this.state === 'PLAYING') {
                if (!document.pointerLockElement) document.getElementById('gameWrapper').requestPointerLock();
                this.mouse.down = true;
                this.shoot();
            }
            Sound.resume();
        });
        document.addEventListener('mouseup', () => this.mouse.down = false);
        document.addEventListener('mousemove', e => {
            if (document.pointerLockElement && this.state === 'PLAYING') {
                const sens = 0.002;
                const rot = -e.movementX * sens;
                const oldDirX = this.player.dirX;
                this.player.dirX = this.player.dirX * Math.cos(rot) - this.player.dirY * Math.sin(rot);
                this.player.dirY = oldDirX * Math.sin(rot) + this.player.dirY * Math.cos(rot);
                const oldPlaneX = this.player.planeX;
                this.player.planeX = this.player.planeX * Math.cos(rot) - this.player.planeY * Math.sin(rot);
                this.player.planeY = oldPlaneX * Math.sin(rot) + this.player.planeY * Math.cos(rot);
                
                // Vertical look limit
                this.player.lookY = (this.player.lookY || 0) - e.movementY * 0.5;
                this.player.lookY = Math.max(-100, Math.min(100, this.player.lookY));
            }
        });
    },
    
    startGame() {
        const m = this.maps[this.selectedMap];
        this.map = m;
        Raycast.setMap(m);
        this.player.x = m.spawn.x; this.player.y = m.spawn.y;
        this.player.dirX = 1; this.player.dirY = 0;
        this.player.planeX = 0; this.player.planeY = 0.66;
        this.player.lookY = 0;
        this.player.health = 100;
        this.player.stamina = 100;
        this.player.ammo = [Infinity, 60, 32, 180];
        this.player.mag = [Infinity, 12, 8, 30];
        this.player.weapon = 0;
        this.player.reloading = false;
        this.player.currentRecoil = 0;
        this.kills = 0;
        this.headshots = 0;
        this.wave = 0;
        this.waveTimer = 3;
        this.betweenWaves = true;
        this.zombies = [];
        this.pickups = [];
        this.notifications = [];
        this.damageIndicators = [];
        this.state = 'PLAYING';
        document.getElementById('gameWrapper').requestPointerLock();
        this.spawnPickups();
        this.addNotification('Bersiap! Wave 1 mulai...', 2);
    },
    
    spawnPickups() {
        // Scatter some pickups
        for (let i = 0; i < 6; i++) {
            let x, y, tries = 0;
            do {
                x = 2 + Math.random() * (this.map.w - 4);
                y = 2 + Math.random() * (this.map.h - 4);
                tries++;
            } while (this.map.grid[Math.floor(y)*this.map.w+Math.floor(x)] !== 0 && tries < 20);
            this.pickups.push({
                x, y, pickupType: Math.random() < 0.5 ? 'health' : 'ammo',
                bob: Math.random() * Math.PI * 2
            });
        }
    },
    
    startWave() {
        this.wave++;
        this.betweenWaves = false;
        const base = this.map.zombieSpawnCount;
        const mult = 1 + (this.wave - 1) * 0.3;
        const normalCount = Math.ceil(base.normal * mult);
        const runnerCount = Math.ceil(base.runner * mult);
        const bruteCount = Math.floor(base.brute * mult);
        
        for (let i = 0; i < normalCount; i++) this.spawnZombie('normal');
        for (let i = 0; i < runnerCount; i++) this.spawnZombie('runner');
        for (let i = 0; i < bruteCount; i++) this.spawnZombie('brute');
        
        this.waveZombiesLeft = this.zombies.length;
        Sound.waveStart();
        this.addNotification(`⚠️ WAVE ${this.wave} ⚠️`, 3);
        
        // Drop extra pickups each wave
        for (let i = 0; i < 2; i++) {
            let x, y, tries = 0;
            do {
                x = 2 + Math.random() * (this.map.w - 4);
                y = 2 + Math.random() * (this.map.h - 4);
                tries++;
            } while (this.map.grid[Math.floor(y)*this.map.w+Math.floor(x)] !== 0 && tries < 20);
            this.pickups.push({
                x, y, pickupType: Math.random() < 0.5 ? 'health' : 'ammo',
                bob: Math.random() * Math.PI * 2
            });
        }
    },
    
    spawnZombie(type) {
        const p = this.player;
        let zx, zy, valid = false, tries = 0;
        while (!valid && tries < 50) {
            zx = 2 + Math.random() * (this.map.w - 4);
            zy = 2 + Math.random() * (this.map.h - 4);
            const mx = Math.floor(zx), my = Math.floor(zy);
            const dist = Math.hypot(zx - p.x, zy - p.y);
            const cell = this.map.grid[my * this.map.w + mx];
            if (cell === 0 && dist > 8) valid = true;
            tries++;
        }
        if (!valid) return;
        
        let hp, speed, dmg;
        if (type === 'runner') {
            hp = 30 + Math.random() * 20;
            speed = 0.035 + this.wave * 0.003;
            dmg = 8;
        } else if (type === 'brute') {
            hp = 120 + Math.random() * 40 + this.wave * 10;
            speed = 0.012 + this.wave * 0.001;
            dmg = 20;
        } else {
            hp = 50 + Math.random() * 30 + this.wave * 5;
            speed = 0.02 + this.wave * 0.002;
            dmg = 12;
        }
        
        this.zombies.push({
            x: zx, y: zy, hp, maxHp: hp, speed, dmg,
            typeZ: type, state: 'idle', attackTimer: 0, hit: 0,
            animFrame: Math.random() * 2, animSpeed: type === 'runner' ? 0.3 : 0.15,
            growlTimer: Math.random() * 5,
            hitFlash: 0
        });
    },
    
    update(dt) {
        if (this.state !== 'PLAYING') return;
        const p = this.player;
        const m = this.map;
        
        // Wave management
        if (this.betweenWaves) {
            this.waveTimer -= dt;
            if (this.waveTimer <= 0) this.startWave();
        } else if (this.zombies.filter(z => z.hp > 0).length === 0) {
            this.betweenWaves = true;
            this.waveTimer = 5;
            this.addNotification(`✓ Wave ${this.wave} CLEAR!`, 3);
            // Heal a bit between waves
            p.health = Math.min(p.maxHealth, p.health + 20);
            // Respawn some pickups
            this.spawnPickups();
        }
        
        // Movement
        const running = this.keys['ShiftLeft'] && p.stamina > 0;
        const baseSpeed = running ? 0.09 : 0.055;
        const moveSpeed = baseSpeed * dt * 60;
        
        let moving = false;
        let dx = 0, dy = 0;
        if (this.keys['KeyW']) { dx += p.dirX; dy += p.dirY; moving = true; }
        if (this.keys['KeyS']) { dx -= p.dirX; dy -= p.dirY; moving = true; }
        if (this.keys['KeyA']) { dx += p.dirY; dy -= p.dirX; moving = true; }
        if (this.keys['KeyD']) { dx -= p.dirY; dy += p.dirX; moving = true; }
        
        const len = Math.hypot(dx, dy);
        if (len > 0) { dx = dx/len * moveSpeed; dy = dy/len * moveSpeed; }
        
        // Stamina
        if (moving && running) {
            p.stamina = Math.max(0, p.stamina - dt * 30);
        } else {
            p.stamina = Math.min(p.maxStamina, p.stamina + dt * 15);
        }
        
        // Collision (with wall sliding)
        const r = 0.25;
        const newX = p.x + dx;
        const newY = p.y + dy;
        const checkCell = (x, y) => {
            if (x < 0 || x >= m.w || y < 0 || y >= m.h) return 1;
            return m.grid[Math.floor(y)*m.w+Math.floor(x)];
        };
        
        if (checkCell(newX + (dx>0?r:-r), p.y) === 0) p.x = newX;
        if (checkCell(p.x, newY + (dy>0?r:-r)) === 0) p.y = newY;
        // Diagonal
        if (checkCell(newX + (dx>0?r:-r), newY + (dy>0?r:-r)) === 0) {
            // Already handled
        }
        
        // Prop collision
        this.map.props && this.map.props.forEach(prop => {
            const propSize = (prop.size || 1) * 0.4;
            const dist = Math.hypot(p.x - prop.x, p.y - prop.y);
            if (dist < propSize + r) {
                const angle = Math.atan2(p.y - prop.y, p.x - prop.x);
                const push = propSize + r - dist;
                p.x += Math.cos(angle) * push;
                p.y += Math.sin(angle) * push;
            }
        });
        
        // Head bob
        if (moving) {
            p.bobPhase += dt * (running ? 14 : 9);
            p.bobIntensity = Math.min(1, p.bobIntensity + dt * 5);
            p.stepTimer += dt;
            if (p.stepTimer > (running ? 0.35 : 0.5)) {
                p.stepTimer = 0;
                // Footstep sound would go here
            }
        } else {
            p.bobIntensity = Math.max(0, p.bobIntensity - dt * 5);
        }
        Raycast.weaponBob = Math.sin(p.bobPhase) * p.bobIntensity;
        
        // Recoil recovery
        p.currentRecoil = Math.max(0, p.currentRecoil - dt * 3);
        p.currentSpread = Math.max(0, p.currentSpread - dt * 2);
        Raycast.weaponRecoil = p.currentRecoil;
        
        // Aim sway (natural movement)
        Raycast.aimSway.tx = Math.sin(performance.now() / 1500) * 0.3;
        Raycast.aimSway.ty = Math.sin(performance.now() / 1200) * 0.2;
        Raycast.aimSway.x += (Raycast.aimSway.tx - Raycast.aimSway.x) * dt * 3;
        Raycast.aimSway.y += (Raycast.aimSway.ty - Raycast.aimSway.y) * dt * 3;
        
        // Auto fire
        if (this.mouse.down && this.weapons[p.weapon].auto) this.shoot();
        
        // Zombie AI
        this.zombies.forEach(z => {
            if (z.hp <= 0) return;
            
            const dist = Math.hypot(p.x - z.x, p.y - z.y);
            
            // Animation
            if (dist < 15) z.animFrame += z.animSpeed;
            
            // Growl sounds
            z.growlTimer -= dt;
            if (z.growlTimer <= 0 && dist < 10 && Math.random() < 0.3) {
                Sound.zombieGrowl();
                z.growlTimer = 3 + Math.random() * 5;
            }
            
            // Movement toward player
            if (dist < 15) {
                const angle = Math.atan2(p.y - z.y, p.x - z.x);
                const moveX = Math.cos(angle) * z.speed * dt * 60;
                const moveY = Math.sin(angle) * z.speed * dt * 60;
                
                // Simple collision
                const nx = z.x + moveX, ny = z.y + moveY;
                if (m.grid[Math.floor(z.y)*m.w+Math.floor(nx)] === 0) z.x = nx;
                if (m.grid[Math.floor(ny)*m.w+Math.floor(z.x)] === 0) z.y = ny;
                
                // Avoid other zombies
                this.zombies.forEach(oz => {
                    if (oz === z || oz.hp <= 0) return;
                    const od = Math.hypot(z.x - oz.x, z.y - oz.y);
                    if (od < 0.6) {
                        const ang = Math.atan2(z.y - oz.y, z.x - oz.x);
                        z.x += Math.cos(ang) * 0.01;
                        z.y += Math.sin(ang) * 0.01;
                    }
                });
            }
            
            // Attack
            if (dist < 0.8) {
                z.attackTimer += dt;
                if (z.attackTimer > 1) {
                    p.health -= z.dmg;
                    Sound.playerHurt();
                    this.addDamageIndicator(z);
                    z.attackTimer = 0;
                    if (p.health <= 0) this.gameOver();
                }
            } else z.attackTimer = 0;
            
            if (z.hit > 0) z.hit -= dt * 5;
            if (z.hitFlash > 0) z.hitFlash -= dt * 5;
        });
        
        // Pickups
        this.pickups = this.pickups.filter(pk => {
            pk.bob += dt * 3;
            const dist = Math.hypot(p.x - pk.x, p.y - pk.y);
            if (dist < 0.8) {
                if (pk.pickupType === 'health') {
                    if (p.health < p.maxHealth) {
                        p.health = Math.min(p.maxHealth, p.health + 40);
                        Sound.pickup('health');
                        this.addNotification('+40 HP', 1.5);
                        return false;
                    }
                } else {
                    // Ammo for current gun (not knife)
                    if (p.weapon > 0) {
                        p.ammo[p.weapon] += 15;
                        Sound.pickup('ammo');
                        this.addNotification('+15 AMMO', 1.5);
                        return false;
                    }
                }
            }
            return true;
        });
        
        // Particles
        Raycast.updateParticles(dt);
        
        // Notifications
        this.notifications = this.notifications.filter(n => { n.time -= dt; return n.time > 0; });
        this.damageIndicators = this.damageIndicators.filter(d => { d.time -= dt; return d.time > 0; });
    },
    
    addNotification(text, duration) {
        this.notifications.push({ text, time: duration, max: duration });
    },
    
    addDamageIndicator(zombie) {
        const p = this.player;
        const angle = Math.atan2(zombie.y - p.y, zombie.x - p.x);
        const playerAngle = Math.atan2(p.dirY, p.dirX);
        let relAngle = angle - playerAngle;
        while (relAngle > Math.PI) relAngle -= 2*Math.PI;
        while (relAngle < -Math.PI) relAngle += 2*Math.PI;
        this.damageIndicators.push({ angle: relAngle, time: 1 });
    },
    
    shoot() {
        const p = this.player;
        const w = this.weapons[p.weapon];
        const now = performance.now();
        if (now - p.lastShot < w.rate || p.reloading) return;
        if (p.mag[p.weapon] <= 0) { Sound.empty(); return; }
        
        p.lastShot = now;
        if (w.mag !== Infinity) p.mag[p.weapon]--;
        
        // Recoil
        p.currentRecoil += w.recoil;
        p.currentSpread += w.spread;
        
        Sound.gunshot(w.name);
        
        // Pellets (shotgun)
        const pellets = w.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            this.doShot(w);
        }
    },
    
    doShot(w) {
        const p = this.player;
        // Apply spread
        const spread = (Math.random() - 0.5) * (w.spread + p.currentSpread);
        const shotDirX = p.dirX + Math.cos(Math.atan2(p.dirY, p.dirX) + Math.PI/2) * spread;
        const shotDirY = p.dirY + Math.sin(Math.atan2(p.dirY, p.dirX) + Math.PI/2) * spread;
        const len = Math.hypot(shotDirX, shotDirY);
        const sdx = shotDirX / len, sdy = shotDirY / len;
        
        let closest = null, minDist = w.range;
        this.zombies.forEach(z => {
            if (z.hp <= 0) return;
            const dx = z.x - p.x, dy = z.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist > w.range) return;
            const dot = (dx * sdx + dy * sdy) / dist;
            // Wider hitbox for close targets
            const hitRadius = 0.5 + dist * 0.05;
            const perpDist = Math.abs(dx * (-sdy) + dy * sdx);
            if (dot > 0.95 && perpDist < hitRadius && dist < minDist) {
                closest = z;
                minDist = dist;
            }
        });
        
        if (closest) {
            // Headshot detection (random chance based on distance & accuracy)
            const headshotChance = Math.max(0, 0.3 - minDist * 0.01 - p.currentSpread * 2);
            const isHeadshot = Math.random() < headshotChance;
            const dmg = isHeadshot ? w.dmg * 2.5 : w.dmg;
            
            closest.hp -= dmg;
            closest.hit = 1;
            closest.hitFlash = 0.3;
            Sound.zombieHit();
            
            // Blood particles
            Raycast.addParticle(closest.x, closest.y, 0.3, 'blood');
            
            if (isHeadshot) {
                Sound.headshot();
                this.headshots++;
                this.addNotification('💀 HEADSHOT!', 1);
            }
            
            if (closest.hp <= 0) {
                this.kills++;
                this.waveZombiesLeft--;
                Sound.zombieDie();
                Raycast.addParticle(closest.x, closest.y, 0.5, 'blood');
                // Remove zombie after delay
                const dead = closest;
                setTimeout(() => {
                    const idx = this.zombies.indexOf(dead);
                    if (idx >= 0) this.zombies.splice(idx, 1);
                }, 1500);
            }
        }
    },
    
    reload() {
        const p = this.player;
        const w = this.weapons[p.weapon];
        if (w.mag === Infinity || p.mag[p.weapon] === w.mag || p.ammo[p.weapon] <= 0 || p.reloading) return;
        p.reloading = true;
        Sound.reload();
        setTimeout(() => {
            const need = w.mag - p.mag[p.weapon];
            const take = Math.min(need, p.ammo[p.weapon]);
            p.mag[p.weapon] += take;
            if (p.ammo[p.weapon] !== Infinity) p.ammo[p.weapon] -= take;
            p.reloading = false;
        }, 1500);
    },
    
    switchWeapon(idx) {
        if (idx >= 0 && idx < 4 && idx !== this.player.weapon) {
            this.player.weapon = idx;
            this.player.reloading = false;
        }
    },
    
    gameOver() {
        this.state = 'GAMEOVER';
        document.exitPointerLock();
        let hsUpdated = false;
        if (this.wave > this.highscore.wave) {
            this.highscore.wave = this.wave;
            localStorage.setItem('zsWaveHS', this.highscore.wave);
            hsUpdated = true;
        }
        if (this.kills > this.highscore.kills) {
            this.highscore.kills = this.kills;
            localStorage.setItem('zsKillsHS', this.highscore.kills);
            hsUpdated = true;
        }
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('finalKills').textContent = this.kills;
        document.getElementById('finalHeadshots').textContent = this.headshots;
        document.getElementById('finalHighscore').textContent = this.highscore.wave;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    },
    
    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.exitPointerLock();
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pauseScreen').classList.add('hidden');
            document.getElementById('gameWrapper').requestPointerLock();
        }
    },
    
    drawHUD() {
        const ctx = this.hudCtx;
        const w = this.hudCanvas.width, h = this.hudCanvas.height;
        ctx.clearRect(0, 0, w, h);
        
        if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;
        
        const p = this.player;
        
        // ===== CROSSHAIR with sway =====
        const cx = w/2 + Raycast.aimSway.x * 2;
        const cy = h/2 + Raycast.aimSway.y * 2 + p.currentRecoil * 5;
        const spreadSize = 10 + p.currentSpread * 30;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - spreadSize, cy); ctx.lineTo(cx - 5, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + spreadSize, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - spreadSize); ctx.lineTo(cx, cy - 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + spreadSize); ctx.stroke();
        ctx.fillStyle = '#f00'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
        
        // ===== WAVE INFO =====
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.font = 'bold 20px Courier New';
        if (this.betweenWaves) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`WAVE ${this.wave + 1} DALAM ${Math.ceil(this.waveTimer)}...`, w/2, 70);
        } else {
            ctx.fillStyle = '#fff';
            ctx.fillText(`WAVE ${this.wave}`, w/2, 10);
            ctx.font = '16px Courier New';
            ctx.fillText(`🧟 ${this.zombies.filter(z=>z.hp>0).length} tersisa`, w/2, 35);
        }
        
        // ===== WEAPON INFO =====
        const wep = this.weapons[p.weapon];
        ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 22px Courier New';
        ctx.fillStyle = '#fff';
        ctx.fillText(wep.name, w - 30, h - 90);
        if (wep.mag !== Infinity) {
            ctx.font = '20px Courier New';
            ctx.fillStyle = p.mag[p.weapon] <= Math.ceil(wep.mag*0.3) ? '#e74c3c' : '#fff';
            ctx.fillText(`${p.mag[p.weapon]} / ${p.ammo[p.weapon]}`, w - 30, h - 60);
        }
        if (p.reloading) {
            ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 22px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('RELOADING...', w/2, h/2 + 60);
        }
        
        // Weapon slots
        ctx.textAlign = 'right';
        ctx.font = '14px Courier New';
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i === p.weapon ? '#f1c40f' : 'rgba(255,255,255,0.5)';
            ctx.fillText(`[${i+1}] ${this.weapons[i].name}`, w - 30, h - 120 - i*20);
        }
        
        // ===== HEALTH & STAMINA =====
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const barW = 200, barH = 16, barX = 110;
        // Health
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX, h - 50, barW, barH);
        const hpPct = p.health / p.maxHealth;
        ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : (hpPct > 0.25 ? '#f39c12' : '#e74c3c');
        ctx.fillRect(barX, h - 50, barW * hpPct, barH);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(barX, h - 50, barW, barH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Courier New';
        ctx.fillText(`HP: ${Math.max(0, Math.floor(p.health))}`, barX + 5, h - 38);
        
        // Stamina
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX, h - 30, barW, barH);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(barX, h - 30, barW * (p.stamina / p.maxStamina), barH);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(barX, h - 30, barW, barH);
        ctx.fillStyle = '#fff';
        ctx.fillText('STAMINA', barX + 5, h - 18);
        
        // ===== CHARACTER PORTRAIT =====
        const pSize = 70;
        ctx.save();
        ctx.beginPath(); ctx.arc(50, 50, pSize/2, 0, Math.PI*2); ctx.clip();
        const charCanvas = document.createElement('canvas');
        charCanvas.width = 128; charCanvas.height = 128;
        drawCharacter(charCanvas, CHARACTERS[this.selectedChar]);
        ctx.drawImage(charCanvas, 50 - pSize/2, 50 - pSize/2, pSize, pSize);
        ctx.restore();
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(50, 50, pSize/2, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(CHARACTERS[this.selectedChar].name, 50, 95);
        
        // ===== KILLS =====
        ctx.textAlign = 'center'; ctx.font = 'bold 16px Courier New';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`💀 ${this.kills}  💢 ${this.headshots}`, w/2, h - 15);
        
        // ===== NOTIFICATIONS =====
        ctx.textAlign = 'center'; ctx.font = 'bold 24px Courier New';
        this.notifications.forEach((n, i) => {
            const alpha = Math.min(1, n.time);
            ctx.fillStyle = `rgba(255,255,100,${alpha})`;
            ctx.fillText(n.text, w/2, h/2 - 100 - i * 35);
        });
        
        // ===== DAMAGE INDICATORS =====
        this.damageIndicators.forEach(d => {
            const alpha = Math.min(1, d.time);
            const dist = 120;
            const ix = w/2 + Math.cos(d.angle) * dist;
            const iy = h/2 + Math.sin(d.angle) * dist;
            ctx.fillStyle = `rgba(255,0,0,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(ix - Math.cos(d.angle)*20 - Math.sin(d.angle)*8, iy - Math.sin(d.angle)*20 + Math.cos(d.angle)*8);
            ctx.lineTo(ix - Math.cos(d.angle)*20 + Math.sin(d.angle)*8, iy - Math.sin(d.angle)*20 - Math.cos(d.angle)*8);
            ctx.fill();
        });
        
        // ===== MINIMAP =====
        const mmSize = Math.min(150, w * 0.15);
        const mmScale = mmSize / this.map.w;
        const mmX = w - mmSize - 20, mmY = 20;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mmX - 3, mmY - 3, mmSize + 6, mmSize + 6);
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
        ctx.strokeRect(mmX - 3, mmY - 3, mmSize + 6, mmSize + 6);
        
        // Only render nearby tiles for performance
        const viewRange = 8;
        const px = Math.floor(p.x), py = Math.floor(p.y);
        for (let y = Math.max(0, py-viewRange); y < Math.min(this.map.h, py+viewRange); y++) {
            for (let x = Math.max(0, px-viewRange); x < Math.min(this.map.w, px+viewRange); x++) {
                const cell = this.map.grid[y*this.map.w+x];
                ctx.fillStyle = cell === 1 ? '#444' : (cell === 2 ? '#666' : '#1a1a1a');
                ctx.fillRect(mmX + x*mmScale, mmY + y*mmScale, mmScale, mmScale);
            }
        }
        // Player
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(mmX + p.x*mmScale, mmY + p.y*mmScale, 3, 0, Math.PI*2);
        ctx.fill();
        // Player direction
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mmX + p.x*mmScale, mmY + p.y*mmScale);
        ctx.lineTo(mmX + (p.x + p.dirX*1.5)*mmScale, mmY + (p.y + p.dirY*1.5)*mmScale);
        ctx.stroke();
        // Zombies (only if close)
        this.zombies.forEach(z => {
            if (z.hp > 0 && Math.hypot(z.x - p.x, z.y - p.y) < viewRange) {
                ctx.fillStyle = z.typeZ === 'brute' ? '#8b0000' : (z.typeZ === 'runner' ? '#ff6600' : '#e74c3c');
                ctx.fillRect(mmX + z.x*mmScale - 1.5, mmY + z.y*mmScale - 1.5, 3, 3);
            }
        });
        // Pickups
        this.pickups.forEach(pk => {
            if (Math.hypot(pk.x - p.x, pk.y - p.y) < viewRange) {
                ctx.fillStyle = pk.pickupType === 'health' ? '#ff3366' : '#f1c40f';
                ctx.fillRect(mmX + pk.x*mmScale - 1, mmY + pk.y*mmScale - 1, 2, 2);
            }
        });
        
        // ===== HIT FLASH / DAMAGE =====
        if (p.currentRecoil > 0.5) {
            ctx.fillStyle = `rgba(255,200,50,${p.currentRecoil * 0.15})`;
            ctx.fillRect(0, 0, w, h);
        }
        if (p.health < 30) {
            const pulse = (Math.sin(performance.now() / 300) + 1) * 0.5;
            ctx.strokeStyle = `rgba(255,0,0,${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 30;
            ctx.strokeRect(0, 0, w, h);
        }
    },
    
    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update(dt);
        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            Raycast.render(this.player, this.zombies, this.pickups);
        }
        this.drawHUD();
        requestAnimationFrame(this.loop);
    }
};