/**
 * Anime TV — Interactive Controller & Secret Shell
 * Inspired by ankitgupta.com.np & WWDC Apple Design Craft
 */
(() => {
    'use strict';

    /* ==========================================================================
       1. PLATFORM SHOWROOM TABS
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

            // Slide showroom track
            sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Update tab states
            tabs.forEach((tab, i) => {
                const isActive = i === currentIndex;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
                if (isActive && focus) tab.focus();
            });

            // Update panels
            panels.forEach((panel, i) => {
                panel.hidden = (i !== currentIndex);
            });
        }

        // Tab click events
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => setPlatform(index));
        });

        // Keyboard Arrow Navigation
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

        // Hero CTA link platform selectors
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
       2. COPY-TO-CLIPBOARD BUTTONS
       ========================================================================== */
    function initCopyButtons() {
        document.querySelectorAll('.cli-copy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const textToCopy = btn.getAttribute('data-copy');
                if (!textToCopy) return;

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<code style="color:#4ade80;">✔ Copied to Clipboard!</code>`;
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 2000);
                } catch {
                    // Fallback
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<code>${textToCopy}</code>`;
                    setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
                }
            });
        });
    }

    /* ==========================================================================
       3. SUBTLE 3D TILT ON ARTWORK (Emil Kowalski craft)
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
       4. INTERACTIVE SECRET TERMINAL / CLI (like ankitgupta.com.np)
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

        // Keyboard Shortcuts (Cmd+K, Ctrl+K, or Backtick `)
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

        // CLI Command Processor
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
  <b style="color:#22c55e;">platforms</b>            - List all supported platforms & packages
  <b style="color:#22c55e;">download &lt;os&gt;</b>       - Trigger installer (android | tv | fire | win)
  <b style="color:#22c55e;">stats</b>                - Live streaming engine telemetry stats
  <b style="color:#22c55e;">specs</b>                - Hardware & codec decoding details
  <b style="color:#22c55e;">matrix</b>               - Wake up, Neo...
  <b style="color:#22c55e;">about</b>                - Core architecture manifesto
  <b style="color:#22c55e;">clear</b>                - Clear terminal window
  <b style="color:#22c55e;">exit</b>                 - Close this interactive shell
                    `);
                    break;

                case 'platforms':
                    appendLine(`
[01] Android Mobile      (Kotlin / ExoPlayer) -> com.animetv.mobile
[02] Android TV Leanback (Android TV API)      -> com.animetv.leanback
[03] Amazon Fire TV      (FireOS 6+)          -> Downloader Code: 82910
[04] Windows 10/11       (WinUI3 / C++)       -> Iris-Installer-3.3.0.exe
                    `);
                    break;

                case 'download':
                    if (!arg) {
                        appendLine(`Usage: download &lt;android | tv | fire | win&gt;`, 'error');
                    } else if (['android', 'tv', 'fire', 'win', 'windows'].includes(arg)) {
                        appendLine(`✔ Starting download payload for [${arg.toUpperCase()}]...`, 'success');
                        window.location.href = 'Iris-Installer-3.3.0.exe';
                    } else {
                        appendLine(`Unknown target '${arg}'. Choose: android, tv, fire, win`, 'error');
                    }
                    break;

                case 'stats':
                    appendLine(`
● Anime TV Node Telemetry:
  - Ad Block Rate:     100.0% (0 network requests leaked)
  - Stream Resolution: Up to 4K UHD @ 60fps AV1
  - Latency:           18ms to nearest CDN resolver
  - Telemetry:         0 cookies / 0 fingerprints stored
                    `);
                    break;

                case 'specs':
                    appendLine(`
Video Decoding Pipeline:
  - AV1 Profile 0 (Main) @ Level 5.1
  - HEVC Main 10 (H.265) Hardware Decode
  - Dual Subtitle Rendering Engine (SSA/ASS + SRT)
  - Audio: Passthrough Dolby Digital / 5.1 Surround
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
                    appendLine(`Command not recognized: '${escapeHTML(cmd)}'. Type <b style="color:#22c55e;">help</b> for commands.`, 'error');
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

    // Initialize all modules when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initPlatformShowroom();
            initCopyButtons();
            initArtworkTilt();
            initInteractiveShell();
        });
    } else {
        initPlatformShowroom();
        initCopyButtons();
        initArtworkTilt();
        initInteractiveShell();
    }
})();
