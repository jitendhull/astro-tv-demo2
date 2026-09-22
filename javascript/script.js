/**
 * Anime TV Web UI Controller
 * Encapsulated platform tab navigation with full ARIA & keyboard support
 */
(() => {
    'use strict';

    /**
     * Initializes the platform tabs and panel slider.
     */
    function initPlatformTabs() {
        const tabList = document.querySelector('[role="tablist"]');
        const tabs = Array.from(document.querySelectorAll('.platform-card[role="tab"]'));
        const slides = document.getElementById('platformSlides');
        const panels = Array.from(document.querySelectorAll('.platform-slide[role="tabpanel"]'));

        if (!tabs.length || !slides || !panels.length) {
            return;
        }

        let currentIndex = tabs.findIndex(tab => tab.classList.contains('active'));
        if (currentIndex === -1) currentIndex = 0;

        /**
         * Switches active tab & panel by index.
         * @param {number} targetIndex
         * @param {boolean} [shouldFocus=false]
         */
        function selectPlatform(targetIndex, shouldFocus = false) {
            if (targetIndex < 0 || targetIndex >= tabs.length) return;

            currentIndex = targetIndex;

            // Animate slider track
            slides.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Update tabs state
            tabs.forEach((tab, index) => {
                const isActive = index === currentIndex;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.setAttribute('tabindex', isActive ? '0' : '-1');

                if (isActive && shouldFocus) {
                    tab.focus();
                }
            });

            // Update panels accessibility visibility
            panels.forEach((panel, index) => {
                const isActive = index === currentIndex;
                panel.hidden = !isActive;
            });
        }

        // Click listeners on tab buttons
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                selectPlatform(index);
            });
        });

        // Accessible Keyboard Navigation (Left/Right/Home/End)
        tabList?.addEventListener('keydown', (e) => {
            let nextIndex = currentIndex;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextIndex = (currentIndex + 1) % tabs.length;
                selectPlatform(nextIndex, true);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                selectPlatform(nextIndex, true);
            } else if (e.key === 'Home') {
                e.preventDefault();
                selectPlatform(0, true);
            } else if (e.key === 'End') {
                e.preventDefault();
                selectPlatform(tabs.length - 1, true);
            }
        });

        // Hero CTA link hooks
        document.querySelectorAll('[data-target-slide]').forEach(cta => {
            cta.addEventListener('click', (e) => {
                const targetSlide = parseInt(cta.getAttribute('data-target-slide'), 10);
                if (!isNaN(targetSlide)) {
                    selectPlatform(targetSlide, true);
                }
            });
        });
    }

    // Initialize once DOM is fully parsed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlatformTabs);
    } else {
        initPlatformTabs();
    }
})();
