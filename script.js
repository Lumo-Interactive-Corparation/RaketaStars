// Telegram Web App API
const tg = window.Telegram.WebApp;

// Игровые переменные
let gameState = {
    stars: 0,
    launches: 0,
    bestScore: 0,
    level: 1,
    totalWithdrawn: 0,
    isPremium: false,
    premiumExpiry: null,
    referrals: 0,
    referralEarnings: 0,
    completedTasks: 0,
    taskEarnings: 0,
    currentSection: 'game',
    achievements: {
        'first-launch': false,
        'star-collector': false,
        'rocket-master': false,
        'space-explorer': false,
        'first-withdrawal': false,
        'premium-user': false,
        'referral-master': false,
        'task-completer': false
    },
    tasks: {
        'subscribe-channel-1': false,
        'subscribe-channel-2': false,
        'subscribe-channel-3': false,
        'invite-friends': false,
        'daily-launch': false
    }
};

// Инициализация приложения
class RaketaStarsApp {
    constructor() {
        this.initTelegramApp();
        this.loadGameState();
        this.initEventListeners();
        this.initMobileMenu();
        this.updateUI();
        this.generateStars();
        this.generateReferralLink();
    }

    // Инициализация Telegram Web App
    initTelegramApp() {
        tg.ready();
        tg.expand();
        
        // Применение темы Telegram
        if (tg.themeParams) {
            this.applyTelegramTheme();
        }

        // Получение данных пользователя
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            this.displayWelcomeMessage(user);
        }

        // Настройка главной кнопки
        tg.MainButton.setText('Поделиться результатом');
        tg.MainButton.onClick(() => {
            this.shareResults();
        });
    }

    // Применение темы Telegram
    applyTelegramTheme() {
        const root = document.documentElement;
        const theme = tg.themeParams;
        
        if (theme.bg_color) {
            root.style.setProperty('--tg-bg-color', theme.bg_color);
        }
        if (theme.button_color) {
            root.style.setProperty('--tg-button-color', theme.button_color);
        }
        if (theme.button_text_color) {
            root.style.setProperty('--tg-button-text-color', theme.button_text_color);
        }
    }

    // Отображение приветственного сообщения
    displayWelcomeMessage(user) {
        const welcomeSection = document.querySelector('.welcome-section p');
        welcomeSection.textContent = `Привет, ${user.first_name}! Собирайте звезды, запускайте ракеты и исследуйте космос!`;
    }

    // Инициализация нижнего меню
    initMobileMenu() {
        const navItems = document.querySelectorAll('.nav-item');

        // Переключение секций
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
    }

    // Переключение секций
    switchSection(sectionName) {
        // Обновляем активный пункт меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Показываем выбранную секцию
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        gameState.currentSection = sectionName;
        this.saveGameState();
        this.updateUI();
    }

    // Генерация реферальной ссылки
    generateReferralLink() {
        const userId = tg.initDataUnsafe?.user?.id || '123456';
        const referralLink = `https://lumo-interactive-corparation.github.io/RaketaStars/?ref=user${userId}`;
        const linkInput = document.getElementById('referral-link');
        if (linkInput) {
            linkInput.value = referralLink;
        }
    }

    // Загрузка состояния игры
    loadGameState() {
        const saved = localStorage.getItem('raketaStarsGame');
        if (saved) {
            gameState = { ...gameState, ...JSON.parse(saved) };
        }
        
        // Восстановление активной секции
        if (gameState.currentSection && gameState.currentSection !== 'game') {
            setTimeout(() => {
                this.switchSection(gameState.currentSection);
            }, 100);
        }
    }

    // Сохранение состояния игры
    saveGameState() {
        localStorage.setItem('raketaStarsGame', JSON.stringify(gameState));
        
        // Отправка данных в Telegram
        if (tg.sendData) {
            tg.sendData(JSON.stringify({
                action: 'game_update',
                stars: gameState.stars,
                launches: gameState.launches,
                level: gameState.level
            }));
        }
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Кнопка запуска ракеты
        const launchBtn = document.getElementById('launch-btn');
        console.log('Looking for launch button...', launchBtn); // Отладка
        if (launchBtn) {
            console.log('Launch button found! Adding event listener...'); // Отладка
            
            // Убираем старые обработчики
            launchBtn.removeEventListener('click', this.launchRocketHandler);
            
            // Создаем обработчик
            this.launchRocketHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚀 LAUNCH BUTTON CLICKED!'); // Отладка
                this.launchRocket();
            };
            
            launchBtn.addEventListener('click', this.launchRocketHandler);
            launchBtn.addEventListener('touchstart', this.launchRocketHandler);
            
            // Дополнительная отладка
            launchBtn.style.cursor = 'pointer';
            launchBtn.style.pointerEvents = 'auto';
            launchBtn.style.zIndex = '1000';
            
            console.log('Launch button configured successfully!'); // Отладка
        } else {
            console.error('❌ Launch button not found!');
        }

        // Обработчики для заданий
        const taskButtons = document.querySelectorAll('.task-btn');
        taskButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const taskItem = btn.closest('.task-item');
                const taskId = taskItem.dataset.task;
                const action = btn.dataset.action;
                
                // Добавляем эффект нажатия
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
                
                this.executeTask(taskId, action);
            });
        });

        // Кнопка вывода
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => {
                this.showWithdrawModal();
            });
        }

        // Кнопки премиума
        const premiumMonthBtn = document.getElementById('premium-month-btn');
        const premiumYearBtn = document.getElementById('premium-year-btn');
        
        if (premiumMonthBtn) {
            premiumMonthBtn.addEventListener('click', () => {
                this.buyPremium(1);
            });
        }
        
        if (premiumYearBtn) {
            premiumYearBtn.addEventListener('click', () => {
                this.buyPremium(12);
            });
        }

        // Копирование реферальной ссылки
        const copyBtn = document.getElementById('copy-referral');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyReferralLink();
            });
        }

        // Поделиться реферальной ссылкой
        const shareBtn = document.getElementById('share-referral');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareReferralLink();
            });
        }

        // Сбор звезд при клике
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('star')) {
                this.collectStar(e.target);
            }
        });

        // Закрытие модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });

        // Звезды
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.collectStar(e.target);
            });
        });

        // Тап по экрану для создания звезд
        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('game-area')) {
                this.createFloatingStar(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
    }

    // Показать модальное окно вывода
    showWithdrawModal() {
        const modal = document.createElement('div');
        modal.className = 'withdraw-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>💰 Вывод звезд</h3>
                <p>Минимальная сумма: 100 звезд</p>
                <p>Доступно: ${gameState.stars} ⭐</p>
                <input type="number" id="withdraw-amount" min="100" max="${gameState.stars}" placeholder="Введите сумму">
                <div class="quick-amounts">
                    <button onclick="document.getElementById('withdraw-amount').value = 100">100</button>
                    <button onclick="document.getElementById('withdraw-amount').value = 500">500</button>
                    <button onclick="document.getElementById('withdraw-amount').value = 1000">1000</button>
                    <button onclick="document.getElementById('withdraw-amount').value = ${gameState.stars}">Все</button>
                </div>
                <div class="modal-buttons">
                    <button class="cancel-btn" onclick="this.closest('.withdraw-modal').remove()">Отмена</button>
                    <button class="confirm-btn" onclick="app.confirmWithdraw()">Вывести</button>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        document.body.appendChild(modal);
    }

    // Подтверждение вывода
    confirmWithdraw() {
        const amount = parseInt(document.getElementById('withdraw-amount').value);
        if (amount && amount >= 100 && amount <= gameState.stars) {
            this.withdrawStars(amount);
            document.querySelector('.withdraw-modal').remove();
        } else {
            this.showNotification('❌ Некорректная сумма для вывода!', 'error');
        }
    }

    // Обновление UI
    updateUI() {
        document.getElementById('stars-count').textContent = gameState.stars;
        document.getElementById('launches-count').textContent = gameState.launches;
        document.getElementById('best-score').textContent = gameState.bestScore;
        document.getElementById('level').textContent = gameState.level;
        
        // Обновление статистики вывода
        const withdrawnElement = document.getElementById('total-withdrawn');
        if (withdrawnElement) {
            withdrawnElement.textContent = gameState.totalWithdrawn;
        }

        // Обновление статуса премиума
        const premiumStatus = document.getElementById('premium-status');
        if (premiumStatus) {
            if (this.isPremiumActive()) {
                const expiry = new Date(gameState.premiumExpiry);
                const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
                premiumStatus.textContent = `Активен (${daysLeft} дн.)`;
                premiumStatus.className = 'premium-active';
            } else {
                premiumStatus.textContent = 'Неактивен';
                premiumStatus.className = 'premium-inactive';
            }
        }

        // Дополнительная статистика
        const totalWithdrawnDisplay = document.getElementById('total-withdrawn-display');
        if (totalWithdrawnDisplay) {
            totalWithdrawnDisplay.textContent = gameState.totalWithdrawn;
        }

        const availableStars = document.getElementById('available-stars');
        if (availableStars) {
            availableStars.textContent = gameState.stars;
        }

        // Реферальная статистика
        const referralsCount = document.getElementById('referrals-count');
        if (referralsCount) {
            referralsCount.textContent = gameState.referrals;
        }

        const referralEarnings = document.getElementById('referral-earnings');
        if (referralEarnings) {
            referralEarnings.textContent = gameState.referralEarnings;
        }

        // Статистика заданий
        const completedTasks = document.getElementById('completed-tasks');
        if (completedTasks) {
            completedTasks.textContent = gameState.completedTasks;
        }

        const taskEarnings = document.getElementById('tasks-earnings');
        if (taskEarnings) {
            taskEarnings.textContent = gameState.taskEarnings;
        }

        // Обновление кнопки запуска
        const launchBtn = document.getElementById('launch-btn');
        if (launchBtn) {
            const btnText = launchBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = 'Запустить ракету';
            }
        }

        // Обновление состояния заданий
        this.updateTasksUI();

        // Обновление кнопок вывода и премиума
        this.updateActionButtons();

        // Обновление достижений
        this.updateAchievementsUI();
        Object.keys(gameState.achievements).forEach(achievementId => {
            const element = document.querySelector(`[data-achievement="${achievementId}"]`);
            if (element) {
                element.classList.toggle('unlocked', gameState.achievements[achievementId]);
                element.classList.toggle('locked', !gameState.achievements[achievementId]);
            }
        });

        // Показать главную кнопку если есть достижения
        if (gameState.stars > 0 || gameState.launches > 0) {
            tg.MainButton.show();
        }
    }

    // Обновление UI заданий
    updateTasksUI() {
        Object.keys(gameState.tasks).forEach(taskId => {
            const taskItem = document.querySelector(`[data-task="${taskId}"]`);
            if (taskItem) {
                const taskBtn = taskItem.querySelector('.task-btn');
                if (gameState.tasks[taskId]) {
                    taskItem.classList.add('completed');
                    taskBtn.textContent = 'Выполнено ✓';
                    taskBtn.disabled = true;
                    taskBtn.classList.add('completed');
                }
            }
        });
    }

    // Обновление кнопок действий
    updateActionButtons() {
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.disabled = gameState.stars < 100;
            withdrawBtn.style.opacity = gameState.stars >= 100 ? '1' : '0.5';
        }
    }

    // Обновление UI достижений
    updateAchievementsUI() {
        const unlockedCount = Object.values(gameState.achievements).filter(Boolean).length;
        const totalCount = Object.keys(gameState.achievements).length;
        const progress = Math.round((unlockedCount / totalCount) * 100);

        // Обновление счетчиков
        const unlockedElement = document.getElementById('unlocked-achievements');
        if (unlockedElement) {
            unlockedElement.textContent = unlockedCount;
        }

        const totalElement = document.getElementById('total-achievements');
        if (totalElement) {
            totalElement.textContent = totalCount;
        }

        // Обновление прогресс-бара
        const progressBar = document.getElementById('achievements-progress-bar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }

        const progressText = document.getElementById('achievements-progress-text');
        if (progressText) {
            progressText.textContent = progress + '%';
        }
    }

    // Запуск ракеты
    launchRocket() {
        this.showLoading('Подготовка к запуску...');
        
        setTimeout(() => {
            gameState.launches++;
            
            // Расчет количества звезд за запуск
            let starsEarned;
            if (this.isPremiumActive()) {
                // Премиум: 50-599 звезд за запуск
                starsEarned = Math.floor(Math.random() * 550) + 50;
            } else {
                // Обычный: 1-5 звезд за запуск
                starsEarned = Math.floor(Math.random() * 5) + 1;
            }
            gameState.stars += starsEarned;
            
            // Обновление рекорда
            if (gameState.stars > gameState.bestScore) {
                gameState.bestScore = gameState.stars;
            }
            
            // Обновление уровня
            gameState.level = Math.floor(gameState.stars / 10) + 1;

            // Отметка ежедневного задания
            if (!gameState.tasks['daily-launch']) {
                this.completeTask('daily-launch', 50);
            }
            
            this.hideLoading();
            this.updateUI();
            this.checkAchievements();
            this.saveGameState();
            
            // Анимация запуска ракеты
            this.animateRocketLaunch();
            
            // Показать результат
            this.showLaunchResult(starsEarned);
            
            // Haptic feedback
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }
        }, 1500);
    }

    // Сбор звезды
    collectStar(starElement) {
        starElement.classList.add('star-collected');
        gameState.stars++;
        
        // Обновление рекорда
        if (gameState.stars > gameState.bestScore) {
            gameState.bestScore = gameState.stars;
        }
        
        // Обновление уровня
        gameState.level = Math.floor(gameState.stars / 10) + 1;
        
        this.updateUI();
        this.checkAchievements();
        this.saveGameState();
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
        
        // Регенерация звезды
        setTimeout(() => {
            starElement.classList.remove('star-collected');
            this.repositionStar(starElement);
        }, 600);
    }

    // Создание плавающей звезды
    createFloatingStar(x, y) {
        const star = document.createElement('div');
        star.className = 'floating-star';
        star.textContent = '⭐';
        star.style.position = 'fixed';
        star.style.left = x + 'px';
        star.style.top = y + 'px';
        star.style.fontSize = '20px';
        star.style.pointerEvents = 'none';
        star.style.zIndex = '1000';
        star.style.animation = 'star-float-up 2s ease-out forwards';
        
        document.body.appendChild(star);
        
        setTimeout(() => {
            star.remove();
        }, 2000);
    }

    // Репозиция звезды
    repositionStar(starElement) {
        const newTop = Math.random() * 80 + 10;
        const newLeft = Math.random() * 80 + 10;
        
        starElement.style.top = newTop + '%';
        starElement.style.left = newLeft + '%';
    }

    // Генерация звезд
    generateStars() {
        const starField = document.querySelector('.star-field');
        
        // Добавляем дополнительные звезды каждые 30 секунд
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.addRandomStar(starField);
            }
        }, 30000);
    }

    // Добавление случайной звезды
    addRandomStar(container) {
        const star = document.createElement('div');
        star.className = 'star bonus-star';
        star.textContent = '🌟';
        star.style.position = 'absolute';
        star.style.top = Math.random() * 80 + 10 + '%';
        star.style.left = Math.random() * 80 + 10 + '%';
        star.style.fontSize = '28px';
        star.style.animation = 'star-float 3s infinite ease-in-out';
        
        star.addEventListener('click', (e) => {
            this.collectBonusStar(e.target);
        });
        
        container.appendChild(star);
        
        // Удаляем звезду через 10 секунд
        setTimeout(() => {
            if (star.parentNode) {
                star.remove();
            }
        }, 10000);
    }

    // Сбор бонусной звезды
    collectBonusStar(starElement) {
        starElement.classList.add('star-collected');
        gameState.stars += 5;
        
        this.updateUI();
        this.saveGameState();
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('heavy');
        }
        
        setTimeout(() => {
            starElement.remove();
        }, 600);
    }

    // Проверка достижений
    checkAchievements() {
        let newAchievements = [];
        
        // Первый запуск
        if (gameState.launches >= 1 && !gameState.achievements['first-launch']) {
            gameState.achievements['first-launch'] = true;
            newAchievements.push('Первый запуск');
        }
        
        // Коллекционер звезд
        if (gameState.stars >= 50 && !gameState.achievements['star-collector']) {
            gameState.achievements['star-collector'] = true;
            newAchievements.push('Коллекционер звезд');
        }
        
        // Мастер ракет
        if (gameState.launches >= 10 && !gameState.achievements['rocket-master']) {
            gameState.achievements['rocket-master'] = true;
            newAchievements.push('Мастер ракет');
        }
        
        // Исследователь космоса
        if (gameState.level >= 5 && !gameState.achievements['space-explorer']) {
            gameState.achievements['space-explorer'] = true;
            newAchievements.push('Исследователь космоса');
        }
        
        // Первый вывод
        if (gameState.totalWithdrawn > 0 && !gameState.achievements['first-withdrawal']) {
            gameState.achievements['first-withdrawal'] = true;
            newAchievements.push('Первый вывод');
        }
        
        // Премиум пользователь
        if (this.isPremiumActive() && !gameState.achievements['premium-user']) {
            gameState.achievements['premium-user'] = true;
            newAchievements.push('Премиум пользователь');
        }

        // Реферал мастер
        if (gameState.referrals >= 5 && !gameState.achievements['referral-master']) {
            gameState.achievements['referral-master'] = true;
            newAchievements.push('Реферал мастер');
        }

        // Исполнитель заданий
        if (gameState.completedTasks >= 3 && !gameState.achievements['task-completer']) {
            gameState.achievements['task-completer'] = true;
            newAchievements.push('Исполнитель заданий');
        }
        
        // Показать уведомления о новых достижениях
        newAchievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });
    }

    // Проверка активности премиума
    isPremiumActive() {
        if (!gameState.isPremium || !gameState.premiumExpiry) {
            return false;
        }
        return new Date() < new Date(gameState.premiumExpiry);
    }

    // Покупка премиума через Telegram Stars
    buyPremium(duration) {
        const prices = {
            1: { stars: 189, label: 'Месяц премиума' },
            12: { stars: 2268, label: 'Год премиума' }
        };
        
        const price = prices[duration];
        if (!price) {
            this.showNotification('Неверный план подписки', 'error');
            return;
        }

        // Проверяем доступность Telegram Stars API
        if (!tg.invokeCustomMethod) {
            this.showNotification('Telegram Stars недоступны в этой версии', 'error');
            return;
        }

        // Показываем подтверждение покупки
        this.showPremiumConfirmation(duration, price, () => {
            // Создаем инвойс для Telegram Stars
            const invoice = {
                title: `RaketaStars Premium - ${price.label}`,
                description: `Премиум подписка на ${duration === 1 ? '1 месяц' : '12 месяцев'}. Больше звезд, эксклюзивные задания и бонусы!`,
                payload: `premium_${duration}_months`,
                provider_token: '', // Для Stars не нужен
                currency: 'XTR', // Telegram Stars currency
                prices: [{
                    label: price.label,
                    amount: price.stars // Количество звезд
                }],
                photo_url: 'https://via.placeholder.com/512x512/6c63ff/ffffff?text=⭐',
                photo_width: 512,
                photo_height: 512,
                need_name: false,
                need_phone_number: false,
                need_email: false,
                need_shipping_address: false,
                send_phone_number_to_provider: false,
                send_email_to_provider: false,
                is_flexible: false
            };

            // Отправляем инвойс через Telegram Bot API
            this.createTelegramStarsInvoice(invoice, duration);
        });
    }

    // Создание инвойса для Telegram Stars
    async createTelegramStarsInvoice(invoice, duration) {
        // Показываем загрузку
        this.showLoading('Подготовка платежа...');

        try {
            // Получаем данные пользователя
            const userId = tg.initDataUnsafe?.user?.id;
            if (!userId) {
                throw new Error('Не удалось получить ID пользователя');
            }

            // Реальный API вызов к вашему боту
            const response = await fetch('/api/create-stars-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': tg.initData || ''
                },
                body: JSON.stringify({
                    user_id: userId,
                    duration: duration,
                    stars: invoice.prices[0].amount,
                    title: invoice.title,
                    description: invoice.description,
                    payload: invoice.payload,
                    photo_url: invoice.photo_url
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Меняем текст загрузки
                this.showLoading('Обработка платежа...');
                
                // Открываем инвойс в Telegram
                if (data.invoice_link) {
                    // Используем Telegram WebApp API для открытия инвойса
                    tg.openInvoice(data.invoice_link, (status) => {
                        this.handleInvoiceCallback(status, duration);
                    });
                } else {
                    throw new Error('Не получена ссылка на инвойс');
                }
            } else {
                throw new Error(data.error || 'Ошибка создания инвойса');
            }

        } catch (error) {
            this.hideLoading();
            console.error('Payment error:', error);
            
            // Показываем пользователю понятную ошибку
            let errorMessage = 'Ошибка создания платежа. ';
            
            if (error.message.includes('fetch')) {
                errorMessage += 'Проверьте подключение к интернету.';
            } else if (error.message.includes('HTTP error')) {
                errorMessage += 'Сервис временно недоступен.';
            } else {
                errorMessage += error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    // Обработка результата оплаты инвойса
    handleInvoiceCallback(status, duration) {
        this.hideLoading();
        
        if (status === 'paid') {
            // Платеж успешен
            this.processPremiumPurchase(duration);
        } else if (status === 'cancelled') {
            // Платеж отменен
            this.showNotification('💫 Платеж отменен', 'info');
        } else if (status === 'failed') {
            // Платеж не удался
            this.showNotification('❌ Платеж не удался. Попробуйте еще раз.', 'error');
        } else {
            // Неизвестный статус
            this.showNotification('⏳ Статус платежа неизвестен. Проверьте позже.', 'info');
        }
    }

    // Обработка успешной покупки премиума
    processPremiumPurchase(duration) {
        // Активируем премиум
        this.activatePremium(duration);
        
        // Показываем уведомление об успешной покупке
        this.showNotification(`🎉 Премиум активирован на ${duration === 1 ? '1 месяц' : '12 месяцев'}!`, 'success');
        
        // Обновляем достижения
        if (!gameState.achievements['premium-user']) {
            gameState.achievements['premium-user'] = true;
            this.showAchievementNotification('premium-user');
        }
        
        // Сохраняем состояние
        this.saveGameState();
        this.updateUI();
        
        // Отправляем данные в Telegram
        if (tg.sendData) {
            tg.sendData(JSON.stringify({
                action: 'premium_activated',
                duration: duration,
                expires: gameState.premiumExpiry
            }));
        }
    }

    // Показ подтверждения покупки премиума
    showPremiumConfirmation(duration, price, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content premium-purchase-modal">
                <h3>🌟 Подтверждение покупки</h3>
                <div class="purchase-info">
                    <div class="purchase-item">
                        <span class="purchase-label">Товар:</span>
                        <span class="purchase-value">RaketaStars Premium</span>
                    </div>
                    <div class="purchase-item">
                        <span class="purchase-label">Срок:</span>
                        <span class="purchase-value">${duration === 1 ? '1 месяц' : '12 месяцев'}</span>
                    </div>
                    <div class="purchase-item">
                        <span class="purchase-label">Стоимость:</span>
                        <span class="purchase-value">${price.stars} ⭐ Telegram Stars</span>
                    </div>
                </div>
                <div class="purchase-benefits">
                    <h4>Что вы получите:</h4>
                    <ul>
                        <li>🚀 Больше звезд за запуск (50-599)</li>
                        <li>👥 Увеличенные реферальные бонусы</li>
                        <li>🎯 Эксклюзивные задания</li>
                        <li>⭐ Случайные бонусные звезды</li>
                    </ul>
                </div>
                <div class="modal-buttons">
                    <button class="cancel-btn">Отмена</button>
                    <button class="confirm-btn">Купить за ${price.stars} ⭐</button>
                </div>
            </div>
        `;

        // Обработчики кнопок
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            modal.remove();
            onConfirm();
        });

        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    // Вывод звезд
    withdrawStars(amount) {
        if (amount < 100) {
            this.showNotification('❌ Минимальная сумма вывода: 100 звезд', 'error');
            return false;
        }
        
        if (gameState.stars < amount) {
            this.showNotification('❌ Недостаточно звезд для вывода!', 'error');
            return false;
        }
        
        gameState.stars -= amount;
        gameState.totalWithdrawn += amount;
        
        this.updateUI();
        this.checkAchievements();
        this.saveGameState();
        
        this.showNotification(`✅ Выведено ${amount} звезд!`, 'success');
        
        // Отправка данных в Telegram
        if (tg.sendData) {
            tg.sendData(JSON.stringify({
                action: 'withdraw',
                amount: amount,
                total_withdrawn: gameState.totalWithdrawn
            }));
        }
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        return true;
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        
        const bgColor = type === 'success' ? '#4caf50' : 
                       type === 'error' ? '#f44336' : '#2196f3';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            z-index: 2000;
            font-weight: bold;
            text-align: center;
            animation: slideDown 3s ease-out forwards;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Показать уведомление о достижении
    showAchievementNotification(achievementName) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 8px;">🏆</div>
            <div>
                <strong>Достижение разблокировано!</strong>
                <br>${achievementName}
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #ffd700, #ffeb3b);
            color: #333;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
            z-index: 2000;
            font-weight: bold;
            text-align: center;
            animation: slideDown 3s ease-out forwards;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    // Анимация запуска ракеты
    animateRocketLaunch() {
        const rocketBtn = document.querySelector('.rocket-emoji');
        rocketBtn.style.animation = 'rocket-launch 1s ease-out';
        
        setTimeout(() => {
            rocketBtn.style.animation = 'rocket-shake 0.5s infinite';
        }, 1000);
    }

    // Показать результат запуска
    showLaunchResult(starsEarned) {
        const result = document.createElement('div');
        result.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🚀</div>
            <h3>Ракета запущена!</h3>
            <p>Вы получили <strong>${starsEarned}</strong> звезд!</p>
        `;
        
        result.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            z-index: 1500;
            animation: popup 2s ease-out forwards;
        `;
        
        document.body.appendChild(result);
        
        setTimeout(() => {
            result.remove();
        }, 2000);
    }

    // Показать загрузку
    showLoading(text = 'Подготовка к запуску...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = loadingOverlay.querySelector('.loading-spinner p');
        if (loadingText) {
            loadingText.textContent = text;
        }
        loadingOverlay.classList.add('active');
    }

    // Скрыть загрузку
    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }

    // Поделиться результатами
    shareResults() {
        const message = `🚀 RaketaStars - Мои результаты:\n⭐ Звезд: ${gameState.stars}\n🎯 Запусков: ${gameState.launches}\n🏆 Рекорд: ${gameState.bestScore}\n🌟 Уровень: ${gameState.level}`;
        
        if (tg.sendData) {
            tg.sendData(JSON.stringify({
                action: 'share_results',
                message: message
            }));
        }
        
        // Закрыть приложение
        tg.close();
    }

    // Копирование реферальной ссылки
    copyReferralLink() {
        const linkInput = document.getElementById('referral-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        document.execCommand('copy');
        
        this.showNotification('📋 Ссылка скопирована!', 'success');
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }

    // Поделиться реферальной ссылкой
    shareReferralLink() {
        const link = document.getElementById('referral-link').value;
        const message = `🚀 Присоединяйтесь к RaketaStars! Собирайте звезды и зарабатывайте вместе со мной!\n\n${link}`;
        
        if (tg.sendData) {
            tg.sendData(JSON.stringify({
                action: 'share_referral',
                message: message,
                link: link
            }));
        }
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
    }

    // Добавление реферала
    addReferral(userId, hasTelegramPremium = false) {
        gameState.referrals++;
        
        let reward = 50; // Базовая награда за обычного друга
        
        if (this.isPremiumActive()) {
            // Если у пользователя есть премиум бота
            reward = hasTelegramPremium ? 1500 : 500;
        } else {
            // Если у пользователя нет премиума бота
            reward = hasTelegramPremium ? 150 : 50;
        }
        
        gameState.stars += reward;
        gameState.referralEarnings += reward;
        
        this.updateUI();
        this.checkAchievements();
        this.saveGameState();
        
        const premiumText = hasTelegramPremium ? ' (Telegram Premium)' : '';
        this.showNotification(`🎉 Новый реферал${premiumText}! +${reward} звезд`, 'success');
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    // Выполнение задания
    executeTask(taskId, action) {
        if (gameState.tasks[taskId]) {
            this.showNotification('✅ Задание уже выполнено!', 'info');
            return;
        }

        const taskRewards = {
            'subscribe-channel-1': 100,
            'subscribe-channel-2': 150,
            'subscribe-channel-3': 300,
            'invite-friends': 500,
            'daily-launch': 50
        };

        if (action === 'subscribe') {
            // Открыть канал в Telegram
            const channels = {
                'subscribe-channel-1': '@raketastars_news',
                'subscribe-channel-2': '@crypto_stars_official',
                'subscribe-channel-3': '@premium_trading_signals'
            };
            
            const channelName = channels[taskId];
            if (channelName) {
                window.open(`https://t.me/${channelName.replace('@', '')}`, '_blank');
                
                // Симуляция проверки подписки
                setTimeout(() => {
                    this.completeTask(taskId, taskRewards[taskId]);
                }, 3000);
            }
        } else if (action === 'invite') {
            // Переключиться на секцию рефералов
            this.switchSection('referrals');
        } else if (action === 'launch') {
            // Переключиться на секцию игры
            this.switchSection('game');
        }
    }

    // Завершение задания
    completeTask(taskId, reward) {
        if (gameState.tasks[taskId]) return;
        
        gameState.tasks[taskId] = true;
        gameState.completedTasks++;
        gameState.taskEarnings += reward;
        gameState.stars += reward;
        
        this.updateUI();
        this.checkAchievements();
        this.saveGameState();
        
        this.showNotification(`✅ Задание выполнено! +${reward} звезд`, 'success');
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
}

// Добавление дополнительных стилей для анимаций
const additionalStyles = `
    @keyframes star-float-up {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
    }
    
    @keyframes slideDown {
        0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        20% { transform: translateX(-50%) translateY(0); opacity: 1; }
        80% { transform: translateX(-50%) translateY(0); opacity: 1; }
        100% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
    }
    
    @keyframes popup {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        30% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        90% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    }
    
    @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }
    
    /* Критичные стили для кнопки */
    .launch-button {
        position: relative !important;
        z-index: 1000 !important;
        pointer-events: auto !important;
        touch-action: manipulation !important;
        user-select: none !important;
    }
    
    .rocket-launch-area {
        position: relative !important;
        z-index: 999 !important;
        pointer-events: auto !important;
    }
`;

// Добавление стилей к документу
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RaketaStarsApp();
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Ошибка в приложении:', e);
});

// Обработка закрытия приложения
window.addEventListener('beforeunload', () => {
    if (app) {
        app.saveGameState();
    }
}); 