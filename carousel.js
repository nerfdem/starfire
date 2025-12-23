/**
 * Fakten-Laufband (Carousel)
 * - Zeigt 1 Karte pro Seite
 * - Navigation per Buttons, Tastatur (←/→) und Touch-Swipe
 * - Aktualisiert aria-hidden und Aktivzustand für bessere Zugänglichkeit
 */

(function () {
    // Sucht alle Carousels (falls später mehrere verwendet werden)
    const carousels = document.querySelectorAll('[data-carousel]');
    if (!carousels.length) return;

    carousels.forEach(initCarousel);

    function initCarousel(root) {
        // Elemente im Carousel
        const viewport = root.querySelector('.carousel-viewport');
        const track = root.querySelector('.carousel-track');
        const slides = Array.from(root.querySelectorAll('.carousel-slide'));
        const btnPrev = root.querySelector('[data-carousel-prev]');
        const btnNext = root.querySelector('[data-carousel-next]');

        // Interner Zustand: aktueller Index
        let index = slides.findIndex(s => s.classList.contains('is-active'));
        if (index < 0) index = 0;

        // Lock: blockiert Klicks während Animation läuft
        let isAnimating = false;
        const ANIMATION_DURATION = 420; // ms (wie in CSS transition definiert)

        // Setzt den initialen Zustand
        update();

        // Klick-Handler für Buttons (nur wenn nicht gerade animiert)
        btnPrev?.addEventListener('click', () => {
            if (!isAnimating) goTo(index - 1);
        });
        btnNext?.addEventListener('click', () => {
            if (!isAnimating) goTo(index + 1);
        });

        // Tastatur-Navigation: Links/Rechts
        root.addEventListener('keydown', (e) => {
            // Nur reagieren, wenn Fokus innerhalb des Carousels liegt
            if (!root.contains(document.activeElement)) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goTo(index - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goTo(index + 1);
            }
        });

        // Fokus beim Tabben in den Viewport setzen (für Keyboard-Nutzung)
        viewport.tabIndex = 0;

        // Touch/Pointer-Swipe für mobile Geräte
        let startX = 0;
        let lastX = 0;
        let dragging = false;

        viewport.addEventListener('pointerdown', (e) => {
            dragging = true;
            startX = e.clientX;
            lastX = startX;
            viewport.setPointerCapture(e.pointerId);
        });

        viewport.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            lastX = e.clientX;
            const dx = lastX - startX;

            // Visuelles Mitschieben beim Drag
            track.style.transition = 'none';
            // dx ist in Pixeln, das Layout arbeitet aber mit Prozentbreiten.
            const slidePercentage = 100 / slides.length;
            const dxPercent = (dx / viewport.clientWidth) * slidePercentage;
            track.style.transform = `translateX(${dxPercent - index * slidePercentage}%)`;
        });

        viewport.addEventListener('pointerup', (e) => {
            if (!dragging) return;
            dragging = false;

            // Schwelle zum Wechseln (mind. 25% der Viewport-Breite)
            const dx = lastX - startX;
            const threshold = viewport.clientWidth * 0.25;

            track.style.transition = '';
            if (Math.abs(dx) > threshold) {
                goTo(dx > 0 ? index - 1 : index + 1);
            } else {
                // Zur aktuellen Position zurückspringen
                update();
            }
        });

        viewport.addEventListener('pointercancel', () => {
            dragging = false;
            track.style.transition = '';
            update();
        });

        // Bei Fenstergröße ändern: Position neu berechnen
        window.addEventListener('resize', update);

        /**
         * Wechselt zum gewünschten Slide-Index.
         * Begrenzung auf 0..slides.length-1
         * Setzt isAnimating Flag für die Dauer der CSS-Animation
         */
        function goTo(nextIndex) {
            if (isAnimating) return;
            index = Math.max(0, Math.min(slides.length - 1, nextIndex));
            isAnimating = true;
            update();

            // Nach Animation vorbei: Lock freigeben
            setTimeout(() => {
                isAnimating = false;
            }, ANIMATION_DURATION);
        }

        /**
         * Aktualisiert Transform, Aktivzustand und ARIA-Attribute.
         */
        function update() {
            // Track horizontal verschieben: jede Slide ist 20% der Track-Breite (500% / 5 Slides)
            const slidePercentage = 100 / slides.length;
            track.style.transform = `translateX(${-index * slidePercentage}%)`;

            slides.forEach((slide, i) => {
                const isActive = i === index;
                slide.classList.toggle('is-active', isActive);
                slide.setAttribute('aria-hidden', String(!isActive));
            });

            // Buttons je nach Position (optional) aktiv/deaktivieren
            toggleDisabled(btnPrev, index === 0);
            toggleDisabled(btnNext, index === slides.length - 1);

            /* --- IN DER UPDATE() FUNKTION --- */

            // Suche den Button
            const continueBtn = document.getElementById('continueBtn');

            if (continueBtn) {
                // Prüfen, ob wir auf der letzten Slide sind
                if (index === slides.length - 1) {

                    // 1. "Tour fortsetzen" einblenden
                    continueBtn.classList.add('is-visible');

                    // 2. Den normalen "Weiter"-Pfeil verstecken (damit er nicht stört)
                    if (btnNext) btnNext.style.opacity = '0';
                    if (btnNext) btnNext.style.pointerEvents = 'none'; // Nicht mehr klickbar

                } else {

                    // Andernfalls: Normalzustand wiederherstellen
                    continueBtn.classList.remove('is-visible');

                    // Pfeil wieder zeigen
                    if (btnNext) btnNext.style.opacity = '1';
                    if (btnNext) btnNext.style.pointerEvents = 'auto';
                }
            }
        }

        function toggleDisabled(btn, disabled) {
            if (!btn) return;
            btn.disabled = disabled;
            btn.setAttribute('aria-disabled', String(disabled));
        }
    }
})();