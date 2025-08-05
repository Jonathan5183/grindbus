/*
  ================================================================================
  GrindBus - Interactive JavaScript (Final Failsafe Version)
  Author: Gemini (Senior Frontend Engineer & UI/UX Visionary)
  Description: Handles all dynamic UI behaviors. This version ensures the site
               is always visible and fixes the authentication modal glitch.
  ================================================================================
*/

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    try {
        // --- 1. DOM Element Selection ---
        const dom = {
            navbar: document.querySelector('.navbar'),
            heroSection: document.getElementById('hero'),
            navLinks: document.querySelector('.nav-links'),
            hamburger: document.getElementById('hamburger'),
            bookingForm: document.querySelector('.booking-form'),
            contactForm: document.getElementById('contact-form'),
            swapButton: document.getElementById('swapLocations'),
            clearInputButtons: document.querySelectorAll('.clear-input-btn'),
            faqItems: document.querySelectorAll('.faq-item'),
            particleCanvas: document.getElementById('particle-canvas'),
            scrollProgress: document.getElementById('scroll-progress-indicator'),
            cursorTrail: document.getElementById('cursor-trail'),
            animatedElements: document.querySelectorAll('.animate'),
            gradientTexts: document.querySelectorAll('.gradient-text'),
            rippleButtons: document.querySelectorAll('.cta-button, .cta-button-small, #contact-form .btn, .swap-button, .auth-submit-btn'),
            authModal: document.getElementById('authModal'),
            authButton: document.getElementById('authButton'),
            authModalCloseBtn: document.querySelector('.auth-modal-close-btn'),
            authFormsContainer: document.querySelector('.auth-forms-container'),
            loginForm: document.getElementById('loginForm'),
            signupForm: document.getElementById('signupForm'),
            showLoginLink: document.getElementById('showLogin'),
            showSignupLink: document.getElementById('showSignup'),
            logoutButton: document.getElementById('logoutButton'),
            userInfoDisplay: document.getElementById('userInfoDisplay'),
            userEmailDisplay: document.getElementById('userEmailDisplay'),
            userIdDisplay: document.getElementById('userIdDisplay'),
            loginError: document.getElementById('loginError'),
            signupError: document.getElementById('signupError')
        };

        // --- 2. Firebase Initialization & Auth ---
        let auth;
        let firebaseInitialized = false;

        function initializeFirebase() {
            try {
                const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
                if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("DUMMY")) {
                    console.warn("Firebase config is missing or a dummy. Auth features will be limited.");
                    return;
                }
                const app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                firebaseInitialized = true;
                console.log("Firebase initialized.");
                signInAnonymously(auth).catch(e => console.error("Anonymous sign-in failed:", e));
                onAuthStateChanged(auth, handleAuthStateChange);
            } catch (e) {
                console.error("Firebase initialization failed:", e);
                alert("Could not connect to authentication service.");
            }
        }

        function handleAuthStateChange(user) {
            if (!dom.authButton || !dom.userInfoDisplay) return;

            if (user && !user.isAnonymous) {
                // User is fully logged in
                dom.authButton.style.display = 'none';
                dom.userInfoDisplay.style.display = 'flex';
                if(dom.userEmailDisplay) dom.userEmailDisplay.textContent = user.email;
                if(dom.userIdDisplay) dom.userIdDisplay.textContent = user.uid;
                if (dom.authModal?.classList.contains('active') && dom.authFormsContainer) {
                    dom.authFormsContainer.style.display = 'none';
                }
            } else {
                // User is anonymous or logged out
                dom.authButton.style.display = 'block';
                dom.userInfoDisplay.style.display = 'none';
                if (dom.authModal?.classList.contains('active') && dom.authFormsContainer) {
                    dom.authFormsContainer.style.display = 'block';
                }
            }
        }

        // --- 3. UI Initializers (with safety checks) ---
        
        function initializeNavbar() {
            if (!dom.navbar || !dom.heroSection) return;
            window.addEventListener('scroll', () => {
                const isScrolled = window.scrollY > (dom.heroSection.offsetHeight * 0.1);
                dom.navbar.classList.toggle('scrolled', isScrolled);
            });

            if (!dom.hamburger || !dom.navLinks) return;
            dom.hamburger.addEventListener('click', () => dom.navLinks.classList.toggle('active'));
            dom.navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => dom.navLinks.classList.remove('active'));
            });
        }

        function initIntersectionObservers() {
            if (!('IntersectionObserver' in window)) return;
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            dom.animatedElements.forEach(el => observer.observe(el));
            dom.gradientTexts.forEach(el => observer.observe(el));
        }

        function initFaqAccordion() {
            dom.faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                const answer = item.querySelector('.faq-answer');
                if (question && answer) {
                    question.addEventListener('click', () => {
                        const isActive = item.classList.toggle('active');
                        answer.style.maxHeight = isActive ? answer.scrollHeight + 'px' : '0';
                    });
                }
            });
        }

        function initFormInteractions() {
            dom.bookingForm?.addEventListener('submit', e => {
                e.preventDefault();
                alert('Finding buses... (This is a demo submission)');
            });
            dom.contactForm?.addEventListener('submit', e => {
                e.preventDefault();
                alert('Your inquiry has been sent!');
                dom.contactForm.reset();
            });
            dom.swapButton?.addEventListener('click', () => {
                const from = document.getElementById('fromLocation');
                const to = document.getElementById('toLocation');
                if (from && to) [from.value, to.value] = [to.value, from.value];
            });
            dom.clearInputButtons.forEach(button => {
                button.addEventListener('click', e => {
                    const targetInput = document.getElementById(e.currentTarget.dataset.target);
                    if (targetInput) targetInput.value = '';
                });
            });
        }

        function initAdvancedEffects() {
            if (dom.scrollProgress) {
                window.addEventListener('scroll', () => {
                    const totalHeight = document.body.scrollHeight - window.innerHeight;
                    dom.scrollProgress.style.width = `${totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0}%`;
                });
            }

            if (dom.rippleButtons.length) {
                dom.rippleButtons.forEach(button => {
                    button.addEventListener('click', function(e) {
                        const ripple = document.createElement('span');
                        ripple.classList.add('ripple');
                        this.appendChild(ripple);
                        const size = Math.max(this.clientWidth, this.clientHeight);
                        ripple.style.width = ripple.style.height = `${size}px`;
                        const rect = this.getBoundingClientRect();
                        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
                        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
                        ripple.addEventListener('animationend', () => ripple.remove());
                    });
                });
            }

            if (dom.cursorTrail) {
                let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;
                const animateCursor = () => {
                    currentX += (mouseX - currentX) * 0.2;
                    currentY += (mouseY - currentY) * 0.2;
                    dom.cursorTrail.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;
                    requestAnimationFrame(animateCursor);
                };
                document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; dom.cursorTrail.style.opacity = '1'; });
                document.addEventListener('mouseleave', () => { dom.cursorTrail.style.opacity = '0'; });
                animateCursor();
            }
        }

        function initParticleCanvas() {
            if (!dom.particleCanvas || !dom.heroSection) return;
            const canvas = dom.particleCanvas;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let particles = [];
            const particleCount = 80;
            const connectionDistance = 120;
            
            const resizeCanvas = () => {
                canvas.width = window.innerWidth;
                canvas.height = dom.heroSection.offsetHeight > 0 ? dom.heroSection.offsetHeight : window.innerHeight;
                initParticles();
            };

            class Particle {
                constructor(x, y, dirX, dirY, size, color) {
                    this.x = x; this.y = y; this.directionX = dirX; this.directionY = dirY; this.size = size; this.color = color;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }
                update() {
                    if (this.x + this.size > canvas.width || this.x - this.size < 0) this.directionX = -this.directionX;
                    if (this.y + this.size > canvas.height || this.y - this.size < 0) this.directionY = -this.directionY;
                    this.x += this.directionX;
                    this.y += this.directionY;
                    this.draw();
                }
            }

            function initParticles() {
                particles = [];
                for (let i = 0; i < particleCount; i++) {
                    let size = (Math.random() * 2 + 1.5);
                    let x = Math.random() * (canvas.width - size * 2) + size;
                    let y = Math.random() * (canvas.height - size * 2) + size;
                    let dirX = (Math.random() * 0.4) - 0.2;
                    let dirY = (Math.random() * 0.4) - 0.2;
                    let color = `rgba(234, 234, 242, ${Math.random() * 0.5 + 0.1})`;
                    particles.push(new Particle(x, y, dirX, dirY, size, color));
                }
            }

            function connectParticles() {
                for (let a = 0; a < particles.length; a++) {
                    for (let b = a; b < particles.length; b++) {
                        let distance = ((particles[a].x - particles[b].x) ** 2) + ((particles[a].y - particles[b].y) ** 2);
                        if (distance < connectionDistance ** 2) {
                            ctx.strokeStyle = `rgba(138, 43, 226, ${1 - (distance / (connectionDistance ** 2))})`;
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(particles[a].x, particles[a].y);
                            ctx.lineTo(particles[b].x, particles[b].y);
                            ctx.stroke();
                        }
                    }
                }
            }

            function animateParticles() {
                requestAnimationFrame(animateParticles);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => p.update());
                connectParticles();
            }

            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();
            
            // THIS IS THE LINE THAT WAS MISSING
            animateParticles(); 
        }

        function setupAuthModal() {
            if (!dom.authModal || !dom.authButton || !dom.authModalCloseBtn || !dom.loginForm || !dom.signupForm) return;

            dom.authButton.addEventListener('click', e => {
                e.preventDefault();
                dom.authModal.classList.add('active');
                handleAuthStateChange(auth?.currentUser);
            });

            dom.authModalCloseBtn.addEventListener('click', () => dom.authModal.classList.remove('active'));
            dom.showSignupLink.addEventListener('click', e => { e.preventDefault(); dom.loginForm.classList.remove('active'); dom.signupForm.classList.add('active'); });
            dom.showLoginLink.addEventListener('click', e => { e.preventDefault(); dom.signupForm.classList.remove('active'); dom.loginForm.classList.add('active'); });

            dom.loginForm.addEventListener('submit', e => {
                e.preventDefault();
                if (!firebaseInitialized) return showAuthError(dom.loginError, "Auth service unavailable.");
                const email = dom.loginForm.querySelector('#loginEmail').value;
                const password = dom.loginForm.querySelector('#loginPassword').value;
                signInWithEmailAndPassword(auth, email, password)
                    .then(() => dom.authModal.classList.remove('active'))
                    .catch(err => showAuthError(dom.loginError, getFirebaseAuthError(err)));
            });

            dom.signupForm.addEventListener('submit', e => {
                e.preventDefault();
                if (!firebaseInitialized) return showAuthError(dom.signupError, "Auth service unavailable.");
                const email = dom.signupForm.querySelector('#signupEmail').value;
                const password = dom.signupForm.querySelector('#signupPassword').value;
                if (password !== dom.signupForm.querySelector('#signupConfirmPassword').value) return showAuthError(dom.signupError, "Passwords do not match.");
                createUserWithEmailAndPassword(auth, email, password)
                    .then(() => dom.authModal.classList.remove('active'))
                    .catch(err => showAuthError(dom.signupError, getFirebaseAuthError(err)));
            });

            dom.logoutButton?.addEventListener('click', () => {
                if (firebaseInitialized) signOut(auth);
            });
        }

        function showAuthError(element, message) {
            if (element) {
                element.textContent = message;
                element.classList.add('active');
                setTimeout(() => element.classList.remove('active'), 5000);
            }
        }

        function getFirebaseAuthError(error) {
            switch (error.code) {
                case 'auth/user-not-found': case 'auth/wrong-password': case 'auth/invalid-credential': return "Invalid email or password.";
                case 'auth/email-already-in-use': return "This email is already in use.";
                case 'auth/weak-password': return "Password must be at least 6 characters.";
                case 'auth/invalid-email': return "Please enter a valid email address.";
                default: return "An unknown error occurred.";
            }
        }

        // --- Initial Execution ---
        console.log("Initializing scripts...");
        initializeFirebase();
        initializeNavbar();
        initIntersectionObservers();
        initFaqAccordion();
        initFormInteractions();
        initAdvancedEffects();
        initParticleCanvas();
        setupAuthModal();

    } catch (globalError) {
        console.error("A critical error occurred during script execution:", globalError);
        alert("An unexpected error occurred. Some features may be disabled.");
    }
});
