// === МИГРАЦИЯ ДАННЫХ ===
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        // Миграция со старой версии
        chrome.storage.sync.get(null, (data) => {
            const updates = {};

            // Миграция textWaitingRoom: 'Гость в комнате ожидания' → 'в комнате ожидания'
            if (data.textWaitingRoom === 'Гость в комнате ожидания') {
                updates.textWaitingRoom = 'в комнате ожидания';
            }

            // Если есть обновления, применяем их
            if (Object.keys(updates).length > 0) {
                chrome.storage.sync.set(updates, () => {
                    console.log('[YTIROK] Миграция завершена:', updates);
                });
            }
        });
    }
});
