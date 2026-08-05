document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // ==========================================
    // DATABASE MANAGER (LocalStorage & Seeds)
    // ==========================================
    class DatabaseManager {
        static STORAGE_KEY = 'economia_vida_database';

        static getStudents() {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                return this.initSeeds();
            }
            try {
                const parsed = JSON.parse(data);
                if (!Array.isArray(parsed)) {
                    return this.initSeeds();
                }
                
                // Defensive repair of any corrupted or legacy records in localStorage
                let needsSave = false;
                parsed.forEach(student => {
                    if (!student || typeof student !== 'object') {
                        needsSave = true;
                        return;
                    }
                    if (!student.email) {
                        student.email = "anonimo@gmail.com";
                        needsSave = true;
                    }
                    if (!student.scores || typeof student.scores !== 'object') {
                        student.scores = { quiz2: null, quiz3: null, quizGlosario: null };
                        needsSave = true;
                    } else {
                        if (student.scores.quiz2 === undefined) student.scores.quiz2 = null;
                        if (student.scores.quiz3 === undefined) student.scores.quiz3 = null;
                        if (student.scores.quizGlosario === undefined) student.scores.quizGlosario = null;
                    }
                    if (!student.lastActive) {
                        student.lastActive = new Date().toISOString();
                        needsSave = true;
                    }
                });
                
                if (needsSave) {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
                }
                return parsed;
            } catch (e) {
                console.error("Error parsing student database, re-seeding.", e);
                return this.initSeeds();
            }
        }

        static initSeeds() {
            const seeds = [
                {
                    email: 'sofia.gomez@gmail.com',
                    scores: { quiz2: 3, quiz3: 3, quizGlosario: 2 },
                    lastActive: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
                },
                {
                    email: 'juan.perez@gmail.com',
                    scores: { quiz2: 2, quiz3: 2, quizGlosario: 1 },
                    lastActive: new Date(Date.now() - 3600000 * 24).toISOString() // 24 hours ago
                },
                {
                    email: 'belen.bulat@gmail.com',
                    scores: { quiz2: 1, quiz3: null, quizGlosario: 2 },
                    lastActive: new Date().toISOString() // now
                },
                {
                    email: 'mateo.finanzas@gmail.com',
                    scores: { quiz2: 3, quiz3: 1, quizGlosario: null },
                    lastActive: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
                }
            ];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(seeds));
            return seeds;
        }

        static saveStudent(email) {
            if (!email) return;
            const students = this.getStudents();
            const exists = students.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
            if (!exists) {
                students.push({
                    email: email,
                    scores: { quiz2: null, quiz3: null, quizGlosario: null },
                    lastActive: new Date().toISOString()
                });
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(students));
            }
        }

        static updateScore(email, quizId, score) {
            if (!email) return;
            const students = this.getStudents();
            const student = students.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
            if (student) {
                if (!student.scores) student.scores = { quiz2: null, quiz3: null, quizGlosario: null };
                student.scores[quizId] = score;
                student.lastActive = new Date().toISOString();
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(students));
            } else {
                students.push({
                    email: email,
                    scores: { quiz2: null, quiz3: null, quizGlosario: null, [quizId]: score },
                    lastActive: new Date().toISOString()
                });
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(students));
            }
        }

        static reset() {
            localStorage.removeItem(this.STORAGE_KEY);
            return this.initSeeds();
        }
    }

    // Expose DatabaseManager globally
    window.DatabaseManager = DatabaseManager;


    // ==========================================
    // TAB NAVIGATION LOGIC (including Docente)
    // ==========================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const mobileTabButtons = document.querySelectorAll('.mobile-tab-btn');
    const sections = document.querySelectorAll('.tab-section');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');

    // Function to switch tabs
    window.switchTab = function(tabId) {
        const userJson = localStorage.getItem('economy_vida_user');
        
        // If not logged in, force login screen
        if (!userJson) {
            tabId = 'tab-login';
        } else {
            // Logged in user cannot access login screen
            if (tabId === 'tab-login') {
                const user = JSON.parse(userJson);
                tabId = user.role === 'docente' ? 'tab-docente' : 'tab-inicio';
            }
            
            // Secure tab check for Teacher panel
            if (tabId === 'tab-docente') {
                const user = JSON.parse(userJson);
                if (user.role !== 'docente') {
                    switchTab('tab-inicio');
                    return;
                }
                // Render docente dashboard
                refreshDocenteDashboard();
            }
        }

        // Update Desktop Tabs
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Mobile Tabs
        mobileTabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Toggle Content Sections
        sections.forEach(sec => {
            if (sec.id === tabId) {
                sec.classList.add('active-section');
            } else {
                sec.classList.remove('active-section');
            }
        });

        // Close mobile nav menu
        if (mobileNav.classList.contains('mobile-active')) {
            mobileNav.classList.remove('mobile-active');
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Add Desktop Tab Listeners
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Add Mobile Tab Listeners
    mobileTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Mobile Hamburger Menu Toggle
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('mobile-active');
    });


    // ==========================================
    // THEME TOGGLE LOGIC (Light / Dark Mode)
    // ==========================================
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });


    // ==========================================
    // GLOSSARY ACCORDION & SEARCH LOGIC
    // ==========================================
    const accordionItems = document.querySelectorAll('.accordion-item');
    const glossarySearch = document.getElementById('glossarySearch');

    accordionItems.forEach(item => {
        const trigger = item.querySelector('.accordion-trigger');
        const panel = item.querySelector('.accordion-panel');

        trigger.addEventListener('click', () => {
            const expanded = trigger.getAttribute('aria-expanded') === 'true';
            
            // Close other items (Wix accordion behavior)
            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('item-active');
                    otherItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
                    otherItem.querySelector('.accordion-panel').style.maxHeight = null;
                }
            });

            // Toggle current item
            trigger.setAttribute('aria-expanded', !expanded);
            if (!expanded) {
                item.classList.add('item-active');
                panel.style.maxHeight = panel.scrollHeight + "px";
            } else {
                item.classList.remove('item-active');
                panel.style.maxHeight = null;
            }
        });
    });

    // Search filter for Glossary
    glossarySearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        accordionItems.forEach(item => {
            const term = item.getAttribute('data-term');
            const content = item.querySelector('.panel-content').textContent.toLowerCase();

            if (term.includes(query) || content.includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });


    // ==========================================
    // REUSABLE QUIZ ENGINE
    // ==========================================
    class QuizEngine {
        constructor(containerId, nextBtnId, restartBtnId, progressBarId, resultCardId, dataField) {
            this.container = document.getElementById(containerId);
            this.nextBtn = document.getElementById(nextBtnId);
            this.restartBtn = document.getElementById(restartBtnId);
            this.progressBar = document.getElementById(progressBarId);
            this.resultCard = document.getElementById(resultCardId);
            this.dataField = dataField;
            
            this.questions = this.container.querySelectorAll('.question-block');
            this.scoreText = this.container.querySelector('.current-score');
            
            this.currentIndex = 0;
            this.score = 0;
            this.totalQuestions = this.questions.length;
            
            this.explanations = {
                // Quiz 20-30
                "¿Qué sucede si realizás una compra con tarjeta de crédito el día posterior a la fecha de cierre?": 
                    "Comprando el día después de la fecha de cierre, la transacción ingresa en el próximo ciclo de facturación, otorgándote de 40 a 44 días de financiación sin interés hasta el vencimiento.",
                "¿De cuánto tiempo disponés a partir de la recepción del resumen para objetar gastos imputados por error?": 
                    "Tenés un plazo legal de 30 días corridos desde que te llega el resumen para impugnar o reclamar cargos indebidos ante la emisora.",
                "Al solicitar un préstamo personal (\"préstamo sueldo\"), ¿cuál es la recomendación clave expuesta en el texto?": 
                    "La recomendación de Tomás Bulat es solicitar únicamente el dinero necesario y lo más cerca posible de la compra para no acumular intereses sobre fondos ociosos.",
                
                // Quiz 30-50
                "¿En qué consisten los denominados \"Family Banks\" y \"Friends Banks\" según el texto?": 
                    "Hacen referencia a los préstamos directos de dinero provistos por familiares o amigos (comúnmente en dólares y con garantía de la propiedad) ante la escasez de crédito bancario tradicional.",
                "¿Cuál es la postura expresada en el texto respecto a endeudarse a los 30 años para adquirir bienes duraderos?": 
                    "El libro lo plantea como la decisión correcta y una valiosa herramienta estratégica para capitalizarse (ej. heladera, lavarropas) estirando los plazos en cuotas fijas en entornos inflacionarios.",
                "¿Cómo debe ejecutarse la regla de oro del ahorro sistemático?": 
                    "Consiste en separar primero el porcentaje fijado de ahorro (Ingresos - Ahorro = Gastos) ni bien cobrás, adaptando tus consumos al dinero restante y no al revés.",
                
                // Quiz Glosario
                "¿Cómo define el glosario el concepto de \"Capacidad de pago\"?": 
                    "Es la porción de ingresos netos mensuales disponibles (después de deducir gastos fijos vitales) destinada a solventar de manera segura las cuotas de nuevas deudas.",
                "¿Qué define la \"Fecha de cierre\" de una tarjeta de crédito?": 
                    "Es la jornada mensual límite en la cual se consolidan las compras acumuladas para conformar el resumen que deberás abonar en la fecha de pago."
            };

            this.init();
        }

        init() {
            // Setup Option Click Listeners
            this.questions.forEach(qBlock => {
                const options = qBlock.querySelectorAll('.option-btn');
                options.forEach(opt => {
                    opt.addEventListener('click', (e) => this.handleAnswerSelect(e, qBlock));
                });
            });

            // Setup Navigation Listeners
            this.nextBtn.addEventListener('click', () => this.nextQuestion());
            this.restartBtn.addEventListener('click', () => this.restartQuiz());
            
            this.updateProgressBar();
        }

        handleAnswerSelect(e, qBlock) {
            const selectedOpt = e.currentTarget;
            const options = qBlock.querySelectorAll('.option-btn');
            const isCorrect = selectedOpt.getAttribute('data-correct') === 'true';
            const feedbackDiv = qBlock.querySelector('.question-feedback');
            const questionText = qBlock.querySelector('.question-text').textContent.trim();
            
            // Disable all options for this question
            options.forEach(opt => {
                opt.disabled = true;
                if (opt.getAttribute('data-correct') === 'true') {
                    opt.classList.add('option-correct');
                } else if (opt === selectedOpt) {
                    opt.classList.add('option-incorrect');
                } else {
                    opt.classList.add('option-fade');
                }
            });

            // Update Score & Feedback
            const explanation = this.explanations[questionText] || "";
            if (isCorrect) {
                this.score++;
                this.scoreText.textContent = this.score;
                feedbackDiv.innerHTML = `<strong>¡Correcto!</strong> ${explanation}`;
                feedbackDiv.className = "question-feedback feedback-correct";
            } else {
                feedbackDiv.innerHTML = `<strong>Incorrecto.</strong> ${explanation}`;
                feedbackDiv.className = "question-feedback feedback-incorrect";
            }
            feedbackDiv.classList.remove('hidden');

            // Enable next button or finish quiz button
            this.nextBtn.disabled = false;
            if (this.currentIndex === this.totalQuestions - 1) {
                this.nextBtn.innerHTML = `Finalizar Autoevaluación <i data-lucide="check"></i>`;
                lucide.createIcons();
            }
        }

        nextQuestion() {
            const currentBlock = this.questions[this.currentIndex];
            currentBlock.classList.remove('active-question');
            
            this.currentIndex++;

            if (this.currentIndex < this.totalQuestions) {
                const nextBlock = this.questions[this.currentIndex];
                nextBlock.classList.add('active-question');
                this.nextBtn.disabled = true;
                this.updateProgressBar();
            } else {
                // End of quiz, show result card
                this.showResults();
            }
        }

        updateProgressBar() {
            const progressPercent = ((this.currentIndex) / this.totalQuestions) * 100;
            this.progressBar.style.width = `${progressPercent}%`;
        }

        showResults() {
            this.progressBar.style.width = `100%`;
            this.resultCard.classList.remove('hidden');
            
            const resultMsg = this.resultCard.querySelector('.result-message');
            const finalScoreSpan = this.resultCard.querySelector('.final-score');
            
            finalScoreSpan.textContent = `Puntaje Final: ${this.score} / ${this.totalQuestions}`;
            
            // Set customized message depending on score
            if (this.score === this.totalQuestions) {
                resultMsg.innerHTML = "<strong>¡Sobresaliente!</strong> Has respondido todo de forma correcta. Comprendes a la perfección los consejos y dinámicas que propone Tomás Bulat en esta etapa.";
            } else if (this.score >= this.totalQuestions / 2) {
                resultMsg.innerHTML = "<strong>¡Buen trabajo!</strong> Tienes nociones sólidas de administración financiera personal. Te sugerimos releer las recomendaciones para pulir los detalles.";
            } else {
                resultMsg.innerHTML = "<strong>¡Sigue practicando!</strong> Cometer errores es parte de aprender. Te invitamos a leer con calma las secciones y volver a intentar el test para dominar estas herramientas.";
            }

            // Database Save Hook
            const userJson = localStorage.getItem('economy_vida_user');
            if (userJson) {
                const user = JSON.parse(userJson);
                if (user.role === 'estudiante') {
                    DatabaseManager.updateScore(user.email, this.dataField, this.score);
                    
                    // Live refresh of Docente panel if currently visible
                    const docenteSection = document.getElementById('tab-docente');
                    if (docenteSection && docenteSection.classList.contains('active-section')) {
                        refreshDocenteDashboard();
                    }
                }
            }

            // Hide Next Button, Show Restart Button
            this.nextBtn.classList.add('hidden');
            this.restartBtn.classList.remove('hidden');
        }

        restartQuiz() {
            // Reset state
            this.currentIndex = 0;
            this.score = 0;
            this.scoreText.textContent = "0";
            
            // Reset progress bar
            this.updateProgressBar();
            
            // Hide result card
            this.resultCard.classList.add('hidden');
            
            // Reset questions and buttons
            this.questions.forEach((qBlock, idx) => {
                if (idx === 0) {
                    qBlock.classList.add('active-question');
                } else {
                    qBlock.classList.remove('active-question');
                }
                
                const feedbackDiv = qBlock.querySelector('.question-feedback');
                feedbackDiv.className = "question-feedback hidden";
                feedbackDiv.textContent = "";

                const options = qBlock.querySelectorAll('.option-btn');
                options.forEach(opt => {
                    opt.disabled = false;
                    opt.className = "option-btn";
                });
            });

            // Reset navigation buttons
            this.nextBtn.disabled = true;
            this.nextBtn.innerHTML = `Siguiente Pregunta <i data-lucide="chevron-right"></i>`;
            this.nextBtn.classList.remove('hidden');
            this.restartBtn.classList.add('hidden');
            
            lucide.createIcons();
        }
    }

    // Instantiate Quizzes
    const quizEtapa1 = new QuizEngine('quiz-20-30', 'next-btn-quiz2', 'restart-btn-quiz2', 'progress-quiz2', 'result-quiz2', 'quiz2');
    const quizEtapa2 = new QuizEngine('quiz-30-50', 'next-btn-quiz3', 'restart-btn-quiz3', 'progress-quiz3', 'result-quiz3', 'quiz3');
    const quizGlosario = new QuizEngine('quiz-glosario', 'next-btn-quiz4', 'restart-btn-quiz4', 'progress-quiz4', 'result-quiz4', 'quizGlosario');


    // ==========================================
    // AUTHENTICATION SYSTEM (Gatekeeper Landing)
    // ==========================================
    const roleTabEstudiante = document.getElementById('role-tab-estudiante');
    const roleTabDocente = document.getElementById('role-tab-docente');
    const formEstudiante = document.getElementById('form-estudiante');
    const formDocente = document.getElementById('form-docente');

    const googleModal = document.getElementById('googleModal');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleCancelBtn = document.getElementById('googleCancelBtn');
    const googleNextBtn = document.getElementById('googleNextBtn');
    const googleEmailInput = document.getElementById('googleEmailInput');
    const googleEmailStep = document.getElementById('google-email-step');
    const googleLoadingStep = document.getElementById('google-loading-step');

    const docentePassword = document.getElementById('docentePassword');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const docenteSubmitBtn = document.getElementById('docenteSubmitBtn');
    const loginErrorMessage = document.getElementById('loginErrorMessage');

    const userProfileMenu = document.getElementById('userProfileMenu');
    const userAvatar = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');

    // Toggle Role Form
    function setRole(role) {
        if (role === 'estudiante') {
            roleTabEstudiante.classList.add('active');
            roleTabDocente.classList.remove('active');
            formEstudiante.classList.remove('hidden');
            formDocente.classList.add('hidden');
        } else {
            roleTabEstudiante.classList.remove('active');
            roleTabDocente.classList.add('active');
            formEstudiante.classList.add('hidden');
            formDocente.classList.remove('hidden');
        }
    }

    roleTabEstudiante.addEventListener('click', () => setRole('estudiante'));
    roleTabDocente.addEventListener('click', () => setRole('docente'));

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = docentePassword.getAttribute('type') === 'password' ? 'text' : 'password';
        docentePassword.setAttribute('type', type);
        
        // Toggle icon
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });

    // Submit Teacher Password
    docenteSubmitBtn.addEventListener('click', () => {
        const password = docentePassword.value.trim();
        if (password === '2228') {
            loginErrorMessage.classList.add('hidden');
            
            const teacherUser = { email: 'docente@colegio.edu.ar', role: 'docente' };
            localStorage.setItem('economy_vida_user', JSON.stringify(teacherUser));
            
            checkLoginState();
        } else {
            loginErrorMessage.classList.remove('hidden');
        }
    });

    // Enter key support for password field
    docentePassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            docenteSubmitBtn.click();
        }
    });

    // Google Login Flow
    googleSignInBtn.addEventListener('click', () => {
        googleModal.classList.remove('hidden');
        googleEmailInput.value = '';
        googleEmailStep.classList.remove('hidden');
        googleLoadingStep.classList.add('hidden');
    });

    googleCancelBtn.addEventListener('click', () => {
        googleModal.classList.add('hidden');
    });

    googleNextBtn.addEventListener('click', () => {
        const email = googleEmailInput.value.trim();
        if (!email || !email.includes('@')) {
            alert('Por favor, ingresa una dirección de correo válida (Gmail).');
            return;
        }

        // Show loading step
        googleEmailStep.classList.add('hidden');
        googleLoadingStep.classList.remove('hidden');

        // Simulate network latency (Google Oauth loader)
        setTimeout(() => {
            googleModal.classList.add('hidden');
            
            // Save User
            const studentUser = { email: email, role: 'estudiante' };
            localStorage.setItem('economy_vida_user', JSON.stringify(studentUser));
            
            // Add student to Database if new
            DatabaseManager.saveStudent(email);
            
            checkLoginState();
        }, 1200);
    });

    googleEmailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            googleNextBtn.click();
        }
    });

    // Profile Dropdown Toggle
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userProfileMenu.classList.toggle('menu-active');
    });

    document.addEventListener('click', (e) => {
        if (!userProfileMenu.contains(e.target)) {
            userProfileMenu.classList.remove('menu-active');
        }
    });

    // Logout Action
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('economy_vida_user');
        userProfileMenu.classList.remove('menu-active');
        checkLoginState();
    });


    // ==========================================
    // INITIAL LOGIN STATE CHECK
    // ==========================================
    function checkLoginState() {
        const userJson = localStorage.getItem('economy_vida_user');
        const navTabs = document.getElementById('navTabs');
        const mobileNav = document.getElementById('mobileNav');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');

        const docButtons = [
            document.getElementById('btn-tab-docente'),
            document.getElementById('btn-mobile-tab-docente')
        ];

        if (userJson) {
            const user = JSON.parse(userJson);
            
            // Show navigation options & profile
            navTabs.classList.remove('hidden');
            userProfileMenu.classList.remove('hidden');
            mobileMenuBtn.classList.remove('hidden');
            
            if (user.role === 'docente') {
                userAvatar.textContent = 'D';
                userAvatar.style.background = 'linear-gradient(135deg, #b45309, #d97706)'; // Amber theme
                profileEmail.textContent = 'Docente Administrador';
                profileRole.textContent = 'Docente';
                
                // Show docente tabs
                docButtons.forEach(btn => btn && btn.classList.remove('hidden'));
                
                // Automatically switch to docente tab if we are on login screen
                const activeSection = document.querySelector('.tab-section.active-section');
                if (!activeSection || activeSection.id === 'tab-login') {
                    switchTab('tab-docente');
                }
            } else {
                const initial = user.email.trim().charAt(0).toUpperCase();
                userAvatar.textContent = initial;
                userAvatar.style.background = 'linear-gradient(135deg, #0f766e, #0284c7)'; // Teal gradient
                profileEmail.textContent = user.email;
                profileRole.textContent = 'Estudiante';
                
                // Hide docente tabs
                docButtons.forEach(btn => btn && btn.classList.add('hidden'));
                
                // Automatically switch to inicio tab if we are on login screen
                const activeSection = document.querySelector('.tab-section.active-section');
                if (!activeSection || activeSection.id === 'tab-login') {
                    switchTab('tab-inicio');
                }
            }
        } else {
            // Clean state - Hide nav tabs and profile
            navTabs.classList.add('hidden');
            mobileNav.classList.add('hidden');
            mobileNav.classList.remove('mobile-active');
            userProfileMenu.classList.add('hidden');
            mobileMenuBtn.classList.add('hidden'); // Hide mobile hamburger menu
            
            // Hide docente tabs
            docButtons.forEach(btn => btn && btn.classList.add('hidden'));
            
            // Force redirection to login tab
            switchTab('tab-login');
        }
    }

    // Run login verification at startup
    checkLoginState();


    // ==========================================
    // DOCENTE DASHBOARD MANAGEMENT
    // ==========================================
    const studentSearch = document.getElementById('studentSearch');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const resetDatabaseBtn = document.getElementById('resetDatabaseBtn');

    // Helper to format email into Name and Last Name
    function formatStudentName(email) {
        if (!email || typeof email !== 'string') return 'Estudiante';
        const namePart = email.split('@')[0];
        if (!namePart) return 'Estudiante';
        if (namePart.includes('.')) {
            return namePart.split('.')
                .map(word => word ? (word.charAt(0).toUpperCase() + word.slice(1)) : '')
                .join(' ');
        }
        return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }

    function refreshDocenteDashboard() {
        const students = DatabaseManager.getStudents();
        const tableBody = document.getElementById('studentsTableBody');
        const noRecordsMsg = document.getElementById('noRecordsMsg');
        const query = studentSearch.value.toLowerCase().trim();
        
        tableBody.innerHTML = '';
        
        // Filter elements
        const filtered = students.filter(s => s.email && s.email.toLowerCase().includes(query));
        
        if (filtered.length === 0) {
            noRecordsMsg.classList.remove('hidden');
        } else {
            noRecordsMsg.classList.add('hidden');
            
            filtered.forEach(student => {
                const tr = document.createElement('tr');
                
                const scores = student.scores || { quiz2: null, quiz3: null, quizGlosario: null };
                const q2Badge = getScoreBadgeHtml(scores.quiz2, 3);
                const q3Badge = getScoreBadgeHtml(scores.quiz3, 3);
                const qgBadge = getScoreBadgeHtml(scores.quizGlosario, 2);
                
                // Sum scores
                const totalScore = (scores.quiz2 || 0) + (scores.quiz3 || 0) + (scores.quizGlosario || 0);
                const totalMax = 8;
                
                // Formatted name
                const formattedName = formatStudentName(student.email);
                
                // Formatted date
                const dateStr = student.lastActive ? new Date(student.lastActive).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'Sin actividad';
                
                tr.innerHTML = `
                    <td><strong>${formattedName}</strong> <span class="student-email-row" style="font-size: 11px; color: var(--text-secondary); display: block;">${student.email}</span></td>
                    <td>${q2Badge}</td>
                    <td>${q3Badge}</td>
                    <td>${qgBadge}</td>
                    <td><strong>${totalScore} / ${totalMax}</strong></td>
                    <td>${dateStr}</td>
                `;
                
                tableBody.appendChild(tr);
            });
        }
        
        // Update stats
        compileDocenteStats(students);

        // Update podium!
        refreshPodium(students);
    }

    function getScoreBadgeHtml(score, max) {
        if (score === null || score === undefined) {
            return `<span class="score-badge badge-pending">Pendiente</span>`;
        }
        if (score === max) {
            return `<span class="score-badge badge-full">${score} / ${max}</span>`;
        }
        if (score >= max / 2) {
            return `<span class="score-badge badge-partial">${score} / ${max}</span>`;
        }
        return `<span class="score-badge badge-low">${score} / ${max}</span>`;
    }

    function compileDocenteStats(students) {
        const totalStudents = students.length;
        
        let totalCompleted = 0;
        let totalScoreSum = 0;
        let totalMaxPossible = 0;
        
        students.forEach(student => {
            const scores = student.scores || { quiz2: null, quiz3: null, quizGlosario: null };
            if (scores.quiz2 !== null && scores.quiz2 !== undefined) {
                totalCompleted++;
                totalScoreSum += Number(scores.quiz2) || 0;
                totalMaxPossible += 3;
            }
            if (scores.quiz3 !== null && scores.quiz3 !== undefined) {
                totalCompleted++;
                totalScoreSum += Number(scores.quiz3) || 0;
                totalMaxPossible += 3;
            }
            if (scores.quizGlosario !== null && scores.quizGlosario !== undefined) {
                totalCompleted++;
                totalScoreSum += Number(scores.quizGlosario) || 0;
                totalMaxPossible += 2;
            }
        });
        
        const avgScorePercent = totalMaxPossible > 0 ? Math.round((totalScoreSum / totalMaxPossible) * 100) : 0;
        
        document.getElementById('stat-total-students').textContent = totalStudents;
        document.getElementById('stat-total-completed').textContent = totalCompleted;
        document.getElementById('stat-average-score').textContent = `${avgScorePercent}%`;
    }

    // Refresh dynamic podium with top 3 students
    function refreshPodium(students) {
        const podiumLayout = document.getElementById('podiumLayout');
        if (!podiumLayout) return;

        try {
            // Map and filter active students who completed at least one quiz
            const scoredStudents = students.map(student => {
                if (!student) return { hasTaken: false };
                const scores = student.scores || { quiz2: null, quiz3: null, quizGlosario: null };
                
                let takenCount = 0;
                let scoreSum = 0;
                let maxPossible = 0;
                
                if (scores.quiz2 !== null && scores.quiz2 !== undefined) {
                    takenCount++;
                    scoreSum += Number(scores.quiz2) || 0;
                    maxPossible += 3;
                }
                if (scores.quiz3 !== null && scores.quiz3 !== undefined) {
                    takenCount++;
                    scoreSum += Number(scores.quiz3) || 0;
                    maxPossible += 3;
                }
                if (scores.quizGlosario !== null && scores.quizGlosario !== undefined) {
                    takenCount++;
                    scoreSum += Number(scores.quizGlosario) || 0;
                    maxPossible += 2;
                }
                
                const pct = maxPossible > 0 ? (scoreSum / maxPossible) * 100 : 0;
                
                return {
                    ...student,
                    totalScore: (Number(scores.quiz2) || 0) + (Number(scores.quiz3) || 0) + (Number(scores.quizGlosario) || 0),
                    hasTaken: takenCount > 0,
                    percentage: Math.round(pct)
                };
            }).filter(s => s.hasTaken);

            // Sort descending by percentage, then by total score, then alphabetically
            scoredStudents.sort((a, b) => {
                if (b.percentage !== a.percentage) {
                    return b.percentage - a.percentage;
                }
                if (b.totalScore !== a.totalScore) {
                    return b.totalScore - a.totalScore;
                }
                return (a.email || "").localeCompare(b.email || "");
            });

            // Get Top 3
            const top3 = scoredStudents.slice(0, 3);

            if (top3.length === 0) {
                podiumLayout.innerHTML = `
                    <div style="grid-column: span 3; text-align: center; padding: 24px 0; color: var(--text-secondary);">
                        <i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 8px; color: var(--color-primary); display: inline-block;"></i>
                        <p>Aún no hay calificaciones registradas para armar el podio escolar.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            let layoutHtml = '';
            const spot2 = top3[1];
            const spot1 = top3[0];
            const spot3 = top3[2];

            // 2nd Place (Left)
            if (spot2) {
                layoutHtml += renderPodiumSpotHtml(spot2, 'second', '2');
            } else {
                layoutHtml += '<div class="podium-spot-empty"></div>';
            }

            // 1st Place (Center)
            if (spot1) {
                layoutHtml += renderPodiumSpotHtml(spot1, 'first', '1');
            }

            // 3rd Place (Right)
            if (spot3) {
                layoutHtml += renderPodiumSpotHtml(spot3, 'third', '3');
            } else {
                layoutHtml += '<div class="podium-spot-empty"></div>';
            }

            podiumLayout.innerHTML = layoutHtml;
            lucide.createIcons();
        } catch (e) {
            console.error("Error in refreshPodium:", e);
            podiumLayout.innerHTML = `
                <div style="grid-column: span 3; text-align: center; padding: 24px 0; color: var(--text-secondary);">
                    <p>Error cargando el podio de calificaciones.</p>
                </div>
            `;
        }
    }

    function renderPodiumSpotHtml(student, rankClass, number) {
        const formattedName = formatStudentName(student.email);
        const initial = student.email ? student.email.charAt(0).toUpperCase() : 'E';
        const crown = rankClass === 'first' ? '<i data-lucide="crown" class="podium-crown"></i>' : '';
        
        return `
            <div class="podium-spot podium-spot-${rankClass}">
                <div class="podium-avatar">
                    ${crown}
                    <span>${initial}</span>
                </div>
                <div class="podium-name" title="${formattedName}">${formattedName}</div>
                <div class="podium-email" title="${student.email}">${student.email}</div>
                <div class="podium-score">${student.totalScore} / 8 pts</div>
                <div class="podium-pct">${student.percentage}% aciertos</div>
                <div class="podium-pedestal">${number}</div>
            </div>
        `;
    }

    // Search input event
    studentSearch.addEventListener('input', refreshDocenteDashboard);

    // Export CSV
    exportCsvBtn.addEventListener('click', () => {
        const students = DatabaseManager.getStudents();
        if (students.length === 0) {
            alert('No hay alumnos registrados en la base de datos.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Estudiante,Nombre,Etapa 20-30 (max 3),Etapa 30-50 (max 3),Glosario (max 2),Total (max 8),Ultima Actividad\n";
        
        students.forEach(student => {
            const scores = student.scores || { quiz2: null, quiz3: null, quizGlosario: null };
            const q2 = scores.quiz2 !== null ? scores.quiz2 : "";
            const q3 = scores.quiz3 !== null ? scores.quiz3 : "";
            const qg = scores.quizGlosario !== null ? scores.quizGlosario : "";
            const total = (scores.quiz2 || 0) + (scores.quiz3 || 0) + (scores.quizGlosario || 0);
            const lastActive = student.lastActive ? new Date(student.lastActive).toISOString() : "";
            const name = formatStudentName(student.email);
            
            csvContent += `"${student.email}","${name}",${q2},${q3},${qg},${total},"${lastActive}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_calificaciones_docente.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Reset Database
    resetDatabaseBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas reiniciar la base de datos de calificaciones? Esto restablecerá los datos semilla de prueba.')) {
            DatabaseManager.reset();
            refreshDocenteDashboard();
            alert('Base de datos restablecida.');
        }
    });
});
