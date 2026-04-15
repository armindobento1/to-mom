/* ============================================
   BIRTHDAY LETTER — SCROLL-DRIVEN ANIMATION
   ============================================
   This script maps scroll progress (0–1) to
   a cinematic sequence: zoom, flap, letter, text.
   ============================================ */

const root = document.documentElement;
const story = document.getElementById("scroll-story");
const curtain = document.getElementById("page-curtain");
const particleCanvas = document.getElementById("particle-canvas");

/* ============================================
   TWEAK: Animation timing & motion feel
   All the key values you'd want to adjust.
   ============================================ */
const SETTINGS = {
  // --- Camera zoom ---
  // TWEAK: zoomStart/zoomEnd — scroll range for camera push-in (0–1)
  zoomStart: 0.03,
  zoomEnd: 0.48,
  // TWEAK: zoomStrength — how far the camera pushes in (higher = closer)
  zoomStrengthDesktop: 0.35,
  zoomStrengthMobile: 0.25,
  // TWEAK: camera shift — horizontal/vertical drift during zoom (vw/vh)
  cameraShiftXDesktop: -1.2,
  cameraShiftYDesktop: -2.8,
  cameraShiftXMobile: -0.6,
  cameraShiftYMobile: -1.6,
  // Camera origin (where the zoom targets)
  // Camera targets the envelope stand (slightly right-of-center)
  cameraOriginXDesktop: 60,
  cameraOriginYDesktop: 54,
  cameraOriginXMobile: 50,
  cameraOriginYMobile: 65,
  // Camera follow when letter emerges (keeps letter in view)
  letterFollowYDesktop: 9.4,
  letterFollowYMobile: 5.8,

  // --- Envelope flap opening ---
  // TWEAK: flapStart/flapEnd — scroll range for flap animation
  flapStart: 0.48,
  flapEnd: 0.70,
  // TWEAK: flapMaxRotation — how far the flap opens (degrees, negative = backward)
  flapMaxRotation: -172,

  // --- Letter slide & message reveal ---
  // TWEAK: letterStart/letterEnd — scroll range for letter emerging
  letterStart: 0.60,
  letterEnd: 0.92,
  // TWEAK: letterHiddenOffset — positive pushes letter down inside envelope
  // TWEAK: letterVisibleOffset — negative pulls letter up out of envelope
  letterHiddenOffset: 200,
  letterVisibleOffset: -200,
  // TWEAK: messageFadeStart/messageFadeEnd — when text becomes readable
  messageFadeStart: 0.75,
  messageFadeEnd: 0.92,

  // --- Smoothing ---
  // TWEAK: smoothing — lower is softer/slower, higher is snappier (0.05–0.2)
  smoothing: 0.09,
};

/* ============================================
   UTILITIES
   ============================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let targetProgress = 0;
let renderedProgress = 0;

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function mapRange(value, start, end) {
  if (start === end) return 0;
  return clamp((value - start) / (end - start));
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutQuad(value) {
  return 1 - (1 - value) * (1 - value);
}

function easeOutQuart(value) {
  return 1 - Math.pow(1 - value, 4);
}

/* ============================================
   SCROLL PROGRESS TRACKING
   ============================================ */

function updateTargetProgress() {
  const rect = story.getBoundingClientRect();
  const maxScroll = rect.height - window.innerHeight;

  if (maxScroll <= 0) {
    targetProgress = 0;
    return;
  }

  targetProgress = clamp(-rect.top / maxScroll);
}

/* ============================================
   SCENE RENDERING
   Maps normalized progress (0–1) to all
   visual properties via CSS custom properties.
   ============================================ */

function applySceneProgress(progress) {
  const isMobile = window.innerWidth < 900;

  // Phase 2: Camera zoom
  const zoomProgress = easeInOutCubic(
    mapRange(progress, SETTINGS.zoomStart, SETTINGS.zoomEnd)
  );

  // Phase 3: Envelope flap
  const flapProgress = easeInOutCubic(
    mapRange(progress, SETTINGS.flapStart, SETTINGS.flapEnd)
  );

  // Phase 4: Letter emergence
  const letterProgress = easeOutQuart(
    mapRange(progress, SETTINGS.letterStart, SETTINGS.letterEnd)
  );

  // Phase 5: Message readability
  const messageProgress = easeOutQuad(
    mapRange(progress, SETTINGS.messageFadeStart, SETTINGS.messageFadeEnd)
  );

  // Camera follows the letter upward as it emerges
  const revealFollowProgress = easeInOutCubic(
    mapRange(progress, SETTINGS.letterStart, SETTINGS.messageFadeEnd)
  );

  // Responsive values
  const zoomStrength = isMobile
    ? SETTINGS.zoomStrengthMobile
    : SETTINGS.zoomStrengthDesktop;
  const cameraShiftX = isMobile
    ? SETTINGS.cameraShiftXMobile
    : SETTINGS.cameraShiftXDesktop;
  const cameraShiftY = isMobile
    ? SETTINGS.cameraShiftYMobile
    : SETTINGS.cameraShiftYDesktop;
  const cameraOriginX = isMobile
    ? SETTINGS.cameraOriginXMobile
    : SETTINGS.cameraOriginXDesktop;
  const cameraOriginY = isMobile
    ? SETTINGS.cameraOriginYMobile
    : SETTINGS.cameraOriginYDesktop;
  const letterFollowY = isMobile
    ? SETTINGS.letterFollowYMobile
    : SETTINGS.letterFollowYDesktop;

  // Compute final values
  const cameraScale = 1 + zoomProgress * zoomStrength;
  const cameraX = zoomProgress * cameraShiftX;
  const cameraY =
    zoomProgress * cameraShiftY + revealFollowProgress * letterFollowY;
  const letterOffset = lerp(
    SETTINGS.letterHiddenOffset,
    SETTINGS.letterVisibleOffset,
    letterProgress
  );
  const botanicalDrift = lerp(0, isMobile ? -10 : -20, zoomProgress);
  const ambientShift = lerp(0, isMobile ? 8 : 14, zoomProgress);
  const hintOpacity = 1 - mapRange(progress, 0.04, 0.16);
  const flapShadowAlpha = lerp(0.08, 0.18, flapProgress);

  // Apply to CSS custom properties
  root.style.setProperty("--camera-scale", cameraScale.toFixed(4));
  root.style.setProperty("--camera-x", `${cameraX.toFixed(3)}vw`);
  root.style.setProperty("--camera-y", `${cameraY.toFixed(3)}vh`);
  root.style.setProperty("--camera-origin-x", `${cameraOriginX.toFixed(2)}%`);
  root.style.setProperty("--camera-origin-y", `${cameraOriginY.toFixed(2)}%`);
  root.style.setProperty(
    "--flap-rotation",
    `${(flapProgress * SETTINGS.flapMaxRotation).toFixed(2)}deg`
  );
  root.style.setProperty("--flap-progress", flapProgress.toFixed(3));
  root.style.setProperty("--flap-shadow-alpha", flapShadowAlpha.toFixed(3));
  root.style.setProperty("--letter-offset", `${letterOffset.toFixed(2)}px`);
  // Open the clip zone as the letter emerges (0 = closed, -500px = open)
  root.style.setProperty("--clip-top-overflow", `${lerp(0, -500, letterProgress).toFixed(1)}px`);
  root.style.setProperty("--message-opacity", messageProgress.toFixed(3));
  root.style.setProperty("--hint-opacity", hintOpacity.toFixed(3));
  root.style.setProperty("--botanical-drift", `${botanicalDrift.toFixed(2)}px`);
  root.style.setProperty("--ambient-shift", `${ambientShift.toFixed(2)}px`);
}

/* ============================================
   ANIMATION LOOP
   Uses lerp for silky-smooth interpolation.
   ============================================ */

function animate() {
  const smoothing = prefersReducedMotion.matches ? 1 : SETTINGS.smoothing;
  renderedProgress = lerp(renderedProgress, targetProgress, smoothing);

  if (Math.abs(renderedProgress - targetProgress) < 0.0004) {
    renderedProgress = targetProgress;
  }

  applySceneProgress(renderedProgress);
  requestAnimationFrame(animate);
}

/* ============================================
   FLOATING LIGHT PARTICLES
   Subtle ambient particles for depth & warmth.
   ============================================ */

function initParticles() {
  if (!particleCanvas) return;
  if (prefersReducedMotion.matches) return;

  const ctx = particleCanvas.getContext("2d");
  let particles = [];
  let width, height;

  function resize() {
    width = particleCanvas.width = particleCanvas.offsetWidth;
    height = particleCanvas.height = particleCanvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: -Math.random() * 0.12 - 0.02,
      opacity: Math.random() * 0.4 + 0.1,
      life: Math.random() * 400 + 200,
      age: 0,
    };
  }

  function init() {
    resize();
    // TWEAK: particle count — more = denser light motes
    const count = Math.min(Math.floor(width * height / 28000), 30);
    particles = [];
    for (let i = 0; i < count; i++) {
      const p = createParticle();
      p.age = Math.random() * p.life;
      particles.push(p);
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.age++;

      const lifeRatio = p.age / p.life;
      // Fade in at start, fade out at end
      const alpha =
        lifeRatio < 0.15
          ? lifeRatio / 0.15
          : lifeRatio > 0.8
            ? (1 - lifeRatio) / 0.2
            : 1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 248, 235, ${(p.opacity * alpha).toFixed(3)})`;
      ctx.fill();

      if (p.age >= p.life || p.y < -10 || p.x < -10 || p.x > width + 10) {
        particles[i] = createParticle();
      }
    }

    requestAnimationFrame(drawParticles);
  }

  init();
  drawParticles();

  window.addEventListener("resize", () => {
    resize();
  });
}

/* ============================================
   PAGE-LOAD ENTRANCE
   ============================================ */

function liftCurtain() {
  if (!curtain) return;
  // Small delay so fonts and layout settle
  requestAnimationFrame(() => {
    setTimeout(() => {
      curtain.classList.add("lifted");
      // Remove from DOM after transition
      curtain.addEventListener("transitionend", () => {
        curtain.remove();
      }, { once: true });
    }, 300);
  });
}

/* ============================================
   INITIALIZATION
   ============================================ */

window.addEventListener("scroll", updateTargetProgress, { passive: true });
window.addEventListener("resize", updateTargetProgress);

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", updateTargetProgress);
} else if (typeof prefersReducedMotion.addListener === "function") {
  prefersReducedMotion.addListener(updateTargetProgress);
}

// Set initial state
updateTargetProgress();
renderedProgress = targetProgress;
applySceneProgress(renderedProgress);

// Start animation loop
requestAnimationFrame(animate);

// Start ambient particles
initParticles();

// Lift the curtain
liftCurtain();
