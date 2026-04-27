const SYS_MATH = {
    phi: 1.61803398875,
    lerp: (start, end, amt) => (1 - amt) * start + amt * end,
    random: (min, max) => Math.random() * (max - min) + min,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max)
};

class CursorEngine {
    constructor() {
        this.dot = document.getElementById('cursor-dot');
        this.ring = document.getElementById('cursor-ring');
        this.targetX = window.innerWidth / 2;
        this.targetY = window.innerHeight / 2;
        this.currentX = this.targetX;
        this.currentY = this.targetY;
        this.isMouseDown = false;
        this.initListeners();
        this.refreshInteractions();
        this.render();
    }
    initListeners() {
        window.addEventListener('mousemove', (e) => { this.targetX = e.clientX; this.targetY = e.clientY; });
        window.addEventListener('mousedown', () => { this.isMouseDown = true; this.ring.style.borderColor = 'var(--text-color)'; });
        window.addEventListener('mouseup', () => { this.isMouseDown = false; this.ring.style.borderColor = ''; });
    }
    refreshInteractions() {
        document.querySelectorAll('.interactable').forEach(el => {
            el.onmouseenter = null; el.onmouseleave = null;
            el.onmouseenter = () => document.body.classList.add('cursor-hover');
            el.onmouseleave = () => document.body.classList.remove('cursor-hover');
        });
        document.querySelectorAll('input, textarea').forEach(el => {
            el.onmouseenter = () => document.body.classList.add('cursor-text');
            el.onmouseleave = () => document.body.classList.remove('cursor-text');
        });
    }
    render() {
        this.dot.style.transform = `translate3d(calc(${this.targetX}px - 50%), calc(${this.targetY}px - 50%), 0)`;
        this.currentX = SYS_MATH.lerp(this.currentX, this.targetX, 0.25);
        this.currentY = SYS_MATH.lerp(this.currentY, this.targetY, 0.25);
        let ringScale = this.isMouseDown ? 0.85 : 1;
        this.ring.style.transform = `translate3d(calc(${this.currentX}px - 50%), calc(${this.currentY}px - 50%), 0) scale(${ringScale})`;
        requestAnimationFrame(() => this.render());
    }
}

class MyceliumEngine {
    constructor() {
        this.canvas = document.getElementById('mycelium-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxDistance = 150;
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        let nodeCount = Math.floor((window.innerWidth * window.innerHeight) / 25000);
        this.spawnNodes(SYS_MATH.clamp(nodeCount, 20, 60));
        this.animate();
    }
    handleResize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    spawnNodes(count) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({ x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height, vx: SYS_MATH.random(-0.2, 0.2), vy: SYS_MATH.random(-0.2, 0.2), radius: SYS_MATH.random(1.0, 2.5) });
        }
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const isDark = document.body.classList.contains('dark-mode');
        const nodeColor = isDark ? '#8b9a46' : '#4a7c59';
        const lineColor = isDark ? '139, 154, 70' : '74, 124, 89';
        this.ctx.fillStyle = nodeColor;
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); this.ctx.fill();
            for (let j = i + 1; j < this.particles.length; j++) {
                let p2 = this.particles[j];
                let dx = p.x - p2.x; let dy = p.y - p2.y;
                if (Math.abs(dx) < this.maxDistance && Math.abs(dy) < this.maxDistance) {
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < this.maxDistance) {
                        let opacity = 1 - (dist / this.maxDistance);
                        this.ctx.strokeStyle = `rgba(${lineColor}, ${opacity * 0.3})`;
                        this.ctx.beginPath(); this.ctx.moveTo(p.x, p.y); this.ctx.lineTo(p2.x, p2.y); this.ctx.stroke();
                    }
                }
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}

class WindowManager {
    constructor(audioEngine) {
        this.baseZIndex = 100;
        this.audio = audioEngine; 
        this.windowStates = {};
        this.bindDesktopIcons();
        this.bindWindowControls();
        this.bindDragging();
    }
    spawn(appId) {
        const win = document.getElementById(appId);
        if (!win) return;
        win.classList.remove('minimized');
        if (!this.windowStates[appId]) {
            let maxWidth = window.innerWidth > 900 ? 600 : window.innerWidth * 0.9;
            win.style.width = `${maxWidth}px`;
            win.style.height = `${maxWidth / SYS_MATH.phi}px`;
            let offsetX = SYS_MATH.random(-20, 20);
            let offsetY = SYS_MATH.random(-20, 20);
            this.windowStates[appId] = { x: (window.innerWidth - maxWidth) / 2 + offsetX, y: (window.innerHeight - (maxWidth / SYS_MATH.phi)) / 2 + offsetY };
        }
        win.style.transform = `translate3d(${this.windowStates[appId].x}px, ${this.windowStates[appId].y}px, 0)`;
        win.classList.add('open');
        this.bringToFront(win);
        if(this.audio) this.audio.play('spawn');
    }
    close(appId) {
        const win = document.getElementById(appId);
        if (win) { win.classList.remove('open'); win.classList.remove('minimized'); if(this.audio) this.audio.play('close'); }
    }
    minimize(win) {
        win.classList.add('minimized');
        setTimeout(() => { win.classList.remove('open'); win.classList.remove('minimized'); }, 150); 
        if(this.audio) this.audio.play('click');
    }
    bringToFront(win) { this.baseZIndex++; win.style.zIndex = this.baseZIndex; }
    bindDesktopIcons() {
        document.querySelectorAll('[data-launch]').forEach(icon => {
            icon.addEventListener('click', () => {
                if(!icon.classList.contains('locked')) { this.spawn(icon.dataset.launch); } 
                else { if(this.audio) this.audio.play('error'); icon.classList.add('shake-err'); setTimeout(() => icon.classList.remove('shake-err'), 300); }
            });
        });
    }
    bindWindowControls() {
        document.querySelectorAll('.os-window').forEach(win => { win.addEventListener('mousedown', () => this.bringToFront(win)); });
        document.querySelectorAll('[data-action="close-window"]').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); this.close(btn.dataset.target); }); });
        document.querySelectorAll('[data-action="min-window"]').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); this.minimize(btn.closest('.os-window')); }); });
    }
    bindDragging() {
        document.querySelectorAll('.window-drag-handle').forEach(handle => {
            const win = handle.closest('.os-window') || document.getElementById('system-bot');
            if(!win) return;
            handle.addEventListener('mousedown', (e) => {
                if(e.target.closest('.window-controls')) return;
                if (win.classList.contains('os-window')) this.bringToFront(win);
                win.style.transition = 'none';
                let startX = 0; let startY = 0;
                const transform = win.style.transform;
                if (transform && transform.includes('translate3d')) {
                    const match = transform.match(/translate3d\(([^px]+)px,\s*([^px]+)px/);
                    if (match) { startX = parseFloat(match[1]); startY = parseFloat(match[2]); }
                }
                let initialMouseX = e.clientX; let initialMouseY = e.clientY; let animationFrameId = null;
                const move = (ev) => {
                    if (animationFrameId) return;
                    animationFrameId = requestAnimationFrame(() => {
                        let newX = startX + (ev.clientX - initialMouseX);
                        let newY = startY + (ev.clientY - initialMouseY);
                        win.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
                        if (win.id && this.windowStates[win.id]) { this.windowStates[win.id] = { x: newX, y: newY }; }
                        animationFrameId = null;
                    });
                };
                const stopMove = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', stopMove); if (animationFrameId) cancelAnimationFrame(animationFrameId); win.style.transition = ''; };
                document.addEventListener('mousemove', move); document.addEventListener('mouseup', stopMove);
            });
        });
    }
}

class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        document.addEventListener('click', () => { if(this.ctx.state === 'suspended') this.ctx.resume(); });
    }
    playDing() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); 
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }
    playFahhh() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        filter.frequency.exponentialRampToValueAtTime(200, now + 1);
        filter.Q.value = 0.8;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
        gain.gain.linearRampToValueAtTime(0, now + 1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }
    play(type) {
        if (type === 'click' || type === 'success') {
            this.playDing();
        } else {
            this.playFahhh();
        }
    }
}

class SystemHUD {
    constructor(audioEngine) {
        this.audio = audioEngine;
        this.xp = parseInt(localStorage.getItem('lumina_os_xp')) || 0;
        this.xpDisplay = document.getElementById('hud-xp');
        this.lvlDisplay = document.getElementById('hud-level');
        this.xpBarFill = document.getElementById('sys-xp-fill');
        this.notifCenter = document.getElementById('sys-notifications');
        this.updateDisplay(); this.initClock();
    }
    initClock() {
        const clock = document.getElementById('hud-clock');
        setInterval(() => { const d = new Date(); clock.innerText = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; }, 1000);
    }
    addXP(amount) {
        this.xp += amount; if (this.xp < 0) this.xp = 0; localStorage.setItem('lumina_os_xp', this.xp.toString()); this.updateDisplay();
        if (amount > 0) {
            this.toast(`+${amount} energy`); this.audio.play('success');
            this.xpDisplay.classList.remove('pop'); void this.xpDisplay.offsetWidth; this.xpDisplay.classList.add('pop'); setTimeout(() => this.xpDisplay.classList.remove('pop'), 300);
        } else if (amount < 0) { this.toast(`Lost ${Math.abs(amount)} energy`); this.audio.play('error'); }
    }
    updateDisplay() {
        const currentLevel = Math.floor(Math.sqrt(this.xp / 100)) + 1; const prevLvlXP = Math.pow(currentLevel - 1, 2) * 100; const nextLvlXP = Math.pow(currentLevel, 2) * 100;
        const progress = ((this.xp - prevLvlXP) / (nextLvlXP - prevLvlXP)) * 100;
        this.xpDisplay.innerText = `Energy: ${this.xp.toString().padStart(4, '0')}`; this.lvlDisplay.innerText = `Growth: ${currentLevel.toString().padStart(2, '0')}`; this.xpBarFill.style.width = `${progress}%`;
    }
    toast(message) {
        const t = document.createElement('div'); t.className = 'os-toast'; t.innerHTML = `<span style="color: var(--accent-color);">>_</span> ${message}`;
        this.notifCenter.appendChild(t); setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
    }
}

class VirtualFS {
    constructor() {
        this.drive = {
            "sys": {
                "_type": "dir",
                "heartbeat.sys": { _type: "file", content: "Studyos core.\nHandle with care." },
                "preferences.json": { _type: "file", content: "{\n  \"theme\": \"warm_light\",\n  \"phi_ratio\": 1.618\n}" }
            },
            "home": {
                "_type": "dir",
                "intentions.md": { _type: "file", content: "# Morning goals\nTake it one step at a time." },
                "thoughts.txt": { _type: "file", content: "- Plant a garden.\n- Read a book.\n- Breathe." }
            }
        };
        this.currentPath = ["home"];
    }
    resolvePath(pathArray) {
        let current = this.drive;
        for (let dir of pathArray) { if (current[dir] && current[dir]._type === "dir") { current = current[dir]; } else { return null; } }
        return current;
    }
    pwd() { return "/" + this.currentPath.join("/"); }
    ls() {
        const dir = this.resolvePath(this.currentPath); if (!dir) return "Hmm, I couldn't find that folder."; let output = [];
        for (let key in dir) { if (key !== "_type") { if (dir[key]._type === "dir") { output.push(`<span style="color: var(--accent-color);">[Dir] ${key}</span>`); } else { output.push(`[File] ${key}`); } } }
        return output.length > 0 ? output.join("<br>") : "Folder is empty";
    }
    cd(target) {
        if (target === "..") { if (this.currentPath.length > 0) this.currentPath.pop(); return `Wandered into ${this.pwd()}`; }
        if (target === "/") { this.currentPath = []; return `Wandered into /`; }
        const dir = this.resolvePath(this.currentPath);
        if (dir && dir[target] && dir[target]._type === "dir") { this.currentPath.push(target); return `Wandered into ${this.pwd()}`; }
        return `cd: ${target}: hmm, I couldn't find that folder.`;
    }
    cat(filename) {
        const dir = this.resolvePath(this.currentPath);
        if (dir && dir[filename]) { if (dir[filename]._type === "file") { return dir[filename].content.replace(/\n/g, '<br>'); } else { return `cat: ${filename}: that's a folder, not a file.`; } }
        return `cat: ${filename}: hmm, I couldn't find that file.`;
    }
}

class TerminalApp {
    constructor(vfs, hud, audio) { this.vfs = vfs; this.hud = hud; this.audio = audio; this.input = document.getElementById('term-input'); this.output = document.getElementById('term-out'); this.prompts = [ "What's on your mind right now?", "If time stopped for a day, what would you do?", "What does success look like to you today?", "Are you consuming or creating?", "Take a deep breath. how does your body feel?", "What is a small detail you appreciate today?", "Who could use a kind word from you?" ]; this.initTerminal(); }
    initTerminal() { this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const cmdRaw = this.input.value.trim(); if (cmdRaw !== "") { this.processCommand(cmdRaw); } this.input.value = ''; } }); document.getElementById('app-terminal').addEventListener('click', () => { this.input.focus(); }); }
    print(htmlText) { const div = document.createElement('div'); div.innerHTML = htmlText; this.output.appendChild(div); this.output.scrollTop = this.output.scrollHeight; }
    processCommand(cmdStr) {
        this.print(`<span style="opacity: 0.5;">${this.vfs.pwd()}></span> ${cmdStr}`); const args = cmdStr.split(' '); const cmd = args[0].toLowerCase(); this.audio.play('click');
        switch (cmd) { 
            case 'help': this.print("Commands: ls, cd, cat, clear, energy, ponder"); break; 
            case 'clear': this.output.innerHTML = ''; break; 
            case 'ls': this.print(this.vfs.ls()); break; 
            case 'cd': if (args[1]) { this.print(this.vfs.cd(args[1])); } else { this.print("Where to? (cd [folder])"); } break; 
            case 'cat': if (args[1]) { this.print(this.vfs.cat(args[1])); } else { this.print("Which file? (cat [file])"); } break; 
            case 'energy': this.print(`Current energy: <span style="color: var(--accent-color);">${this.hud.xp}</span>`); break; 
            case 'ponder': const p = this.prompts[Math.floor(Math.random() * this.prompts.length)]; this.print(`<i>${p}</i>`); break;
            default: this.print(`I'm not sure what '${cmd}' means. try 'help'.`); this.audio.play('error'); break; 
        }
    }
}

class QuestsApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.tasks = JSON.parse(localStorage.getItem('lumina_os_quests')) || []; this.input = document.getElementById('quest-input-field'); this.btn = document.getElementById('btn-add-quest'); this.list = document.getElementById('quest-list-container'); this.initQuests(); this.render(); }
    initQuests() { this.btn.addEventListener('click', () => this.addTask()); this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.addTask(); }); }
    save() { localStorage.setItem('lumina_os_quests', JSON.stringify(this.tasks)); }
    addTask() { const val = this.input.value.trim(); if (val) { this.tasks.push({ text: val, completed: false }); this.input.value = ''; this.save(); this.render(); this.audio.play('click'); } }
    completeTask(index) { if (!this.tasks[index].completed) { this.tasks[index].completed = true; this.hud.addXP(20); this.save(); this.render(); } }
    deleteTask(index) { this.tasks.splice(index, 1); this.save(); this.render(); this.audio.play('close'); }
    render() { this.list.innerHTML = ''; this.tasks.forEach((task, index) => { const item = document.createElement('div'); item.className = `task-item ${task.completed ? 'completed' : ''}`; let checkBtn = task.completed ? `<span style="color: var(--success-color);">✔ Done</span>` : `<button class="os-btn interactable" style="padding: 4px 10px; font-size: 0.65rem;" onclick="window.OS.Quests.completeTask(${index})">Done</button>`; item.innerHTML = `<div style="flex: 1; margin-right: 15px; word-wrap: break-word; font-family: var(--font-main); font-size: 0.85rem;">${task.text}</div><div style="display: flex; gap: 8px; align-items: center;">${checkBtn}<button class="os-btn interactable" style="padding: 4px 8px; font-size: 0.65rem; border-color: var(--error-color);" onclick="window.OS.Quests.deleteTask(${index})">x</button></div>`; this.list.appendChild(item); }); if (window.OS && window.OS.Cursor) window.OS.Cursor.refreshInteractions(); }
}

class FileExplorerApp {
    constructor(vfs, terminal) { this.vfs = vfs; this.terminal = terminal; this.pathDisplay = document.getElementById('vfs-current-path'); this.grid = document.getElementById('vfs-file-grid'); setInterval(() => this.checkPathChange(), 500); this.lastPath = ""; this.render(); }
    checkPathChange() { const current = this.vfs.pwd(); if (current !== this.lastPath) { this.lastPath = current; this.render(); } }
    render() { this.pathDisplay.innerText = `Path: ${this.vfs.pwd()}`; this.grid.innerHTML = ''; const dir = this.vfs.resolvePath(this.vfs.currentPath); if (!dir) return; if (this.vfs.currentPath.length > 0) { this.createNode("..", "dir", "🔙"); } for (let key in dir) { if (key !== "_type") { this.createNode(key, dir[key]._type, dir[key]._type === "dir" ? "📁" : "📄"); } } if (window.OS && window.OS.Cursor) window.OS.Cursor.refreshInteractions(); }
    createNode(name, type, icon) { const node = document.createElement('div'); node.className = "task-item interactable"; node.style.cursor = "none"; node.innerHTML = `<span style="font-family: var(--font-mono); font-size: 0.8rem;">${icon} ${name}</span>`; node.onclick = () => { if (type === "dir") { this.vfs.cd(name); this.render(); if(window.OS) window.OS.Audio.play('click'); } else if (type === "file") { if(window.OS) { window.OS.WindowManager.spawn('app-terminal'); window.OS.Terminal.processCommand(`cat ${name}`); } } }; this.grid.appendChild(node); }
}

class FocusHeistApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.display = document.getElementById('heist-timer-display'); this.input = document.getElementById('heist-duration'); this.btn = document.getElementById('btn-start-heist'); this.controls = document.getElementById('heist-controls'); this.interval = null; this.isActive = false; this.secondsRemaining = 0; this.totalMinutes = 0; this.initHeist(); }
    initHeist() { this.btn.addEventListener('click', () => this.startHeist()); window.addEventListener('blur', () => { if (this.isActive) { this.failHeist(); } }); }
    startHeist() { const mins = parseInt(this.input.value); if (isNaN(mins) || mins <= 0) return; this.totalMinutes = mins; this.secondsRemaining = mins * 60; this.isActive = true; this.controls.style.display = 'none'; this.hud.toast(`Focus started: ${mins} mins`); this.audio.play('spawn'); this.updateDisplay(); this.interval = setInterval(() => this.tick(), 1000); }
    tick() { this.secondsRemaining--; this.updateDisplay(); if (this.secondsRemaining <= 0) { this.completeHeist(); } }
    updateDisplay() { const m = Math.floor(this.secondsRemaining / 60).toString().padStart(2, '0'); const s = (this.secondsRemaining % 60).toString().padStart(2, '0'); this.display.innerText = `${m}:${s}`; }
    completeHeist() { clearInterval(this.interval); this.isActive = false; this.controls.style.display = 'grid'; this.display.innerText = "00:00"; const reward = this.totalMinutes * 15; this.hud.addXP(reward); this.hud.toast(`Focus complete`); }
    failHeist() { clearInterval(this.interval); this.isActive = false; this.controls.style.display = 'grid'; this.display.innerText = "00:00"; this.hud.addXP(-50); this.hud.toast(`Focus paused`); }
}

class MarketApp {
    constructor(hud, audio, windowManager) { this.hud = hud; this.audio = audio; this.wm = windowManager; this.grid = document.getElementById('market-grid'); this.storeItems = [ { id: 'app-bugfixer', icon: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>', name: 'Untangle', desc: 'Clear mental clutter', cost: 100 }, { id: 'app-flexcss', icon: '<svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/></svg>', name: 'Harmony', desc: 'Find layout balance', cost: 250 }, { id: 'app-typer', icon: '<svg viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>', name: 'Flow state', desc: 'Type your thoughts', cost: 400 } ]; this.unlocked = new Set(JSON.parse(localStorage.getItem('lumina_os_unlocks')) || []); this.render(); }
    render() { this.grid.innerHTML = ''; this.unlocked.forEach(appId => { const item = this.storeItems.find(i => i.id === appId); if (item) { const icon = document.getElementById(item.id.replace('app-', 'icon-')); if (icon) icon.classList.remove('locked'); } }); this.storeItems.forEach(item => { const isOwned = this.unlocked.has(item.id); const card = document.createElement('div'); card.className = 'market-card'; if (isOwned) { card.innerHTML = `${item.icon}<div style="font-family: var(--font-main); font-weight: 700; font-size: 0.9rem;">${item.name}</div><div style="font-family: var(--font-main); font-size: 0.75rem; opacity: 0.6;">${item.desc}</div><button class="os-btn" style="width: 100%; margin-top: auto; opacity: 0.5; pointer-events: none; background: transparent; box-shadow: none;">Owned</button>`; } else { card.innerHTML = `${item.icon}<div style="font-family: var(--font-main); font-weight: 700; font-size: 0.9rem;">${item.name}</div><div style="font-family: var(--font-main); font-size: 0.75rem; opacity: 0.6;">${item.desc}</div><button class="os-btn interactable" style="width: 100%; margin-top: auto;">Unlock [${item.cost} energy]</button>`; const btn = card.querySelector('button'); btn.onclick = () => this.purchase(item, card); } this.grid.appendChild(card); }); if (window.OS && window.OS.Cursor) window.OS.Cursor.refreshInteractions(); }
    purchase(item, cardElement) { if (this.hud.xp >= item.cost) { this.hud.addXP(-item.cost); this.unlocked.add(item.id); localStorage.setItem('lumina_os_unlocks', JSON.stringify([...this.unlocked])); this.audio.play('success'); this.hud.toast(`${item.name} unlocked.`); this.render(); } else { this.audio.play('error'); cardElement.classList.add('shake-err'); setTimeout(() => cardElement.classList.remove('shake-err'), 300); } }
}

class BugFixerApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.arena = document.getElementById('bug-arena'); this.btnScan = document.getElementById('btn-scan-bugs'); this.threatDisplay = document.getElementById('bug-threat-level'); this.nodes = []; this.isScanning = false; this.initArena(); }
    initArena() { for (let i = 0; i < 9; i++) { let node = document.createElement('div'); node.className = 'bug-node interactable'; node.dataset.state = 'clean'; node.addEventListener('click', () => this.handleNodeClick(node)); this.arena.appendChild(node); this.nodes.push(node); } this.btnScan.addEventListener('click', () => { if (!this.isScanning) this.runScan(); }); }
    runScan() { this.isScanning = true; this.threatDisplay.innerText = "Sweeping..."; this.audio.play('spawn'); let cycles = 20; const scanInterval = setInterval(() => { this.nodes.forEach(n => { n.className = 'bug-node interactable'; n.innerText = ''; n.dataset.state = 'clean'; }); if (cycles <= 0) { clearInterval(scanInterval); this.isScanning = false; this.threatDisplay.innerText = "Clutter level: 0"; return; } let targetIndex = Math.floor(Math.random() * 9); let isGolden = Math.random() > 0.85; let targetNode = this.nodes[targetIndex]; if (isGolden) { targetNode.classList.add('golden'); targetNode.innerText = '✧'; targetNode.dataset.state = 'golden'; } else { targetNode.classList.add('corrupt'); targetNode.innerText = 'Noise'; targetNode.dataset.state = 'corrupt'; } cycles--; }, 500); }
    handleNodeClick(node) { if (node.dataset.state === 'corrupt') { node.className = 'bug-node interactable'; node.innerText = 'Clear'; node.dataset.state = 'clean'; this.hud.addXP(10); } else if (node.dataset.state === 'golden') { node.className = 'bug-node interactable'; node.innerText = 'Calm'; node.dataset.state = 'clean'; this.hud.addXP(50); } else if (this.isScanning) { this.hud.addXP(-5); node.classList.add('shake-err'); setTimeout(() => node.classList.remove('shake-err'), 300); } }
}

class FlexCSSApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.title = document.getElementById('flex-target-name'); this.ghost = document.getElementById('flex-ghost'); this.player = document.getElementById('flex-player'); this.btnContainer = document.getElementById('flex-btn-container'); this.levels = [ { name: "center", ghostStyle: "top: 50%; left: 50%; transform: translate(-50%, -50%);", correct: "justify-content: center; align-items: center;", wrong: "justify-content: flex-end; align-items: center;" }, { name: "top right", ghostStyle: "top: 0; right: 0;", correct: "justify-content: flex-end; align-items: flex-start;", wrong: "justify-content: center; align-items: flex-start;" }, { name: "bottom left", ghostStyle: "bottom: 0; left: 0;", correct: "justify-content: flex-start; align-items: flex-end;", wrong: "justify-content: flex-end; align-items: flex-end;" }, { name: "bottom right", ghostStyle: "bottom: 0; right: 0;", correct: "justify-content: flex-end; align-items: flex-end;", wrong: "justify-content: space-between; align-items: flex-end;" } ]; this.loadLevel(); }
    loadLevel() { this.btnContainer.innerHTML = ''; this.player.style = "width:40px; height:40px; background: var(--accent-color); z-index: 2; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);"; let lvl = this.levels[Math.floor(Math.random() * this.levels.length)]; this.title.innerText = `Goal: ${lvl.name}`; this.ghost.style = `width:40px; height:40px; border: 2px dashed var(--border-color); position: absolute; opacity: 0.5; ${lvl.ghostStyle}`; let options = Math.random() > 0.5 ? [lvl.correct, lvl.wrong] : [lvl.wrong, lvl.correct]; options.forEach(opt => { let btn = document.createElement('button'); btn.className = 'os-btn interactable'; btn.style.textTransform = "none"; btn.style.fontSize = "0.7rem"; btn.innerText = opt; btn.addEventListener('click', () => { if (opt === lvl.correct) { document.getElementById('flex-arena').style = `height: 180px; position: relative; display: flex; padding: 0; ${opt}`; this.hud.addXP(40); setTimeout(() => this.loadLevel(), 1000); } else { this.audio.play('error'); btn.classList.add('shake-err'); setTimeout(() => btn.classList.remove('shake-err'), 300); } }); this.btnContainer.appendChild(btn); }); if (window.OS && window.OS.Cursor) window.OS.Cursor.refreshInteractions(); }
}

class TyperApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.targetEl = document.getElementById('typer-target-text'); this.inputEl = document.getElementById('typer-input-field'); this.wpmEl = document.getElementById('typer-wpm'); this.snippets = [ "\"The present moment is the only moment available to us, and it is the door to all moments.\" \n– Thich Nhat Hanh", "\"Water does not resist. Water flows. When you plunge your hand into it, all you feel is a caress.\" \n– Margaret Atwood", "\"To understand the immeasurable, the mind must be extraordinarily quiet, still.\" \n– J. Krishnamurti" ]; this.currentSnippet = ""; this.startTime = null; this.initTyper(); }
    initTyper() { this.loadSnippet(); this.inputEl.addEventListener('input', (e) => { e.preventDefault(); if (!this.startTime) this.startTime = Date.now(); let currentLen = this.inputEl.value.length; if (currentLen > this.currentSnippet.length) currentLen = this.currentSnippet.length; this.inputEl.value = this.currentSnippet.substring(0, currentLen); if (currentLen === this.currentSnippet.length) { let timeMins = (Date.now() - this.startTime) / 60000; let words = this.currentSnippet.length / 5; let wpm = Math.round(words / timeMins); this.wpmEl.innerText = `Wpm: ${wpm}`; let xpReward = wpm > 60 ? 100 : 40; this.hud.addXP(xpReward); this.inputEl.value = ''; this.startTime = null; this.loadSnippet(); } }); }
    loadSnippet() { this.currentSnippet = this.snippets[Math.floor(Math.random() * this.snippets.length)]; this.targetEl.innerText = this.currentSnippet; }
}

class CodeSpaceApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.input = document.getElementById('ide-input'); this.highlight = document.getElementById('ide-highlight'); this.lines = document.getElementById('ide-lines'); this.preview = document.getElementById('ide-preview'); this.runBtn = document.getElementById('btn-run-code'); this.initEditor(); }
    initEditor() { this.input.addEventListener('scroll', () => { this.highlight.scrollTop = this.input.scrollTop; this.highlight.scrollLeft = this.input.scrollLeft; this.lines.scrollTop = this.input.scrollTop; }); this.input.addEventListener('input', () => { this.updateSyntax(); this.updateLines(); }); this.input.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); const start = this.input.selectionStart; const end = this.input.selectionEnd; this.input.value = this.input.value.substring(0, start) + "  " + this.input.value.substring(end); this.input.selectionStart = this.input.selectionEnd = start + 2; this.updateSyntax(); } }); this.runBtn.addEventListener('click', () => { this.executeCode(); }); this.input.value = "\n<style>\n  body {\n    background: #e8ecd7;\n    color: #2c4c3b;\n    font-family: system-ui, sans-serif;\n    padding: 20px;\n  }\n  h1 {\n    border-bottom: 2px solid #8b9a46;\n    padding-bottom: 10px;\n  }\n</style>\n\n<h1>Workspace preview</h1>\n<p>Systems functional.</p>\n\n<script>\n  console.log('Under the hood access granted.');\n<\/script>"; this.updateSyntax(); this.updateLines(); }
    updateLines() { const lineCount = this.input.value.split('\n').length; let lineString = ''; for (let i = 1; i <= lineCount; i++) { lineString += i + '<br>'; } this.lines.innerHTML = lineString; }
    updateSyntax() { let code = this.input.value; code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); code = code.replace(/\b(const|let|var|function|return|if|else|for|while|class|new|import|export)\b/g, '<span style="color: var(--warning-color);">$1</span>'); code = code.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, '<span style="color: var(--success-color);">$1</span>'); code = code.replace(/(&lt;\/?[\w\s="/.':;#-\/\?]+&gt;)/g, '<span style="color: var(--error-color);">$1</span>'); this.highlight.innerHTML = code; }
    executeCode() { const code = this.input.value; const iframeDoc = this.preview.contentDocument || this.preview.contentWindow.document; iframeDoc.open(); iframeDoc.write(code); iframeDoc.close(); this.hud.addXP(40); this.hud.toast('Render success'); this.audio.play('success'); this.runBtn.classList.add('pop'); setTimeout(() => this.runBtn.classList.remove('pop'), 200); }
}

class MycoMazeApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.canvas = document.getElementById('myco-canvas'); this.ctx = this.canvas.getContext('2d'); this.scoreEl = document.getElementById('myco-score'); this.statusEl = document.getElementById('myco-status'); this.tileSize = 40; this.cols = this.canvas.width / this.tileSize; this.rows = this.canvas.height / this.tileSize; this.isPlaying = false; this.animationId = null; this.score = 0; this.keys = {}; this.player = null; this.nutrients = []; this.enemies = []; this.initEngine(); }
    initEngine() { window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; if (e.code === 'Space' && !this.isPlaying && document.getElementById('app-mycomaze').classList.contains('open')) { e.preventDefault(); this.startGame(); } }); window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; }); this.drawInitialScreen(); }
    startGame() { this.isPlaying = true; this.score = 0; this.scoreEl.innerText = this.score; this.statusEl.innerText = "Growing..."; this.statusEl.style.color = "var(--success-color)"; this.audio.play('spawn'); this.player = { x: Math.floor(this.cols / 2) * this.tileSize, y: Math.floor(this.rows / 2) * this.tileSize, size: this.tileSize * 0.8, speed: 4, vx: 0, vy: 0 }; this.nutrients = []; this.enemies = []; for(let i=0; i<3; i++) this.spawnNutrient(); for(let i=0; i<2; i++) this.spawnEnemy(); if (this.animationId) cancelAnimationFrame(this.animationId); this.gameLoop(); }
    spawnNutrient() { this.nutrients.push({ x: Math.floor(Math.random() * this.cols) * this.tileSize + (this.tileSize * 0.25), y: Math.floor(Math.random() * this.rows) * this.tileSize + (this.tileSize * 0.25), size: this.tileSize * 0.5 }); }
    spawnEnemy() { let ex, ey; do { ex = Math.floor(Math.random() * this.cols) * this.tileSize; ey = Math.floor(Math.random() * this.rows) * this.tileSize; } while (Math.abs(ex - this.player.x) < this.tileSize * 2 && Math.abs(ey - this.player.y) < this.tileSize * 2); this.enemies.push({ x: ex, y: ey, size: this.tileSize * 0.7, vx: (Math.random() > 0.5 ? 2 : -2), vy: (Math.random() > 0.5 ? 2 : -2) }); }
    update() { if (!this.isPlaying) return; this.player.vx = 0; this.player.vy = 0; if (this.keys['w'] || this.keys['arrowup']) this.player.vy = -this.player.speed; if (this.keys['s'] || this.keys['arrowdown']) this.player.vy = this.player.speed; if (this.keys['a'] || this.keys['arrowleft']) this.player.vx = -this.player.speed; if (this.keys['d'] || this.keys['arrowright']) this.player.vx = this.player.speed; this.player.x += this.player.vx; this.player.y += this.player.vy; this.player.x = SYS_MATH.clamp(this.player.x, 0, this.canvas.width - this.player.size); this.player.y = SYS_MATH.clamp(this.player.y, 0, this.canvas.height - this.player.size); this.enemies.forEach(enemy => { enemy.x += enemy.vx; enemy.y += enemy.vy; if (enemy.x <= 0 || enemy.x + enemy.size >= this.canvas.width) enemy.vx *= -1; if (enemy.y <= 0 || enemy.y + enemy.size >= this.canvas.height) enemy.vy *= -1; if (this.checkAABB(this.player, enemy)) { this.gameOver(); } }); for (let i = this.nutrients.length - 1; i >= 0; i--) { let nut = this.nutrients[i]; if (this.checkAABB(this.player, nut)) { this.nutrients.splice(i, 1); this.score += 10; this.scoreEl.innerText = this.score; this.audio.play('click'); this.hud.addXP(5); this.spawnNutrient(); if (this.score % 50 === 0) this.spawnEnemy(); } } }
    draw() { this.ctx.fillStyle = '#121815'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.strokeStyle = '#1e2b25'; this.ctx.lineWidth = 1; for (let i = 0; i < this.canvas.width; i += this.tileSize) { this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); this.ctx.stroke(); } for (let i = 0; i < this.canvas.height; i += this.tileSize) { this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i); this.ctx.stroke(); } if (!this.isPlaying && this.score === 0) { this.drawInitialScreen(); return; } this.ctx.fillStyle = 'var(--warning-color)'; this.nutrients.forEach(nut => { this.ctx.fillRect(nut.x, nut.y, nut.size, nut.size); }); this.ctx.fillStyle = 'var(--error-color)'; this.enemies.forEach(enemy => { this.ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size); }); this.ctx.fillStyle = 'var(--accent-color)'; this.ctx.fillRect(this.player.x, this.player.y, this.player.size, this.player.size); this.ctx.fillStyle = 'var(--bg-color)'; this.ctx.fillRect(this.player.x + 4, this.player.y + 4, this.player.size - 8, this.player.size - 8); }
    drawInitialScreen() { this.ctx.fillStyle = '#121815'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.fillStyle = 'var(--accent-color)'; this.ctx.font = '20px var(--font-mono)'; this.ctx.textAlign = 'center'; this.ctx.fillText('Press space to meander', this.canvas.width / 2, this.canvas.height / 2); this.ctx.textAlign = 'left'; }
    gameLoop() { if (!this.isPlaying) return; this.update(); this.draw(); this.animationId = requestAnimationFrame(() => this.gameLoop()); }
    checkAABB(rect1, rect2) { return ( rect1.x < rect2.x + rect2.size && rect1.x + rect1.size > rect2.x && rect1.y < rect2.y + rect2.size && rect1.y + rect1.size > rect2.y ); }
    gameOver() { this.isPlaying = false; this.audio.play('error'); this.statusEl.innerText = "Too close to the noise. press space to try again."; this.statusEl.style.color = "var(--error-color)"; this.ctx.fillStyle = 'rgba(217, 83, 79, 0.2)'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); this.hud.toast(`Wandering paused. total collected: ${this.score}`); }
}

class AudioVisualizerApp {
    constructor(hud, sysAudio) { this.hud = hud; this.sysAudio = sysAudio; this.canvas = document.getElementById('viz-canvas'); this.ctx = this.canvas.getContext('2d'); this.fileInput = document.getElementById('viz-file-upload'); this.uploadBtn = document.getElementById('btn-viz-upload'); this.playBtn = document.getElementById('btn-viz-play'); this.audioElement = document.getElementById('viz-audio-element'); this.trackName = document.getElementById('viz-track-name'); this.idleText = document.getElementById('viz-idle-text'); this.audioCtx = null; this.analyser = null; this.source = null; this.dataArray = null; this.bufferLength = null; this.animationId = null; this.isPlaying = false; this.isInitialized = false; this.initControls(); }
    initControls() { this.uploadBtn.addEventListener('click', () => { this.fileInput.click(); }); this.fileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) { const objectUrl = URL.createObjectURL(file); this.audioElement.src = objectUrl; this.trackName.innerText = `Track: ${file.name.toLowerCase()}`; this.idleText.style.display = 'none'; if (!this.isInitialized) this.initAudioContext(); this.hud.toast('Song loaded. energy generator active.'); this.sysAudio.play('success'); } }); this.playBtn.addEventListener('click', () => { if (!this.audioElement.src) { this.hud.toast('Silence is nice, but music is better.'); this.sysAudio.play('error'); return; } if (this.audioCtx && this.audioCtx.state === 'suspended') { this.audioCtx.resume(); } if (this.audioElement.paused) { this.audioElement.play(); this.isPlaying = true; this.sysAudio.play('spawn'); this.drawVisualizer(); } else { this.audioElement.pause(); this.isPlaying = false; cancelAnimationFrame(this.animationId); } }); this.audioElement.addEventListener('ended', () => { this.isPlaying = false; cancelAnimationFrame(this.animationId); this.hud.addXP(100); this.hud.toast('Track finished. +100 energy'); }); }
    initAudioContext() { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); this.analyser = this.audioCtx.createAnalyser(); this.source = this.audioCtx.createMediaElementSource(this.audioElement); this.source.connect(this.analyser); this.analyser.connect(this.audioCtx.destination); this.analyser.fftSize = 256; this.bufferLength = this.analyser.frequencyBinCount; this.dataArray = new Uint8Array(this.bufferLength); this.isInitialized = true; }
    drawVisualizer() { if (!this.isPlaying) return; this.animationId = requestAnimationFrame(() => this.drawVisualizer()); this.analyser.getByteFrequencyData(this.dataArray); this.ctx.fillStyle = '#0a0f0d'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); const centerX = this.canvas.width / 2; const centerY = this.canvas.height / 2; const phi = 1.61803398875; const radius = 50 * phi; for (let i = 0; i < this.bufferLength; i++) { const barHeight = (this.dataArray[i] / 2) * phi; const rads = (Math.PI * 2) / this.bufferLength; const angle = i * rads; const x1 = centerX + Math.cos(angle) * radius; const y1 = centerY + Math.sin(angle) * radius; const x2 = centerX + Math.cos(angle) * (radius + barHeight); const y2 = centerY + Math.sin(angle) * (radius + barHeight); const hue = 80 + (i / this.bufferLength) * 40; const isDark = document.body.classList.contains('dark-mode'); this.ctx.strokeStyle = isDark ? `hsla(${hue}, 40%, 60%, 0.8)` : `hsla(${hue}, 30%, 40%, 0.8)`; this.ctx.lineWidth = 2 * phi; this.ctx.lineCap = 'round'; this.ctx.beginPath(); this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.stroke(); } const bassAvg = (this.dataArray[0] + this.dataArray[1] + this.dataArray[2]) / 3; const coreRadius = (radius - 10) + (bassAvg / 10); this.ctx.beginPath(); this.ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2); this.ctx.fillStyle = 'var(--accent-color)'; this.ctx.fill(); this.ctx.beginPath(); this.ctx.arc(centerX, centerY, coreRadius / phi, 0, Math.PI * 2); this.ctx.fillStyle = 'var(--bg-color)'; this.ctx.fill(); if (Math.random() > 0.99) { this.hud.addXP(1); } }
}

class NetStatApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.targetInput = document.getElementById('ping-target'); this.pingBtn = document.getElementById('btn-ping-send'); this.trafficLog = document.getElementById('net-traffic-log'); this.nodesDisplay = document.getElementById('active-nodes'); this.statusDisplay = document.getElementById('sniffer-status'); this.sniffBtn = document.getElementById('btn-toggle-sniff'); this.isSniffing = false; this.sniffInterval = null; this.activeNodes = 0; this.initNetStat(); }
    initNetStat() { this.pingBtn.addEventListener('click', () => this.sendPing()); this.sniffBtn.addEventListener('click', () => this.toggleSniffer()); }
    generateIP() { return `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`; }
    logTraffic(message, color = "var(--bg-color)") { const entry = document.createElement('div'); entry.style.color = color; entry.innerText = `[${new Date().toLocaleTimeString()}] ${message}`; this.trafficLog.appendChild(entry); if (this.trafficLog.children.length > 50) { this.trafficLog.removeChild(this.trafficLog.firstChild); } this.trafficLog.scrollTop = this.trafficLog.scrollHeight; }
    sendPing() { const target = this.targetInput.value.trim(); if (!target) return; this.audio.play('click'); this.logTraffic(`Reaching out to ${target}...`, 'var(--warning-color)'); setTimeout(() => { const success = Math.random() > 0.2; if (success) { const time = Math.floor(Math.random() * 50) + 10; this.logTraffic(`${target} waved back! (took ${time}ms)`, 'var(--success-color)'); this.audio.play('success'); this.hud.addXP(5); } else { this.logTraffic(`No answer. they might be resting.`, 'var(--error-color)'); this.audio.play('error'); } }, 800); }
    toggleSniffer() { this.isSniffing = !this.isSniffing; if (this.isSniffing) { this.sniffBtn.innerText = "Stop listening"; this.sniffBtn.style.background = "var(--error-color)"; this.statusDisplay.innerText = "Intercepting"; this.statusDisplay.style.color = "var(--success-color)"; this.audio.play('spawn'); this.sniffInterval = setInterval(() => { this.activeNodes = Math.floor(Math.random() * 15) + 1; this.nodesDisplay.innerText = `Connections: ${this.activeNodes}`; const ip = this.generateIP(); const port = Math.floor(Math.random() * 8000) + 80; const size = Math.floor(Math.random() * 1500) + 64; if (Math.random() > 0.9) { this.logTraffic(`Caught a wandering thought: ${ip}:${port} [${size}b]`, 'var(--accent-color)'); this.hud.addXP(10); this.audio.play('success'); } else { this.logTraffic(`Src: ${ip}:${port} -> dest: localhost [${size}b]`); } }, 1200); } else { this.sniffBtn.innerText = "Listen in"; this.sniffBtn.style.background = "var(--window-bg)"; this.statusDisplay.innerText = "Idle"; this.statusDisplay.style.color = "var(--warning-color)"; clearInterval(this.sniffInterval); this.nodesDisplay.innerText = `Connections: 0`; this.audio.play('close'); } }
}

class SysMonitorApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.cpuTxt = document.getElementById('mon-cpu-txt'); this.cpuBar = document.getElementById('mon-cpu-bar'); this.ramTxt = document.getElementById('mon-ram-txt'); this.ramBar = document.getElementById('mon-ram-bar'); this.processList = document.getElementById('mon-process-list'); this.updateInterval = null; this.processes = []; this.totalRam = 8192; this.initMonitor(); }
    initMonitor() { const names = ['heartbeat.sys', 'dwm.exe', 'vfs_daemon', 'mycelium_bg', 'audio_host', 'net_stat', 'idle_process', 'distraction.exe']; names.forEach((name, i) => { this.processes.push({ id: i, name: name, pid: Math.floor(Math.random() * 9000) + 1000, mem: Math.floor(Math.random() * 500) + 10, isRogue: name === 'distraction.exe' }); }); this.renderProcesses(); const win = document.getElementById('app-sysmonitor'); const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.attributeName === 'class') { if (win.classList.contains('open')) { this.startMonitoring(); } else { this.stopMonitoring(); } } }); }); observer.observe(win, { attributes: true }); }
    startMonitoring() { if (this.updateInterval) clearInterval(this.updateInterval); this.updateInterval = setInterval(() => { const cpuUsage = Math.floor(Math.random() * 40) + 10 + (this.processes.length * 2); this.cpuTxt.innerText = `${cpuUsage}%`; this.cpuBar.style.width = `${cpuUsage}%`; if (cpuUsage > 80) this.cpuBar.style.background = 'var(--error-color)'; else if (cpuUsage > 50) this.cpuBar.style.background = 'var(--warning-color)'; else this.cpuBar.style.background = 'var(--accent-color)'; let currentRam = this.processes.reduce((acc, curr) => acc + curr.mem, 0); currentRam += Math.floor(Math.random() * 200) - 100; const ramPercent = (currentRam / this.totalRam) * 100; this.ramTxt.innerText = `${currentRam}MB / ${this.totalRam}MB`; this.ramBar.style.width = `${ramPercent}%`; if (Math.random() > 0.95 && this.processes.length < 15) { this.processes.push({ id: Date.now(), name: `unknown_${Math.floor(Math.random()*999)}.exe`, pid: Math.floor(Math.random() * 9000) + 1000, mem: Math.floor(Math.random() * 800) + 100, isRogue: true }); this.renderProcesses(); } }, 1000); }
    stopMonitoring() { clearInterval(this.updateInterval); }
    renderProcesses() { this.processList.innerHTML = ''; this.processes.sort((a, b) => b.mem - a.mem).forEach(proc => { const row = document.createElement('div'); row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.alignItems = 'center'; row.style.padding = '8px 10px'; row.style.background = 'rgba(255,255,255,0.05)'; row.style.borderRadius = '5px'; row.style.fontSize = '0.8rem'; row.style.color = proc.isRogue ? 'var(--warning-color)' : 'var(--text-color)'; row.innerHTML = `<span style="flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${proc.name}</span><span style="flex: 1; text-align: right; opacity: 0.7; font-family: var(--font-mono);">${proc.pid}</span><span style="flex: 1; text-align: right; font-family: var(--font-mono);">${proc.mem}M</span><div style="flex: 1; text-align: right;"><button class="os-btn interactable" style="padding: 4px 8px; font-size: 0.65rem; border-color: var(--error-color); color: var(--error-color); background: transparent;">End</button></div>`; const killBtn = row.querySelector('button'); killBtn.addEventListener('click', () => this.killProcess(proc.id)); this.processList.appendChild(row); }); if (window.OS && window.OS.Cursor) window.OS.Cursor.refreshInteractions(); }
    killProcess(id) { const procIndex = this.processes.findIndex(p => p.id === id); if (procIndex > -1) { const proc = this.processes[procIndex]; if (proc.name === 'heartbeat.sys') { this.hud.toast("Let's leave that one alone, it's keeping us alive."); this.audio.play('error'); return; } this.processes.splice(procIndex, 1); this.renderProcesses(); this.audio.play('close'); if (proc.isRogue) { this.hud.addXP(25); this.hud.toast(`Quieted a noisy thought. +25 energy`); this.audio.play('success'); } } }
}

class FractalLabApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.canvas = document.getElementById('fractal-canvas'); this.ctx = this.canvas.getContext('2d'); this.depthSlider = document.getElementById('fractal-depth'); this.angleSlider = document.getElementById('fractal-angle'); this.depthVal = document.getElementById('fractal-depth-val'); this.angleVal = document.getElementById('fractal-angle-val'); this.angle = parseFloat(this.angleSlider.value); this.depth = parseInt(this.depthSlider.value); this.animationOffset = 0; this.animationId = null; this.initEvents(); }
    initEvents() { this.depthSlider.addEventListener('input', (e) => { this.depth = parseInt(e.target.value); this.depthVal.innerText = this.depth; this.audio.play('click'); }); this.angleSlider.addEventListener('input', (e) => { this.angle = parseFloat(e.target.value); this.angleVal.innerText = this.angle.toFixed(2); }); const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.attributeName === 'class') { const win = document.getElementById('app-fractal'); if (win.classList.contains('open')) { if (!this.animationId) this.drawLoop(); } else { cancelAnimationFrame(this.animationId); this.animationId = null; } } }); }); observer.observe(document.getElementById('app-fractal'), { attributes: true }); }
    drawBranch(startX, startY, len, angle, depth) { this.ctx.beginPath(); this.ctx.save(); this.ctx.translate(startX, startY); this.ctx.rotate(angle); this.ctx.moveTo(0, 0); this.ctx.lineTo(0, -len); this.ctx.strokeStyle = `hsla(${120 - (depth * 10)}, 60%, 50%, ${depth/this.depth})`; this.ctx.lineWidth = depth * 0.5; this.ctx.stroke(); if (depth > 0) { this.drawBranch(0, -len, len * 0.7, this.angle + Math.sin(this.animationOffset) * 0.1, depth - 1); this.drawBranch(0, -len, len * 0.7, -this.angle + Math.sin(this.animationOffset) * 0.1, depth - 1); } this.ctx.restore(); }
    drawLoop() { this.ctx.fillStyle = '#0a0f0d'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); this.animationOffset += 0.02; this.drawBranch(this.canvas.width / 2, this.canvas.height - 20, 80, 0, this.depth); if (Math.random() > 0.99) this.hud.addXP(1); this.animationId = requestAnimationFrame(() => this.drawLoop()); }
}

class SonicWeaverApp {
    constructor(hud, sysAudio) { this.hud = hud; this.sysAudio = sysAudio; this.btnToggle = document.getElementById('btn-sonic-toggle'); this.pulseVisual = document.getElementById('sonic-visual-pulse'); this.audioCtx = null; this.isPlaying = false; this.oscillators = []; this.gains = []; this.lfo = null; this.visualizerId = null; this.initEvents(); }
    initEvents() { this.btnToggle.addEventListener('click', () => { if (this.isPlaying) { this.stopDrone(); } else { this.startDrone(); } }); }
    startDrone() { if (!this.audioCtx) { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); const baseFreq = 110; const frequencies = [baseFreq, baseFreq * 1.5, baseFreq * 2, baseFreq * 2.01]; const masterGain = this.audioCtx.createGain(); masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime); masterGain.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 3); masterGain.connect(this.audioCtx.destination); this.lfo = this.audioCtx.createOscillator(); this.lfo.type = 'sine'; this.lfo.frequency.value = 0.2; const lfoGain = this.audioCtx.createGain(); lfoGain.gain.value = 0.5; this.lfo.connect(lfoGain); this.lfo.start(); frequencies.forEach(freq => { const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain(); osc.type = 'sine'; osc.frequency.value = freq; lfoGain.connect(gain.gain); osc.connect(gain); gain.connect(masterGain); osc.start(); this.oscillators.push(osc); this.gains.push(gain); }); this.isPlaying = true; this.btnToggle.innerText = "Fade to silence"; this.btnToggle.style.background = "var(--error-color)"; this.hud.toast("Sonic weave initiated"); this.sysAudio.play('spawn'); this.animatePulse(); }
    stopDrone() { if (!this.isPlaying) return; this.gains.forEach(gain => { gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 2); }); setTimeout(() => { this.oscillators.forEach(osc => osc.stop()); if (this.lfo) this.lfo.stop(); this.oscillators = []; this.gains = []; this.lfo = null; }, 2000); this.isPlaying = false; this.btnToggle.innerText = "Weave soundscape"; this.btnToggle.style.background = "var(--window-bg)"; this.pulseVisual.style.transform = "scale(1)"; cancelAnimationFrame(this.visualizerId); this.hud.addXP(30); this.sysAudio.play('close'); }
    animatePulse() { if (!this.isPlaying) return; const time = this.audioCtx.currentTime; const scale = 1 + Math.sin(time * Math.PI * 2 * 0.2) * 0.3; this.pulseVisual.style.transform = `scale(${scale})`; this.visualizerId = requestAnimationFrame(() => this.animatePulse()); }
}

class PranaStateApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.orb = document.getElementById('prana-orb'); this.text = document.getElementById('prana-text'); this.btn = document.getElementById('btn-prana-start'); this.isActive = false; this.cycleCount = 0; this.timeoutIds = []; this.btn.addEventListener('click', () => { if (this.isActive) this.stopCycle(); else this.startCycle(); }); }
    startCycle() { this.isActive = true; this.cycleCount = 0; this.btn.innerText = "End meditation"; this.audio.play('spawn'); this.runPhase(); }
    stopCycle() { this.isActive = false; this.timeoutIds.forEach(id => clearTimeout(id)); this.timeoutIds = []; this.orb.style.transition = "all 1s ease"; this.orb.style.transform = "scale(1)"; this.orb.style.background = "var(--accent-color)"; this.text.innerText = "Centered"; this.btn.innerText = "Inhale deeply..."; const xpEarned = this.cycleCount * 15; if (xpEarned > 0) this.hud.addXP(xpEarned); }
    runPhase() { if (!this.isActive) return; this.text.innerText = "Inhale"; this.orb.style.transition = "transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 4s"; this.orb.style.transform = "scale(2.5)"; this.orb.style.background = "var(--success-color)"; this.timeoutIds.push(setTimeout(() => { if (!this.isActive) return; this.text.innerText = "Hold"; this.orb.style.transition = "background 7s"; this.orb.style.background = "var(--warning-color)"; this.timeoutIds.push(setTimeout(() => { if (!this.isActive) return; this.text.innerText = "Exhale"; this.orb.style.transition = "transform 8s ease-in-out, background 8s"; this.orb.style.transform = "scale(1)"; this.orb.style.background = "var(--accent-color)"; this.timeoutIds.push(setTimeout(() => { if (!this.isActive) return; this.cycleCount++; this.runPhase(); }, 8000)); }, 7000)); }, 4000)); }
}

class DesktopWidgets {
    constructor() { this.clockEl = document.getElementById('widget-clock'); this.notesInput = document.getElementById('widget-notes-input'); this.initClock(); this.initStickyNotes(); }
    initClock() { setInterval(() => { const now = new Date(); const h = now.getHours().toString().padStart(2, '0'); const m = now.getMinutes().toString().padStart(2, '0'); const s = now.getSeconds().toString().padStart(2, '0'); this.clockEl.innerText = `${h}:${m}:${s}`; }, 1000); }
    initStickyNotes() { const saved = localStorage.getItem('lumina_os_quickmemo'); if (saved) this.notesInput.value = saved; this.notesInput.addEventListener('input', () => { localStorage.setItem('lumina_os_quickmemo', this.notesInput.value); }); }
}

class ZenModeApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.isActive = false; this.buildUI(); }
    buildUI() { const taskbar = document.querySelector('.taskbar-group'); const btn = document.createElement('button'); btn.className = 'os-btn interactable'; btn.id = 'btn-zen-toggle'; btn.style.padding = '8px 16px'; btn.style.fontSize = '0.75rem'; btn.innerText = 'Zen mode'; btn.onclick = () => this.toggleZen(); taskbar.appendChild(btn); }
    toggleZen() {
        this.isActive = !this.isActive;
        const desktop = document.getElementById('desktop-environment');
        const bot = document.getElementById('system-bot');
        const btn = document.getElementById('btn-zen-toggle');
        if (this.isActive) {
            desktop.style.opacity = '0'; desktop.style.pointerEvents = 'none'; bot.style.opacity = '0'; bot.style.pointerEvents = 'none'; btn.innerText = 'Exit zen'; btn.style.background = 'var(--error-color)'; this.hud.toast('Zen mode active'); this.audio.play('spawn');
        } else {
            desktop.style.opacity = '1'; desktop.style.pointerEvents = 'all'; bot.style.opacity = '1'; bot.style.pointerEvents = 'all'; btn.innerText = 'Zen mode'; btn.style.background = 'transparent'; this.hud.toast('Zen mode disabled'); this.audio.play('close');
        }
    }
}

class BackupApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.buildUI(); this.initEvents(); }
    buildUI() {
        const desktop = document.getElementById('desktop-environment');
        const icon = document.createElement('div'); icon.className = 'desktop-icon interactable'; icon.dataset.launch = 'app-backup'; icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg><span>Backup</span>'; desktop.appendChild(icon);
        const layer = document.getElementById('os-window-layer'); const win = document.createElement('div'); win.className = 'os-window'; win.id = 'app-backup'; win.style.width = '400px'; win.innerHTML = '<div class="window-titlebar window-drag-handle interactable"><span>Data backup</span><div class="window-controls"><button class="window-btn min interactable" data-action="min-window">-</button><button class="window-btn close interactable" data-action="close-window" data-target="app-backup">x</button></div></div><div class="window-content" style="display: flex; flex-direction: column; gap: 15px;"><div class="status-box" style="padding: 10px; font-size: 0.9rem;">Save your progress</div><div class="grid-2"><button class="os-btn interactable" id="btn-export-data">Export data</button><button class="os-btn interactable" id="btn-import-data">Import data</button></div><input type="file" id="backup-file-input" accept=".json" style="display: none;"></div>'; layer.appendChild(win);
    }
    initEvents() {
        document.getElementById('btn-export-data').addEventListener('click', () => this.exportData());
        document.getElementById('btn-import-data').addEventListener('click', () => document.getElementById('backup-file-input').click());
        document.getElementById('backup-file-input').addEventListener('change', (e) => this.importData(e));
    }
    exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('os_') || key.includes('studyos')) { data[key] = localStorage.getItem(key); }
        }
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'studyos_backup.json'; a.click(); URL.revokeObjectURL(url);
        this.hud.toast('Data exported'); this.audio.play('success');
    }
    importData(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try { const data = JSON.parse(event.target.result); for (const key in data) { localStorage.setItem(key, data[key]); } this.hud.toast('Data restored. reload page to apply'); this.audio.play('spawn'); } 
            catch (err) { this.hud.toast('Invalid backup file'); this.audio.play('error'); }
        };
        reader.readAsText(file);
    }
}

class CalculatorApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.current = ''; this.buildUI(); this.initEvents(); }
    buildUI() {
        const desktop = document.getElementById('desktop-environment');
        const icon = document.createElement('div'); icon.className = 'desktop-icon interactable'; icon.dataset.launch = 'app-calc'; icon.innerHTML = '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="8" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/></svg><span>Calculator</span>'; desktop.appendChild(icon);
        const layer = document.getElementById('os-window-layer'); const win = document.createElement('div'); win.className = 'os-window'; win.id = 'app-calc'; win.style.width = '300px'; win.innerHTML = '<div class="window-titlebar window-drag-handle interactable"><span>Math tool</span><div class="window-controls"><button class="window-btn min interactable" data-action="min-window">-</button><button class="window-btn close interactable" data-action="close-window" data-target="app-calc">x</button></div></div><div class="window-content" style="display: flex; flex-direction: column; gap: 10px;"><div class="status-box" id="calc-display" style="padding: 15px; font-size: 1.5rem; text-align: right; font-family: var(--font-mono); overflow: hidden; white-space: nowrap;">0</div><div id="calc-keys" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;"></div></div>'; layer.appendChild(win);
        const keys = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', 'Del'];
        const container = document.getElementById('calc-keys');
        keys.forEach(k => { const btn = document.createElement('button'); btn.className = 'os-btn interactable'; btn.innerText = k; btn.dataset.val = k; container.appendChild(btn); });
    }
    initEvents() {
        this.display = document.getElementById('calc-display');
        document.querySelectorAll('#calc-keys .os-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audio.play('click');
                const val = e.target.dataset.val;
                if (val === 'C') { this.current = ''; this.display.innerText = '0'; } 
                else if (val === 'Del') { this.current = this.current.slice(0, -1); this.display.innerText = this.current || '0'; } 
                else if (val === '=') {
                    try { const result = new Function('return ' + this.current)(); this.current = String(Number.isInteger(result) ? result : parseFloat(result.toFixed(4))); this.display.innerText = this.current; this.hud.addXP(2); } 
                    catch (err) { this.display.innerText = 'Error'; this.current = ''; this.audio.play('error'); }
                } else { this.current += val; this.display.innerText = this.current; }
            });
        });
    }
}

class AchievementsApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.buildUI(); this.initEvents(); }
    buildUI() {
        const desktop = document.getElementById('desktop-environment');
        const icon = document.createElement('div'); icon.className = 'desktop-icon interactable'; icon.dataset.launch = 'app-achievements'; icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 15l-3 3h6l-3-3m0-12a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/><path d="M10 8h4v4h-4z"/></svg><span>Trophies</span>'; desktop.appendChild(icon);
        const layer = document.getElementById('os-window-layer'); const win = document.createElement('div'); win.className = 'os-window'; win.id = 'app-achievements'; win.style.width = '400px'; win.innerHTML = '<div class="window-titlebar window-drag-handle interactable"><span>Milestones</span><div class="window-controls"><button class="window-btn min interactable" data-action="min-window">-</button><button class="window-btn close interactable" data-action="close-window" data-target="app-achievements">x</button></div></div><div class="window-content" style="display: flex; flex-direction: column; gap: 10px;"><div class="status-box" style="padding: 10px; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center;"><span>Track your progress</span><button class="os-btn interactable" id="btn-refresh-trophies" style="padding: 4px 8px; font-size: 0.7rem;">Refresh</button></div><div id="trophy-list" style="display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 300px;"></div></div>'; layer.appendChild(win);
    }
    initEvents() {
        document.getElementById('btn-refresh-trophies').addEventListener('click', () => this.renderTrophies());
        const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.attributeName === 'class') { if (document.getElementById('app-achievements').classList.contains('open')) { this.renderTrophies(); } } }); });
        observer.observe(document.getElementById('app-achievements'), { attributes: true });
    }
    renderTrophies() {
        const list = document.getElementById('trophy-list'); list.innerHTML = '';
        const xp = parseInt(localStorage.getItem('lumina_os_xp')) || 0;
        const quests = JSON.parse(localStorage.getItem('lumina_os_quests')) || [];
        const completedQuests = quests.filter(q => q.completed).length;
        const goals = [
            { title: 'Starter spark', desc: 'Earn 100 energy', met: xp >= 100 },
            { title: 'Bright mind', desc: 'Earn 1000 energy', met: xp >= 1000 },
            { title: 'Focus master', desc: 'Earn 5000 energy', met: xp >= 5000 },
            { title: 'Doer', desc: 'Finish 1 task', met: completedQuests >= 1 },
            { title: 'Taskmaster', desc: 'Finish 10 tasks', met: completedQuests >= 10 }
        ];
        goals.forEach(g => {
            const item = document.createElement('div'); item.className = 'status-box'; item.style.padding = '10px'; item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.alignItems = 'center'; item.style.opacity = g.met ? '1' : '0.5';
            item.innerHTML = `<div style="display: flex; flex-direction: column;"><span style="font-weight: bold; color: ${g.met ? 'var(--accent-color)' : 'var(--text-color)'}">${g.title}</span><span style="font-size: 0.75rem;">${g.desc}</span></div><div style="font-family: var(--font-mono); font-size: 0.8rem; color: ${g.met ? 'var(--success-color)' : 'var(--error-color)'}">${g.met ? 'Unlocked' : 'Locked'}</div>`;
            list.appendChild(item);
        });
        this.audio.play('click');
    }
}

class ScratchpadApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.isDrawing = false; this.buildUI(); this.initEvents(); }
    buildUI() {
        const desktop = document.getElementById('desktop-environment');
        const icon = document.createElement('div'); icon.className = 'desktop-icon interactable'; icon.dataset.launch = 'app-scratchpad'; icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg><span>Scratchpad</span>'; desktop.appendChild(icon);
        const layer = document.getElementById('os-window-layer'); const win = document.createElement('div'); win.className = 'os-window'; win.id = 'app-scratchpad'; win.style.width = '420px'; win.innerHTML = '<div class="window-titlebar window-drag-handle interactable"><span>Quick sketch</span><div class="window-controls"><button class="window-btn min interactable" data-action="min-window">-</button><button class="window-btn close interactable" data-action="close-window" data-target="app-scratchpad">x</button></div></div><div class="window-content" style="display: flex; flex-direction: column; gap: 10px; align-items: center;"><canvas id="scratch-canvas" width="380" height="300" style="background: var(--window-bg); border: 2px solid var(--border-color); border-radius: 5px; cursor: crosshair;"></canvas><button class="os-btn interactable" id="btn-clear-scratch" style="width: 100%;">Clear canvas</button></div>'; layer.appendChild(win);
    }
    initEvents() {
        this.canvas = document.getElementById('scratch-canvas'); this.ctx = this.canvas.getContext('2d'); this.ctx.lineWidth = 2; this.ctx.lineCap = 'round';
        this.canvas.addEventListener('mousedown', (e) => { this.isDrawing = true; const rect = this.canvas.getBoundingClientRect(); this.ctx.beginPath(); this.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top); });
        this.canvas.addEventListener('mousemove', (e) => { if (!this.isDrawing) return; const rect = this.canvas.getBoundingClientRect(); this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); this.ctx.stroke(); });
        this.canvas.addEventListener('mouseup', () => { this.isDrawing = false; if (Math.random() > 0.8) this.hud.addXP(2); });
        this.canvas.addEventListener('mouseleave', () => { this.isDrawing = false; });
        document.getElementById('btn-clear-scratch').addEventListener('click', () => { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.audio.play('close'); });
        const observer = new MutationObserver((mutations) => { mutations.forEach((mutation) => { if (mutation.attributeName === 'class') { if (document.getElementById('app-scratchpad').classList.contains('open')) { const style = getComputedStyle(document.body); this.ctx.strokeStyle = style.getPropertyValue('--accent-color').trim(); } } }); });
        observer.observe(document.getElementById('app-scratchpad'), { attributes: true });
    }
}

class HabitTrackerApp {
    constructor(hud, audio) { this.hud = hud; this.audio = audio; this.habits = JSON.parse(localStorage.getItem('studyos_habits')) || []; this.buildUI(); this.initEvents(); this.render(); }
    buildUI() {
        const desktop = document.getElementById('desktop-environment');
        const icon = document.createElement('div'); icon.className = 'desktop-icon interactable'; icon.dataset.launch = 'app-habits'; icon.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg><span>Habits</span>'; desktop.appendChild(icon);
        const layer = document.getElementById('os-window-layer'); const win = document.createElement('div'); win.className = 'os-window'; win.id = 'app-habits'; win.style.width = '350px'; win.innerHTML = '<div class="window-titlebar window-drag-handle interactable"><span>Daily habits</span><div class="window-controls"><button class="window-btn min interactable" data-action="min-window">-</button><button class="window-btn close interactable" data-action="close-window" data-target="app-habits">x</button></div></div><div class="window-content" style="display: flex; flex-direction: column; gap: 10px;"><div style="display: flex; gap: 5px;"><input type="text" id="habit-input" class="os-input interactable" placeholder="New habit..." style="flex: 1;"><button class="os-btn interactable" id="btn-add-habit">+</button></div><div id="habit-list" style="display: flex; flex-direction: column; gap: 5px; max-height: 250px; overflow-y: auto;"></div></div>'; layer.appendChild(win);
    }
    initEvents() {
        document.getElementById('btn-add-habit').addEventListener('click', () => this.addHabit());
        document.getElementById('habit-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') this.addHabit(); });
    }
    addHabit() {
        const input = document.getElementById('habit-input'); const val = input.value.trim();
        if (val) { this.habits.push({ name: val, streak: 0, lastDone: null }); input.value = ''; this.save(); this.render(); this.audio.play('click'); }
    }
    checkHabit(index) {
        const today = new Date().toDateString(); const habit = this.habits[index];
        if (habit.lastDone !== today) { habit.streak++; habit.lastDone = today; this.hud.addXP(20); this.audio.play('success'); this.save(); this.render(); } 
        else { this.hud.toast('Already done today'); this.audio.play('error'); }
    }
    deleteHabit(index) { this.habits.splice(index, 1); this.save(); this.render(); this.audio.play('close'); }
    save() { localStorage.setItem('studyos_habits', JSON.stringify(this.habits)); }
    render() {
        const list = document.getElementById('habit-list'); list.innerHTML = ''; const today = new Date().toDateString();
        this.habits.forEach((h, i) => {
            const isDone = h.lastDone === today;
            const item = document.createElement('div'); item.className = 'status-box interactable'; item.style.padding = '8px'; item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.alignItems = 'center'; item.style.opacity = isDone ? '0.6' : '1';
            item.innerHTML = `<div style="display: flex; flex-direction: column; flex: 1; cursor: pointer;" id="habit-click-${i}"><span style="text-decoration: ${isDone ? 'line-through' : 'none'};">${h.name}</span><span style="font-size: 0.65rem; color: var(--accent-color);">Streak: ${h.streak}</span></div><button class="os-btn interactable" id="habit-del-${i}" style="padding: 2px 6px; font-size: 0.6rem; border-color: var(--error-color);">x</button>`;
            list.appendChild(item);
            document.getElementById(`habit-click-${i}`).addEventListener('click', () => this.checkHabit(i));
            document.getElementById(`habit-del-${i}`).addEventListener('click', () => this.deleteHabit(i));
        });
    }
}

class SettingsApp {
    constructor(hud, audio) {
        this.hud = hud;
        this.audio = audio;
        this.themes = {
            default: { '--bg-color': '#e8ecd7', '--text-color': '#2c4c3b', '--accent-color': '#8b9a46', '--window-bg': '#f4f6ec', '--border-color': '#a3b16d' },
            matcha: { '--bg-color': '#d1e2c4', '--text-color': '#2a3b22', '--accent-color': '#6b8e23', '--window-bg': '#e5eedb', '--border-color': '#8fbc8f' },
            nord: { '--bg-color': '#2e3440', '--text-color': '#eceff4', '--accent-color': '#88c0d0', '--window-bg': '#3b4252', '--border-color': '#4c566a' },
            cyber: { '--bg-color': '#0d0221', '--text-color': '#0ff0fc', '--accent-color': '#ff003c', '--window-bg': '#1a0b2e', '--border-color': '#4a0072' }
        };
        this.buildUI();
        this.initEvents();
        this.loadSavedTheme();
    }
    buildUI() {
        const desktop = document.getElementById('desktop-environment');
        const icon = document.createElement('div');
        icon.className = 'desktop-icon interactable';
        icon.dataset.launch = 'app-settings';
        icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69-.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49-.12-.64l2.11 1.63c-.04.31-.07.65-.07.97s.03.65.07.97l-2.11 1.63c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63z"/></svg><span>Settings</span>';
        desktop.appendChild(icon);
        const layer = document.getElementById('os-window-layer');
        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = 'app-settings';
        win.style.width = '450px';
        win.innerHTML = '<div class="window-titlebar window-drag-handle interactable"><span>System settings</span><div class="window-controls"><button class="window-btn min interactable" data-action="min-window">-</button><button class="window-btn close interactable" data-action="close-window" data-target="app-settings">x</button></div></div><div class="window-content" style="display: flex; flex-direction: column; gap: 15px;"><div class="status-box" style="padding: 10px; font-size: 0.9rem;">Color themes</div><div class="grid-2" id="theme-btn-container"><button class="os-btn interactable" data-theme="default">Studyos default</button><button class="os-btn interactable" data-theme="matcha">Matcha zen</button><button class="os-btn interactable" data-theme="nord">Nordic frost</button><button class="os-btn interactable" data-theme="cyber">Neon cyber</button></div></div>';
        layer.appendChild(win);
    }
    initEvents() {
        document.querySelectorAll('#theme-btn-container .os-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { this.applyTheme(e.target.dataset.theme); });
        });
    }
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (theme) {
            for (let key in theme) { document.documentElement.style.setProperty(key, theme[key]); }
            localStorage.setItem('studyos_theme', themeName);
            this.hud.toast(`Theme shift: ${themeName}`);
            this.audio.play('success');
        }
    }
    loadSavedTheme() {
        const saved = localStorage.getItem('studyos_theme');
        if (saved && this.themes[saved]) { this.applyTheme(saved); }
    }
}

class SystemKernel {
    constructor() {
        this.Cursor = new CursorEngine();
        this.Mycelium = new MyceliumEngine();
        this.Audio = new AudioEngine();
        this.HUD = new SystemHUD(this.Audio);
        this.VFS = new VirtualFS();
        this.WindowManager = new WindowManager(this.Audio);
        this.Terminal = new TerminalApp(this.VFS, this.HUD, this.Audio);
        this.Quests = new QuestsApp(this.HUD, this.Audio);
        this.FileExplorer = new FileExplorerApp(this.VFS, this.Terminal);
        this.Heist = new FocusHeistApp(this.HUD, this.Audio);
        this.BugFixer = new BugFixerApp(this.HUD, this.Audio);
        this.FlexCSS = new FlexCSSApp(this.HUD, this.Audio);
        this.Typer = new TyperApp(this.HUD, this.Audio);
        this.Market = new MarketApp(this.HUD, this.Audio, this.WindowManager);
        this.initGlobalBindings();
        this.bindBootSequence();
    }
    initGlobalBindings() {
        document.getElementById('btn-theme-toggle').addEventListener('click', () => { document.body.classList.toggle('dark-mode'); this.Audio.play('click'); });
        const bot = document.getElementById('system-bot');
        const bubble = document.getElementById('bot-bubble');
        bot.addEventListener('dblclick', () => { this.Audio.play('spawn'); bubble.innerText = "Take a deep breath. you're doing great, but remember to step outside sometimes."; bubble.classList.add('active'); setTimeout(() => bubble.classList.remove('active'), 3000); });
    }
    bindBootSequence() {
        const screen = document.getElementById('boot-screen');
        const log = document.getElementById('boot-terminal-log');
        const barFill = document.getElementById('boot-progress-fill');
        const bootBtn = document.getElementById('btn-init-kernel');
        
        bootBtn.addEventListener('click', () => {
            bootBtn.style.display = 'none';
            
            if(this.Audio.ctx && this.Audio.ctx.state === 'suspended') {
                this.Audio.ctx.resume();
            }

            const bootSteps = [ "Gathering thoughts...", "Brewing some tea...", "Getting things ready...", "Gathering your workspace...", "Opening the shell...", "We're ready for you." ];
            let step = 0;
            const bootInterval = setInterval(() => {
                if (step < bootSteps.length) {
                    const div = document.createElement('div');
                    div.innerText = `> ${bootSteps[step]}`;
                    log.appendChild(div);
                    barFill.style.width = `${((step + 1) / bootSteps.length) * 100}%`;
                    this.Audio.play('click');
                    step++;
                } else {
                    clearInterval(bootInterval);
                    this.Audio.play('success');
                    screen.style.opacity = '0';
                    setTimeout(() => { screen.style.display = 'none'; this.HUD.toast("Welcome to your space."); }, 800); 
                }
            }, 400); 
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.OS = new SystemKernel();
    
    setTimeout(() => {
        if (window.OS) {
            window.OS.CodeSpace = new CodeSpaceApp(window.OS.HUD, window.OS.Audio);
            window.OS.MycoMaze = new MycoMazeApp(window.OS.HUD, window.OS.Audio);
            window.OS.AudioVisualizer = new AudioVisualizerApp(window.OS.HUD, window.OS.Audio);
            window.OS.NetStat = new NetStatApp(window.OS.HUD, window.OS.Audio);
            window.OS.SysMonitor = new SysMonitorApp(window.OS.HUD, window.OS.Audio);
            window.OS.FractalLab = new FractalLabApp(window.OS.HUD, window.OS.Audio);
            window.OS.SonicWeaver = new SonicWeaverApp(window.OS.HUD, window.OS.Audio);
            window.OS.PranaState = new PranaStateApp(window.OS.HUD, window.OS.Audio);
            window.OS.Widgets = new DesktopWidgets();
            
            window.OS.Settings = new SettingsApp(window.OS.HUD, window.OS.Audio);
            window.OS.ZenMode = new ZenModeApp(window.OS.HUD, window.OS.Audio);
            window.OS.Backup = new BackupApp(window.OS.HUD, window.OS.Audio);
            window.OS.Calculator = new CalculatorApp(window.OS.HUD, window.OS.Audio);
            window.OS.Achievements = new AchievementsApp(window.OS.HUD, window.OS.Audio);
            window.OS.Scratchpad = new ScratchpadApp(window.OS.HUD, window.OS.Audio);
            window.OS.Habits = new HabitTrackerApp(window.OS.HUD, window.OS.Audio);
            
            window.OS.WindowManager.bindDesktopIcons();
            window.OS.WindowManager.bindWindowControls();
            window.OS.WindowManager.bindDragging();
            window.OS.Cursor.refreshInteractions();
        }
    }, 400);
});