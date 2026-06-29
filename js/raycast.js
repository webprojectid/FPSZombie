const Raycast = {
    map: [], props: [], mapW: 0, mapH: 0,
    texWidth: 64, texHeight: 64,
    textures: {}, floorTextures: {},
    zBuffer: [],
    weaponBob: 0, weaponRecoil: 0,
    aimSway: { x: 0, y: 0, tx: 0, ty: 0 },
    particles: [],
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        this.width = canvas.width;
        this.height = canvas.height;
        this.imgData = this.ctx.createImageData(this.width, this.height);
        this.buf = this.imgData.data;
        this.generateTextures();
        this.generateFloorTextures();
    },
    
    setMap(mapData) {
        this.map = mapData.grid;
        this.props = mapData.props || [];
        this.mapW = mapData.w;
        this.mapH = mapData.h;
        this.theme = mapData.theme;
    },
    
    generateTextures() {
        const themes = {
            city: { base: [85,85,85], dark: [50,50,50], accent: [120,120,120], brick: true },
            forest: { base: [42,58,26], dark: [26,42,10], accent: [58,74,42], brick: false },
            hospital: { base: [176,184,192], dark: [128,136,144], accent: [208,216,224], brick: false }
        };
        
        Object.keys(themes).forEach(t => {
            const c = document.createElement('canvas');
            c.width = this.texWidth; c.height = this.texHeight;
            const cx = c.getContext('2d');
            const th = themes[t];
            
            // Base
            cx.fillStyle = `rgb(${th.base.join(',')})`;
            cx.fillRect(0, 0, 64, 64);
            
            if (th.brick) {
                // Brick pattern
                cx.fillStyle = `rgb(${th.dark.join(',')})`;
                for (let y = 0; y < 64; y += 12) {
                    const offset = (Math.floor(y/12) % 2) * 16;
                    for (let x = -16; x < 64; x += 32) {
                        cx.fillRect(x + offset, y, 1, 12);
                        cx.fillRect(x + offset, y, 32, 1);
                    }
                }
                // Random bricks
                cx.fillStyle = `rgb(${th.accent.join(',')})`;
                for (let i = 0; i < 15; i++) {
                    cx.fillRect(Math.random()*64, Math.random()*64, 3, 2);
                }
                // Cracks
                cx.strokeStyle = `rgb(${th.dark.join(',')})`;
                cx.lineWidth = 1;
                cx.beginPath();
                cx.moveTo(10, 20); cx.lineTo(25, 35); cx.lineTo(20, 50);
                cx.stroke();
            } else if (t === 'hospital') {
                // Tile pattern
                cx.fillStyle = `rgb(${th.dark.join(',')})`;
                for (let y = 0; y < 64; y += 16) {
                    for (let x = 0; x < 64; x += 16) {
                        cx.fillRect(x, y, 16, 1);
                        cx.fillRect(x, y, 1, 16);
                    }
                }
                // Blood stains
                cx.fillStyle = 'rgba(139, 0, 0, 0.6)';
                cx.beginPath(); cx.arc(40, 30, 6, 0, Math.PI*2); cx.fill();
                cx.fillStyle = 'rgba(139, 0, 0, 0.4)';
                cx.beginPath(); cx.arc(20, 50, 4, 0, Math.PI*2); cx.fill();
            } else {
                // Tree bark / stone
                for (let i = 0; i < 50; i++) {
                    const shade = Math.random() > 0.5 ? th.dark : th.accent;
                    cx.fillStyle = `rgb(${shade.join(',')})`;
                    cx.fillRect(Math.random()*64, Math.random()*64, 2+Math.random()*4, 1+Math.random()*2);
                }
            }
            
            this.textures[t] = cx.getImageData(0, 0, 64, 64).data;
        });
    },
    
    generateFloorTextures() {
        const themes = {
            city: { base: [50,50,55], detail: [35,35,40] },
            forest: { base: [35,45,25], detail: [20,30,15] },
            hospital: { base: [70,70,75], detail: [50,50,55] }
        };
        
        Object.keys(themes).forEach(t => {
            const c = document.createElement('canvas');
            c.width = 64; c.height = 64;
            const cx = c.getContext('2d');
            const th = themes[t];
            
            cx.fillStyle = `rgb(${th.base.join(',')})`;
            cx.fillRect(0, 0, 64, 64);
            
            if (t === 'hospital') {
                // Checkerboard tile
                cx.fillStyle = `rgb(${th.detail.join(',')})`;
                for (let y = 0; y < 64; y += 16) {
                    for (let x = 0; x < 64; x += 16) {
                        if ((x/16 + y/16) % 2 === 0) cx.fillRect(x, y, 16, 16);
                    }
                }
            } else {
                // Random detail
                for (let i = 0; i < 30; i++) {
                    cx.fillStyle = `rgb(${th.detail.join(',')})`;
                    cx.fillRect(Math.random()*64, Math.random()*64, 1+Math.random()*2, 1+Math.random()*2);
                }
            }
            
            this.floorTextures[t] = cx.getImageData(0, 0, 64, 64).data;
        });
    },
    
    addParticle(x, y, z, type) {
        for (let i = 0; i < (type === 'blood' ? 8 : 4); i++) {
            this.particles.push({
                x, y, z: z + 0.3,
                vx: (Math.random()-0.5) * 0.08,
                vy: (Math.random()-0.5) * 0.08,
                vz: Math.random() * 0.05 + 0.02,
                life: 1,
                type
            });
        }
    },
    
    updateParticles(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            p.vz -= 0.002;
            p.life -= dt * 2;
            return p.life > 0 && p.z > 0;
        });
    },
    
    render(player, sprites, pickups) {
        const w = this.width, h = this.height;
        const buf = this.buf;
        const map = this.map, mapW = this.mapW;
        const tex = this.textures[this.theme] || this.textures.city;
        const floorTex = this.floorTextures[this.theme] || this.floorTextures.city;
        const zBuf = this.zBuffer = new Float32Array(w);
        
        const bob = this.weaponBob;
        const recoil = this.weaponRecoil;
        const swayX = this.aimSway.x;
        const swayY = this.aimSway.y;
        
        // Apply bob/sway to horizon
        const horizonOffset = Math.floor(bob * 5 + recoil * 3);
        
        // Raycasting with textured floor
        for (let y = 0; y < h; y++) {
            const isFloor = y > h / 2 + horizonOffset;
            const p = isFloor ? (y - h/2 - horizonOffset) : (h/2 + horizonOffset - y);
            if (p === 0) continue;
            
            // Vertical ray direction
            const rayDirX0 = player.dirX - player.planeX;
            const rayDirY0 = player.dirY - player.planeY;
            const rayDirX1 = player.dirX + player.planeX;
            const rayDirY1 = player.dirY + player.planeY;
            
            const rowDist = (0.5 * h) / p;
            
            const floorStepX = rowDist * (rayDirX1 - rayDirX0) / w;
            const floorStepY = rowDist * (rayDirY1 - rayDirY0) / w;
            
            let floorX = player.x + rowDist * rayDirX0;
            let floorY = player.y + rowDist * rayDirY0;
            
            // Fog factor
            const fog = Math.min(1, rowDist / 12);
            
            for (let x = 0; x < w; x++) {
                const cellX = Math.floor(floorX), cellY = Math.floor(floorY);
                let tx = Math.floor(64 * (floorX - cellX)) & 63;
                let ty = Math.floor(64 * (floorY - cellY)) & 63;
                
                floorX += floorStepX;
                floorY += floorStepY;
                
                let r, g, b;
                if (isFloor) {
                    const tIdx = (ty * 64 + tx) * 4;
                    r = floorTex[tIdx]; g = floorTex[tIdx+1]; b = floorTex[tIdx+2];
                } else {
                    // Ceiling
                    const ceilShade = 0.3;
                    r = 20 * ceilShade; g = 20 * ceilShade; b = 25 * ceilShade;
                }
                
                // Fog
                r = r * (1-fog) + 10*fog;
                g = g * (1-fog) + 10*fog;
                b = b * (1-fog) + 10*fog;
                
                // Distance shading
                const shade = Math.max(0.3, 1 - rowDist / 15);
                r *= shade; g *= shade; b *= shade;
                
                const i = (y * w + x) * 4;
                buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = 255;
            }
        }
        
        // Walls
        for (let x = 0; x < w; x++) {
            const cameraX = 2 * x / w - 1;
            const rayDirX = player.dirX + player.planeX * cameraX;
            const rayDirY = player.dirY + player.planeY * cameraX;
            
            let mapX = Math.floor(player.x), mapY = Math.floor(player.y);
            const deltaDistX = Math.abs(1 / rayDirX), deltaDistY = Math.abs(1 / rayDirY);
            let stepX, stepY, sideDistX, sideDistY;
            
            if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
            else { stepX = 1; sideDistX = (mapX + 1 - player.x) * deltaDistX; }
            if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
            else { stepY = 1; sideDistY = (mapY + 1 - player.y) * deltaDistY; }
            
            let hit = 0, side = 0, wallType = 1;
            let steps = 0;
            while (!hit && steps < 40) {
                if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
                else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
                if (mapX < 0 || mapX >= mapW || mapY < 0 || mapY >= this.mapH) break;
                const cell = map[mapY * mapW + mapX];
                if (cell > 0) { hit = 1; wallType = cell; }
                steps++;
            }
            
            if (!hit) { zBuf[x] = 1000; continue; }
            
            let perpWallDist;
            if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
            else perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
            zBuf[x] = perpWallDist;
            
            const lineHeight = Math.floor(h / perpWallDist);
            let drawStart = Math.max(0, Math.floor(-lineHeight / 2 + h / 2 + horizonOffset));
            let drawEnd = Math.min(h - 1, Math.floor(lineHeight / 2 + h / 2 + horizonOffset));
            
            let wallX;
            if (side === 0) wallX = player.y + perpWallDist * rayDirY;
            else wallX = player.x + perpWallDist * rayDirX;
            wallX -= Math.floor(wallX);
            
            let texX = Math.floor(wallX * 64);
            if (side === 0 && rayDirX > 0) texX = 63 - texX;
            if (side === 1 && rayDirY < 0) texX = 63 - texX;
            
            const step = 64 / lineHeight;
            let texPos = (drawStart - horizonOffset - h / 2 + lineHeight / 2) * step;
            
            const fog = Math.min(1, perpWallDist / 12);
            const sideShade = side === 1 ? 0.7 : 1.0;
            
            for (let y = drawStart; y <= drawEnd; y++) {
                let texY = Math.floor(texPos) & 63;
                texPos += step;
                const tIdx = (texY * 64 + texX) * 4;
                let r = tex[tIdx], g = tex[tIdx+1], b = tex[tIdx+2];
                r *= sideShade; g *= sideShade; b *= sideShade;
                r = r * (1-fog) + 10*fog;
                g = g * (1-fog) + 10*fog;
                b = b * (1-fog) + 10*fog;
                const i = (y * w + x) * 4;
                buf[i] = r; buf[i+1] = g; buf[i+2] = b;
            }
        }
        
        // Render props (static sprites)
        const allSprites = [
            ...this.props.map(p => ({...p, type: 'prop'})),
            ...sprites.map(s => ({...s, type: 'zombie'})),
            ...pickups.map(p => ({...p, type: 'pickup'})),
            ...this.particles.map(p => ({...p, type: 'particle'}))
        ];
        
        const spriteOrder = allSprites.map((s, i) => ({
            i, dist: ((player.x-s.x)**2 + (player.y-s.y)**2)
        })).sort((a, b) => b.dist - a.dist);
        
        for (const obj of spriteOrder) {
            const s = allSprites[obj.i];
            const spriteX = s.x - player.x, spriteY = s.y - player.y;
            const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
            const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
            const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);
            if (transformY <= 0.1) continue;
            
            const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
            let spriteHeight, spriteWidth, baseTex;
            
            if (s.type === 'particle') {
                spriteHeight = 8;
                spriteWidth = 8;
            } else if (s.type === 'pickup') {
                spriteHeight = Math.abs(Math.floor(h / transformY * 0.4));
                spriteWidth = spriteHeight;
            } else if (s.type === 'prop') {
                const size = s.size || 1;
                spriteHeight = Math.abs(Math.floor(h / transformY * size));
                spriteWidth = spriteHeight * 0.7;
            } else {
                // Zombie
                const size = s.typeZ === 'brute' ? 1.3 : (s.typeZ === 'runner' ? 0.9 : 1);
                spriteHeight = Math.abs(Math.floor(h / transformY * size));
                spriteWidth = Math.floor(spriteHeight * 0.6);
            }
            
            const drawStartY = Math.max(0, Math.floor(-spriteHeight / 2 + h / 2 + horizonOffset));
            const drawEndY = Math.min(h - 1, Math.floor(spriteHeight / 2 + h / 2 + horizonOffset));
            const drawStartX = Math.max(0, Math.floor(-spriteWidth / 2 + spriteScreenX));
            const drawEndX = Math.min(w - 1, Math.floor(spriteWidth / 2 + spriteScreenX));
            
            const fog = Math.min(0.9, transformY / 12);
            
            // Get texture data
            let texData, texW = 64, texH = 96;
            if (s.type === 'particle') {
                // Draw inline - colored pixel
                const color = s.type === 'blood' ? [139, 0, 0] : [255, 200, 50];
                for (let stripe = drawStartX; stripe <= drawEndX; stripe++) {
                    if (transformY < zBuf[stripe]) {
                        for (let y = drawStartY; y <= drawEndY; y++) {
                            const i = (y * w + stripe) * 4;
                            buf[i] = color[0] * s.life;
                            buf[i+1] = color[1] * s.life;
                            buf[i+2] = color[2] * s.life;
                        }
                    }
                }
                continue;
            } else if (s.type === 'pickup') {
                // Pickup - colored box
                const isHealth = s.pickupType === 'health';
                const color = isHealth ? [255, 50, 50] : [255, 200, 50];
                for (let stripe = drawStartX; stripe <= drawEndX; stripe++) {
                    if (transformY < zBuf[stripe]) {
                        for (let y = drawStartY; y <= drawEndY; y++) {
                            const i = (y * w + stripe) * 4;
                            const relY = (y - drawStartY) / spriteHeight;
                            const relX = (stripe - drawStartX) / spriteWidth;
                            // Cross pattern for health, bullet for ammo
                            const inCross = isHealth && ((relX > 0.35 && relX < 0.65) || (relY > 0.35 && relY < 0.65));
                            const inBox = relX > 0.1 && relX < 0.9 && relY > 0.1 && relY < 0.9;
                            if (inBox) {
                                buf[i] = color[0] * (1-fog) * 0.8;
                                buf[i+1] = color[1] * (1-fog) * 0.8;
                                buf[i+2] = color[2] * (1-fog) * 0.8;
                                if (inCross) {
                                    buf[i] = 255; buf[i+1] = 255; buf[i+2] = 255;
                                }
                            }
                        }
                    }
                }
                continue;
            } else if (s.type === 'prop') {
                // Draw prop procedurally
                this.drawProp(buf, w, drawStartX, drawEndX, drawStartY, drawEndY, spriteHeight, spriteWidth, transformY, zBuf, s.propType, fog);
                continue;
            } else {
                // Zombie sprite
                const frame = Math.floor(s.animFrame || 0) % 2;
                texData = ZOMBIE_SPRITES[s.typeZ || 'normal'][frame]?.data;
                if (!texData) continue;
                texH = 96; texW = 64;
            }
            
            for (let stripe = drawStartX; stripe <= drawEndX; stripe++) {
                if (transformY >= zBuf[stripe]) continue;
                const texX = Math.floor(((stripe - (-spriteWidth/2 + spriteScreenX)) * texW) / spriteWidth);
                if (texX < 0 || texX >= texW) continue;
                
                for (let y = drawStartY; y <= drawEndY; y++) {
                    const d = (y - drawStartY) * texH / spriteHeight;
                    const texY = Math.floor(d) & (texH-1);
                    const tIdx = (texY * texW + texX) * 4;
                    const r = texData[tIdx], g = texData[tIdx+1], b = texData[tIdx+2], a = texData[tIdx+3];
                    if (a < 50 || (r === 0 && g === 0 && b === 0)) continue;
                    
                    // Headshot detection (top 30% of sprite)
                    if (s.hitFlash > 0) {
                        const i = (y * w + stripe) * 4;
                        buf[i] = 255; buf[i+1] = 255; buf[i+2] = 255;
                    } else {
                        const i = (y * w + stripe) * 4;
                        buf[i] = r * (1-fog);
                        buf[i+1] = g * (1-fog);
                        buf[i+2] = b * (1-fog);
                    }
                }
            }
        }
        
        this.ctx.putImageData(this.imgData, 0, 0);
    },
    
    drawProp(buf, w, startX, endX, startY, endY, sh, sw, dist, zBuf, type, fog) {
        for (let stripe = startX; stripe <= endX; stripe++) {
            if (dist >= zBuf[stripe]) continue;
            for (let y = startY; y <= endY; y++) {
                const relX = (stripe - startX) / sw;
                const relY = (y - startY) / sh;
                const i = (y * w + stripe) * 4;
                
                let r, g, b, draw = true;
                if (type === 'barrel') {
                    const inBarrel = relX > 0.2 && relX < 0.8 && relY > 0.1 && relY < 0.95;
                    if (inBarrel) {
                        r = 139 * (1-fog); g = 69 * (1-fog); b = 19 * (1-fog);
                        // Metal bands
                        if (relY > 0.25 && relY < 0.3 || relY > 0.7 && relY < 0.75) {
                            r = 60 * (1-fog); g = 60 * (1-fog); b = 60 * (1-fog);
                        }
                    } else draw = false;
                } else if (type === 'crate') {
                    if (relX > 0.1 && relX < 0.9 && relY > 0.2 && relY < 0.95) {
                        r = 160 * (1-fog); g = 82 * (1-fog); b = 45 * (1-fog);
                        // Planks
                        if (Math.abs(relX - 0.5) < 0.03 || Math.abs(relY - 0.5) < 0.03) {
                            r *= 0.6; g *= 0.6; b *= 0.6;
                        }
                    } else draw = false;
                } else if (type === 'tree') {
                    const trunk = relX > 0.4 && relX < 0.6 && relY > 0.5;
                    const leaves = relY < 0.7 && Math.hypot(relX - 0.5, relY - 0.4) < 0.35;
                    if (trunk) {
                        r = 90 * (1-fog); g = 60 * (1-fog); b = 30 * (1-fog);
                    } else if (leaves) {
                        r = 40 * (1-fog); g = 80 * (1-fog); b = 30 * (1-fog);
                    } else draw = false;
                } else if (type === 'car') {
                    const body = relY > 0.4 && relY < 0.9 && relX > 0.1 && relX < 0.9;
                    const top = relY > 0.15 && relY < 0.45 && relX > 0.25 && relX < 0.75;
                    if (body || top) {
                        r = 80 * (1-fog); g = 30 * (1-fog); b = 30 * (1-fog);
                        if (top) { r = 40 * (1-fog); g = 40 * (1-fog); b = 50 * (1-fog); }
                        // Wheels
                        if (relY > 0.85 && ((relX > 0.15 && relX < 0.3) || (relX > 0.7 && relX < 0.85))) {
                            r = 20 * (1-fog); g = 20 * (1-fog); b = 20 * (1-fog);
                        }
                    } else draw = false;
                } else draw = false;
                
                if (draw) {
                    buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = 255;
                }
            }
        }
    }
};