// === ASSETS ===
const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="130" height="32" viewBox="0 0 130 32" fill="none">
  <text x="0" y="24" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="26" fill="#2c3e50" letter-spacing="-1">YTR   K</text>
  
  <g transform="translate(58, 15)">
    <circle cx="0" cy="0" r="8" fill="#e74c3c" opacity="0.4">
      <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="0" cy="0" r="6" fill="#e74c3c"/>
  </g>
</svg>
`;

// === КОНФИГУРАЦИЯ ===
const DEFAULTS = {
    aloneDelay: 10,
    battleDelay: 20,
    doubleCheckEnabled: true,
    doubleCheckDelay: 30,
    periodicEnabled: false,
    periodicInterval: 300,
    periodicCount: 3
};

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
console.log('🚀 YTRok: Script loaded, loading settings...');
chrome.storage.sync.get(DEFAULTS, (data) => {
    console.log('⚙️ YTRok: Settings loaded:', data);
    settings = data;
    startMainLoop();
    console.log('✅ YTRok: Main loop started');
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
        <div class="ytrok-header">
            <div class="ytrok-logo" title="Yandex Telemost Record OK">${LOGO_SVG}</div>
        </div>
        <p class="ytrok-text">${text}</p>
        <div class="ytrok-buttons">${buttonsHtml}</div>
    `;
}

function showWaitingGreeting() {
    if (document.getElementById('ytrok-toast')) return;

    const container = document.createElement('div');
    container.id = 'ytrok-toast';
    container.className = 'ytrok-neutral';
    container.innerHTML = createToastHTML(
        random(WAITING_TEXTS),
        `<button class="ytrok-btn ytrok-btn-neutral">${random(WAITING_BUTTONS)}</button>`
    );

    // Добавляем кнопку refresh в хедер
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'ytrok-refresh';
    refreshBtn.innerHTML = '↻';
    refreshBtn.onclick = () => {
        container.querySelector('.ytrok-text').textContent = random(WAITING_TEXTS);
        container.querySelector('.ytrok-btn-neutral').textContent = random(WAITING_BUTTONS);
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => refreshBtn.style.transform = '', 300);
    };
    container.querySelector('.ytrok-header').insertBefore(
        refreshBtn,
        container.querySelector('.ytrok-close')
    );

    document.body.appendChild(container);

    container.querySelector('.ytrok-btn-neutral').onclick = () => removeToast(false);

    aloneGreetingShown = true;
}

function showBattleReminder() {
    if (document.getElementById('ytrok-toast')) return;

    battleReminderShown = true;

    const container = document.createElement('div');
    container.id = 'ytrok-toast';
    container.innerHTML = createToastHTML(
        "Коллеги часто забывают про запись. Включим?",
        `<button class="ytrok-btn ytrok-btn-primary">Включаю</button>
         <button class="ytrok-btn ytrok-btn-secondary">Не нужна</button>`
    );

    document.body.appendChild(container);

    container.querySelector('.ytrok-btn-secondary').onclick = () => removeToast(true);
    container.querySelector('.ytrok-btn-primary').onclick = () => {
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
    if (document.getElementById('ytrok-toast')) return;

    const container = document.createElement('div');
    container.id = 'ytrok-toast';
    container.className = 'ytrok-warning';
    container.innerHTML = createToastHTML(
        `Прошло ${settings.doubleCheckDelay} секунд. Индикатор записи точно горит?`,
        `<button class="ytrok-btn ytrok-btn-warning-primary">Да, всё работает</button>
         <button class="ytrok-btn ytrok-btn-warning-secondary">Ой, точно, спасибо</button>`
    );

    document.body.appendChild(container);

    container.querySelectorAll('.ytrok-btn').forEach(btn => {
        btn.onclick = () => {
            removeToast(false);
            startPeriodicReminder();
        };
    });
}

const MINI_POSITIONS = ['bottom', 'top', 'left', 'right'];

function showPeriodicReminder() {
    console.log('🔄 YTRok: showPeriodicReminder called');
    console.log(`   - toast exists: ${!!document.getElementById('ytrok-toast')}`);
    console.log(`   - mini exists: ${!!document.getElementById('ytrok-mini')}`);
    console.log(`   - meeting active: ${isMeetingActive()}`);
    console.log(`   - alone: ${isUserAlone()}`);

    if (document.getElementById('ytrok-toast')) return;
    if (document.getElementById('ytrok-mini')) return;
    if (!isMeetingActive() || isUserAlone()) return;

    console.log('✅ YTRok: Showing periodic mini reminder!');

    periodicShownCount++;
    console.log(`   - shown count: ${periodicShownCount}/${settings.periodicCount}`);

    if (periodicShownCount >= settings.periodicCount) {
        console.log('   - max count reached, stopping periodic');
        stopPeriodicReminder();
    }

    const position = random(MINI_POSITIONS);
    console.log(`   - position: ${position}`);

    const mini = document.createElement('div');
    mini.id = 'ytrok-mini';
    mini.className = `ytrok-pos-${position}`;
    mini.innerHTML = `
        <span>${random(PERIODIC_TEXTS)}</span>
        <button class="ytrok-mini-close">&times;</button>
    `;

    document.body.appendChild(mini);

    const closeBtn = mini.querySelector('.ytrok-mini-close');
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
    console.log(`🔄 YTRok: startPeriodicReminder called (enabled=${settings.periodicEnabled}, interval=${settings.periodicInterval}min)`);
    if (!settings.periodicEnabled) {
        console.log('   - periodic disabled, skipping');
        return;
    }
    stopPeriodicReminder();
    periodicShownCount = 0;

    // TODO: вернуть * 60 после тестов
    const intervalMs = settings.periodicInterval * 1000;
    console.log(`   - starting interval: ${intervalMs}ms (${settings.periodicInterval}sec - TEST MODE)`);

    periodicTimerId = setInterval(() => {
        console.log('🔄 YTRok: periodic interval fired');
        if (isMeetingActive() && !isUserAlone()) {
            showPeriodicReminder();
        } else {
            console.log(`   - skipped: meeting=${isMeetingActive()}, alone=${isUserAlone()}`);
        }
    }, intervalMs);

    console.log(`   - timer started with id: ${periodicTimerId}`);
}

function stopPeriodicReminder() {
    if (periodicTimerId) {
        console.log(`🛑 YTRok: stopping periodic timer (id=${periodicTimerId})`);
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
    const el = document.getElementById('ytrok-toast');
    if (el) {
        el.style.transform = 'translateX(120%)';
        el.style.transition = 'transform 0.3s ease-in';
        setTimeout(() => el.remove(), 300);
    }
    if (suppress) {
        sessionStorage.setItem('ytrok_suppressed', 'true');
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
let loopLogCounter = 0;
function startMainLoop() {
    setInterval(() => {
        if (sessionStorage.getItem('ytrok_suppressed') === 'true') return;

        const meetingActive = isMeetingActive();
        const alone = isUserAlone();

        // Логируем каждые 5 секунд
        if (loopLogCounter++ % 5 === 0) {
            console.log(`🔍 YTRok loop: meeting=${meetingActive}, alone=${alone}, aloneTimer=${aloneTimerStarted}, aloneGreeting=${aloneGreetingShown}, battleReminder=${battleReminderShown}`);
        }

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
                console.log(`⏱️ YTRok: Starting alone timer (${settings.aloneDelay}s)...`);

                setTimeout(() => {
                    console.log(`⏰ YTRok: Alone timer fired! meeting=${isMeetingActive()}, alone=${isUserAlone()}, greeting=${aloneGreetingShown}, battle=${battleReminderShown}`);
                    if (isMeetingActive() && isUserAlone() && !aloneGreetingShown && !battleReminderShown) {
                        showWaitingGreeting();
                    }
                }, settings.aloneDelay * 1000);
            }
            return;
        }

        const existingToast = document.getElementById('ytrok-toast');
        if (existingToast?.classList.contains('ytrok-neutral')) {
            removeToast(false);
        }

        if (!battleTimerStarted) {
            battleTimerStarted = true;

            setTimeout(() => {
                if (isMeetingActive() && !isUserAlone() && sessionStorage.getItem('ytrok_suppressed') !== 'true') {
                    showBattleReminder();
                }
            }, settings.battleDelay * 1000);
        }
    }, 1000);
}
