document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Tab Navigation Logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    const mobileTabButtons = document.querySelectorAll('.mobile-tab-btn');
    const sections = document.querySelectorAll('.tab-section');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');

    // Function to switch tabs
    window.switchTab = function(tabId) {
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


    // 3. Theme Toggle Logic (Light / Dark Mode)
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


    // 4. Glossary Accordion & Search Logic
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


    // 5. Reusable Quiz Engine
    class QuizEngine {
        constructor(containerId, nextBtnId, restartBtnId, progressBarId, resultCardId) {
            this.container = document.getElementById(containerId);
            this.nextBtn = document.getElementById(nextBtnId);
            this.restartBtn = document.getElementById(restartBtnId);
            this.progressBar = document.getElementById(progressBarId);
            this.resultCard = document.getElementById(resultCardId);
            
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
    const quizEtapa1 = new QuizEngine('quiz-20-30', 'next-btn-quiz2', 'restart-btn-quiz2', 'progress-quiz2', 'result-quiz2');
    const quizEtapa2 = new QuizEngine('quiz-30-50', 'next-btn-quiz3', 'restart-btn-quiz3', 'progress-quiz3', 'result-quiz3');
    const quizGlosario = new QuizEngine('quiz-glosario', 'next-btn-quiz4', 'restart-btn-quiz4', 'progress-quiz4', 'result-quiz4');
});
