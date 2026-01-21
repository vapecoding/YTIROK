const DEFAULTS = {
    aloneDelay: 10,
    battleDelay: 20,
    showAloneGreeting: true,
    doubleCheckEnabled: true,
    doubleCheckDelay: 30,
    periodicEnabled: false,
    periodicInterval: 300,
    periodicCount: 3,
    waitingRoomNotificationEnabled: true,
    waitingRoomNotificationMode: 'infinite',
    waitingRoomNotificationCount: 5,
    waitingRoomNotificationInterval: 15,
    autoStartRecording: true,
    // Расширенные настройки - селекторы
    selectorMoreButton: 'button[title="Ещё"]',
    selectorRecordOption: '[title="Записать на Яндекс Диск"]',
    selectorEndCallButton: 'button[class*="endCallButton"]',
    selectorExitMeetingButton: 'button[title="Выйти из встречи"]',
    selectorWaitingRoomNotification: '.waitingRoomNotification_XcdCf, [class*="waitingRoomNotification"]',
    textAloneUser: 'Чтобы пригласить других участников',
    textWaitingRoom: 'в комнате ожидания'
};
