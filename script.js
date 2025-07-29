/*
  ================================================================================
  GrindBus - Interactive JavaScript
  Author: Gemini (Senior Frontend Engineer & UI/UX Visionary)
  Description: Handles dynamic UI behaviors including navbar scrolling effects,
               mobile navigation toggle, scroll-triggered animations,
               enhanced booking form interactions, FAQ accordion,
               parallax, particle background, scroll progress, ripple effects,
               and Firebase Authentication for login/signup.
  ================================================================================
*/

// Firebase Imports (MUST be at the top for module scripts in HTML)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// No Firestore imports needed for just authentication, but including for future reference
// import { getFirestore, doc, getDoc, setDoc, collection, query, where, addDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded: Starting script execution.");

    try { // --- START Global Try-Catch Block to catch any unhandled errors ---

        // --- GLOBAL UTILITY FUNCTION: Custom Alert/Message Box ---
        // Defined early to ensure it's available for any initialization errors
        function alert(message) {
            const existingMessageBox = document.getElementById('custom-message-box');
            if (existingMessageBox) {
                existingMessageBox.remove();
            }

            const messageBox = document.createElement('div');
            messageBox.id = 'custom-message-box';
            messageBox.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(23, 22, 45, 0.98); /* More opaque for alerts */
                color: var(--color-text);
                padding: 25px 40px;
                border-radius: var(--border-radius-md);
                border: 1px solid var(--color-border);
                backdrop-filter: blur(15px); /* Stronger blur for alerts */
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7), 0 0 35px var(--color-glow); /* Enhanced shadow and glow */
                z-index: 9999;
                text-align: center;
                font-family: var(--font-family-base);
                max-width: 90%;
                display: flex;
                flex-direction: column;
                gap: 20px;
                animation: fadeInScale 0.3s ease-out forwards;
            `;

            const messageText = document.createElement('p');
            messageText.textContent = message;
            messageText.style.cssText = `
                font-size: 1.1rem;
                margin-bottom: 15px;
                color: var(--color-text);
            `;

            const closeButton = document.createElement('button');
            closeButton.textContent = 'OK';
            closeButton.style.cssText = `
                padding: 10px 25px;
                background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
                color: #fff;
                border: none;
                border-radius: var(--border-radius-sm);
                cursor: pointer;
                font-size: 1rem;
                font-weight: 600;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            `;
            closeButton.addEventListener('click', () => {
                messageBox.style.animation = 'fadeOutScale 0.3s ease-in forwards';
                messageBox.addEventListener('animationend', () => messageBox.remove());
            });

            messageBox.appendChild(messageText);
            messageBox.appendChild(closeButton);
            document.body.appendChild(messageBox);

            // Add keyframes to the document's head if not already present
            if (!document.querySelector('style[data-keyframes="auth-modal"]')) {
                const keyframesStyle = document.createElement('style');
                keyframesStyle.setAttribute('data-keyframes', 'auth-modal');
                keyframesStyle.textContent = `
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    }
                    @keyframes fadeOutScale {
                        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    }
                `;
                document.head.appendChild(keyframesStyle);
            }
        }


        // Firebase Initialization
        let app;
        let auth;
        let userId = null; // To store the current user's ID
        let firebaseInitialized = false; // Flag to track Firebase initialization status
        let usingDummyFirebaseConfig = false; // New flag to track if dummy config is used

        try {
            let firebaseConfig = {};
            try {
                const firebaseConfigRaw = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
                firebaseConfig = JSON.parse(firebaseConfigRaw);
            } catch (parseError) {
                console.error("Error parsing __firebase_config:", parseError);
                alert("Firebase configuration is malformed. Authentication features will be disabled.");
                // No throw here, allow the rest of the script to run without Firebase
            }

            // --- IMPORTANT: Determine if using a valid Firebase config or a dummy one ---
            if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId || firebaseConfig.apiKey === "YOUR_DUMMY_API_KEY") {
                console.warn("Firebase configuration is missing or incomplete, or using a dummy key. Authentication will not work with a real backend.");
                firebaseConfig = { // Provide a syntactically valid but non-functional dummy config
                    apiKey: "YOUR_DUMMY_API_KEY", 
                    authDomain: "your-project-id.firebaseapp.com",
                    projectId: "your-project-id", 
                    storageBucket: "your-project-id.appspot.com",
                    messagingSenderId: "YOUR_DUMMY_SENDER_ID",
                    appId: "YOUR_DUMMY_APP_ID"
                };
                usingDummyFirebaseConfig = true;
                alert("Firebase is not fully configured. Using a dummy config. Authentication will not connect to a real Firebase project.");
            }

            // Only initialize Firebase app if NOT using the dummy config
            if (!usingDummyFirebaseConfig) {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                firebaseInitialized = true;
                console.log("Firebase app initialized successfully with real config.");

                // Authenticate user with custom token or anonymously (ONLY if real config)
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    signInWithCustomToken(auth, __initial_auth_token)
                        .then((userCredential) => {
                            console.log("Signed in with custom token:", userCredential.user.uid);
                        })
                        .catch((error) => {
                            console.error("Error signing in with custom token:", error);
                            // Fallback to anonymous if custom token fails
                            signInAnonymously(auth)
                                .then(() => console.log("Signed in anonymously as fallback."))
                                .catch(e => console.error("Anonymous sign-in fallback failed:", e));
                        });
                } else {
                    signInAnonymously(auth)
                        .then(() => console.log("Signed in anonymously."))
                        .catch(e => console.error("Anonymous sign-in failed:", e));
                }

                // Listen for authentication state changes (ONLY if real config)
                onAuthStateChanged(auth, (user) => {
                    const authButton = document.getElementById('authButton');
                    const userInfoDisplay = document.getElementById('userInfoDisplay');
                    const authFormsContainer = document.querySelector('.auth-forms-container');

                    if (user) {
                        userId = user.uid;
                        console.log("Auth state changed: User is logged in.", user.uid, "Email:", user.email);
                        if (authButton) authButton.style.display = 'none';
                        if (authFormsContainer) authFormsContainer.style.display = 'none';
                        if (userInfoDisplay) {
                            userInfoDisplay.style.display = 'flex';
                            document.getElementById('userEmailDisplay').textContent = user.email || 'Guest';
                            document.getElementById('userIdDisplay').textContent = user.uid;
                        }
                    } else {
                        userId = null;
                        console.log("Auth state changed: User is logged out.");
                        if (authButton) authButton.style.display = 'block';
                        const authModal = document.getElementById('authModal');
                        if (authModal && authModal.classList.contains('active')) {
                             if (authFormsContainer) authFormsContainer.style.display = 'block';
                        } else {
                             if (authFormsContainer) authFormsContainer.style.display = 'none';
                        }
                        if (userInfoDisplay) userInfoDisplay.style.display = 'none';
                    }
                });
            } else {
                console.log("Firebase not initialized with real config. Authentication features are disabled.");
            }

        } catch (e) {
            console.error("Firebase initialization failed due to an uncaught error:", e);
            alert("Failed to initialize Firebase. Some authentication features may not work. Check console for details.");
            firebaseInitialized = false; // Ensure flag is false on any error
        }


        // --- DOM Element References (Centralized for clarity and robustness) ---
        // Added console.log to confirm element selection
        const navbar = document.querySelector('.navbar'); console.log("Navbar element:", navbar);
        const heroSection = document.getElementById('hero'); console.log("Hero Section element:", heroSection);
        const hamburger = document.getElementById('hamburger'); console.log("Hamburger element:", hamburger);
        const navLinks = document.querySelector('.nav-links'); console.log("Nav Links element:", navLinks);
        const bookingForm = document.querySelector('.booking-form'); console.log("Booking Form element:", bookingForm);
        const contactForm = document.getElementById('contact-form'); console.log("Contact Form element:", contactForm);
        const swapButton = document.getElementById('swapLocations'); console.log("Swap Button element:", swapButton);
        const faqQuestions = document.querySelectorAll('.faq-question'); console.log("FAQ Questions elements:", faqQuestions.length);
        const canvas = document.getElementById('particle-canvas'); console.log("Particle Canvas element:", canvas);
        const scrollProgress = document.getElementById('scroll-progress-indicator'); console.log("Scroll Progress element:", scrollProgress);
        const cursorTrail = document.getElementById('cursor-trail'); console.log("Cursor Trail element:", cursorTrail);
        const parallaxBlobs = document.querySelectorAll('.parallax-blob'); console.log("Parallax Blobs elements:", parallaxBlobs.length);
        const heroContent = document.querySelector('.hero-content'); console.log("Hero Content element:", heroContent);
        const animatedElements = document.querySelectorAll('.animate'); console.log("Animated elements (total):", animatedElements.length);
        const gradientTexts = document.querySelectorAll('.gradient-text'); console.log("Gradient text elements (total):", gradientTexts.length);

        // Login/Signup Modal Elements
        const authModal = document.getElementById('authModal'); console.log("Auth Modal element:", authModal);
        const authButton = document.getElementById('authButton'); console.log("Auth Button element:", authButton);
        const authModalCloseBtn = document.querySelector('.auth-modal-close-btn'); console.log("Auth Modal Close Button element:", authModalCloseBtn);
        const loginForm = document.getElementById('loginForm'); console.log("Login Form element:", loginForm);
        const signupForm = document.getElementById('signupForm'); console.log("Sign Up Form element:", signupForm);
        const showLoginLink = document.getElementById('showLogin'); console.log("Show Login Link element:", showLoginLink);
        const showSignupLink = document.getElementById('showSignup'); console.log("Show Sign Up Link element:", showSignupLink);
        const loginEmailInput = document.getElementById('loginEmail'); console.log("Login Email Input element:", loginEmailInput);
        const loginPasswordInput = document.getElementById('loginPassword'); console.log("Login Password Input element:", loginPasswordInput);
        const signupEmailInput = document.getElementById('signupEmail'); console.log("Sign Up Email Input element:", signupEmailInput);
        const signupPasswordInput = document.getElementById('signupPassword'); console.log("Sign Up Password Input element:", signupPasswordInput);
        const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword'); console.log("Sign Up Confirm Password Input element:", signupConfirmPasswordInput);
        const loginError = document.getElementById('loginError'); console.log("Login Error element:", loginError);
        const signupError = document.getElementById('signupError'); console.log("Sign Up Error element:", signupError);
        const logoutButton = document.getElementById('logoutButton'); console.log("Logout Button element:", logoutButton);

        // Intersection Observer Options - Moved to a higher scope
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        console.log("Intersection Observer Options defined.");

        // --- TEMPORARY DIAGNOSTIC: Log mouse events to identify interfering layers ---
        // Uncomment the line below if you want to see every element the mouse hovers over.
        // Be careful, it can flood the console.
        // document.addEventListener('mousemove', (e) => {
        //     console.log("Mouse over:", e.target.id || e.target.className || e.target.tagName);
        // });
        // --- END TEMPORARY DIAGNOSTIC ---


        // 1. Navbar Scroll Effect
        if (navbar && heroSection) { // Ensure elements exist
            console.log("Initializing Navbar Scroll Effect.");
            const handleScroll = () => {
                const scrollThreshold = heroSection.offsetHeight > 0 ? heroSection.offsetHeight * 0.1 : 50; 
                if (window.scrollY > scrollThreshold) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            };
            window.addEventListener('scroll', handleScroll);
            handleScroll(); // Call on load
        } else {
            console.warn("Navbar or Hero Section not found, Navbar scroll effect disabled.");
        }

        // 2. Mobile Navigation Toggle (Hamburger Menu)
        if (hamburger && navLinks) {
            console.log("Initializing Mobile Navigation Toggle.");
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                });
            });
        } else {
            console.warn("Hamburger or Nav Links not found, Mobile navigation disabled.");
        }

        // 3. Scroll-Triggered Animations (Intersection Observer)
        if (animatedElements.length > 0) {
            console.log(`Found ${animatedElements.length} animated elements. Initializing Intersection Observer.`);
            const observerCallback = (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            };
            const observer = new IntersectionObserver(observerCallback, observerOptions);
            animatedElements.forEach(element => {
                observer.observe(element);
            });
        } else {
            console.log("No animated elements found.");
        }

        // Also observe gradient text elements for animation
        if (gradientTexts.length > 0) {
            console.log(`Found ${gradientTexts.length} gradient text elements. Initializing gradient observer.`);
            const gradientObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        gradientObserver.unobserve(entry.target);
                    }
                });
            }, observerOptions); // Now observerOptions is in scope
            gradientTexts.forEach(element => {
                gradientObserver.observe(element);
            });
        } else {
            console.log("No gradient text elements found.");
        }


        // 4. Booking Form Submission Handling
        if (bookingForm) {
            console.log("Initializing Booking Form Submission.");
            bookingForm.addEventListener('submit', (event) => {
                event.preventDefault();
                console.log('Booking form submitted!');
                alert('Finding buses... (This is a demo submission)');
                bookingForm.reset();
            });
        } else {
            console.warn("Booking form not found.");
        }

        // 5. Contact Form Submission Handling
        if (contactForm) {
            console.log("Initializing Contact Form Submission.");
            contactForm.addEventListener('submit', (event) => {
                event.preventDefault();
                console.log('Your inquiry has been sent! We will get back to you shortly.');
                alert('Your inquiry has been sent! We will get back to you shortly.');
                contactForm.reset();
            });
        } else {
            console.warn("Contact form not found.");
        }

        // 6. Booking Form Enhancements (Swap & Clear)
        if (swapButton) {
            console.log("Initializing Swap Button.");
            swapButton.addEventListener('click', () => {
                const fromInput = document.getElementById('fromLocation');
                const toInput = document.getElementById('toLocation');
                if (fromInput && toInput) {
                    const fromValue = fromInput.value;
                    fromInput.value = toInput.value;
                    toInput.value = fromValue;
                } else {
                    console.warn("From/To location inputs not found for swap button.");
                }
            });
        } else {
            console.warn("Swap button not found.");
        }

        document.querySelectorAll('.clear-input-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const targetId = event.currentTarget.dataset.target;
                const targetInput = document.getElementById(targetId);
                if (targetInput) {
                    targetInput.value = '';
                    targetInput.focus();
                } else {
                    console.warn(`Clear input button target '${targetId}' not found.`);
                }
            });
        });

        // 7. FAQ Accordion Functionality
        if (faqQuestions.length > 0) {
            console.log(`Found ${faqQuestions.length} FAQ questions. Initializing FAQ Accordion.`);
            faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    const faqItem = question.closest('.faq-item');
                    if (faqItem) {
                        faqItem.classList.toggle('active');
                        const answer = faqItem.querySelector('.faq-answer');
                        if (answer) {
                            if (faqItem.classList.contains('active')) {
                                answer.style.maxHeight = answer.scrollHeight + 'px';
                            } else {
                                answer.style.maxHeight = '0';
                            }
                        } else {
                            console.warn("FAQ answer element not found for question.");
                        }
                    } else {
                        console.warn("FAQ item parent not found for question.");
                    }
                });
            });
        } else {
            console.log("No FAQ questions found.");
        }

        // 8. Parallax Effect for Hero Background Blobs and Content
        if (heroSection && heroContent && parallaxBlobs.length > 0) {
            console.log("Initializing Parallax Effect.");
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                const heroRect = heroSection.getBoundingClientRect();

                // Only apply parallax when hero section is in or near view
                if (heroRect.top <= window.innerHeight && heroRect.bottom >= 0) {
                    // Content moves slightly faster (closer to viewer)
                    const contentParallaxOffset = scrollY * 0.1; // Adjust multiplier for intensity
                    heroContent.style.transform = `translateY(${contentParallaxOffset}px)`;

                    // Blobs move slower (further from viewer)
                    parallaxBlobs.forEach((blob, index) => {
                        const blobSpeed = (index === 0 ? 0.05 : 0.08); // Different speeds for blobs
                        const blobOffset = scrollY * blobSpeed;
                        // Apply parallax relative to their initial position
                        blob.style.transform = `translate(-50%, -50%) translateZ(${index === 0 ? -1 : -2}px) translateY(${blobOffset}px)`;
                    });
                } else {
                    // Reset transforms when outside hero section to prevent accumulation
                    heroContent.style.transform = `translateY(0px)`;
                    parallaxBlobs.forEach((blob, index) => {
                        blob.style.transform = `translate(-50%, -50%) translateZ(${index === 0 ? -1 : -2}px) translateY(0px)`;
                    });
                }
            });
        } else {
            console.warn("Hero section, hero content, or parallax blobs not found. Parallax effect disabled.");
        }

        // 9. Subtle Interactive Particle Background (Canvas)
        if (canvas && heroSection) { // Ensure both canvas and heroSection exist
            console.log("Initializing Particle Background.");
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error("Failed to get 2D rendering context for canvas. Particle background disabled.");
                // Do not return here, allow other parts of the script to run
            } else {
                let particles = [];
                const particleCount = 80;
                const particleSize = 1.5;
                const particleSpeed = 0.2;
                const connectionDistance = 120;
                let mouse = { x: null, y: null, radius: 150 };

                const resizeCanvas = () => {
                    canvas.width = window.innerWidth;
                    canvas.height = heroSection.offsetHeight > 0 ? heroSection.offsetHeight : window.innerHeight; 
                    initParticles();
                };

                class Particle {
                    constructor(x, y, directionX, directionY, size, color) {
                        this.x = x;
                        this.y = y;
                        this.directionX = directionX;
                        this.directionY = directionY;
                        this.size = size;
                        this.color = color;
                    }
                    draw() {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                        ctx.fillStyle = this.color;
                        ctx.fill();
                    }
                    update() {
                        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
                            this.directionX = -this.directionX;
                        }
                        if (this.y + this.size > canvas.height || this.y - this.size < 0) {
                            this.directionY = -this.directionY;
                        }
                        this.x += this.directionX;
                        this.y += this.directionY;

                        if (mouse.x !== null && mouse.y !== null) {
                            let dx = mouse.x - this.x;
                            let dy = mouse.y - this.y;
                            let distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < mouse.radius + this.size) {
                                const forceDirectionX = dx / distance;
                                const forceDirectionY = dy / distance;
                                const force = (mouse.radius + this.size - distance) / mouse.radius;
                                const directionX = forceDirectionX * force * 0.5;
                                const directionY = forceDirectionY * force * 0.5;
                                this.x -= directionX;
                                this.y -= directionY;
                            }
                        }
                        this.draw();
                    }
                }

                function initParticles() {
                    particles = [];
                    for (let i = 0; i < particleCount; i++) {
                        let size = (Math.random() * 2 + particleSize);
                        let x = Math.random() * (canvas.width - size * 2) + size;
                        let y = Math.random() * (canvas.height - size * 2) + size;
                        let directionX = (Math.random() * particleSpeed * 2) - particleSpeed;
                        let directionY = (Math.random() * particleSpeed * 2) - particleSpeed;
                        let color = `rgba(234, 234, 242, ${Math.random() * 0.5 + 0.1})`;
                        particles.push(new Particle(x, y, directionX, directionY, size, color));
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
                    for (let i = 0; i < particles.length; i++) {
                        particles[i].update();
                    }
                    connectParticles();
                }

                canvas.addEventListener('mousemove', (event) => {
                    mouse.x = event.x;
                    mouse.y = event.y;
                });

                canvas.addEventListener('mouseout', () => {
                    mouse.x = null;
                    mouse.y = null;
                });

                window.addEventListener('resize', resizeCanvas);
                resizeCanvas();
                animateParticles();
            }
        } else {
            console.warn("Particle canvas or Hero Section not found. Particle background disabled.");
        }

        // 10. Custom Scroll Progress Indicator
        if (scrollProgress) {
            console.log("Initializing Scroll Progress Indicator.");
            window.addEventListener('scroll', () => {
                const totalHeight = document.body.scrollHeight - window.innerHeight;
                const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
                scrollProgress.style.width = progress + '%';
            });
        } else {
            console.warn("Scroll progress indicator not found.");
        }

        // 11. Ripple Click Effects for Buttons
        document.querySelectorAll('.cta-button, .cta-button-small, #contact-form .btn, .swap-button, .auth-submit-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');

                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;

                this.appendChild(ripple);

                ripple.addEventListener('animationend', () => {
                    ripple.remove();
                });
            });
        });
        console.log("Initializing Ripple Click Effects.");

        // 12. Dynamic Cursor Trail
        if (cursorTrail) {
            console.log("Initializing Dynamic Cursor Trail.");
            let mouseX = 0;
            let mouseY = 0;
            let currentX = 0;
            let currentY = 0;
            const speed = 0.2; // Increased from 0.1 for less laggy feel

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                cursorTrail.style.opacity = '1';
                // The scale transform is already handled here
            });

            document.addEventListener('mouseleave', () => {
                cursorTrail.style.opacity = '0';
                cursorTrail.style.transform = `translate(-50%, -50%) scale(0)`; // Ensure it scales down on leave
            });

            function animateCursorTrail() {
                // Interpolate current position towards mouse position
                currentX += (mouseX - currentX) * speed;
                currentY += (mouseY - currentY) * speed;

                // Use transform: translate3d for smoother, GPU-accelerated movement
                // The -50%, -50% is handled by the CSS transform property on the element itself
                cursorTrail.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;

                requestAnimationFrame(animateCursorTrail);
            }
            animateCursorTrail();
        } else {
            console.warn("Cursor trail element not found. Dynamic cursor trail disabled.");
        }

        // 13. Login/Sign Up Modal Logic
        // Ensure all modal related elements are checked before adding listeners
        if (authModal && authButton && authModalCloseBtn && loginForm && signupForm && showLoginLink && showSignupLink && loginEmailInput && loginPasswordInput && signupEmailInput && signupPasswordInput && signupConfirmPasswordInput && loginError && signupError && logoutButton) {
            console.log("Initializing Login/Sign Up Modal Logic.");
            // Function to show error message
            function showAuthError(element, message) {
                element.textContent = message;
                element.classList.add('active');
                setTimeout(() => {
                    element.classList.remove('active');
                    element.textContent = '';
                }, 5000); // Hide after 5 seconds
            }

            // Open modal
            authButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Auth button CLICKED! Attempting to open modal."); // Crucial diagnostic log
                authModal.classList.add('active');
                
                const authFormsContainer = document.querySelector('.auth-forms-container');
                const userInfoDisplay = document.getElementById('userInfoDisplay');

                if (firebaseInitialized && auth.currentUser) {
                    if (authFormsContainer) authFormsContainer.style.display = 'none';
                    if (userInfoDisplay) userInfoDisplay.style.display = 'flex';
                } else {
                    if (authFormsContainer) authFormsContainer.style.display = 'block';
                    if (userInfoDisplay) userInfoDisplay.style.display = 'none';
                    loginForm.classList.add('active');
                    signupForm.classList.remove('active');
                }
            });

            // Close modal
            authModalCloseBtn.addEventListener('click', () => {
                console.log("Auth modal close button clicked. Closing modal.");
                // Removed the temporary 100ms delay for closing the modal
                authModal.classList.remove('active');
                loginError.classList.remove('active');
                signupError.classList.remove('active');
            });

            // Switch to Sign Up form
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Switching to Sign Up form.");
                loginForm.classList.remove('active');
                signupForm.classList.add('active');
                loginError.classList.remove('active');
            });

            // Switch to Login form
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Switching to Login form.");
                signupForm.classList.remove('active');
                loginForm.classList.add('active');
                signupError.classList.remove('active');
            });

            // Get all buttons that should have the moving gradient effect
            // Now includes .cta-button and #contact-form .btn
            const gradientButtons = document.querySelectorAll('.auth-button, .auth-submit-btn, .cta-button, #contact-form .btn');

            gradientButtons.forEach(button => {
                button.addEventListener('mousemove', (e) => {
                    const rect = button.getBoundingClientRect();
                    // Calculate mouse position relative to the button (0 to 1 for x, y)
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;

                    // Set CSS variables for radial-gradient position
                    button.style.setProperty('--mouse-x', `${x * 100}%`);
                    button.style.setProperty('--mouse-y', `${y * 100}%`);
                });

                button.addEventListener('mouseleave', () => {
                    // Reset CSS variables to center when mouse leaves
                    button.style.setProperty('--mouse-x', '50%');
                    button.style.setProperty('--mouse-y', '50%');
                });
            });


            // Handle Login Form Submission
            if (firebaseInitialized) { // Only attempt if Firebase is truly initialized
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    console.log("Login form submitted (Firebase initialized).");
                    const email = loginEmailInput.value;
                    const password = loginPasswordInput.value;
                    loginError.classList.remove('active');

                    try {
                        await signInWithEmailAndPassword(auth, email, password);
                        console.log("User logged in successfully!");
                        authModal.classList.remove('active');
                    } catch (error) {
                        console.error("Login failed:", error.code, error.message);
                        let errorMessage = "Login failed. Please check your credentials.";
                        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                            errorMessage = "Invalid email or password.";
                        } else if (error.code === 'auth/invalid-email') {
                            errorMessage = "Invalid email format.";
                        } else if (error.code === 'auth/network-request-failed') {
                            errorMessage = "Network error. Please check your internet connection.";
                        }
                        showAuthError(loginError, errorMessage);
                    }
                });
            } else { // Fallback for dummy config
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.warn("Login attempt failed: Firebase not initialized with real config.");
                    showAuthError(loginError, "Authentication is not available. Firebase not connected to a real project.");
                });
            }

            // Handle Sign Up Form Submission
            if (firebaseInitialized) { // Only attempt if Firebase is truly initialized
                signupForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    console.log("Sign up form submitted (Firebase initialized).");
                    const email = signupEmailInput.value;
                    const password = signupPasswordInput.value;
                    const confirmPassword = signupConfirmPasswordInput.value;
                    signupError.classList.remove('active');

                    if (password !== confirmPassword) {
                        showAuthError(signupError, "Passwords do not match.");
                        return;
                    }
                    if (password.length < 6) {
                        showAuthError(signupError, "Password should be at least 6 characters.");
                        return;
                    }

                    try {
                        await createUserWithEmailAndPassword(auth, email, password);
                        console.log("User signed up successfully!");
                        authModal.classList.remove('active');
                    } catch (error) {
                        console.error("Sign up failed:", error.code, error.message);
                        let errorMessage = "Sign up failed. Please try again.";
                        if (error.code === 'auth/email-already-in-use') {
                            errorMessage = "This email is already in use.";
                        } else if (error.code === 'auth/invalid-email') {
                            errorMessage = "Invalid email format.";
                        } else if (error.code === 'auth/weak-password') {
                            errorMessage = "Password is too weak. Choose a stronger one.";
                        } else if (error.code === 'auth/network-request-failed') {
                            errorMessage = "Network error. Please check your internet connection.";
                        }
                        showAuthError(signupError, errorMessage);
                    }
                });
            } else { // Fallback for dummy config
                signupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.warn("Sign up attempt failed: Firebase not initialized with real config.");
                    showAuthError(signupError, "Authentication is not available. Firebase not connected to a real project.");
                });
            }

            // Handle Logout
            if (firebaseInitialized) { // Only attempt if Firebase is truly initialized
                logoutButton.addEventListener('click', async () => {
                    console.log("Logout button clicked (Firebase initialized).");
                    try {
                        await signOut(auth);
                        console.log("User logged out successfully!");
                    } catch (error) {
                        console.error("Logout failed:", error);
                        alert("Logout failed. Please try again.");
                    }
                });
            } else { // Fallback for dummy config
                logoutButton.addEventListener('click', () => {
                    console.warn("Logout attempt failed: Firebase not initialized with real config.");
                    alert("Logout is not available. Firebase not connected to a real project.");
                });
            }
        } else {
            console.warn("One or more authentication modal elements not found. Authentication features disabled.");
            // Ensure auth button is visible if modal elements are missing to avoid a dead end
            if (authButton) authButton.style.display = 'block';
        }

    } catch (globalError) { // --- END Global Try-Catch Block ---
        console.error("An unhandled error occurred during script execution:", globalError);
        alert("An unexpected error occurred. Some features may not work. Please check the browser console for details.");
    }
    console.log("Script execution finished.");
});
