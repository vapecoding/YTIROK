// Элементы
const fields = {
    aloneDelay: document.getElementById('aloneDelay'),
    battleDelay: document.getElementById('battleDelay'),
    showAloneGreeting: document.getElementById('showAloneGreeting'),
    autoStartRecording: document.getElementById('autoStartRecording'),
    doubleCheckEnabled: document.getElementById('doubleCheckEnabled'),
    doubleCheckDelay: document.getElementById('doubleCheckDelay'),
    periodicEnabled: document.getElementById('periodicEnabled'),
    periodicInterval: document.getElementById('periodicInterval'),
    periodicCount: document.getElementById('periodicCount'),
    waitingRoomNotificationEnabled: document.getElementById('waitingRoomNotificationEnabled'),
    waitingRoomModeInfinite: document.getElementById('waitingRoomModeInfinite'),
    waitingRoomModeFinite: document.getElementById('waitingRoomModeFinite'),
    waitingRoomNotificationCount: document.getElementById('waitingRoomNotificationCount'),
    waitingRoomNotificationInterval: document.getElementById('waitingRoomNotificationInterval'),
    selectorMoreButton: document.getElementById('selectorMoreButton'),
    selectorRecordOption: document.getElementById('selectorRecordOption'),
    selectorEndCallButton: document.getElementById('selectorEndCallButton'),
    selectorExitMeetingButton: document.getElementById('selectorExitMeetingButton'),
    selectorWaitingRoomNotification: document.getElementById('selectorWaitingRoomNotification'),
    textAloneUser: document.getElementById('textAloneUser'),
    textWaitingRoom: document.getElementById('textWaitingRoom')
};

const doubleCheckDelayField = document.getElementById('doubleCheckDelayField');
const periodicIntervalField = document.getElementById('periodicIntervalField');
const periodicCountField = document.getElementById('periodicCountField');
const waitingRoomModeField = document.getElementById('waitingRoomModeField');
const waitingRoomCountField = document.getElementById('waitingRoomCountField');
const waitingRoomIntervalField = document.getElementById('waitingRoomIntervalField');
const statusEl = document.getElementById('status');

// Отображаем версию расширения
const manifest = chrome.runtime.getManifest();
document.getElementById('version').textContent = `v${manifest.version}`;

// Загрузка настроек
chrome.storage.sync.get(DEFAULTS, (data) => {
    fields.aloneDelay.value = data.aloneDelay;
    fields.battleDelay.value = data.battleDelay;
    fields.showAloneGreeting.checked = data.showAloneGreeting;
    fields.autoStartRecording.checked = data.autoStartRecording;
    fields.doubleCheckEnabled.checked = data.doubleCheckEnabled;
    fields.doubleCheckDelay.value = data.doubleCheckDelay;
    fields.periodicEnabled.checked = data.periodicEnabled;
    fields.periodicInterval.value = data.periodicInterval;
    fields.periodicCount.value = data.periodicCount;
    fields.waitingRoomNotificationEnabled.checked = data.waitingRoomNotificationEnabled;
    if (data.waitingRoomNotificationMode === 'infinite') {
        fields.waitingRoomModeInfinite.checked = true;
    } else {
        fields.waitingRoomModeFinite.checked = true;
    }
    fields.waitingRoomNotificationCount.value = data.waitingRoomNotificationCount;
    fields.waitingRoomNotificationInterval.value = data.waitingRoomNotificationInterval;
    fields.selectorMoreButton.value = data.selectorMoreButton;
    fields.selectorRecordOption.value = data.selectorRecordOption;
    fields.selectorEndCallButton.value = data.selectorEndCallButton;
    fields.selectorExitMeetingButton.value = data.selectorExitMeetingButton;
    fields.selectorWaitingRoomNotification.value = data.selectorWaitingRoomNotification;
    fields.textAloneUser.value = data.textAloneUser;
    fields.textWaitingRoom.value = data.textWaitingRoom;
    updateDoubleCheckFieldState();
    updatePeriodicFieldState();
    updateWaitingRoomFieldState();
});

// Сохранение при изменении
function save() {
    const data = {
        aloneDelay: parseInt(fields.aloneDelay.value) || DEFAULTS.aloneDelay,
        battleDelay: parseInt(fields.battleDelay.value) || DEFAULTS.battleDelay,
        showAloneGreeting: fields.showAloneGreeting.checked,
        autoStartRecording: fields.autoStartRecording.checked,
        doubleCheckEnabled: fields.doubleCheckEnabled.checked,
        doubleCheckDelay: parseInt(fields.doubleCheckDelay.value) || DEFAULTS.doubleCheckDelay,
        periodicEnabled: fields.periodicEnabled.checked,
        periodicInterval: parseInt(fields.periodicInterval.value) || DEFAULTS.periodicInterval,
        periodicCount: parseInt(fields.periodicCount.value) || DEFAULTS.periodicCount,
        waitingRoomNotificationEnabled: fields.waitingRoomNotificationEnabled.checked,
        waitingRoomNotificationMode: fields.waitingRoomModeInfinite.checked ? 'infinite' : 'finite',
        waitingRoomNotificationCount: parseInt(fields.waitingRoomNotificationCount.value) || DEFAULTS.waitingRoomNotificationCount,
        waitingRoomNotificationInterval: parseInt(fields.waitingRoomNotificationInterval.value) || DEFAULTS.waitingRoomNotificationInterval,
        selectorMoreButton: fields.selectorMoreButton.value || DEFAULTS.selectorMoreButton,
        selectorRecordOption: fields.selectorRecordOption.value || DEFAULTS.selectorRecordOption,
        selectorEndCallButton: fields.selectorEndCallButton.value || DEFAULTS.selectorEndCallButton,
        selectorExitMeetingButton: fields.selectorExitMeetingButton.value || DEFAULTS.selectorExitMeetingButton,
        selectorWaitingRoomNotification: fields.selectorWaitingRoomNotification.value || DEFAULTS.selectorWaitingRoomNotification,
        textAloneUser: fields.textAloneUser.value || DEFAULTS.textAloneUser,
        textWaitingRoom: fields.textWaitingRoom.value || DEFAULTS.textWaitingRoom
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

// Состояние полей уведомлений о комнате ожидания
function updateWaitingRoomFieldState() {
    if (fields.waitingRoomNotificationEnabled.checked) {
        waitingRoomModeField.classList.remove('disabled');
        waitingRoomIntervalField.classList.remove('disabled');
        updateWaitingRoomCountFieldState();
    } else {
        waitingRoomModeField.classList.add('disabled');
        waitingRoomCountField.classList.add('disabled');
        waitingRoomIntervalField.classList.add('disabled');
    }
}

// Состояние поля количества повторений (только для конечного режима)
function updateWaitingRoomCountFieldState() {
    if (fields.waitingRoomNotificationEnabled.checked && fields.waitingRoomModeFinite.checked) {
        waitingRoomCountField.classList.remove('disabled');
    } else {
        waitingRoomCountField.classList.add('disabled');
    }
}

// Обработчики
Object.values(fields).forEach(field => {
    field.addEventListener('change', save);
    if (field.type === 'number') {
        field.addEventListener('input', save);
    }
    if (field.type === 'text') {
        field.addEventListener('input', save);
    }
});

fields.doubleCheckEnabled.addEventListener('change', updateDoubleCheckFieldState);
fields.periodicEnabled.addEventListener('change', updatePeriodicFieldState);
fields.waitingRoomNotificationEnabled.addEventListener('change', updateWaitingRoomFieldState);
fields.waitingRoomModeInfinite.addEventListener('change', updateWaitingRoomCountFieldState);
fields.waitingRoomModeFinite.addEventListener('change', updateWaitingRoomCountFieldState);

// Кнопка сброса расширенных настроек
document.getElementById('resetAdvanced').addEventListener('click', () => {
    fields.selectorMoreButton.value = DEFAULTS.selectorMoreButton;
    fields.selectorRecordOption.value = DEFAULTS.selectorRecordOption;
    fields.selectorEndCallButton.value = DEFAULTS.selectorEndCallButton;
    fields.selectorExitMeetingButton.value = DEFAULTS.selectorExitMeetingButton;
    fields.selectorWaitingRoomNotification.value = DEFAULTS.selectorWaitingRoomNotification;
    fields.textAloneUser.value = DEFAULTS.textAloneUser;
    fields.textWaitingRoom.value = DEFAULTS.textWaitingRoom;
    save();
});

// Кнопка полного сброса всех настроек
const resetConfirmEl = document.getElementById('resetConfirm');
const resetAllBtn = document.getElementById('resetAll');
const resetConfirmYesBtn = document.getElementById('resetConfirmYes');
const resetConfirmNoBtn = document.getElementById('resetConfirmNo');

resetAllBtn.addEventListener('click', () => {
    // Показываем блок подтверждения
    resetConfirmEl.style.display = 'block';
    resetAllBtn.style.display = 'none';
});

resetConfirmNoBtn.addEventListener('click', () => {
    // Скрываем блок подтверждения
    resetConfirmEl.style.display = 'none';
    resetAllBtn.style.display = 'block';
});

resetConfirmYesBtn.addEventListener('click', () => {
    // Выполняем сброс
    chrome.storage.sync.set(DEFAULTS, () => {
        // Перезагружаем значения в UI
        chrome.storage.sync.get(DEFAULTS, (data) => {
            fields.aloneDelay.value = data.aloneDelay;
            fields.battleDelay.value = data.battleDelay;
            fields.showAloneGreeting.checked = data.showAloneGreeting;
            fields.autoStartRecording.checked = data.autoStartRecording;
            fields.doubleCheckEnabled.checked = data.doubleCheckEnabled;
            fields.doubleCheckDelay.value = data.doubleCheckDelay;
            fields.periodicEnabled.checked = data.periodicEnabled;
            fields.periodicInterval.value = data.periodicInterval;
            fields.periodicCount.value = data.periodicCount;
            fields.waitingRoomNotificationEnabled.checked = data.waitingRoomNotificationEnabled;
            if (data.waitingRoomNotificationMode === 'infinite') {
                fields.waitingRoomModeInfinite.checked = true;
            } else {
                fields.waitingRoomModeFinite.checked = true;
            }
            fields.waitingRoomNotificationCount.value = data.waitingRoomNotificationCount;
            fields.waitingRoomNotificationInterval.value = data.waitingRoomNotificationInterval;
            fields.selectorMoreButton.value = data.selectorMoreButton;
            fields.selectorRecordOption.value = data.selectorRecordOption;
            fields.selectorEndCallButton.value = data.selectorEndCallButton;
            fields.selectorExitMeetingButton.value = data.selectorExitMeetingButton;
            fields.selectorWaitingRoomNotification.value = data.selectorWaitingRoomNotification;
            fields.textAloneUser.value = data.textAloneUser;
            fields.textWaitingRoom.value = data.textWaitingRoom;
            updateDoubleCheckFieldState();
            updatePeriodicFieldState();
            updateWaitingRoomFieldState();

            // Скрываем блок подтверждения, показываем кнопку, показываем статус
            resetConfirmEl.style.display = 'none';
            resetAllBtn.style.display = 'block';
            statusEl.textContent = 'Все настройки сброшены!';
            setTimeout(() => statusEl.textContent = '', 2000);
        });
    });
});
