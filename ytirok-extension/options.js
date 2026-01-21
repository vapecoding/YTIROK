// Элементы
const fields = {
    aloneDelay: document.getElementById('aloneDelay'),
    battleDelay: document.getElementById('battleDelay'),
    doubleCheckEnabled: document.getElementById('doubleCheckEnabled'),
    doubleCheckDelay: document.getElementById('doubleCheckDelay'),
    periodicEnabled: document.getElementById('periodicEnabled'),
    periodicInterval: document.getElementById('periodicInterval'),
    periodicCount: document.getElementById('periodicCount')
};

const doubleCheckDelayField = document.getElementById('doubleCheckDelayField');
const periodicIntervalField = document.getElementById('periodicIntervalField');
const periodicCountField = document.getElementById('periodicCountField');
const statusEl = document.getElementById('status');

// Загрузка настроек
chrome.storage.sync.get(DEFAULTS, (data) => {
    fields.aloneDelay.value = data.aloneDelay;
    fields.battleDelay.value = data.battleDelay;
    fields.doubleCheckEnabled.checked = data.doubleCheckEnabled;
    fields.doubleCheckDelay.value = data.doubleCheckDelay;
    fields.periodicEnabled.checked = data.periodicEnabled;
    fields.periodicInterval.value = data.periodicInterval;
    fields.periodicCount.value = data.periodicCount;
    updateDoubleCheckFieldState();
    updatePeriodicFieldState();
});

// Сохранение при изменении
function save() {
    const data = {
        aloneDelay: parseInt(fields.aloneDelay.value) || DEFAULTS.aloneDelay,
        battleDelay: parseInt(fields.battleDelay.value) || DEFAULTS.battleDelay,
        doubleCheckEnabled: fields.doubleCheckEnabled.checked,
        doubleCheckDelay: parseInt(fields.doubleCheckDelay.value) || DEFAULTS.doubleCheckDelay,
        periodicEnabled: fields.periodicEnabled.checked,
        periodicInterval: parseInt(fields.periodicInterval.value) || DEFAULTS.periodicInterval,
        periodicCount: parseInt(fields.periodicCount.value) || DEFAULTS.periodicCount
    };

    chrome.storage.sync.set(data, () => {
        statusEl.textContent = 'Сохранено!';
        setTimeout(() => statusEl.textContent = '', 1500);
    });
}

// Состояние поля контрольной проверки
function updateDoubleCheckFieldState() {
    if (fields.doubleCheckEnabled.checked) {
        doubleCheckDelayField.classList.remove('disabled');
    } else {
        doubleCheckDelayField.classList.add('disabled');
    }
}

// Состояние полей периодического напоминания
function updatePeriodicFieldState() {
    if (fields.periodicEnabled.checked) {
        periodicIntervalField.classList.remove('disabled');
        periodicCountField.classList.remove('disabled');
    } else {
        periodicIntervalField.classList.add('disabled');
        periodicCountField.classList.add('disabled');
    }
}

// Обработчики
Object.values(fields).forEach(field => {
    field.addEventListener('change', save);
    if (field.type === 'number') {
        field.addEventListener('input', save);
    }
});

fields.doubleCheckEnabled.addEventListener('change', updateDoubleCheckFieldState);
fields.periodicEnabled.addEventListener('change', updatePeriodicFieldState);
