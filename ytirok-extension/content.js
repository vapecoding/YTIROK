// === ASSETS ===
const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="32" viewBox="0 0 140 32" fill="none">
  <text x="0" y="24" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="26" fill="#2c3e50" letter-spacing="-1">YTIR</text>
  
  <g transform="translate(68, 15)">
    <circle cx="0" cy="0" r="8" fill="#e74c3c" opacity="0.4">
      <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="0" cy="0" r="6" fill="#e74c3c"/>
  </g>

  <text x="82" y="24" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="26" fill="#2c3e50">K</text>
</svg>
`;

const WAITING_TEXTS = [
    "Я позабочусь и не дам тебе забыть включить запись!",
    "Расслабься, я напомню про запись когда придут коллеги.",
    "Жду вместе с тобой. Про запись — не переживай, напомню!",
    "Пока ты один — отдыхай. Запись? Это моя забота.",
    "Я на страже! Когда начнётся — напомню про запись."
];

const WAITING_BUTTONS = [
    "Спасибо, лапочка",
    "Ты — золото",
    "Обнял",
    "Чмок",
    "Ладушки"
];

const PERIODIC_TEXTS = [
    "Надеюсь, вы не забыли про запись!",
    "Запись идёт? Просто проверяю.",
    "Дружеское напоминание: запись!",
    "Индикатор записи горит?"
];

const random = arr => arr[Math.floor(Math.random() * arr.length)];

// === СОСТОЯНИЕ ===
let settings = { ...DEFAULTS };
let aloneTimerStarted = false;
let aloneGreetingShown = false;
let battleTimerStarted = false;
let battleReminderShown = false;
let periodicTimerId = null;
let periodicShownCount = 0;

// Загружаем настройки
chrome.storage.sync.get(DEFAULTS, (data) => {
    settings = data;
    startMainLoop();
});

// Слушаем изменения настроек
chrome.storage.onChanged.addListener((changes) => {
    for (const key in changes) {
        settings[key] = changes[key].newValue;
    }
    // Перезапуск периодического таймера если изменились настройки
    if (changes.periodicEnabled || changes.periodicInterval) {
        restartPeriodicReminder();
    }
});

// === UI ===
function createToastHTML(text, buttonsHtml) {
    return `
        <div class="ytirok-header">
            <div class="ytirok-logo" title="Yandex Telemost Is Recording OK">${LOGO_SVG}</div>
        </div>
        <p class="ytirok-text">${text}</p>
        <div class="ytirok-buttons">${buttonsHtml}</div>
    `;
}

function showWaitingGreeting() {
    if (document.getElementById('ytirok-toast')) return;

    const container = document.createElement('div');
    container.id = 'ytirok-toast';
    container.className = 'ytirok-neutral';
    container.innerHTML = createToastHTML(
        random(WAITING_TEXTS),
        `<button class="ytirok-btn ytirok-btn-neutral">${random(WAITING_BUTTONS)}</button>`
    );

    // Добавляем кнопку refresh в хедер
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'ytirok-refresh';
    refreshBtn.innerHTML = '↻';
    refreshBtn.onclick = () => {
        container.querySelector('.ytirok-text').textContent = random(WAITING_TEXTS);
        container.querySelector('.ytirok-btn-neutral').textContent = random(WAITING_BUTTONS);
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => refreshBtn.style.transform = '', 300);
    };
    container.querySelector('.ytirok-header').insertBefore(
        refreshBtn,
        container.querySelector('.ytirok-close')
    );

    document.body.appendChild(container);

    container.querySelector('.ytirok-btn-neutral').onclick = () => removeToast(false);

    aloneGreetingShown = true;
}

function showBattleReminder() {
    if (document.getElementById('ytirok-toast')) return;

    battleReminderShown = true;

    const container = document.createElement('div');
    container.id = 'ytirok-toast';
    container.innerHTML = createToastHTML(
        "Коллеги часто забывают про запись. Включим?",
        `<button class="ytirok-btn ytirok-btn-primary">Включаю</button>
         <button class="ytirok-btn ytirok-btn-secondary">Не нужна</button>`
    );

    document.body.appendChild(container);

    container.querySelector('.ytirok-btn-secondary').onclick = () => removeToast(true);
    container.querySelector('.ytirok-btn-primary').onclick = () => {
        removeToast(false);
        if (settings.doubleCheckEnabled) {
            setTimeout(() => {
                if (isMeetingActive()) showDoubleCheck();
            }, settings.doubleCheckDelay * 1000);
        } else {
            startPeriodicReminder();
        }
    };
}

function showDoubleCheck() {
    if (document.getElementById('ytirok-toast')) return;

    const container = document.createElement('div');
    container.id = 'ytirok-toast';
    container.className = 'ytirok-warning';
    container.innerHTML = createToastHTML(
        `Прошло ${settings.doubleCheckDelay} секунд. Индикатор записи точно горит?`,
        `<button class="ytirok-btn ytirok-btn-warning-primary">Да, всё работает</button>
         <button class="ytirok-btn ytirok-btn-warning-secondary">Ой, точно, спасибо</button>`
    );

    document.body.appendChild(container);

    container.querySelectorAll('.ytirok-btn').forEach(btn => {
        btn.onclick = () => {
            removeToast(false);
            startPeriodicReminder();
        };
    });
}

const MINI_POSITIONS = ['bottom', 'top', 'left', 'right'];

function showPeriodicReminder() {
    if (document.getElementById('ytirok-toast')) return;
    if (document.getElementById('ytirok-mini')) return;
    if (!isMeetingActive() || isUserAlone()) return;

    periodicShownCount++;

    if (periodicShownCount >= settings.periodicCount) {
        stopPeriodicReminder();
    }

    const position = random(MINI_POSITIONS);

    const mini = document.createElement('div');
    mini.id = 'ytirok-mini';
    mini.className = `ytirok-pos-${position}`;
    mini.innerHTML = `
        <span>${random(PERIODIC_TEXTS)}</span>
        <button class="ytirok-mini-close">&times;</button>
    `;

    document.body.appendChild(mini);

    const closeBtn = mini.querySelector('.ytirok-mini-close');
    closeBtn.onclick = () => mini.remove();

    // Авто-скрытие через 3 секунды
    setTimeout(() => {
        if (mini.parentNode) {
            mini.style.opacity = '0';
            // Анимация ухода в зависимости от позиции
            if (position === 'bottom') {
                mini.style.transform = 'translateX(-50%) translateY(100%)';
            } else if (position === 'top') {
                mini.style.transform = 'translateX(-50%) translateY(-100%)';
            } else if (position === 'left') {
                mini.style.transform = 'translateY(-50%) translateX(-100%)';
            } else {
                mini.style.transform = 'translateY(-50%) translateX(100%)';
            }
            setTimeout(() => mini.remove(), 300);
        }
    }, 3000);
}

function startPeriodicReminder() {
    if (!settings.periodicEnabled) return;
    stopPeriodicReminder();
    periodicShownCount = 0;

    const intervalMs = settings.periodicInterval * 1000;

    periodicTimerId = setInterval(() => {
        if (isMeetingActive() && !isUserAlone()) {
            showPeriodicReminder();
        }
    }, intervalMs);
}

function stopPeriodicReminder() {
    if (periodicTimerId) {
        clearInterval(periodicTimerId);
        periodicTimerId = null;
    }
}

function restartPeriodicReminder() {
    stopPeriodicReminder();
    if (settings.periodicEnabled && isMeetingActive() && !isUserAlone()) {
        startPeriodicReminder();
    }
}

function removeToast(suppress) {
    const el = document.getElementById('ytirok-toast');
    if (el) {
        el.style.transform = 'translateX(120%)';
        el.style.transition = 'transform 0.3s ease-in';
        setTimeout(() => el.remove(), 300);
    }
    if (suppress) {
        sessionStorage.setItem('ytirok_suppressed', 'true');
        stopPeriodicReminder();
    }
}

// === ДЕТЕКЦИЯ ===
function isMeetingActive() {
    if (!window.location.href.includes('/j/')) return false;
    const btnByTitle = document.querySelector('button[title="Выйти из встречи"]');
    const btnByClass = document.querySelector('button[class*="endCallButton"]');
    return !!(btnByTitle || btnByClass);
}

function isUserAlone() {
    return document.body.innerText.includes("Чтобы пригласить других участников");
}

// === ГЛАВНЫЙ ЦИКЛ ===
function startMainLoop() {
    setInterval(() => {
        if (sessionStorage.getItem('ytirok_suppressed') === 'true') return;

        const meetingActive = isMeetingActive();
        const alone = isUserAlone();

        if (!meetingActive) {
            aloneTimerStarted = false;
            battleTimerStarted = false;
            stopPeriodicReminder();
            return;
        }

        if (alone) {
            battleTimerStarted = false;
            stopPeriodicReminder();

            if (!aloneGreetingShown && !aloneTimerStarted && !battleReminderShown) {
                aloneTimerStarted = true;

                setTimeout(() => {
                    if (isMeetingActive() && isUserAlone() && !aloneGreetingShown && !battleReminderShown) {
                        showWaitingGreeting();
                    }
                }, settings.aloneDelay * 1000);
            }
            return;
        }

        const existingToast = document.getElementById('ytirok-toast');
        if (existingToast?.classList.contains('ytirok-neutral')) {
            removeToast(false);
        }

        if (!battleTimerStarted) {
            battleTimerStarted = true;

            setTimeout(() => {
                if (isMeetingActive() && !isUserAlone() && sessionStorage.getItem('ytirok_suppressed') !== 'true') {
                    showBattleReminder();
                }
            }, settings.battleDelay * 1000);
        }
    }, 1000);
}
