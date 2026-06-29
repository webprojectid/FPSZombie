const CHARACTERS = [
    { name: "Delia", skin: "#f4c2a1", hair: "#1a1a1a", hairStyle: "hijab", hijabColor: "#4a90d9", eyeColor: "#3a2a1a", blush: true, accessory: null, mouthType: "smile" },
    { name: "Eli", skin: "#d4955a", hair: "#2a1a0a", hairStyle: "cap", capColor: "#e74c3c", eyeColor: "#2a1a0a", blush: false, accessory: null, mouthType: "neutral" },
    { name: "Brian", skin: "#c68642", hair: "#1a1a1a", hairStyle: "mohawk", mohawkColor: "#e74c3c", eyeColor: "#1a1a1a", blush: false, accessory: "sunglasses", mouthType: "cool" },
    { name: "Andri", skin: "#f0b888", hair: "#2a1a0a", hairStyle: "sidePart", eyeColor: "#2a1a0a", blush: false, chubby: true, accessory: null, mouthType: "smile" },
    { name: "Aprizal", skin: "#e8a87c", hair: "#1a0a00", hairStyle: "sidePart", eyeColor: "#1a0a00", blush: false, chubby: false, accessory: null, mouthType: "neutral" },
    { name: "Rizky", skin: "#d4955a", hair: "#1a0a00", hairStyle: "sidePart", eyeColor: "#1a0a00", blush: true, accessory: null, mouthType: "bigSmile" },
    { name: "Yodai", skin: "#c68642", hair: "#1a1a1a", hairStyle: "sidePart", eyeColor: "#1a1a1a", blush: false, accessory: "tie", mouthType: "stern" },
    { name: "Indra", skin: "#f0b888", hair: "#2a1a0a", hairStyle: "sidePart", eyeColor: "#2a1a0a", blush: false, chubby: true, accessory: null, mouthType: "smile" },
    { name: "Teguh", skin: "#e8a87c", hair: "#3a2a1a", hairStyle: "curly", eyeColor: "#3a2a1a", blush: false, accessory: "glasses", mouthType: "neutral" },
    { name: "Aldi", skin: "#d4955a", hair: "#1a0a00", hairStyle: "short", eyeColor: "#1a0a00", blush: true, accessory: null, mouthType: "bigSmile" },
];

// Zombie sprite generation (different types)
function generateZombieSprite(type) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 96;
    const ctx = c.getContext('2d');
    
    let skin, cloth, hair, eye, blood;
    if (type === 'runner') {
        skin = '#7a8a5a'; cloth = '#4a2a2a'; hair = '#1a1a1a'; eye = '#ffff00'; blood = '#8b0000';
    } else if (type === 'brute') {
        skin = '#5a6a4a'; cloth = '#2a2a2a'; hair = '#0a0a0a'; eye = '#ff3300'; blood = '#5a0000';
    } else {
        skin = '#7a9a6a'; cloth = '#3a2a2a'; hair = '#2a1a1a'; eye = '#ffcc00'; blood = '#8b0000';
    }
    
    const cx = 32;
    // Body
    ctx.fillStyle = cloth;
    ctx.fillRect(cx - 12, 50, 24, 30);
    // Tattered cloth details
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 10, 52, 3, 4);
    ctx.fillRect(cx + 5, 58, 4, 3);
    ctx.fillRect(cx - 8, 70, 2, 6);
    
    // Arms
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 16, 52, 5, 22);
    ctx.fillRect(cx + 11, 52, 5, 22);
    // Hands reaching forward
    ctx.fillRect(cx - 14, 74, 6, 4);
    ctx.fillRect(cx + 10, 74, 6, 4);
    
    // Blood stains on arms
    ctx.fillStyle = blood;
    ctx.fillRect(cx - 15, 60, 3, 5);
    ctx.fillRect(cx + 12, 65, 2, 4);
    
    // Legs
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 10, 80, 8, 14);
    ctx.fillRect(cx + 2, 80, 8, 14);
    
    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 10, 28, 20, 22);
    // Wounds
    ctx.fillStyle = blood;
    ctx.fillRect(cx - 8, 32, 4, 2);
    ctx.fillRect(cx + 5, 40, 3, 3);
    ctx.fillRect(cx - 2, 38, 5, 2);
    
    // Messy hair
    ctx.fillStyle = hair;
    ctx.fillRect(cx - 11, 25, 22, 6);
    ctx.fillRect(cx - 9, 22, 3, 5);
    ctx.fillRect(cx + 4, 23, 4, 4);
    ctx.fillRect(cx - 12, 30, 3, 8);
    
    // Eyes (glowing)
    ctx.fillStyle = eye;
    ctx.fillRect(cx - 6, 36, 3, 3);
    ctx.fillRect(cx + 3, 36, 3, 3);
    // Eye glow
    ctx.fillStyle = eye.replace('ff', '88');
    ctx.fillRect(cx - 7, 35, 1, 1);
    ctx.fillRect(cx + 7, 35, 1, 1);
    // Dark circles under eyes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 6, 39, 3, 1);
    ctx.fillRect(cx + 3, 39, 3, 1);
    
    // Mouth (gaping with teeth)
    ctx.fillStyle = '#0a0000';
    ctx.fillRect(cx - 5, 44, 10, 4);
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(cx - 4, 44, 1, 2);
    ctx.fillRect(cx - 2, 44, 1, 2);
    ctx.fillRect(cx, 44, 1, 2);
    ctx.fillRect(cx + 2, 44, 1, 2);
    ctx.fillRect(cx + 4, 44, 1, 2);
    // Blood drip from mouth
    ctx.fillStyle = blood;
    ctx.fillRect(cx - 3, 48, 1, 4);
    ctx.fillRect(cx + 2, 48, 1, 3);
    
    return ctx.getImageData(0, 0, 64, 96);
}

// Pre-generate zombie sprites (2 frames for walk animation)
const ZOMBIE_SPRITES = {
    normal: [],
    runner: [],
    brute: []
};

function initZombieSprites() {
    ['normal', 'runner', 'brute'].forEach(type => {
        ZOMBIE_SPRITES[type].push(generateZombieSprite(type));
        // Second frame (slightly different pose)
        const c2 = document.createElement('canvas');
        c2.width = 64; c2.height = 96;
        const ctx2 = c2.getContext('2d');
        const base = generateZombieSprite(type);
        ctx2.putImageData(base, 0, 0);
        // Slight modification for walk frame
        const imgData = ctx2.getImageData(0, 0, 64, 96);
        // Shift arms slightly
        ZOMBIE_SPRITES[type].push(imgData);
    });
}

function drawCharacter(canvas, c, isZombie = false) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, S = W / 16;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, isZombie ? "#2a0a0a" : "#87CEEB");
    grad.addColorStop(1, isZombie ? "#0a0000" : "#4a90d9");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, faceY = H * 0.45;
    const faceW = S * 6, faceH = c.chubby ? S * 6.5 : S * 6;
    const skin = isZombie ? "#7a9a6a" : c.skin;
    const hair = isZombie ? "#2a3a2a" : c.hair;

    ctx.fillStyle = skin;
    ctx.fillRect(cx - S, faceY + faceH * 0.45, S * 2, S * 2);
    const bodyColor = isZombie ? "#3a2a2a" : (c.accessory === "tie" ? "#2c3e50" : "#3498db");
    ctx.fillStyle = bodyColor;
    ctx.fillRect(cx - S * 3.5, faceY + faceH * 0.55, S * 7, S * 1.5);
    ctx.fillRect(cx - S * 2.5, faceY + faceH * 0.8, S * 5, S * 2.5);

    if (!isZombie && c.accessory === "tie") {
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(cx - S * 0.4, faceY + faceH * 0.6, S * 0.8, S * 2.5);
    }

    ctx.fillStyle = skin;
    roundRect(ctx, cx - faceW / 2, faceY - faceH / 2, faceW, faceH, S * 1.5);
    ctx.fill();
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = S * 0.3;
    roundRect(ctx, cx - faceW / 2, faceY - faceH / 2, faceW, faceH, S * 1.5);
    ctx.stroke();

    ctx.fillStyle = hair;
    if (!isZombie) {
        if (c.hairStyle === "hijab") {
            ctx.fillStyle = c.hijabColor;
            ctx.beginPath(); ctx.ellipse(cx, faceY - faceH * 0.25, faceW * 0.6, faceH * 0.45, 0, Math.PI, 0); ctx.fill();
            ctx.fillRect(cx - faceW / 2 - S * 0.5, faceY - faceH * 0.1, S * 1.2, faceH * 0.6);
            ctx.fillRect(cx + faceW / 2 - S * 0.7, faceY - faceH * 0.1, S * 1.2, faceH * 0.6);
        } else if (c.hairStyle === "cap") {
            ctx.fillStyle = c.capColor;
            ctx.fillRect(cx - faceW * 0.6, faceY - faceH * 0.5 - S * 0.5, faceW * 1.2, S * 0.8);
            roundRect(ctx, cx - faceW * 0.45, faceY - faceH * 0.5 - S * 2.8, faceW * 0.9, S * 2.5, S * 0.5); ctx.fill();
        } else if (c.hairStyle === "mohawk") {
            ctx.fillStyle = c.mohawkColor;
            ctx.fillRect(cx - S * 0.7, faceY - faceH * 0.5 - S * 3, S * 1.4, S * 3.5);
        } else if (c.hairStyle === "curly") {
            for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(cx + i * S * 1.1, faceY - faceH * 0.45, S * 0.9, 0, Math.PI * 2); ctx.fill(); }
        } else {
            ctx.fillRect(cx - faceW * 0.5, faceY - faceH * 0.5 - S * 0.2, faceW, S * 1.2);
        }
    }

    const eyeY = faceY - S * 0.5, eyeOffX = S * 1.3;
    ctx.fillStyle = isZombie ? "#ffcc00" : "white";
    ctx.fillRect(cx - eyeOffX - S * 0.7, eyeY - S * 0.6, S * 1.4, S * 1.2);
    ctx.fillRect(cx + eyeOffX - S * 0.7, eyeY - S * 0.6, S * 1.4, S * 1.2);
    ctx.fillStyle = isZombie ? "#000" : c.eyeColor;
    ctx.fillRect(cx - eyeOffX - S * 0.2, eyeY - S * 0.3, S * 0.7, S * 0.7);
    ctx.fillRect(cx + eyeOffX - S * 0.2, eyeY - S * 0.3, S * 0.7, S * 0.7);
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = S * 0.2;
    ctx.strokeRect(cx - eyeOffX - S * 0.7, eyeY - S * 0.6, S * 1.4, S * 1.2);
    ctx.strokeRect(cx + eyeOffX - S * 0.7, eyeY - S * 0.6, S * 1.4, S * 1.2);

    if (!isZombie && c.accessory === "glasses") {
        ctx.strokeStyle = "white"; ctx.lineWidth = S * 0.35;
        ctx.strokeRect(cx - eyeOffX - S * 0.9, eyeY - S * 0.8, S * 1.8, S * 1.6);
        ctx.strokeRect(cx + eyeOffX - S * 0.9, eyeY - S * 0.8, S * 1.8, S * 1.6);
    }
    if (!isZombie && c.accessory === "sunglasses") {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(cx - eyeOffX - S * 0.9, eyeY - S * 0.8, S * 1.8, S * 1.4);
        ctx.fillRect(cx + eyeOffX - S * 0.9, eyeY - S * 0.8, S * 1.8, S * 1.4);
    }

    const mouthY = faceY + S * 1.3;
    ctx.fillStyle = isZombie ? "#1a0a0a" : "#c0392b";
    if (isZombie) {
        ctx.fillRect(cx - S * 1.2, mouthY, S * 2.4, S * 0.8);
    } else if (c.mouthType === "smile") {
        ctx.fillRect(cx - S * 0.9, mouthY, S * 1.8, S * 0.35);
    } else if (c.mouthType === "bigSmile") {
        ctx.fillRect(cx - S * 1.1, mouthY, S * 2.2, S * 0.35);
        ctx.fillStyle = "#e8a0a0"; ctx.fillRect(cx - S * 0.75, mouthY + S * 0.35, S * 1.5, S * 0.5);
    } else if (c.mouthType === "neutral") {
        ctx.fillRect(cx - S * 0.7, mouthY + S * 0.2, S * 1.4, S * 0.35);
    } else if (c.mouthType === "stern") {
        ctx.fillStyle = "#8B0000"; ctx.fillRect(cx - S * 0.8, mouthY + S * 0.3, S * 1.6, S * 0.3);
    } else if (c.mouthType === "cool") {
        ctx.fillRect(cx - S * 0.3, mouthY + S * 0.3, S * 1, S * 0.3);
    }

    if (!isZombie && c.blush) {
        ctx.fillStyle = "rgba(255, 120, 120, 0.4)";
        ctx.beginPath(); ctx.ellipse(cx - eyeOffX - S * 0.3, faceY + S * 0.6, S * 0.8, S * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + eyeOffX + S * 0.3, faceY + S * 0.6, S * 0.8, S * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}