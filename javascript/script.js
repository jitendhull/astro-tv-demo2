/**
 * Anime TV — Interactive Controller, Ambient Canvas & Dual-Theme Engine
 * Inspired by ankitgupta.com.np & WWDC Apple Design Craft
 */
(() => {
    'use strict';

    /* ==========================================================================
       1. DUAL-THEME CONTROLLER (Dark / Light Mode)
       ========================================================================== */
    function initThemeEngine() {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const root = document.documentElement;

        // Retrieve saved theme or detect system preference
        const savedTheme = localStorage.getItem('animetv_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'dark');

        setTheme(initialTheme);

        function setTheme(theme) {
            root.setAttribute('data-theme', theme);
            localStorage.setItem('animetv_theme', theme);

            // Update theme color meta tag
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', theme === 'dark' ? '#0a0c12' : '#f8fafc');
            }

            // Dispatch custom event for canvas re-theming
            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        }

        function toggleTheme() {
            const current = root.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            setTheme(next);
        }

        themeToggleBtn?.addEventListener('click', toggleTheme);

        // Export helper for terminal shell
        window.__animetv_setTheme = setTheme;
        window.__animetv_toggleTheme = toggleTheme;
    }

    /* ==========================================================================
       2. CUSTOM SMOOTH CURSOR (Lag + Hover Magnetism)
       ========================================================================== */
    function initCustomCursor() {
        const dot = document.getElementById('cursorDot');
        const ring = document.getElementById('cursorRing');

        if (!dot || !ring || window.matchMedia('(hover: none)').matches) return;

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let isMoving = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

            if (!isMoving) {
                dot.classList.remove('cursor-hidden');
                ring.classList.remove('cursor-hidden');
                isMoving = true;
            }
        });

        // Smooth Lerp loop for trailing outer ring
        function renderCursorRing() {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;

            ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%)`;

            requestAnimationFrame(renderCursorRing);
        }
        requestAnimationFrame(renderCursorRing);

        // Hover expansions on interactive controls
        const interactives = 'a, button, [role="tab"], summary, input, .stat-metric-item, .arch-brick, .features-brick';
        document.querySelectorAll(interactives).forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => ring.classList.remove('cursor-hover'));
        });

        // Hide when mouse leaves window
        document.addEventListener('mouseleave', () => {
            dot.classList.add('cursor-hidden');
            ring.classList.add('cursor-hidden');
            isMoving = false;
        });
        document.addEventListener('mouseenter', () => {
            dot.classList.remove('cursor-hidden');
            ring.classList.remove('cursor-hidden');
        });
    }

    /* ==========================================================================
       3. INTERACTIVE AMBIENT CANVAS BACKGROUND (Theme-Adaptive)
       ========================================================================== */
    function initInteractiveBackground() {
        const canvas = document.getElementById('bgCanvas');
        if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let mouse = { x: width / 2, y: height / 2, active: false };

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        });

        window.addEventListener('mouseleave', () => {
            mouse.active = false;
        });

        const particleCount = Math.min(Math.floor(window.innerWidth / 20), 65);
        let particles = [];

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.45;
                this.vy = (Math.random() - 0.5) * 0.45;
                this.radius = Math.random() * 1.6 + 0.8;
                this.baseAlpha = Math.random() * 0.35 + 0.15;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;

                // Mouse subtle repulsion
                if (mouse.active) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 140;

                    if (dist < maxDist) {
                        const force = (1 - dist / maxDist) * 1.5;
                        this.x += (dx / dist) * force;
                        this.y += (dy / dist) * force;
                    }
                }
            }

            draw(theme) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                if (theme === 'light') {
                    ctx.fillStyle = `rgba(79, 70, 229, ${this.baseAlpha * 0.7})`;
                } else {
                    ctx.fillStyle = `rgba(129, 140, 248, ${this.baseAlpha})`;
                }
                ctx.fill();
            }
        }

        function createParticles() {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }
        createParticles();

        let animFrameId;
        let isVisible = true;

        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
            if (isVisible) loop();
            else cancelAnimationFrame(animFrameId);
        });

        function loop() {
            if (!isVisible) return;
            ctx.clearRect(0, 0, width, height);
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw(currentTheme);

                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxLineDist = 110;

                    if (dist < maxLineDist) {
                        const alpha = (1 - dist / maxLineDist) * (currentTheme === 'light' ? 0.08 : 0.14);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = currentTheme === 'light'
                            ? `rgba(79, 70, 229, ${alpha})`
                            : `rgba(99, 102, 241, ${alpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }
            }

            animFrameId = requestAnimationFrame(loop);
        }
        loop();
    }

    /* ==========================================================================
       4. SMOOTH SCROLL REVEAL OBSERVER
       ========================================================================== */
    function initScrollReveals() {
        const reveals = document.querySelectorAll('.reveal-on-scroll');
        if (!reveals.length) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
            reveals.forEach(el => el.classList.add('is-revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        reveals.forEach(el => observer.observe(el));
    }

    /* ==========================================================================
       5. PLATFORM SHOWROOM TABS
       ========================================================================== */
    function initPlatformShowroom() {
        const tabList = document.querySelector('[role="tablist"]');
        const tabs = Array.from(document.querySelectorAll('.platform-tab-card[role="tab"]'));
        const sliderTrack = document.getElementById('platformSlides');
        const panels = Array.from(document.querySelectorAll('.showroom-panel[role="tabpanel"]'));

        if (!tabs.length || !sliderTrack || !panels.length) return;

        let currentIndex = tabs.findIndex(tab => tab.classList.contains('active'));
        if (currentIndex === -1) currentIndex = 0;

        function setPlatform(index, focus = false) {
            if (index < 0 || index >= tabs.length) return;
            currentIndex = index;

            sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

            tabs.forEach((tab, i) => {
                const isActive = i === currentIndex;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
                if (isActive && focus) tab.focus();
            });

            panels.forEach((panel, i) => {
                panel.hidden = (i !== currentIndex);
            });
        }

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => setPlatform(index));
        });

        tabList?.addEventListener('keydown', (e) => {
            let nextIndex = currentIndex;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextIndex = (currentIndex + 1) % tabs.length;
                setPlatform(nextIndex, true);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                setPlatform(nextIndex, true);
            } else if (e.key === 'Home') {
                e.preventDefault();
                setPlatform(0, true);
            } else if (e.key === 'End') {
                e.preventDefault();
                setPlatform(tabs.length - 1, true);
            }
        });

        document.querySelectorAll('[data-target-slide]').forEach(cta => {
            cta.addEventListener('click', () => {
                const slideNum = parseInt(cta.getAttribute('data-target-slide'), 10);
                if (!isNaN(slideNum)) {
                    setPlatform(slideNum, false);
                }
            });
        });
    }

    /* ==========================================================================
       6. COPY TO CLIPBOARD BUTTONS
       ========================================================================== */
    function initCopyButtons() {
        document.querySelectorAll('.cli-copy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const textToCopy = btn.getAttribute('data-copy');
                if (!textToCopy) return;

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<code style="color:var(--accent);">✔ Copied!</code>`;
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 2000);
                } catch {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<code>${textToCopy}</code>`;
                    setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
                }
            });
        });
    }

    /* ==========================================================================
       7. 3D ARTWORK CARD TILT (Emil Kowalski craft)
       ========================================================================== */
    function initArtworkTilt() {
        const card = document.getElementById('artworkCard');
        if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const rotX = (y / (rect.height / 2)) * -6;
            const rotY = (x / (rect.width / 2)) * 6;

            card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    }

    /* ==========================================================================
       8. INTERACTIVE CLI TERMINAL (interactive_shell.sh)
       ========================================================================== */
    function initInteractiveShell() {
        const modal = document.getElementById('cliModal');
        const triggerBtn = document.getElementById('cliTriggerBtn');
        const footerBtn = document.getElementById('footerCliBtn');
        const closeBtn = document.getElementById('cliCloseBtn');
        const cliInput = document.getElementById('cliInput');
        const cliOutput = document.getElementById('cliOutput');

        if (!modal || !cliInput || !cliOutput) return;

        function openShell() {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            cliInput.focus();
        }

        function closeShell() {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        }

        triggerBtn?.addEventListener('click', openShell);
        footerBtn?.addEventListener('click', openShell);
        closeBtn?.addEventListener('click', closeShell);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeShell();
        });

        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (modal.classList.contains('open')) closeShell();
                else openShell();
            } else if (e.key === 'Escape' && modal.classList.contains('open')) {
                closeShell();
            } else if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                openShell();
            }
        });

        function appendLine(text, className = '') {
            const line = document.createElement('div');
            line.className = `cli-line ${className}`;
            line.innerHTML = text;
            cliOutput.appendChild(line);
            cliOutput.scrollTop = cliOutput.scrollHeight;
        }

        function handleCommand(rawCmd) {
            const cmd = rawCmd.trim().toLowerCase();
            appendLine(`<span class="cli-prompt">guest@animetv:~$</span> ${escapeHTML(rawCmd)}`, 'command');

            if (!cmd) return;

            const parts = cmd.split(' ');
            const mainCmd = parts[0];
            const arg = parts[1];

            switch (mainCmd) {
                case 'help':
                    appendLine(`
Available commands:
  <b style="color:#818cf8;">platforms</b>            - List supported platforms & native targets
  <b style="color:#818cf8;">theme &lt;dark|light&gt;</b>   - Switch site visual color theme
  <b style="color:#818cf8;">download &lt;os&gt;</b>       - Trigger installer payload (android | tv | fire | win)
  <b style="color:#818cf8;">stats</b>                - Show engine stream telemetry
  <b style="color:#818cf8;">specs</b>                - Video decoding & GPU pipeline details
  <b style="color:#818cf8;">matrix</b>               - Wake up, Neo...
  <b style="color:#818cf8;">about</b>                - Core architecture manifesto
  <b style="color:#818cf8;">clear</b>                - Clear shell buffer
  <b style="color:#818cf8;">exit</b>                 - Close terminal
                    `);
                    break;

                case 'theme':
                    if (arg === 'light' || arg === 'dark') {
                        window.__animetv_setTheme(arg);
                        appendLine(`✔ Switched theme to [${arg.toUpperCase()}] mode`, 'success');
                    } else if (arg === 'toggle' || !arg) {
                        window.__animetv_toggleTheme();
                        appendLine(`✔ Toggled visual theme`, 'success');
                    } else {
                        appendLine(`Usage: theme &lt;dark | light | toggle&gt;`, 'error');
                    }
                    break;

                case 'platforms':
                    appendLine(`
[01] Android Mobile      (Kotlin / Jetpack)  -> com.animetv.mobile
[02] Android TV Leanback (Android TV API)    -> com.animetv.leanback
[03] Amazon Fire TV      (FireOS 6+)        -> Downloader Code: 82910
[04] Windows 10/11       (WinUI3 / C++)     -> Iris-Installer-3.3.0.exe
                    `);
                    break;

                case 'download':
                    if (!arg) {
                        appendLine(`Usage: download &lt;android | tv | fire | win&gt;`, 'error');
                    } else if (['android', 'tv', 'fire', 'win', 'windows'].includes(arg)) {
                        appendLine(`✔ Initiating payload transfer for [${arg.toUpperCase()}]...`, 'success');
                        window.location.href = 'Iris-Installer-3.3.0.exe';
                    } else {
                        appendLine(`Unknown target '${arg}'. Try: android, tv, fire, win`, 'error');
                    }
                    break;

                case 'stats':
                    appendLine(`
● Anime TV Node Telemetry:
  - Ad Block Efficiency: 100.0% (0 network ads resolved)
  - Stream Resolution:   Up to 4K UHD @ 60fps AV1
  - Resolver Latency:    18ms to nearest edge node
  - User Telemetry:      0 bytes stored
                    `);
                    break;

                case 'specs':
                    appendLine(`
Video Decoding Pipeline:
  - AV1 Profile 0 (Main) @ Level 5.1
  - HEVC Main 10 (H.265) Hardware Decode
  - SSA/ASS Subtitle Renderer
  - 5.1 Surround Passthrough
                    `);
                    break;

                case 'matrix':
                    appendLine(`Wake up, Neo... The Matrix has you. Follow the white rabbit. 🐇`, 'success');
                    break;

                case 'about':
                    appendLine(`Anime TV is an open-source media scraper built by fans, for fans. No ads. No popups. Ever.`, 'banner');
                    break;

                case 'clear':
                    cliOutput.innerHTML = '';
                    break;

                case 'exit':
                case 'close':
                case 'quit':
                    closeShell();
                    break;

                default:
                    appendLine(`Command not recognized: '${escapeHTML(cmd)}'. Type <b style="color:#818cf8;">help</b> for commands.`, 'error');
            }
        }

        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag));
        }

        cliInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = cliInput.value;
                cliInput.value = '';
                handleCommand(val);
            }
        });
    }

    // Initialize all components
    function bootstrap() {
        initThemeEngine();
        initCustomCursor();
        initInteractiveBackground();
        initScrollReveals();
        initPlatformShowroom();
        initCopyButtons();
        initArtworkTilt();
        initInteractiveShell();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
