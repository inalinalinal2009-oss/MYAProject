
// ==================== КОНФИГУРАЦИЯ ====================
let currentSection = 'medicines';
let medicines = [];
let nextReminderInterval = null;
let telegramCareInterval = null;
let telegramCareCheckInFlight = false;
let pharmacyMapInstance = null;
let pharmacySearchControl = null;
let pharmacyResultsCollection = null;
let pharmacyUserPlacemark = null;
let pharmacySearchResults = [];
let pharmacyUserCoords = null;
let emergencyAlertCooldownTimer = null;
let accessibilityModeEnabled = false;
const ACCESSIBILITY_MODE_STORAGE_KEY = 'smartAptechkaAccessibilityMode';
const TELEGRAM_CARE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const TELEGRAM_CARE_THRESHOLDS_HOURS = [24, 48, 72];
const TELEGRAM_EMERGENCY_COOLDOWN_MS = 2 * 60 * 1000;
const TELEGRAM_EMERGENCY_LOCATION_TIMEOUT_MS = 8000;
const RED_ZONE_STREAK_THRESHOLD = 2;
const RED_ZONE_TELEGRAM_COOLDOWN_MS = 3 * 60 * 60 * 1000;
const RESTOCK_WARNING_DAYS = 3;
const DEFAULT_FAMILY_PROFILE_ID = 'self';
const DEFAULT_INTAKE_PLANNER_MODE = 'evenly';
const AUTO_RESTOCK_DEFAULT_TARGET_DAYS = 7;
const AUTO_RESTOCK_MIN_TARGET_DAYS = 1;
const AUTO_RESTOCK_MAX_TARGET_DAYS = 30;
const AUTO_BACKUP_STORAGE_KEY = 'smartAptechkaAutoBackups';
const AUTO_BACKUP_INTERVAL_MS = 10 * 60 * 1000;
const SYNC_CODE_PREFIX = 'SAPT2:';
const PDFMAKE_LIBRARY_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js';
const PDFMAKE_FONTS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.min.js';
const LOGIN_STREAK_REWARD_TABLE = [10, 14, 18, 22, 28, 34, 45];
const MAX_NARRATION_CHARS = 3800;
const INTAKE_PLANNER_MODE_OPTIONS = [
    { id: 'evenly', label: 'Равномерно в течение суток' },
    { id: 'daytime', label: 'Дневной режим (без ночных доз)' },
    { id: 'morning_evening', label: 'Утро/вечер (мягкий режим)' }
];
const CUSTOMIZATION_CATALOG = [
    {
        id: 'avatar_halo',
        name: 'Золотой ореол',
        description: 'Роскошная золотая рамка вокруг аватара.',
        cost: 90,
        className: 'customization-avatar-halo'
    },
    {
        id: 'cards_glow',
        name: 'Неоновые карточки',
        description: 'Карточки и блоки получают мягкое неоновое свечение.',
        cost: 130,
        className: 'customization-cards-glow'
    },
    {
        id: 'buttons_gold',
        name: 'Золотые кнопки',
        description: 'Кнопки становятся более выразительными и премиальными.',
        cost: 110,
        className: 'customization-buttons-gold'
    }
];
const ACHIEVEMENT_CATALOG = [
    {
        id: 'first_medicine',
        name: 'Первый шаг',
        icon: 'fa-kit-medical',
        isUnlocked: (ctx) => ctx.medicineCount >= 1,
        describe: (ctx) => `Добавлено лекарств: ${ctx.medicineCount}/1.`
    },
    {
        id: 'collector_5',
        name: 'Коллекционер',
        icon: 'fa-pills',
        isUnlocked: (ctx) => ctx.medicineCount >= 5,
        describe: (ctx) => `Собрано препаратов: ${ctx.medicineCount}/5.`
    },
    {
        id: 'collector_12',
        name: 'Аптечный менеджер',
        icon: 'fa-capsules',
        isUnlocked: (ctx) => ctx.medicineCount >= 12,
        describe: (ctx) => `Расширьте аптечку: ${ctx.medicineCount}/12.`
    },
    {
        id: 'active_courses_3',
        name: 'В ритме лечения',
        icon: 'fa-heart-pulse',
        isUnlocked: (ctx) => ctx.activeCoursesCount >= 3,
        describe: (ctx) => `Активные курсы: ${ctx.activeCoursesCount}/3.`
    },
    {
        id: 'active_courses_6',
        name: 'Командный режим',
        icon: 'fa-people-group',
        isUnlocked: (ctx) => ctx.activeCoursesCount >= 6,
        describe: (ctx) => `Масштаб лечения: ${ctx.activeCoursesCount}/6 курсов.`
    },
    {
        id: 'taken_10',
        name: 'Ответственный старт',
        icon: 'fa-check-circle',
        isUnlocked: (ctx) => ctx.takenDoses >= 10,
        describe: (ctx) => `Подтверждено приёмов: ${ctx.takenDoses}/10.`
    },
    {
        id: 'taken_75',
        name: 'Стальная дисциплина',
        icon: 'fa-shield-heart',
        isUnlocked: (ctx) => ctx.takenDoses >= 75,
        describe: (ctx) => `Подтверждено приёмов: ${ctx.takenDoses}/75.`
    },
    {
        id: 'taken_150',
        name: 'Легенда приверженности',
        icon: 'fa-medal',
        isUnlocked: (ctx) => ctx.takenDoses >= 150,
        describe: (ctx) => `Подтверждено приёмов: ${ctx.takenDoses}/150.`
    },
    {
        id: 'adherence_90',
        name: 'Точный курс',
        icon: 'fa-award',
        isUnlocked: (ctx) => ctx.totalDoses >= 10 && ctx.adherenceRate >= 90,
        describe: (ctx) => `Приверженность: ${ctx.adherenceRate}% (цель 90%).`
    },
    {
        id: 'adherence_100',
        name: 'Идеальный график',
        icon: 'fa-crown',
        isUnlocked: (ctx) => ctx.totalDoses >= 12 && ctx.adherenceRate >= 100,
        describe: (ctx) => `Без пропусков: ${ctx.adherenceRate}% при ${ctx.totalDoses} дозах.`
    },
    {
        id: 'streak_3',
        name: 'Стрик на месте',
        icon: 'fa-fire',
        isUnlocked: (ctx) => ctx.loginStreak >= 3,
        describe: (ctx) => `Текущий стрик входа: ${ctx.loginStreak}/3 дней.`
    },
    {
        id: 'streak_7',
        name: 'Нерушимый',
        icon: 'fa-bolt',
        isUnlocked: (ctx) => ctx.bestLoginStreak >= 7,
        describe: (ctx) => `Лучший стрик: ${ctx.bestLoginStreak}/7 дней.`
    },
    {
        id: 'coins_100',
        name: 'Копилка 100',
        icon: 'fa-coins',
        isUnlocked: (ctx) => ctx.coins >= 100,
        describe: (ctx) => `Баланс монет: ${ctx.coins}/100.`
    },
    {
        id: 'coins_300',
        name: 'Инвестор здоровья',
        icon: 'fa-piggy-bank',
        isUnlocked: (ctx) => ctx.coins >= 300,
        describe: (ctx) => `Баланс монет: ${ctx.coins}/300.`
    },
    {
        id: 'style_first',
        name: 'Первая кастомизация',
        icon: 'fa-palette',
        isUnlocked: (ctx) => ctx.unlockedCustomizationCount >= 1,
        describe: (ctx) => `Открыто стилей: ${ctx.unlockedCustomizationCount}/1.`
    },
    {
        id: 'style_full',
        name: 'Бутик стилей',
        icon: 'fa-wand-magic-sparkles',
        isUnlocked: (ctx) => ctx.unlockedCustomizationCount >= 3,
        describe: (ctx) => `Открыто стилей: ${ctx.unlockedCustomizationCount}/3.`
    },
    {
        id: 'family_2',
        name: 'Семейный режим',
        icon: 'fa-user-group',
        isUnlocked: (ctx) => ctx.familyProfilesCount >= 2,
        describe: (ctx) => `Профилей в семье: ${ctx.familyProfilesCount}/2.`
    },
    {
        id: 'family_4',
        name: 'Координатор семьи',
        icon: 'fa-people-roof',
        isUnlocked: (ctx) => ctx.familyProfilesCount >= 4,
        describe: (ctx) => `Профилей в семье: ${ctx.familyProfilesCount}/4.`
    },
    {
        id: 'stock_tracked_5',
        name: 'Контроль запасов',
        icon: 'fa-boxes-stacked',
        isUnlocked: (ctx) => ctx.stockTrackedCount >= 5,
        describe: (ctx) => `Лекарств с учетом остатков: ${ctx.stockTrackedCount}/5.`
    },
    {
        id: 'safety_loaded_5',
        name: 'Проверено на безопасность',
        icon: 'fa-shield-virus',
        isUnlocked: (ctx) => ctx.contraReadyCount >= 5,
        describe: (ctx) => `Карточек с противопоказаниями: ${ctx.contraReadyCount}/5.`
    },
    {
        id: 'care_channel',
        name: 'Связь с близкими',
        icon: 'fa-paper-plane',
        isUnlocked: (ctx) => ctx.telegramConfigured,
        describe: () => 'Telegram-канал заботы подключен и готов к тревожным уведомлениям.'
    },
    {
        id: 'backup_ready',
        name: 'Страховка данных',
        icon: 'fa-cloud-arrow-up',
        isUnlocked: (ctx) => ctx.hasAutoBackup,
        describe: () => 'Автоматический бэкап создан. История лечения защищена.'
    },
    {
        id: 'week_routine',
        name: 'Неделя без суеты',
        icon: 'fa-calendar-check',
        isUnlocked: (ctx) => ctx.uniqueTakenDays >= 7,
        describe: (ctx) => `Дней с подтвержденными приёмами: ${ctx.uniqueTakenDays}/7.`
    }
];
const externalScriptLoaders = {};
let voiceRecognitionSession = null;
let voiceSearchActive = false;
let screenNarrationActive = false;
let srAnnounceTimer = null;
let keyboardAccessibilityBound = false;
let redZoneEscalationInFlight = false;
let achievementUnlockCheckInFlight = false;
const achievementToastShownAtById = new Map();
const ACHIEVEMENT_TOAST_COOLDOWN_MS = 6000;
const telegramRuntimeTokensByEmail = new Map();

// ==================== УТИЛИТЫ ====================
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttribute(text) {
    return escapeHtml(String(text ?? ''));
}

function shouldUseMotionAnimations() {
    if (accessibilityModeEnabled) return false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }
    return true;
}

function animateSectionEntrance(sectionName) {
    if (!window.gsap || !shouldUseMotionAnimations()) return;

    const content = document.getElementById('content');
    if (!content) return;

    const sectionSpecificSelectors = {
        medicines: '.dashboard-hero, .dashboard-highlight, .medicine-card, .empty-state',
        profile: '.user-header, .stat-card, .gamification-panel, .achievement, .customization-card, .health-progress, .family-profile-chip',
        search: '.section-intro, .content-card, .card, .result-item',
        add: '.section-intro, .content-card, .form-control, .form-select, .btn',
        map: '.section-intro, .pharmacy-map-toolbar, #pharmacyMap, .pharmacy-result-card',
        ocr: '.section-intro, .ocr-container, .upload-area-ocr, .ocr-result'
    };

    const fallbackSelector = '.section-intro, .content-card, .card, .btn, .medicine-card, .stat-card';
    const selector = sectionSpecificSelectors[sectionName] || fallbackSelector;
    const elements = Array.from(content.querySelectorAll(selector)).filter(element => {
        if (!element || !(element instanceof HTMLElement)) return false;
        if (element.closest('.achievement-toast-container')) return false;
        return element.offsetParent !== null;
    }).slice(0, 30);

    if (elements.length === 0) return;

    window.gsap.fromTo(
        elements,
        { y: 16, autoAlpha: 0, scale: 0.985 },
        {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.52,
            ease: 'power3.out',
            stagger: 0.035,
            clearProps: 'transform,opacity,visibility'
        }
    );
}

function announceForScreenReader(message, mode = 'polite') {
    const region = document.getElementById('srAnnouncements');
    if (!region) return;

    const normalized = String(message || '').trim();
    if (!normalized) return;

    region.setAttribute('aria-live', mode === 'assertive' ? 'assertive' : 'polite');
    region.textContent = '';
    if (srAnnounceTimer) {
        clearTimeout(srAnnounceTimer);
    }
    srAnnounceTimer = setTimeout(() => {
        region.textContent = normalized;
    }, 25);
}

function getReadableTextFromElement(element) {
    if (!element) return '';

    const selectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'li', 'label', '.alert', '.medicine-instruction', '.medicine-contraindications'
    ];
    const textChunks = [];

    element.querySelectorAll(selectors.join(',')).forEach(node => {
        const chunk = String(node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!chunk) return;
        if (textChunks[textChunks.length - 1] !== chunk) {
            textChunks.push(chunk);
        }
    });

    return textChunks.join('. ').slice(0, MAX_NARRATION_CHARS);
}

function stopSpeechNarration() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    screenNarrationActive = false;
    announceForScreenReader('Озвучка остановлена');
}

function speakCurrentSection() {
    if (!('speechSynthesis' in window)) {
        showToast('Озвучка не поддерживается в этом браузере', 'warning');
        announceForScreenReader('Озвучка не поддерживается в этом браузере', 'assertive');
        return;
    }

    const content = document.getElementById('content');
    const readableText = getReadableTextFromElement(content);
    if (!readableText) {
        showToast('Нет текста для озвучки в текущем разделе', 'warning');
        announceForScreenReader('Нет текста для озвучки в текущем разделе');
        return;
    }

    stopSpeechNarration();
    const utterance = new SpeechSynthesisUtterance(readableText);
    utterance.lang = 'ru-RU';
    utterance.rate = accessibilityModeEnabled ? 0.92 : 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
        screenNarrationActive = true;
        announceForScreenReader('Запущена озвучка текущего раздела');
    };
    utterance.onend = () => {
        screenNarrationActive = false;
        announceForScreenReader('Озвучка завершена');
    };
    utterance.onerror = () => {
        screenNarrationActive = false;
        showToast('Не удалось выполнить озвучку', 'error');
        announceForScreenReader('Не удалось выполнить озвучку', 'assertive');
    };

    window.speechSynthesis.speak(utterance);
}

function updateVoiceSearchButtonState(isListening) {
    const button = document.getElementById('voiceSearchButton');
    if (!button) return;

    button.classList.toggle('btn-danger', isListening);
    button.classList.toggle('btn-outline-primary', !isListening);
    button.classList.toggle('voice-search-btn--listening', isListening);
    button.setAttribute('aria-pressed', isListening ? 'true' : 'false');
    button.innerHTML = isListening
        ? '<i class="fas fa-microphone-lines me-1"></i>Слушаю...'
        : '<i class="fas fa-microphone me-1"></i>Голос';
}

function normalizeVoiceSymptomsQuery(rawTranscript) {
    let text = String(rawTranscript || '')
        .toLowerCase()
        .replace(/[.!?]+/g, ',')
        .replace(/\s*(?:\/|;|\|)\s*/g, ',')
        .replace(/\s+(?:и|или|а также|также|плюс)\s+/g, ',')
        .replace(/\s{2,}/g, ' ')
        .trim();

    text = text
        .replace(/\b(?:найди|найти|поиск|ищи|покажи|лекарство|лекарства|симптом|симптомы|пожалуйста)\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s*,\s*/g, ',')
        .replace(/,+/g, ',')
        .replace(/^,|,$/g, '')
        .trim();

    return text;
}

function startVoiceSymptomsSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        showToast('Откройте раздел поиска по симптомам', 'warning');
        return;
    }

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
        showToast('Голосовой ввод не поддерживается в этом браузере', 'warning');
        announceForScreenReader('Голосовой ввод не поддерживается в этом браузере', 'assertive');
        return;
    }

    if (voiceSearchActive && voiceRecognitionSession) {
        voiceRecognitionSession.stop();
        return;
    }

    const recognition = new SpeechRecognitionApi();
    voiceRecognitionSession = recognition;
    voiceSearchActive = false;
    let finalTranscript = '';
    let recognitionFailed = false;
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => {
        voiceSearchActive = true;
        updateVoiceSearchButtonState(true);
        showToast('Голосовой ввод запущен. Говорите симптомы.', 'info');
        announceForScreenReader('Голосовой ввод запущен');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const chunk = `${event.results[index][0].transcript || ''}`.trim();
            if (!chunk) continue;
            if (event.results[index].isFinal) {
                finalTranscript += `${chunk} `;
            } else {
                interimTranscript += `${chunk} `;
            }
        }
        const combined = normalizeVoiceSymptomsQuery(`${finalTranscript} ${interimTranscript}`.trim());
        searchInput.value = combined;
    };

    recognition.onerror = (event) => {
        recognitionFailed = true;
        const errorMap = {
            'not-allowed': 'Нет доступа к микрофону. Разрешите доступ в браузере.',
            'service-not-allowed': 'Голосовой сервис недоступен в этом браузере.',
            'no-speech': 'Речь не распознана. Попробуйте говорить громче и чётче.',
            'audio-capture': 'Микрофон не найден или недоступен.'
        };
        const message = errorMap[event.error] || 'Ошибка голосового ввода';
        showToast(message, 'error');
        announceForScreenReader(message, 'assertive');
    };

    recognition.onend = () => {
        voiceSearchActive = false;
        updateVoiceSearchButtonState(false);
        announceForScreenReader('Голосовой ввод остановлен');
        if (recognitionFailed) {
            voiceRecognitionSession = null;
            return;
        }
        const finalQuery = normalizeVoiceSymptomsQuery(`${finalTranscript} ${searchInput.value}`.trim());
        if (finalQuery) {
            searchInput.value = finalQuery;
            performSymptomsSearch(finalQuery, 'searchResults');
            showToast(`Ищу по запросу: ${finalQuery}`, 'success');
        } else {
            showToast('Не удалось распознать симптомы. Попробуйте ещё раз.', 'warning');
        }
        voiceRecognitionSession = null;
    };

    try {
        recognition.start();
    } catch (error) {
        voiceSearchActive = false;
        updateVoiceSearchButtonState(false);
        showToast('Не удалось запустить голосовой ввод', 'error');
        console.error('Ошибка запуска голосового ввода:', error);
    }
}

function showToast(message, type = 'info') {
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icon} me-2"></i>
        <span>${message}</span>
    `;
    
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    announceForScreenReader(String(message).replace(/\s+/g, ' ').trim(), type === 'error' ? 'assertive' : 'polite');
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateAccessibilityToggleButtons() {
    document.querySelectorAll('[data-accessibility-toggle]').forEach(button => {
        const label = button.querySelector('.accessibility-toggle-label');
        const icon = button.querySelector('.accessibility-toggle-icon');
        const isEnabled = accessibilityModeEnabled;

        button.classList.toggle('btn-warning', isEnabled);
        button.classList.toggle('btn-outline-dark', !isEnabled);
        button.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');

        if (label) {
            label.textContent = isEnabled ? 'Обычный вид' : 'Режим слабовидящих';
        }

        if (icon) {
            icon.className = `fas accessibility-toggle-icon me-2 ${isEnabled ? 'fa-eye' : 'fa-universal-access'}`;
        }
    });
}

function applyAccessibilityMode(enabled) {
    accessibilityModeEnabled = Boolean(enabled);
    document.body.classList.toggle('accessibility-mode', accessibilityModeEnabled);
    updateAccessibilityToggleButtons();
}

function toggleAccessibilityMode() {
    const nextMode = !accessibilityModeEnabled;
    applyAccessibilityMode(nextMode);

    try {
        localStorage.setItem(ACCESSIBILITY_MODE_STORAGE_KEY, nextMode ? '1' : '0');
    } catch (error) {
        console.warn('Не удалось сохранить настройки режима слабовидящих:', error);
    }

    showToast(
        nextMode ? 'Режим слабовидящих включён' : 'Возврат к стандартному виду',
        nextMode ? 'warning' : 'info'
    );
}

function initAccessibilityMode() {
    let enabled = false;
    try {
        enabled = localStorage.getItem(ACCESSIBILITY_MODE_STORAGE_KEY) === '1';
    } catch (error) {
        console.warn('Не удалось прочитать настройки режима слабовидящих:', error);
    }

    applyAccessibilityMode(enabled);
}

function handleKeyboardActivation(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target?.closest?.('[onclick]');
    if (!target) return;
    if (target.matches('button, a, input, select, textarea')) return;

    event.preventDefault();
    target.click();
}

function initEnhancedAccessibility() {
    const skipTarget = document.getElementById('content');
    if (skipTarget && !skipTarget.hasAttribute('tabindex')) {
        skipTarget.setAttribute('tabindex', '-1');
    }

    document.querySelectorAll('[onclick]').forEach(element => {
        if (element.matches('button, a, input, select, textarea')) return;
        if (!element.hasAttribute('role')) {
            element.setAttribute('role', 'button');
        }
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
    });

    if (!keyboardAccessibilityBound) {
        document.addEventListener('keydown', handleKeyboardActivation);
        keyboardAccessibilityBound = true;
    }
}

function getFullCurrentUser() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;
    return getUserData(currentUser.email) || currentUser;
}

function generateEntityId(prefix = 'id') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeIntakePlannerMode(rawMode) {
    const mode = String(rawMode || '').trim().toLowerCase();
    const exists = INTAKE_PLANNER_MODE_OPTIONS.some(item => item.id === mode);
    return exists ? mode : DEFAULT_INTAKE_PLANNER_MODE;
}

function getIntakePlannerModeLabel(mode) {
    const safeMode = normalizeIntakePlannerMode(mode);
    return INTAKE_PLANNER_MODE_OPTIONS.find(item => item.id === safeMode)?.label
        || INTAKE_PLANNER_MODE_OPTIONS[0].label;
}

function buildIntakePlannerModeOptions(selectedMode) {
    const safeMode = normalizeIntakePlannerMode(selectedMode);
    return INTAKE_PLANNER_MODE_OPTIONS.map(option => `
        <option value="${escapeAttribute(option.id)}" ${safeMode === option.id ? 'selected' : ''}>${escapeHtml(option.label)}</option>
    `).join('');
}

function normalizeAutoRestockTargetDays(value) {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) return AUTO_RESTOCK_DEFAULT_TARGET_DAYS;
    return Math.max(AUTO_RESTOCK_MIN_TARGET_DAYS, Math.min(AUTO_RESTOCK_MAX_TARGET_DAYS, parsed));
}

function normalizePlannerSettings(rawValue) {
    const raw = rawValue && typeof rawValue === 'object' ? rawValue : {};
    return {
        defaultMode: normalizeIntakePlannerMode(raw.defaultMode),
        autoRestockEnabled: raw.autoRestockEnabled !== false,
        autoRestockTargetDays: normalizeAutoRestockTargetDays(raw.autoRestockTargetDays)
    };
}

function getPlannerSettings(userData) {
    return normalizePlannerSettings(userData?.settings?.planner || {});
}

function updatePlannerSettingsForCurrentUser(patch = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;

    const userData = getUserData(currentUser.email);
    if (!userData) return null;

    const currentSettings = getPlannerSettings(userData);
    const nextSettings = normalizePlannerSettings({
        ...currentSettings,
        ...patch
    });

    saveUserData(currentUser.email, {
        ...userData,
        settings: {
            ...(userData.settings || {}),
            planner: nextSettings
        }
    });

    return nextSettings;
}

function sanitizeFamilyProfileName(value, fallback = 'Профиль') {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return fallback;
    return normalized.slice(0, 32);
}

function sanitizeFamilyProfiles(rawProfiles, ownerName = '') {
    const sourceProfiles = Array.isArray(rawProfiles) ? rawProfiles : [];
    const selfRaw = sourceProfiles.find(profile => String(profile?.id || '') === DEFAULT_FAMILY_PROFILE_ID) || {};
    const selfName = sanitizeFamilyProfileName(selfRaw.name || ownerName || 'Я', 'Я');

    const profiles = [{
        id: DEFAULT_FAMILY_PROFILE_ID,
        name: selfName,
        relation: sanitizeFamilyProfileName(selfRaw.relation || 'Я', 'Я'),
        createdAt: typeof selfRaw.createdAt === 'string' && selfRaw.createdAt ? selfRaw.createdAt : new Date().toISOString()
    }];

    sourceProfiles.forEach(profile => {
        if (!profile || typeof profile !== 'object') return;

        const rawId = String(profile.id || '').trim();
        if (!rawId || rawId === DEFAULT_FAMILY_PROFILE_ID) return;
        if (profiles.some(item => item.id === rawId)) return;

        profiles.push({
            id: rawId,
            name: sanitizeFamilyProfileName(profile.name, 'Участник семьи'),
            relation: sanitizeFamilyProfileName(profile.relation, 'Семья'),
            createdAt: typeof profile.createdAt === 'string' && profile.createdAt ? profile.createdAt : new Date().toISOString()
        });
    });

    return profiles.slice(0, 8);
}

function getFamilyStorage(userData) {
    const ownerName = String(userData?.name || '').split(' ')[0] || 'Я';
    const rawFamily = userData?.family && typeof userData.family === 'object'
        ? userData.family
        : {};
    const profiles = sanitizeFamilyProfiles(rawFamily.profiles, ownerName);
    const rawMap = rawFamily.medicinesByProfile && typeof rawFamily.medicinesByProfile === 'object'
        ? rawFamily.medicinesByProfile
        : {};
    const medicinesByProfile = {};

    profiles.forEach(profile => {
        const profileMedicines = rawMap[profile.id];
        medicinesByProfile[profile.id] = Array.isArray(profileMedicines) ? profileMedicines : [];
    });

    const legacyMedicines = Array.isArray(userData?.medicines) ? userData.medicines : [];
    const hasAnyFamilyMedicines = Object.values(medicinesByProfile).some(items => items.length > 0);
    if (!hasAnyFamilyMedicines && legacyMedicines.length > 0) {
        medicinesByProfile[DEFAULT_FAMILY_PROFILE_ID] = legacyMedicines;
    }

    const activeProfileId = profiles.some(profile => profile.id === rawFamily.activeProfileId)
        ? rawFamily.activeProfileId
        : profiles[0].id;

    return {
        profiles,
        activeProfileId,
        medicinesByProfile
    };
}

function getActiveFamilyContext(userDataOverride = null) {
    const userData = userDataOverride || getFullCurrentUser();
    if (!userData?.email) {
        return { family: null, profile: null };
    }

    const family = getFamilyStorage(userData);
    const profile = family.profiles.find(item => item.id === family.activeProfileId) || family.profiles[0] || null;
    return { family, profile };
}

function persistFamilyStorageForCurrentUser(nextFamilyState) {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;

    const userData = getUserData(currentUser.email);
    if (!userData) return null;

    const normalizedFamily = getFamilyStorage({
        ...userData,
        family: nextFamilyState
    });
    const activeMedicines = normalizedFamily.medicinesByProfile[normalizedFamily.activeProfileId] || [];

    return saveUserData(currentUser.email, {
        ...userData,
        family: normalizedFamily,
        medicines: activeMedicines
    });
}

function switchFamilyProfile(profileId, options = {}) {
    const silent = Boolean(options.silent);
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const family = getFamilyStorage(userData);
    const target = family.profiles.find(profile => profile.id === profileId);
    if (!target) {
        showToast('Выбранный семейный профиль не найден.', 'warning');
        return;
    }

    if (family.activeProfileId === target.id && options.force !== true) return;

    family.activeProfileId = target.id;
    persistFamilyStorageForCurrentUser(family);
    loadMedicines();

    if (currentSection === 'profile') {
        showSection('profile');
    } else {
        showSection('medicines');
    }

    if (!silent) {
        showToast(`Активный профиль: ${target.name}`, 'success');
    }
}

function switchFamilyProfileFromProfile() {
    const select = document.getElementById('activeFamilyProfileSelect');
    if (!select) return;
    switchFamilyProfile(select.value);
}

function addFamilyMemberProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        return;
    }

    const nameInput = document.getElementById('familyMemberNameInput');
    const relationInput = document.getElementById('familyMemberRelationInput');
    const name = sanitizeFamilyProfileName(nameInput?.value, '');
    const relation = sanitizeFamilyProfileName(relationInput?.value, 'Семья');

    if (!name || name.length < 2) {
        showToast('Введите имя родственника (минимум 2 символа).', 'warning');
        nameInput?.focus();
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const family = getFamilyStorage(userData);
    if (family.profiles.length >= 8) {
        showToast('Достигнут лимит семейных профилей (8).', 'warning');
        return;
    }

    if (family.profiles.some(profile => profile.name.toLowerCase() === name.toLowerCase())) {
        showToast('Профиль с таким именем уже существует.', 'info');
        return;
    }

    const newProfileId = generateEntityId('family');
    family.profiles.push({
        id: newProfileId,
        name,
        relation,
        createdAt: new Date().toISOString()
    });
    family.medicinesByProfile[newProfileId] = [];
    family.activeProfileId = newProfileId;

    const persistedUserData = persistFamilyStorageForCurrentUser(family);
    const persistedFamily = getFamilyStorage(persistedUserData || {});
    const isProfileSaved = persistedFamily.profiles.some(profile => profile.id === newProfileId);
    if (!isProfileSaved) {
        showToast('Не удалось сохранить семейный профиль. Обновите страницу и попробуйте снова.', 'error');
        return;
    }

    medicines = [];
    saveMedicines();
    maybeUnlockAchievements({
        showPopup: true,
        refreshProfile: false
    });

    if (nameInput) nameInput.value = '';
    if (relationInput) relationInput.value = '';

    showToast(`Профиль «${name}» добавлен.`, 'success');
    showSection('profile');
}

function removeFamilyMemberProfile(profileId) {
    if (!profileId || profileId === DEFAULT_FAMILY_PROFILE_ID) {
        showToast('Основной профиль удалить нельзя.', 'warning');
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser?.email) return;

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const family = getFamilyStorage(userData);
    const target = family.profiles.find(profile => profile.id === profileId);
    if (!target) return;

    const confirmed = confirm(`Удалить профиль «${target.name}» и его курсы?`);
    if (!confirmed) return;

    family.profiles = family.profiles.filter(profile => profile.id !== profileId);
    delete family.medicinesByProfile[profileId];
    if (family.activeProfileId === profileId) {
        family.activeProfileId = DEFAULT_FAMILY_PROFILE_ID;
    }

    persistFamilyStorageForCurrentUser(family);
    loadMedicines();
    showToast(`Профиль «${target.name}» удалён.`, 'info');
    showSection('profile');
}

function encodeUtf8ToBase64(value) {
    try {
        return btoa(unescape(encodeURIComponent(String(value))));
    } catch (_error) {
        return '';
    }
}

function decodeUtf8FromBase64(value) {
    try {
        return decodeURIComponent(escape(atob(String(value))));
    } catch (_error) {
        return '';
    }
}

function buildSafeUserSnapshot(userData) {
    const family = getFamilyStorage(userData || {});
    const plannerSettings = getPlannerSettings(userData || {});

    return {
        name: userData?.name || '',
        email: userData?.email || '',
        createdAt: userData?.createdAt || null,
        medicines: Array.isArray(userData?.medicines) ? userData.medicines : [],
        family,
        settings: {
            ...(userData?.settings || {}),
            planner: plannerSettings
        },
        avatar: userData?.avatar || null,
        gamification: userData?.gamification || null
    };
}

function buildSyncPayloadForCurrentUser() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;

    const userData = getUserData(currentUser.email);
    if (!userData) return null;

    return {
        app: 'smart-aptechka',
        version: 2,
        exportedAt: new Date().toISOString(),
        data: {
            userData: buildSafeUserSnapshot(userData)
        }
    };
}

function getAutoBackupsBucket() {
    try {
        const raw = JSON.parse(localStorage.getItem(AUTO_BACKUP_STORAGE_KEY) || '{}');
        return raw && typeof raw === 'object' ? raw : {};
    } catch (_error) {
        return {};
    }
}

function saveAutoBackupsBucket(bucket) {
    try {
        localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(bucket || {}));
    } catch (_error) {
        // ignore quota errors
    }
}

function maybeStoreAutomaticBackup() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return;

    const payload = buildSyncPayloadForCurrentUser();
    if (!payload) return;

    const nowTs = Date.now();
    const bucket = getAutoBackupsBucket();
    const history = Array.isArray(bucket[currentUser.email]) ? bucket[currentUser.email] : [];
    const latestTs = Number(history[0]?.timestamp || 0);
    if (Number.isFinite(latestTs) && nowTs - latestTs < AUTO_BACKUP_INTERVAL_MS) {
        return;
    }

    history.unshift({
        timestamp: nowTs,
        payload
    });

    bucket[currentUser.email] = history.slice(0, 6);
    saveAutoBackupsBucket(bucket);
}

function getLatestAutoBackupRecord() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;
    const bucket = getAutoBackupsBucket();
    const history = Array.isArray(bucket[currentUser.email]) ? bucket[currentUser.email] : [];
    return history[0] || null;
}

function applyImportedBackupPayload(importedData, options = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        return false;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) return false;

    const importedUserData = importedData?.data?.userData
        || importedData?.userData
        || (importedData?.data && typeof importedData.data === 'object' ? importedData.data : null);
    const legacyMedicines = Array.isArray(importedData?.medicines) ? importedData.medicines : null;

    if (!importedUserData && !legacyMedicines) {
        showToast('Файл не содержит данных для импорта.', 'error');
        return false;
    }

    const sourceLabel = options.sourceLabel || 'резервной копии';
    const shouldConfirm = options.skipConfirm !== true;
    if (shouldConfirm) {
        const confirmed = confirm(`Импортировать данные из ${sourceLabel}? Текущие курсы активного профиля будут заменены.`);
        if (!confirmed) return false;
    }

    let nextUserData = {
        ...userData
    };

    if (importedUserData && typeof importedUserData === 'object') {
        if (Array.isArray(importedUserData.medicines)) {
            nextUserData.medicines = importedUserData.medicines;
        }
        if (importedUserData.family && typeof importedUserData.family === 'object') {
            nextUserData.family = importedUserData.family;
        }
        if (importedUserData.settings && typeof importedUserData.settings === 'object') {
            nextUserData.settings = {
                ...(userData.settings || {}),
                ...importedUserData.settings
            };
        }
        if (importedUserData.avatar) {
            nextUserData.avatar = importedUserData.avatar;
        }
        if (importedUserData.gamification && typeof importedUserData.gamification === 'object') {
            nextUserData.gamification = importedUserData.gamification;
        }
    }

    let normalizedFamily = getFamilyStorage(nextUserData);
    if (legacyMedicines) {
        normalizedFamily.medicinesByProfile[normalizedFamily.activeProfileId] = legacyMedicines;
        nextUserData.medicines = legacyMedicines;
    }

    normalizedFamily = getFamilyStorage({
        ...nextUserData,
        family: normalizedFamily
    });
    nextUserData.family = normalizedFamily;
    nextUserData.medicines = normalizedFamily.medicinesByProfile[normalizedFamily.activeProfileId] || [];
    nextUserData.settings = {
        ...(nextUserData.settings || {}),
        planner: normalizePlannerSettings(nextUserData.settings?.planner || {})
    };

    saveUserData(currentUser.email, nextUserData);
    loadMedicines();
    showSection(currentSection === 'profile' ? 'profile' : 'medicines');
    showToast('Данные успешно импортированы.', 'success');
    return true;
}

async function copySyncCodeToClipboard() {
    const payload = buildSyncPayloadForCurrentUser();
    if (!payload) {
        showToast('Не удалось сформировать код синхронизации.', 'error');
        return;
    }

    const raw = JSON.stringify(payload);
    const code = `${SYNC_CODE_PREFIX}${encodeUtf8ToBase64(raw)}`;
    if (!code || code === SYNC_CODE_PREFIX) {
        showToast('Не удалось сформировать код синхронизации.', 'error');
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code);
        } else {
            throw new Error('Clipboard API unavailable');
        }
        showToast('Код синхронизации скопирован.', 'success');
    } catch (_error) {
        showToast('Не удалось скопировать код. Попробуйте другой браузер.', 'warning');
    }
}

function importSyncCode() {
    const rawInput = prompt('Вставьте код синхронизации SmartАптечки');
    if (!rawInput) return;

    const value = String(rawInput).trim();
    const encoded = value.startsWith(SYNC_CODE_PREFIX)
        ? value.slice(SYNC_CODE_PREFIX.length)
        : value;
    const decoded = decodeUtf8FromBase64(encoded);
    if (!decoded) {
        showToast('Код синхронизации поврежден.', 'error');
        return;
    }

    try {
        const payload = JSON.parse(decoded);
        applyImportedBackupPayload(payload, { sourceLabel: 'кода синхронизации' });
    } catch (_error) {
        showToast('Не удалось прочитать код синхронизации.', 'error');
    }
}

function restoreLatestAutoBackup() {
    const record = getLatestAutoBackupRecord();
    if (!record?.payload) {
        showToast('Автобэкап пока не найден.', 'info');
        return;
    }

    const backupTime = new Date(Number(record.timestamp) || Date.now()).toLocaleString('ru-RU');
    applyImportedBackupPayload(record.payload, {
        sourceLabel: `автобэкапа (${backupTime})`
    });
}

function getLatestAutoBackupHint() {
    const record = getLatestAutoBackupRecord();
    if (!record?.timestamp) return 'Автобэкап появится после изменений в аптечке.';
    return `Последний автобэкап: ${new Date(record.timestamp).toLocaleString('ru-RU')}`;
}

function savePlannerSettingsFromProfile() {
    const modeInput = document.getElementById('defaultIntakePlannerModeInput');
    const autoRestockToggle = document.getElementById('autoRestockEnabledInput');
    const targetDaysInput = document.getElementById('autoRestockTargetDaysInput');

    const nextSettings = updatePlannerSettingsForCurrentUser({
        defaultMode: modeInput?.value,
        autoRestockEnabled: autoRestockToggle?.checked !== false,
        autoRestockTargetDays: targetDaysInput?.value
    });

    if (!nextSettings) return;
    showToast('Настройки планировщика сохранены.', 'success');
    renderRestockForecastAlert();
}

function toLocalDayStamp(value = new Date()) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseLocalDayStamp(dayStamp) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dayStamp || ''))) return null;
    const [year, month, day] = String(dayStamp).split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }
    return date;
}

function getDayStampDiff(fromDayStamp, toDayStamp) {
    const fromDate = parseLocalDayStamp(fromDayStamp);
    const toDate = parseLocalDayStamp(toDayStamp);
    if (!fromDate || !toDate) return null;
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.round((toDate.getTime() - fromDate.getTime()) / dayMs);
}

function sanitizeGamificationState(rawValue) {
    const raw = rawValue && typeof rawValue === 'object' ? rawValue : {};
    const allowedIds = new Set(CUSTOMIZATION_CATALOG.map(item => item.id));
    const allowedAchievementIds = new Set(ACHIEVEMENT_CATALOG.map(item => item.id));
    const unlocked = Array.isArray(raw.unlockedCustomizations)
        ? raw.unlockedCustomizations.filter(id => allowedIds.has(id))
        : [];
    const unlockedAchievements = Array.isArray(raw.unlockedAchievements)
        ? raw.unlockedAchievements.filter(id => allowedAchievementIds.has(id))
        : [];
    const lastRewardDay = parseLocalDayStamp(raw.lastLoginRewardDay)
        ? String(raw.lastLoginRewardDay)
        : '';
    const activeCustomization = typeof raw.activeCustomization === 'string'
        ? raw.activeCustomization
        : '';
    const activeAllowed = unlocked.includes(activeCustomization) ? activeCustomization : '';

    return {
        coins: Math.max(0, Math.floor(Number(raw.coins) || 0)),
        loginStreak: Math.max(0, Math.min(7, Math.floor(Number(raw.loginStreak) || 0))),
        bestLoginStreak: Math.max(0, Math.floor(Number(raw.bestLoginStreak) || 0)),
        lastLoginRewardDay: lastRewardDay,
        unlockedCustomizations: [...new Set(unlocked)],
        unlockedAchievements: [...new Set(unlockedAchievements)],
        activeCustomization: activeAllowed
    };
}

function getGamificationState(userData) {
    return sanitizeGamificationState(userData?.gamification || {});
}

function getDailyLoginRewardCoins(streakDay) {
    const safeDay = Math.max(1, Math.min(7, Math.floor(Number(streakDay) || 1)));
    return LOGIN_STREAK_REWARD_TABLE[safeDay - 1] || LOGIN_STREAK_REWARD_TABLE[0];
}

function clearCustomizationThemeClasses() {
    CUSTOMIZATION_CATALOG.forEach(item => {
        document.body.classList.remove(item.className);
    });
}

function applyCustomizationThemeByState(gamificationState) {
    clearCustomizationThemeClasses();

    const state = sanitizeGamificationState(gamificationState);
    if (!state.activeCustomization) return;

    const selected = CUSTOMIZATION_CATALOG.find(item => item.id === state.activeCustomization);
    if (selected?.className) {
        document.body.classList.add(selected.className);
    }
}

function applyCustomizationThemeForCurrentUser() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        clearCustomizationThemeClasses();
        return;
    }

    const userData = getUserData(currentUser.email);
    applyCustomizationThemeByState(getGamificationState(userData));
}

function persistGamificationStateForCurrentUser(nextState) {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;

    const userData = getUserData(currentUser.email);
    if (!userData) return null;

    const normalizedState = sanitizeGamificationState(nextState);
    saveUserData(currentUser.email, {
        ...userData,
        gamification: normalizedState
    });

    return normalizedState;
}

function awardDailyLoginCoins(options = {}) {
    const silent = Boolean(options.silent);
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;

    const userData = getUserData(currentUser.email);
    if (!userData) return null;

    const currentState = getGamificationState(userData);
    const today = toLocalDayStamp(new Date());
    if (!today) return null;

    if (currentState.lastLoginRewardDay === today) {
        applyCustomizationThemeByState(currentState);
        return { awarded: false, state: currentState };
    }

    const dayDiff = currentState.lastLoginRewardDay
        ? getDayStampDiff(currentState.lastLoginRewardDay, today)
        : null;
    if (dayDiff !== null && dayDiff < 0) {
        applyCustomizationThemeByState(currentState);
        return { awarded: false, state: currentState };
    }

    const nextStreak = dayDiff === 1
        ? Math.min(7, currentState.loginStreak + 1)
        : 1;
    const reward = getDailyLoginRewardCoins(nextStreak);

    const nextState = sanitizeGamificationState({
        ...currentState,
        coins: currentState.coins + reward,
        loginStreak: nextStreak,
        bestLoginStreak: Math.max(currentState.bestLoginStreak, nextStreak),
        lastLoginRewardDay: today
    });

    persistGamificationStateForCurrentUser(nextState);
    applyCustomizationThemeByState(nextState);
    maybeUnlockAchievements({
        showPopup: !silent,
        refreshProfile: !silent
    });

    if (!silent) {
        showToast(`Ежедневный вход ${nextStreak}/7: +${reward} монет с курочкой`, 'success');
    }

    return {
        awarded: true,
        reward,
        streak: nextStreak,
        state: nextState
    };
}

function purchaseCustomizationItem(customizationId) {
    const item = CUSTOMIZATION_CATALOG.find(entry => entry.id === customizationId);
    if (!item) return;

    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        showAuthModal();
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const state = getGamificationState(userData);
    if (state.unlockedCustomizations.includes(item.id)) {
        activateCustomizationItem(item.id);
        return;
    }

    if (state.coins < item.cost) {
        showToast(`Не хватает ${item.cost - state.coins} монет для покупки.`, 'warning');
        return;
    }

    const nextState = sanitizeGamificationState({
        ...state,
        coins: state.coins - item.cost,
        unlockedCustomizations: [...state.unlockedCustomizations, item.id],
        activeCustomization: item.id
    });

    persistGamificationStateForCurrentUser(nextState);
    applyCustomizationThemeByState(nextState);
    maybeUnlockAchievements({
        showPopup: true,
        refreshProfile: false
    });
    showToast(`Кастомизация «${item.name}» куплена!`, 'success');

    if (currentSection === 'profile') {
        showSection('profile');
    }
}

function activateCustomizationItem(customizationId) {
    const item = CUSTOMIZATION_CATALOG.find(entry => entry.id === customizationId);
    if (!item) return;

    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        showAuthModal();
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const state = getGamificationState(userData);
    if (!state.unlockedCustomizations.includes(item.id)) {
        showToast('Сначала купите эту кастомизацию.', 'warning');
        return;
    }

    if (state.activeCustomization === item.id) {
        showToast('Кастомизация уже активна.', 'info');
        return;
    }

    const nextState = sanitizeGamificationState({
        ...state,
        activeCustomization: item.id
    });

    persistGamificationStateForCurrentUser(nextState);
    applyCustomizationThemeByState(nextState);
    showToast(`Применено: ${item.name}`, 'success');

    if (currentSection === 'profile') {
        showSection('profile');
    }
}

function resetActiveCustomization() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        showAuthModal();
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const state = getGamificationState(userData);
    if (!state.activeCustomization) {
        showToast('Уже используется стандартный стиль.', 'info');
        return;
    }

    const nextState = sanitizeGamificationState({
        ...state,
        activeCustomization: ''
    });

    persistGamificationStateForCurrentUser(nextState);
    applyCustomizationThemeByState(nextState);
    showToast('Возврат к стандартному стилю выполнен.', 'success');

    if (currentSection === 'profile') {
        showSection('profile');
    }
}

function getAllFamilyMedicinesSnapshot(userData) {
    const familyState = getFamilyStorage(userData || {});
    return Object.values(familyState.medicinesByProfile || {}).reduce((accumulator, profileMedicines) => {
        if (Array.isArray(profileMedicines)) {
            accumulator.push(...profileMedicines);
        }
        return accumulator;
    }, []);
}

function buildAchievementContext(userDataOverride = null) {
    const userData = userDataOverride || getFullCurrentUser();
    if (!userData?.email) return null;

    const gamification = getGamificationState(userData);
    const familyState = getFamilyStorage(userData);
    const allMedicines = getAllFamilyMedicinesSnapshot(userData);
    const activeCoursesCount = allMedicines.filter(med => Array.isArray(med.schedule) && med.schedule.length > 0).length;
    const takenDoses = allMedicines.reduce((sum, med) => {
        return sum + (med.taken ? Object.values(med.taken).filter(Boolean).length : 0);
    }, 0);
    const totalDoses = allMedicines.reduce((sum, med) => {
        return sum + (Array.isArray(med.schedule) ? med.schedule.length : 0);
    }, 0);
    const stockTrackedCount = allMedicines.filter(med => {
        const stock = Number(med?.tabletsInStock);
        return Number.isFinite(stock) && stock > 0;
    }).length;
    const contraReadyCount = allMedicines.filter(med => {
        const status = String(med?.contraindicationsStatus || '').trim().toLowerCase();
        return status === 'ready' || status === 'not_found';
    }).length;
    const uniqueTakenDays = new Set();

    allMedicines.forEach(med => {
        if (!med?.taken || typeof med.taken !== 'object') return;
        Object.entries(med.taken).forEach(([timestamp, isTaken]) => {
            if (!isTaken) return;
            const dayStamp = toLocalDayStamp(Number(timestamp));
            if (dayStamp) {
                uniqueTakenDays.add(dayStamp);
            }
        });
    });

    const careSettings = getTelegramCareSettings(userData);

    return {
        userData,
        gamification,
        medicineCount: allMedicines.length,
        activeCoursesCount,
        takenDoses,
        totalDoses,
        adherenceRate: totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0,
        loginStreak: gamification.loginStreak,
        bestLoginStreak: gamification.bestLoginStreak,
        coins: gamification.coins,
        unlockedCustomizationCount: gamification.unlockedCustomizations.length,
        familyProfilesCount: familyState.profiles.length,
        stockTrackedCount,
        contraReadyCount,
        telegramConfigured: Boolean(careSettings.hasToken && careSettings.recipients.length > 0),
        hasAutoBackup: Boolean(getLatestAutoBackupRecord()?.timestamp),
        uniqueTakenDays: uniqueTakenDays.size
    };
}

function normalizeAchievementDescription(rawValue, fallbackText) {
    const normalized = String(rawValue || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return String(fallbackText || 'Выполняйте условия, чтобы открыть достижение.');
    return normalized.slice(0, 180);
}

function getAchievementSnapshot(userDataOverride = null) {
    const context = buildAchievementContext(userDataOverride);
    if (!context) {
        return {
            context: null,
            items: [],
            unlockedCount: 0,
            total: 0
        };
    }

    const unlockedSet = new Set(context.gamification.unlockedAchievements || []);
    const items = ACHIEVEMENT_CATALOG.map(achievement => {
        let unlockedByRule = false;
        try {
            unlockedByRule = Boolean(achievement.isUnlocked(context));
        } catch (_error) {
            unlockedByRule = false;
        }

        const unlocked = unlockedSet.has(achievement.id) || unlockedByRule;
        const description = normalizeAchievementDescription(
            typeof achievement.describe === 'function' ? achievement.describe(context) : '',
            unlocked ? 'Достижение уже разблокировано.' : 'В процессе выполнения.'
        );

        return {
            ...achievement,
            unlocked,
            description
        };
    });

    const unlockedCount = items.filter(item => item.unlocked).length;
    return {
        context,
        items,
        unlockedCount,
        total: items.length
    };
}

function showAchievementUnlockPopup(achievement, contextOverride = null) {
    if (!achievement) return;
    const achievementId = String(achievement.id || '').trim();
    if (!achievementId) return;

    const now = Date.now();
    const lastShownAt = Number(achievementToastShownAtById.get(achievementId) || 0);
    if (lastShownAt > 0 && now - lastShownAt < ACHIEVEMENT_TOAST_COOLDOWN_MS) {
        return;
    }
    achievementToastShownAtById.set(achievementId, now);
    window.setTimeout(() => {
        if (Number(achievementToastShownAtById.get(achievementId) || 0) === now) {
            achievementToastShownAtById.delete(achievementId);
        }
    }, ACHIEVEMENT_TOAST_COOLDOWN_MS * 2);

    const context = contextOverride || buildAchievementContext();
    const rawDescription = typeof achievement.describe === 'function'
        ? achievement.describe(context || {})
        : '';
    const description = normalizeAchievementDescription(rawDescription, 'Новое достижение разблокировано.');
    const iconClass = typeof achievement.icon === 'string' && achievement.icon.trim() ? achievement.icon.trim() : 'fa-trophy';

    let container = document.querySelector('.achievement-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'achievement-toast-container';
        document.body.appendChild(container);
    }
    if (Array.from(container.children).some(child => child?.dataset?.achievementId === achievementId)) {
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-unlock-toast';
    toast.dataset.achievementId = achievementId;
    toast.innerHTML = `
        <div class="achievement-unlock-toast__glow" aria-hidden="true"></div>
        <div class="achievement-unlock-toast__icon">
            <i class="fas ${escapeAttribute(iconClass)}"></i>
        </div>
        <div class="achievement-unlock-toast__body">
            <div class="achievement-unlock-toast__kicker">Новое достижение</div>
            <div class="achievement-unlock-toast__title">${escapeHtml(achievement.name || 'Достижение')}</div>
            <div class="achievement-unlock-toast__desc">${escapeHtml(description)}</div>
        </div>
    `;

    container.appendChild(toast);
    if (window.gsap && shouldUseMotionAnimations()) {
        window.gsap.fromTo(
            toast,
            { x: 34, autoAlpha: 0, scale: 0.975 },
            { x: 0, autoAlpha: 1, scale: 1, duration: 0.42, ease: 'back.out(1.15)' }
        );

        const icon = toast.querySelector('.achievement-unlock-toast__icon');
        if (icon) {
            window.gsap.fromTo(
                icon,
                { scale: 0.76, rotate: -10 },
                { scale: 1, rotate: 0, duration: 0.55, ease: 'elastic.out(1, 0.62)' }
            );
        }
    } else {
        window.requestAnimationFrame(() => {
            toast.classList.add('is-visible');
        });
    }

    announceForScreenReader(`Новое достижение: ${achievement.name}. ${description}`, 'polite');

    window.setTimeout(() => {
        if (window.gsap && shouldUseMotionAnimations()) {
            window.gsap.to(toast, {
                x: 28,
                autoAlpha: 0,
                scale: 0.97,
                duration: 0.28,
                ease: 'power2.in',
                onComplete: () => toast.remove()
            });
            return;
        }

        toast.classList.add('is-leaving');
        window.setTimeout(() => {
            toast.remove();
        }, 360);
    }, 4200);
}

function maybeUnlockAchievements(options = {}) {
    if (achievementUnlockCheckInFlight) return [];
    const showPopup = options.showPopup !== false;
    const refreshProfile = options.refreshProfile !== false;
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return [];

    const userData = getUserData(currentUser.email);
    if (!userData) return [];

    const context = buildAchievementContext(userData);
    if (!context) return [];

    achievementUnlockCheckInFlight = true;
    try {
        const unlockedSet = new Set(context.gamification.unlockedAchievements || []);
        const newlyUnlockedById = new Map();

        ACHIEVEMENT_CATALOG.forEach(achievement => {
            if (unlockedSet.has(achievement.id)) return;

            let shouldUnlock = false;
            try {
                shouldUnlock = Boolean(achievement.isUnlocked(context));
            } catch (_error) {
                shouldUnlock = false;
            }

            if (!shouldUnlock) return;
            unlockedSet.add(achievement.id);
            if (!newlyUnlockedById.has(achievement.id)) {
                newlyUnlockedById.set(achievement.id, achievement);
            }
        });

        const newlyUnlocked = Array.from(newlyUnlockedById.values());
        if (newlyUnlocked.length === 0) return [];

        const nextState = sanitizeGamificationState({
            ...context.gamification,
            unlockedAchievements: Array.from(unlockedSet)
        });
        persistGamificationStateForCurrentUser(nextState);

        const popupContext = {
            ...context,
            gamification: nextState,
            loginStreak: nextState.loginStreak,
            bestLoginStreak: nextState.bestLoginStreak,
            coins: nextState.coins,
            unlockedCustomizationCount: nextState.unlockedCustomizations.length
        };

        if (showPopup) {
            newlyUnlocked.forEach((achievement, index) => {
                window.setTimeout(() => {
                    showAchievementUnlockPopup(achievement, popupContext);
                }, index * 320);
            });
        }

        if (refreshProfile && currentSection === 'profile') {
            showSection('profile');
        }

        return newlyUnlocked;
    } finally {
        achievementUnlockCheckInFlight = false;
    }
}

function getMedicineStats() {
    const activeCourses = medicines.filter(med => Array.isArray(med.schedule) && med.schedule.length > 0);
    const takenDoses = medicines.reduce((sum, med) => {
        return sum + (med.taken ? Object.values(med.taken).filter(Boolean).length : 0);
    }, 0);
    const totalDoses = medicines.reduce((sum, med) => {
        return sum + (Array.isArray(med.schedule) ? med.schedule.length : 0);
    }, 0);

    return {
        activeCourses,
        takenDoses,
        totalDoses,
        adherenceRate: totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0
    };
}

function getUserAvatarMarkup(userData) {
    const initials = getInitials(userData?.name || 'Пользователь');

    if (userData?.avatar?.type === 'image') {
        return `<img src="${escapeAttribute(userData.avatar.data)}" alt="Аватар" class="avatar-preview">`;
    }

    return `<span>${initials}</span>`;
}

function renderMedicineGroups(name) {
    if (typeof getMedicineGroupLabels !== 'function') return '';

    const groups = getMedicineGroupLabels(name);
    if (groups.length === 0) return '';

    return `
        <div class="medicine-groups">
            ${groups.map(group => `<span class="badge medicine-group-badge">${escapeHtml(group)}</span>`).join('')}
        </div>
    `;
}

function getMedicalDisclaimerMarkup() {
    return `
        <div class="medical-disclaimer">
            <i class="fas fa-stethoscope me-2"></i>
            Это НЕ лечебная рекомендация. Перед применением препаратов проконсультируйтесь с врачом.
        </div>
    `;
}

function getInstructionTemplateByGroup(groupId) {
    const templates = {
        antibiotic: 'Принимайте через равные интервалы и проходите курс полностью. Не прекращайте приём раньше времени, даже если стало лучше.',
        nsaid: 'Принимайте после еды, запивая водой. Не сочетайте с другими НПВС и контролируйте состояние желудка.',
        acetaminophen: 'Соблюдайте интервалы приёма и контролируйте суточную дозу. Не комбинируйте с другими средствами, содержащими парацетамол.',
        decongestant: 'Используйте только краткосрочно. Строго соблюдайте интервалы и не применяйте непрерывно длительное время.',
        sedative: 'Принимайте, когда возможен отдых. Избегайте алкоголя и задач, требующих высокой концентрации.',
        antihistamine: 'Принимайте 1 раз в день в одно и то же время. При сонливости избегайте вождения.',
        antacid: 'Принимайте по инструкции относительно еды. Соблюдайте интервалы с другими лекарствами.',
        sorbent: 'Принимайте с достаточным количеством воды и выдерживайте интервал с другими лекарствами.',
        antidiarrheal: 'Поддерживайте водный баланс. Если симптомы сохраняются или усиливаются, обратитесь к врачу.',
        antispasmodic: 'Принимайте по расписанию при спазматической боли. При сильной или длительной боли обратитесь к врачу.',
        cardiovascular: 'Принимайте ежедневно в одно и то же время и не пропускайте дозы без рекомендации врача.',
        antihypertensive: 'Принимайте регулярно в одно и то же время. Контролируйте давление и не отменяйте препарат резко.',
        antiseptic: 'Применяйте наружно по инструкции и избегайте контакта с глазами и слизистыми, если не указано иное.',
        default: 'Следуйте инструкции к препарату и назначенной схеме. Не превышайте рекомендованную дозу.'
    };
    return templates[groupId] || templates.default;
}

function getPrimaryMedicineGroupId(name) {
    if (typeof getMedicineGroups !== 'function') return null;
    const groups = getMedicineGroups(name);
    if (!Array.isArray(groups) || groups.length === 0) return null;

    const priority = [
        'antibiotic', 'antihypertensive', 'cardiovascular', 'nsaid', 'acetaminophen',
        'antihistamine', 'decongestant', 'sedative', 'antacid', 'sorbent',
        'antidiarrheal', 'antispasmodic', 'antiseptic'
    ];

    const ids = groups.map(group => group.id);
    return priority.find(id => ids.includes(id)) || ids[0] || null;
}

function buildShortInstructionForMedicine(medicine) {
    const med = medicine || {};
    const name = String(med.name || 'Лекарство');
    const dosageMg = Number.isFinite(Number(med.dosageMg)) ? Math.max(1, Math.round(Number(med.dosageMg))) : null;
    const symptoms = Array.isArray(med.symptoms) ? med.symptoms.filter(Boolean).slice(0, 2) : [];
    const primaryGroupId = getPrimaryMedicineGroupId(name);
    const mainInstruction = getInstructionTemplateByGroup(primaryGroupId);
    const dosagePart = dosageMg ? ` Текущая дозировка таблетки: ${dosageMg} мг.` : '';
    const symptomPart = symptoms.length > 0 ? ` Основные симптомы: ${symptoms.join(', ')}.` : '';

    return `${mainInstruction}${dosagePart}${symptomPart} Это НЕ лечебная рекомендация. Перед применением проконсультируйтесь с врачом.`;
}

function needsShortInstructionRuLocalization(value) {
    const text = String(value || '').trim();
    if (!text) return true;
    if (containsCyrillicText(text)) return false;
    return /This is not a treatment recommendation|Current tablet strength|Main symptoms|Follow package instructions|Take /i.test(text);
}

const OPEN_FDA_BASE_URL = 'https://api.fda.gov/drug/label.json';
const CONTRAINDICATIONS_LOOKUP_VERSION = 2;
const CONTRAINDICATIONS_ALIAS_MAP = {
    'парацетамол': ['acetaminophen', 'paracetamol'],
    'нурофен': ['ibuprofen'],
    'ибупрофен': ['ibuprofen'],
    'но-шпа': ['drotaverine'],
    'дротаверин': ['drotaverine'],
    'аспирин': ['aspirin'],
    'ацетилсалициловая кислота': ['aspirin'],
    'амоксициллин': ['amoxicillin'],
    'амоксиклав': ['amoxicillin clavulanate'],
    'азитромицин': ['azithromycin'],
    'лоратадин': ['loratadine'],
    'цетиризин': ['cetirizine'],
    'супрастин': ['chloropyramine'],
    'кларитин': ['loratadine'],
    'эриус': ['desloratadine']
};

const CONTRAINDICATIONS_ALIAS_MAP_ASCII = {
    'paracetamol': ['acetaminophen', 'paracetamol'],
    'nurofen': ['ibuprofen'],
    'ibuprofen': ['ibuprofen'],
    'no-shpa': ['drotaverine', 'drotaverine hydrochloride'],
    'drotaverin': ['drotaverine'],
    'aspirin': ['aspirin', 'acetylsalicylic acid'],
    'acetilsalicilovaya kislota': ['aspirin', 'acetylsalicylic acid'],
    'amoksicillin': ['amoxicillin'],
    'amoksiklav': ['amoxicillin', 'clavulanate'],
    'azitromicin': ['azithromycin'],
    'klaritromicin': ['clarithromycin'],
    'ceftriakson': ['ceftriaxone'],
    'loratadin': ['loratadine'],
    'cetirizin': ['cetirizine'],
    'suprastin': ['chloropyramine'],
    'klaritin': ['loratadine'],
    'erius': ['desloratadine'],
    'omeprazol': ['omeprazole'],
    'nolpaza': ['pantoprazole'],
    'mezim': ['pancreatin'],
    'pankreatin': ['pancreatin'],
    'smekta': ['diosmectite', 'smectite'],
    'enterosgel': ['polymethylsiloxane polyhydrate'],
    'aktivirovannyy ugol': ['activated charcoal'],
    'loperamid': ['loperamide'],
    'imodium': ['loperamide'],
    'enterofuril': ['nifuroxazide'],
    'nifuroksazid': ['nifuroxazide'],
    'zyrtec': ['cetirizine'],
    'zodak': ['cetirizine'],
    'tavegil': ['clemastine'],
    'fenistil': ['dimetindene'],
    'diklofenak': ['diclofenac'],
    'ketorol': ['ketorolac'],
    'ketanov': ['ketorolac'],
    'nimesulid': ['nimesulide'],
    'nazivin': ['oxymetazoline'],
    'otrivin': ['xylometazoline'],
    'tizin': ['tetryzoline'],
    'nazol': ['oxymetazoline'],
    'naftizin': ['naphazoline']
};

function transliterateToLatin(text) {
    const map = {
        '\u0430': 'a', '\u0431': 'b', '\u0432': 'v', '\u0433': 'g', '\u0434': 'd', '\u0435': 'e', '\u0451': 'e',
        '\u0436': 'zh', '\u0437': 'z', '\u0438': 'i', '\u0439': 'y', '\u043a': 'k', '\u043b': 'l', '\u043c': 'm',
        '\u043d': 'n', '\u043e': 'o', '\u043f': 'p', '\u0440': 'r', '\u0441': 's', '\u0442': 't', '\u0443': 'u',
        '\u0444': 'f', '\u0445': 'kh', '\u0446': 'ts', '\u0447': 'ch', '\u0448': 'sh', '\u0449': 'sch',
        '\u044a': '', '\u044b': 'y', '\u044c': '', '\u044d': 'e', '\u044e': 'yu', '\u044f': 'ya'
    };

    return String(text || '')
        .toLowerCase()
        .split('')
        .map(char => map[char] ?? char)
        .join('')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getContraindicationLookupTerms(medicineName) {
    const original = String(medicineName || '').trim();
    if (!original) return [];

    const lower = original.toLowerCase();
    const transliterated = transliterateToLatin(original);
    const aliases = CONTRAINDICATIONS_ALIAS_MAP[lower] || [];

    return [...new Set([original, transliterated, ...aliases].filter(Boolean))];
}

function extractContraindicationsFromLabelResult(result) {
    if (!result || typeof result !== 'object') return '';

    const candidateFields = ['contraindications', 'do_not_use', 'warnings', 'ask_doctor'];
    for (const field of candidateFields) {
        const value = result[field];
        if (Array.isArray(value) && value.length > 0) {
            const compact = String(value[0]).replace(/\s+/g, ' ').trim();
            return compact.length > 420 ? `${compact.slice(0, 417)}...` : compact;
        }
    }

    return '';
}

async function queryOpenFdaContraindications(term, field) {
    const safeTerm = String(term || '').trim();
    if (!safeTerm) return null;

    const query = `${field}:\"${safeTerm}\"`;
    const url = `${OPEN_FDA_BASE_URL}?search=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url);

    if (!response.ok) return null;
    const data = await response.json();
    const firstResult = Array.isArray(data.results) ? data.results[0] : null;
    const contraindications = extractContraindicationsFromLabelResult(firstResult);

    if (!contraindications) return null;
    return {
        contraindications,
        sourceUrl: url,
        matchedTerm: safeTerm
    };
}

async function fetchContraindicationsFromInternet(medicineName) {
    const terms = getContraindicationLookupTerms(medicineName);
    const fields = ['openfda.brand_name', 'openfda.generic_name', 'openfda.substance_name'];

    for (const term of terms) {
        for (const field of fields) {
            try {
                const hit = await queryOpenFdaContraindications(term, field);
                if (hit?.contraindications) {
                    return hit;
                }
            } catch (error) {
                console.warn('OpenFDA lookup failed:', error);
            }
        }
    }

    return null;
}

function getContraindicationsFallbackText() {
    return 'В онлайн-базе openFDA противопоказания для этого названия не найдены. Проверьте официальную инструкцию и государственный реестр лекарств.';
}

function containsCyrillicText(value) {
    return /[\u0400-\u04FF]/u.test(String(value || ''));
}

function needsContraindicationsRuTranslation(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    if (containsCyrillicText(text)) return false;
    return /[A-Za-z]/.test(text);
}

async function translateTextToRussian(value) {
    const text = String(value || '').trim();
    if (!needsContraindicationsRuTranslation(text)) return text;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ru`;
        const response = await fetch(url);
        if (!response.ok) return text;

        const data = await response.json();
        const translated = String(data?.responseData?.translatedText || '').trim();
        if (!translated || !containsCyrillicText(translated)) return text;
        return translated;
    } catch (error) {
        console.warn('Contraindications RU translation failed:', error);
        return text;
    }
}

async function localizeStoredContraindications(medicineId) {
    const medicine = medicines.find(item => item.id === medicineId);
    if (!medicine) return;
    if (medicine.contraindicationsTranslationStatus === 'loading') return;
    if (!needsContraindicationsRuTranslation(medicine.contraindications)) {
        medicine.contraindicationsLanguage = containsCyrillicText(medicine.contraindications) ? 'ru' : 'source';
        medicine.contraindicationsTranslationStatus = 'ready';
        saveMedicines();
        return;
    }

    medicine.contraindicationsTranslationStatus = 'loading';
    saveMedicines();

    const translated = await translateTextToRussian(medicine.contraindications);
    const target = medicines.find(item => item.id === medicineId);
    if (!target) return;

    target.contraindications = translated || target.contraindications;
    target.contraindicationsLanguage = containsCyrillicText(target.contraindications) ? 'ru' : 'source';
    target.contraindicationsTranslationStatus = target.contraindicationsLanguage === 'ru' ? 'ready' : 'failed';
    saveMedicines();

    if (currentSection === 'medicines') {
        renderMedicines();
    }
}

async function enrichMedicineContraindications(medicineId) {
    const medicine = medicines.find(item => item.id === medicineId);
    if (!medicine) return;
    if (medicine.contraindicationsStatus === 'loading' || medicine.contraindicationsStatus === 'ready') return;

    medicine.contraindicationsStatus = 'loading';
    medicine.contraindications = 'Загружаю противопоказания из интернета...';
    saveMedicines();
    if (currentSection === 'medicines') {
        renderMedicines();
    }

    const result = await fetchContraindicationsFromInternet(medicine.name);
    const target = medicines.find(item => item.id === medicineId);
    if (!target) return;

    if (result?.contraindications) {
        target.contraindications = await translateTextToRussian(result.contraindications);
        target.contraindicationsSource = result.sourceUrl;
        target.contraindicationsStatus = 'ready';
        target.contraindicationsLanguage = containsCyrillicText(target.contraindications) ? 'ru' : 'source';
        target.contraindicationsTranslationStatus = target.contraindicationsLanguage === 'ru' ? 'ready' : 'failed';
        target.contraindicationsLookupVersion = CONTRAINDICATIONS_LOOKUP_VERSION;
    } else {
        target.contraindications = getContraindicationsFallbackText();
        target.contraindicationsSource = OPEN_FDA_BASE_URL;
        target.contraindicationsStatus = 'not_found';
        target.contraindicationsLanguage = 'ru';
        target.contraindicationsTranslationStatus = 'ready';
        target.contraindicationsLookupVersion = CONTRAINDICATIONS_LOOKUP_VERSION;
    }

    saveMedicines();
    if (currentSection === 'medicines') {
        renderMedicines();
    }
}

function clearNextReminderTimer() {
    if (nextReminderInterval) {
        window.clearInterval(nextReminderInterval);
        nextReminderInterval = null;
    }
}

function updateNextReminderButton(reminder) {
    const button = document.getElementById('nextReminderButton');
    const hint = document.getElementById('nextReminderHint');
    const status = document.getElementById('nextReminderStatus');
    if (!button || !hint || !status || !reminder) return;

    const diff = reminder.time - Date.now();
    if (diff > 0) {
        status.textContent = getReminderStatusText(reminder.time);
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-hourglass-half me-1"></i>Доступно через ${formatTimeTo(reminder.time)}`;
        hint.textContent = `Отметить приём можно только когда наступит время дозы по расписанию.`;
        return;
    }

    status.textContent = getReminderStatusText(reminder.time);
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-check me-1"></i>Принято';
    hint.textContent = 'Время приёма наступило. После подтверждения кнопка переключится на следующую дозу.';
}

function setupNextReminderTimer(reminder) {
    clearNextReminderTimer();
    if (!reminder) return;

    updateNextReminderButton(reminder);
    nextReminderInterval = window.setInterval(() => {
        if (currentSection !== 'medicines') {
            clearNextReminderTimer();
            return;
        }

        updateNextReminderButton(reminder);
        if (Date.now() >= reminder.time) {
            clearNextReminderTimer();
        }
    }, 1000);
}

function getReminderStatusText(timestamp) {
    const diff = timestamp - Date.now();
    if (diff > 0) {
        return `Через ${formatTimeTo(timestamp)}`;
    }

    return 'Время приёма уже наступило';
}

function normalizeTelegramRecipient(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    if (/^-?\d{5,}$/.test(raw)) {
        return raw;
    }

    const username = raw.replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/i.test(username)) {
        return '';
    }

    return username;
}

function parseTelegramRecipientsInput(value) {
    return [...new Set(
        String(value || '')
            .split(/[\n,;]+/)
            .map(item => normalizeTelegramRecipient(item))
            .filter(Boolean)
    )].slice(0, 12);
}

function formatTelegramRecipientsForInput(recipients) {
    if (!Array.isArray(recipients)) return '';
    return recipients
        .map(item => (/^-?\d+$/.test(item) ? item : `@${item}`))
        .join('\n');
}

function sanitizeTelegramAlertState(value) {
    const raw = value && typeof value === 'object' ? value : {};
    const rawByLevel = raw.lastSentByLevel && typeof raw.lastSentByLevel === 'object'
        ? raw.lastSentByLevel
        : {};
    const lastSentByLevel = {};

    TELEGRAM_CARE_THRESHOLDS_HOURS.forEach(level => {
        const sentAnchor = Number(rawByLevel[level]);
        if (Number.isFinite(sentAnchor) && sentAnchor > 0) {
            lastSentByLevel[level] = sentAnchor;
        }
    });

    const redZoneSentAt = Number(raw.redZoneSentAt);
    const redZoneSignature = String(raw.redZoneSignature || '').slice(0, 260);

    return {
        lastSentByLevel,
        redZoneSentAt: Number.isFinite(redZoneSentAt) && redZoneSentAt > 0 ? redZoneSentAt : 0,
        redZoneSignature
    };
}

function sanitizeTelegramEmergencyState(value) {
    const raw = value && typeof value === 'object' ? value : {};
    const lastSentAt = Number(raw.lastSentAt);
    return {
        lastSentAt: Number.isFinite(lastSentAt) && lastSentAt > 0 ? lastSentAt : 0
    };
}

function getTelegramTokenCacheKey(email) {
    return String(email || '').trim().toLowerCase();
}

function setRuntimeTelegramToken(email, token) {
    const cacheKey = getTelegramTokenCacheKey(email);
    if (!cacheKey) return;

    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) {
        telegramRuntimeTokensByEmail.delete(cacheKey);
        return;
    }

    telegramRuntimeTokensByEmail.set(cacheKey, normalizedToken);
}

function getRuntimeTelegramToken(email) {
    const cacheKey = getTelegramTokenCacheKey(email);
    if (!cacheKey) return '';
    return String(telegramRuntimeTokensByEmail.get(cacheKey) || '').trim();
}

function sanitizeTelegramCareSettings(rawValue) {
    const raw = rawValue && typeof rawValue === 'object' ? rawValue : {};
    const recipients = Array.isArray(raw.recipients)
        ? raw.recipients
        : parseTelegramRecipientsInput(raw.recipientsText || '');

    return {
        enabled: raw.enabled === true || raw.enabled === 'enabled' || raw.enabled === 'on',
        botToken: String(raw.botToken || '').trim(),
        hasToken: Boolean(raw.hasToken || raw.botToken),
        recipients: [...new Set(recipients.map(item => normalizeTelegramRecipient(item)).filter(Boolean))].slice(0, 12),
        alertState: sanitizeTelegramAlertState(raw.alertState),
        emergencyState: sanitizeTelegramEmergencyState(raw.emergencyState),
        lastError: String(raw.lastError || '').slice(0, 220),
        lastUpdatedAt: Number(raw.lastUpdatedAt) || 0
    };
}

function getTelegramCareSettings(userData) {
    const settings = sanitizeTelegramCareSettings(userData?.settings?.telegramCare || {});
    const currentUserEmail = userData?.email || getCurrentUser()?.email || '';
    const runtimeToken = getRuntimeTelegramToken(currentUserEmail);

    if (!runtimeToken && settings.botToken && currentUserEmail) {
        setRuntimeTelegramToken(currentUserEmail, settings.botToken);
    }

    const resolvedToken = runtimeToken || settings.botToken || '';
    return {
        ...settings,
        botToken: resolvedToken,
        hasToken: Boolean(resolvedToken || settings.hasToken)
    };
}

function updateTelegramCareSettingsForCurrentUser(patch = {}) {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) return null;

    const userData = getUserData(currentUser.email);
    if (!userData) return null;

    const explicitPatchToken = Object.prototype.hasOwnProperty.call(patch, 'botToken')
        ? String(patch.botToken || '').trim()
        : null;
    const currentCare = getTelegramCareSettings(userData);
    const nextCare = sanitizeTelegramCareSettings({
        ...currentCare,
        ...patch,
        alertState: patch.alertState
            ? sanitizeTelegramAlertState(patch.alertState)
            : currentCare.alertState,
        emergencyState: patch.emergencyState
            ? sanitizeTelegramEmergencyState(patch.emergencyState)
            : currentCare.emergencyState,
        lastUpdatedAt: Date.now()
    });
    const runtimeToken = explicitPatchToken !== null ? explicitPatchToken : nextCare.botToken;
    setRuntimeTelegramToken(currentUser.email, runtimeToken);
    const persistedCare = {
        ...nextCare,
        botToken: '',
        hasToken: Boolean(getRuntimeTelegramToken(currentUser.email))
    };

    saveUserData(currentUser.email, {
        ...userData,
        settings: {
            ...(userData.settings || {}),
            telegramCare: persistedCare
        }
    });

    return {
        ...nextCare,
        botToken: getRuntimeTelegramToken(currentUser.email),
        hasToken: persistedCare.hasToken
    };
}

function setTelegramCareInputsDisabled(disabled) {
    const tokenInput = document.getElementById('telegramBotTokenInput');
    const recipientsInput = document.getElementById('telegramRelativesInput');
    const testButton = document.getElementById('telegramCareTestButton');

    [tokenInput, recipientsInput, testButton].forEach(element => {
        if (element) {
            element.disabled = Boolean(disabled);
        }
    });
}

function getOldestOverdueDoseInfo(referenceTime = Date.now()) {
    let oldestTimestamp = null;
    let oldestMedicine = '';
    let overdueCount = 0;

    medicines.forEach(med => {
        if (!Array.isArray(med.schedule)) return;

        med.schedule.forEach(time => {
            const doseTimestamp = Number(time);
            if (!Number.isFinite(doseTimestamp) || doseTimestamp > referenceTime) return;
            if (med.taken && med.taken[doseTimestamp]) return;

            overdueCount += 1;
            if (oldestTimestamp === null || doseTimestamp < oldestTimestamp) {
                oldestTimestamp = doseTimestamp;
                oldestMedicine = med.name || 'Лекарство';
            }
        });
    });

    if (oldestTimestamp === null) return null;

    return {
        oldestTimestamp,
        oldestMedicine,
        overdueCount,
        ageMs: Math.max(0, referenceTime - oldestTimestamp)
    };
}

function formatDurationHours(ageMs) {
    const totalMinutes = Math.max(0, Math.floor(ageMs / (1000 * 60)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} ч ${minutes} мин`;
}

function buildTelegramCareMessage({ userData, overdueInfo, thresholdHours, isTest }) {
    const patientName = userData?.name || 'Пользователь';
    const nowText = new Date().toLocaleString('ru-RU');

    if (isTest) {
        return [
            'Тестовое сообщение от SmartАптечки.',
            `Пациент: ${patientName}.`,
            `Порог контроля: ${thresholdHours} ч.`,
            `Время отправки: ${nowText}.`,
            'Если вы получили это сообщение, канал уведомлений работает.'
        ].join('\n');
    }

    const overdueSince = new Date(overdueInfo.oldestTimestamp).toLocaleString('ru-RU');
    return [
        'Внимание: возможен пропуск приёма лекарства.',
        `Пациент: ${patientName}.`,
        `Без подтверждения приёма: ${formatDurationHours(overdueInfo.ageMs)}.`,
        `Сработал порог: ${thresholdHours} ч.`,
        `Просроченных доз: ${overdueInfo.overdueCount}.`,
        `Самая ранняя непринятая доза: ${overdueSince}.`,
        `Препарат: ${overdueInfo.oldestMedicine}.`,
        'Пожалуйста, свяжитесь с пациентом.'
    ].join('\n');
}

async function callTelegramApi(botToken, method, payload, requestInit = {}) {
    const token = String(botToken || '').trim();
    if (!token) {
        throw new Error('Не указан Telegram Bot Token');
    }

    const url = `https://api.telegram.org/bot${token}/${method}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
        ...requestInit
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
        throw new Error(data?.description || `Ошибка Telegram API (${response.status})`);
    }

    return data.result;
}

async function fetchTelegramUpdates(botToken) {
    const token = String(botToken || '').trim();
    if (!token) return [];

    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=100`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
        throw new Error(data?.description || `Ошибка Telegram API (${response.status})`);
    }

    return Array.isArray(data.result) ? data.result : [];
}

async function resolveTelegramChatIdByUsername(botToken, username, cache) {
    const normalizedUsername = normalizeTelegramRecipient(username);
    if (!normalizedUsername || /^-?\d+$/.test(normalizedUsername)) {
        return normalizedUsername || null;
    }

    const cacheKey = `username:${normalizedUsername}`;
    if (cache?.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const updates = await fetchTelegramUpdates(botToken);
    for (let i = updates.length - 1; i >= 0; i -= 1) {
        const update = updates[i];
        const message = update?.message || update?.edited_message || update?.channel_post || update?.edited_channel_post;
        const fromUser = String(message?.from?.username || '').toLowerCase();
        if (fromUser === normalizedUsername && message?.chat?.id !== undefined && message?.chat?.id !== null) {
            const chatId = String(message.chat.id);
            cache?.set(cacheKey, chatId);
            return chatId;
        }

        const callbackFrom = String(update?.callback_query?.from?.username || '').toLowerCase();
        const callbackChatId = update?.callback_query?.message?.chat?.id;
        if (callbackFrom === normalizedUsername && callbackChatId !== undefined && callbackChatId !== null) {
            const chatId = String(callbackChatId);
            cache?.set(cacheKey, chatId);
            return chatId;
        }
    }

    cache?.set(cacheKey, null);
    return null;
}

async function sendTelegramMessageToRecipient(botToken, recipient, text, cache) {
    const normalizedRecipient = normalizeTelegramRecipient(recipient);
    if (!normalizedRecipient) {
        return { ok: false, error: `Некорректный контакт: ${recipient}` };
    }

    const isChatId = /^-?\d+$/.test(normalizedRecipient);
    if (isChatId) {
        await callTelegramApi(botToken, 'sendMessage', {
            chat_id: normalizedRecipient,
            text,
            disable_web_page_preview: true
        });
        return { ok: true };
    }

    try {
        await callTelegramApi(botToken, 'sendMessage', {
            chat_id: `@${normalizedRecipient}`,
            text,
            disable_web_page_preview: true
        });
        return { ok: true };
    } catch (directSendError) {
        const chatId = await resolveTelegramChatIdByUsername(botToken, normalizedRecipient, cache);
        if (!chatId) {
            return {
                ok: false,
                error: `Для @${normalizedRecipient} не найден chat_id. Пусть контакт сначала напишет вашему боту /start.`
            };
        }

        try {
            await callTelegramApi(botToken, 'sendMessage', {
                chat_id: chatId,
                text,
                disable_web_page_preview: true
            });
            return { ok: true };
        } catch (resolvedSendError) {
            return { ok: false, error: resolvedSendError.message || 'Не удалось отправить сообщение в Telegram' };
        }
    }
}

async function broadcastTelegramCareAlert(userData, careSettings, payload) {
    const recipients = Array.isArray(careSettings?.recipients) ? careSettings.recipients : [];
    const botToken = String(careSettings?.botToken || '').trim();
    if (!botToken || recipients.length === 0) {
        return { successCount: 0, failures: ['Не заполнены Telegram Bot Token и/или контакты'] };
    }

    const message = buildTelegramCareMessage({
        userData,
        overdueInfo: payload.overdueInfo,
        thresholdHours: payload.thresholdHours,
        isTest: payload.isTest
    });

    const cache = new Map();
    let successCount = 0;
    const failures = [];

    for (const recipient of recipients) {
        try {
            const result = await sendTelegramMessageToRecipient(botToken, recipient, message, cache);
            if (result.ok) {
                successCount += 1;
            } else {
                failures.push(result.error || `Не удалось отправить: ${recipient}`);
            }
        } catch (error) {
            failures.push(error?.message || `Ошибка отправки для ${recipient}`);
        }
    }

    return { successCount, failures };
}

async function broadcastTelegramTextMessage(careSettings, messageText) {
    const recipients = Array.isArray(careSettings?.recipients) ? careSettings.recipients : [];
    const botToken = String(careSettings?.botToken || '').trim();
    if (!botToken || recipients.length === 0) {
        return { successCount: 0, failures: ['Не заполнены Telegram Bot Token и/или контакты'] };
    }

    const cache = new Map();
    let successCount = 0;
    const failures = [];

    for (const recipient of recipients) {
        try {
            const result = await sendTelegramMessageToRecipient(botToken, recipient, messageText, cache);
            if (result.ok) {
                successCount += 1;
            } else {
                failures.push(result.error || `Не удалось отправить: ${recipient}`);
            }
        } catch (error) {
            failures.push(error?.message || `Ошибка отправки для ${recipient}`);
        }
    }

    return { successCount, failures };
}

function getEmergencyCooldownRemainingMs(careSettings) {
    const state = sanitizeTelegramEmergencyState(careSettings?.emergencyState);
    const elapsed = Date.now() - state.lastSentAt;
    return Math.max(0, TELEGRAM_EMERGENCY_COOLDOWN_MS - elapsed);
}

function formatEmergencyCooldown(ms) {
    const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        return `${minutes} мин ${String(seconds).padStart(2, '0')} сек`;
    }
    return `${seconds} сек`;
}

function getEmergencyMedicationSnapshot() {
    const overdue = getOldestOverdueDoseInfo();
    const nextReminder = findNextReminder();

    const now = Date.now();
    let overdueCount = 0;
    medicines.forEach(med => {
        if (!Array.isArray(med.schedule)) return;
        med.schedule.forEach(time => {
            const timestamp = Number(time);
            if (!Number.isFinite(timestamp) || timestamp > now) return;
            if (med.taken && med.taken[timestamp]) return;
            overdueCount += 1;
        });
    });

    return {
        overdueCount,
        overdue,
        nextReminder
    };
}

async function tryGetEmergencyLocation() {
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = Number(position?.coords?.latitude);
                const lon = Number(position?.coords?.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                    resolve(null);
                    return;
                }
                resolve({
                    lat,
                    lon,
                    accuracy: Number(position?.coords?.accuracy) || null
                });
            },
            () => resolve(null),
            {
                enableHighAccuracy: true,
                timeout: TELEGRAM_EMERGENCY_LOCATION_TIMEOUT_MS,
                maximumAge: 30 * 1000
            }
        );
    });
}

function buildTelegramEmergencyMessage(userData, snapshot, location) {
    const patientName = userData?.name || 'Пользователь';
    const nowText = new Date().toLocaleString('ru-RU');
    const lines = [
        'Срочное уведомление SmartАптечки.',
        `Пациент: ${patientName}.`,
        `Время сигнала: ${nowText}.`,
        'Пользователь нажал кнопку SOS в приложении.'
    ];

    if (snapshot.overdueCount > 0) {
        lines.push(`Неподтверждённых прошедших доз: ${snapshot.overdueCount}.`);
    } else {
        lines.push('Просроченных доз на данный момент не обнаружено.');
    }

    if (snapshot.overdue?.oldestMedicine) {
        lines.push(`Самый ранний пропуск: ${snapshot.overdue.oldestMedicine}.`);
    }

    if (snapshot.nextReminder?.medicine) {
        const nextAt = new Date(snapshot.nextReminder.time).toLocaleString('ru-RU');
        lines.push(`Ближайший приём: ${snapshot.nextReminder.medicine} (${nextAt}).`);
    }

    if (location) {
        const mapsLink = `https://yandex.ru/maps/?pt=${location.lon},${location.lat}&z=16&l=map`;
        lines.push(`Геопозиция: ${mapsLink}`);
        if (Number.isFinite(location.accuracy)) {
            lines.push(`Точность геопозиции: ±${Math.round(location.accuracy)} м.`);
        }
    } else {
        lines.push('Геопозиция недоступна (нет доступа или таймаут).');
    }

    lines.push('Рекомендуем срочно связаться с пациентом.');
    return lines.join('\n');
}

function updateEmergencyAlertButtonState() {
    const button = document.getElementById('emergencyAlertButton');
    const hint = document.getElementById('emergencyAlertHint');
    if (emergencyAlertCooldownTimer) {
        window.clearTimeout(emergencyAlertCooldownTimer);
        emergencyAlertCooldownTimer = null;
    }
    if (!button || !hint) return;

    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        button.disabled = true;
        hint.textContent = 'Войдите в аккаунт, чтобы использовать SOS.';
        return;
    }

    const userData = getUserData(currentUser.email);
    const careSettings = getTelegramCareSettings(userData);
    const hasTelegramSetup = Boolean(careSettings.botToken) && careSettings.recipients.length > 0;
    const cooldownLeft = getEmergencyCooldownRemainingMs(careSettings);

    button.disabled = !hasTelegramSetup || cooldownLeft > 0;
    if (!hasTelegramSetup) {
        hint.textContent = 'Настройте Telegram-контакты в профиле, чтобы SOS отправлялся родственникам.';
        return;
    }

    if (cooldownLeft > 0) {
        hint.textContent = `Повторная отправка будет доступна через ${formatEmergencyCooldown(cooldownLeft)}.`;
        emergencyAlertCooldownTimer = window.setTimeout(() => {
            if (currentSection === 'medicines') {
                updateEmergencyAlertButtonState();
            }
        }, 1000);
        return;
    }

    hint.textContent = 'При нажатии отправится срочное сообщение родственникам с текущим статусом и геопозицией.';
}

async function sendEmergencyAlertToRelatives() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) {
        showToast('Профиль пользователя не найден.', 'error');
        return;
    }

    const careSettings = getTelegramCareSettings(userData);
    if (!careSettings.botToken || careSettings.recipients.length === 0) {
        showToast('Настройте Telegram Bot Token и контакты родственников в профиле.', 'warning');
        showSection('profile');
        return;
    }

    const cooldownLeft = getEmergencyCooldownRemainingMs(careSettings);
    if (cooldownLeft > 0) {
        showToast(`Повторная SOS-отправка доступна через ${formatEmergencyCooldown(cooldownLeft)}.`, 'info');
        updateEmergencyAlertButtonState();
        return;
    }

    const button = document.getElementById('emergencyAlertButton');
    const previousLabel = button?.innerHTML || '';
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Отправка...';
    }

    try {
        const snapshot = getEmergencyMedicationSnapshot();
        const location = await tryGetEmergencyLocation();
        const message = buildTelegramEmergencyMessage(userData, snapshot, location);
        const result = await broadcastTelegramTextMessage(careSettings, message);

        if (result.successCount > 0) {
            updateTelegramCareSettingsForCurrentUser({
                emergencyState: { lastSentAt: Date.now() },
                lastError: result.failures[0] || ''
            });

            if (result.failures.length > 0) {
                showToast(`SOS отправлен (${result.successCount}), но есть ошибки по части контактов.`, 'warning');
            } else {
                showToast(`SOS отправлен ${result.successCount} контакт(ам).`, 'success');
            }
        } else {
            updateTelegramCareSettingsForCurrentUser({
                lastError: result.failures[0] || 'Не удалось отправить SOS'
            });
            showToast(result.failures[0] || 'Не удалось отправить SOS-сообщение.', 'error');
        }
    } catch (error) {
        updateTelegramCareSettingsForCurrentUser({
            lastError: error?.message || 'Ошибка SOS-уведомления'
        });
        showToast(error?.message || 'Ошибка отправки SOS-сообщения.', 'error');
    } finally {
        if (button) {
            button.innerHTML = previousLabel || '<i class="fas fa-bell me-1"></i>SOS родственникам';
        }
        updateEmergencyAlertButtonState();
    }
}

async function runTelegramCareCheck() {
    if (telegramCareCheckInFlight) return;

    const currentUser = getCurrentUser();
    if (!currentUser?.email) return;

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const notificationsSetting = userData?.settings?.notifications;
    if (notificationsSetting === 'disabled') return;

    const careSettings = getTelegramCareSettings(userData);
    if (!careSettings.enabled || !careSettings.botToken || careSettings.recipients.length === 0) return;

    const redZoneSummary = getRedZoneRiskSummary();
    if (redZoneSummary.isRedZone) {
        await triggerRedZoneTelegramEscalation(redZoneSummary);
    }

    const overdueInfo = getOldestOverdueDoseInfo();
    const nextAlertState = sanitizeTelegramAlertState(careSettings.alertState);
    let settingsChanged = false;
    let lastErrorMessage = '';

    if (!overdueInfo) {
        if (Object.keys(nextAlertState.lastSentByLevel).length > 0) {
            nextAlertState.lastSentByLevel = {};
            settingsChanged = true;
        }
        if (settingsChanged) {
            updateTelegramCareSettingsForCurrentUser({ alertState: nextAlertState, lastError: '' });
        }
        return;
    }

    telegramCareCheckInFlight = true;
    try {
        for (const thresholdHours of TELEGRAM_CARE_THRESHOLDS_HOURS) {
            const thresholdMs = thresholdHours * 60 * 60 * 1000;
            if (overdueInfo.ageMs < thresholdMs) continue;

            const lastAnchor = Number(nextAlertState.lastSentByLevel[thresholdHours] || 0);
            if (lastAnchor === overdueInfo.oldestTimestamp) continue;

            const result = await broadcastTelegramCareAlert(userData, careSettings, {
                overdueInfo,
                thresholdHours,
                isTest: false
            });

            if (result.successCount > 0) {
                nextAlertState.lastSentByLevel[thresholdHours] = overdueInfo.oldestTimestamp;
                settingsChanged = true;
            }

            if (result.failures.length > 0) {
                settingsChanged = true;
                if (!lastErrorMessage) {
                    lastErrorMessage = result.failures[0];
                }
            }
        }

        if (settingsChanged) {
            updateTelegramCareSettingsForCurrentUser({
                alertState: nextAlertState,
                lastError: lastErrorMessage
            });
        }
    } catch (error) {
        updateTelegramCareSettingsForCurrentUser({
            alertState: nextAlertState,
            lastError: error?.message || 'Ошибка фоновой проверки Telegram-уведомлений'
        });
    } finally {
        telegramCareCheckInFlight = false;
    }
}

function startTelegramCareWatcher() {
    if (telegramCareInterval) {
        window.clearInterval(telegramCareInterval);
        telegramCareInterval = null;
    }

    telegramCareInterval = window.setInterval(() => {
        void runTelegramCareCheck();
    }, TELEGRAM_CARE_CHECK_INTERVAL_MS);

    void runTelegramCareCheck();
}

function toggleTelegramTokenVisibility() {
    const input = document.getElementById('telegramBotTokenInput');
    const icon = document.getElementById('telegramTokenToggleIcon');
    if (!input || !icon) return;

    const shouldShow = input.type === 'password';
    input.type = shouldShow ? 'text' : 'password';
    icon.className = `fas ${shouldShow ? 'fa-eye-slash' : 'fa-eye'}`;
}

function getTelegramCareSettingsFromProfileInputs() {
    const enabledCheckbox = document.getElementById('telegramCareEnabledInput');
    const botTokenInput = document.getElementById('telegramBotTokenInput');
    const recipientsInput = document.getElementById('telegramRelativesInput');

    return sanitizeTelegramCareSettings({
        enabled: Boolean(enabledCheckbox?.checked),
        botToken: botTokenInput?.value || '',
        recipients: parseTelegramRecipientsInput(recipientsInput?.value || '')
    });
}

function saveTelegramCareSettings() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        return;
    }

    const settings = getTelegramCareSettingsFromProfileInputs();
    if (settings.enabled) {
        if (!settings.botToken) {
            showToast('Укажите Telegram Bot Token.', 'error');
            return;
        }
        if (settings.recipients.length === 0) {
            showToast('Добавьте хотя бы один контакт родственника.', 'error');
            return;
        }
    }

    updateTelegramCareSettingsForCurrentUser({
        enabled: settings.enabled,
        botToken: settings.botToken,
        recipients: settings.recipients,
        lastError: ''
    });
    maybeUnlockAchievements({
        showPopup: true,
        refreshProfile: true
    });
    startTelegramCareWatcher();
    updateEmergencyAlertButtonState();
    showToast('Контакты для Telegram-уведомлений сохранены.', 'success');
}

async function sendTelegramCareTestMessage() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Сначала войдите в аккаунт.', 'error');
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) {
        showToast('Профиль пользователя не найден.', 'error');
        return;
    }

    const settings = getTelegramCareSettingsFromProfileInputs();
    if (!settings.botToken || settings.recipients.length === 0) {
        showToast('Для теста укажите токен бота и хотя бы один контакт.', 'error');
        return;
    }

    const overdueInfo = getOldestOverdueDoseInfo() || {
        oldestTimestamp: Date.now(),
        oldestMedicine: medicines[0]?.name || 'Лекарство',
        overdueCount: 0,
        ageMs: 0
    };

    try {
        const result = await broadcastTelegramCareAlert(userData, settings, {
            overdueInfo,
            thresholdHours: 24,
            isTest: true
        });

        updateTelegramCareSettingsForCurrentUser({
            enabled: settings.enabled,
            botToken: settings.botToken,
            recipients: settings.recipients,
            lastError: result.failures[0] || ''
        });

        if (result.successCount > 0) {
            showToast(`Тест отправлен: ${result.successCount} контакт(ам).`, 'success');
        } else {
            showToast(result.failures[0] || 'Тестовое сообщение не отправлено.', 'error');
        }
    } catch (error) {
        showToast(error?.message || 'Не удалось отправить тестовое сообщение.', 'error');
    }
}

function renderCourseSafetyWarnings() {
    const container = document.getElementById('courseSafetyWarnings');
    if (!container || typeof findCourseSafetyWarnings !== 'function') return;

    const warnings = findCourseSafetyWarnings(medicines);
    if (warnings.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = warnings.map(warning => `
        <div class="safety-warning-card safety-warning-card--${warning.severity}">
            <div class="safety-warning-card__header">
                <i class="fas ${warning.severity === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}"></i>
                <strong>${escapeHtml(warning.title)}</strong>
            </div>
            <p class="mb-2">${escapeHtml(warning.message)}</p>
            <p class="mb-2"><strong>Обнаружены препараты:</strong> ${warning.medicines.map(name => escapeHtml(name)).join(', ')}</p>
            <small>Автоматическая проверка не заменяет врача. При сомнениях пересмотрите схему лечения со специалистом.</small>
        </div>
    `).join('');
}

function getSortedMedicineSchedule(med) {
    if (!Array.isArray(med?.schedule)) return [];
    return med.schedule
        .map(Number)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
}

function getRedZoneRiskSummary(referenceTime = Date.now()) {
    const criticalItems = [];
    let totalOverdueDoses = 0;
    let highestStreak = 0;

    medicines.forEach(med => {
        const schedule = getSortedMedicineSchedule(med);
        if (schedule.length === 0) return;

        const pastDoses = schedule.filter(timestamp => timestamp <= referenceTime);
        if (pastDoses.length === 0) return;

        let ongoingMissedStreak = 0;
        let maxMissedStreak = 0;
        let overdueDoses = 0;
        let streakStartAt = null;
        let currentStreakStartAt = null;
        let lastMissedAt = null;

        pastDoses.forEach(timestamp => {
            const isTaken = Boolean(med.taken && med.taken[timestamp]);
            if (isTaken) {
                ongoingMissedStreak = 0;
                currentStreakStartAt = null;
                return;
            }

            overdueDoses += 1;
            totalOverdueDoses += 1;
            lastMissedAt = timestamp;

            if (ongoingMissedStreak === 0) {
                currentStreakStartAt = timestamp;
            }
            ongoingMissedStreak += 1;

            if (ongoingMissedStreak > maxMissedStreak) {
                maxMissedStreak = ongoingMissedStreak;
            }
        });

        highestStreak = Math.max(highestStreak, maxMissedStreak);

        if (ongoingMissedStreak >= RED_ZONE_STREAK_THRESHOLD) {
            streakStartAt = currentStreakStartAt || pastDoses[pastDoses.length - 1];
            criticalItems.push({
                id: med.id,
                name: med.name || 'Лекарство',
                ongoingMissedStreak,
                overdueDoses,
                streakStartAt,
                lastMissedAt
            });
        }
    });

    criticalItems.sort((a, b) => b.ongoingMissedStreak - a.ongoingMissedStreak || b.overdueDoses - a.overdueDoses);

    const signature = criticalItems
        .map(item => `${item.id}:${item.ongoingMissedStreak}:${item.streakStartAt || 0}`)
        .join('|');

    return {
        isRedZone: criticalItems.length > 0,
        criticalItems,
        totalOverdueDoses,
        highestStreak,
        signature
    };
}

function getRestockForecastSummary(referenceTime = Date.now()) {
    const dayMs = 24 * 60 * 60 * 1000;
    const plannerSettings = getPlannerSettings(getFullCurrentUser());
    const warningDays = normalizeAutoRestockTargetDays(plannerSettings.autoRestockTargetDays || RESTOCK_WARNING_DAYS);
    const urgentItems = [];
    let totalNeedToBuy = 0;
    let outOfStockCount = 0;
    let monitoredCount = 0;

    medicines.forEach(med => {
        const schedule = getSortedMedicineSchedule(med);
        const hasStock = Number.isFinite(Number(med.tabletsInStock));
        if (!hasStock || schedule.length === 0) return;

        monitoredCount += 1;

        const totalStock = Math.max(0, Math.round(Number(med.tabletsInStock)));
        const leftStock = Math.max(0, Math.min(Math.round(Number(med.tabletsLeft ?? totalStock)), totalStock));
        const upcomingUntaken = schedule.filter(timestamp => timestamp >= referenceTime && !(med.taken && med.taken[timestamp]));
        if (upcomingUntaken.length === 0) return;

        const totalCourseDays = Math.max(1, Math.ceil(((schedule[schedule.length - 1] - schedule[0]) / dayMs)) + 1);
        const estimatedDosesPerDay = Math.max(1, Math.round(schedule.length / totalCourseDays));
        const daysLeft = leftStock / estimatedDosesPerDay;
        const directDeficit = Math.max(0, upcomingUntaken.length - leftStock);

        const requiresAttention = leftStock <= 0 || directDeficit > 0 || daysLeft <= warningDays;
        if (!requiresAttention) return;

        if (leftStock <= 0) {
            outOfStockCount += 1;
        }

        const recommendedBuy = directDeficit > 0
            ? directDeficit
            : Math.max(1, Math.ceil((estimatedDosesPerDay * warningDays) - leftStock));

        totalNeedToBuy += recommendedBuy;

        urgentItems.push({
            id: med.id,
            name: med.name || 'Лекарство',
            leftStock,
            estimatedDosesPerDay,
            daysLeft,
            upcomingUntaken: upcomingUntaken.length,
            directDeficit,
            recommendedBuy
        });
    });

    urgentItems.sort((a, b) => {
        if (a.directDeficit !== b.directDeficit) return b.directDeficit - a.directDeficit;
        if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
        return a.leftStock - b.leftStock;
    });

    return {
        warningDays,
        autoRestockEnabled: plannerSettings.autoRestockEnabled !== false,
        monitoredCount,
        urgentItems,
        outOfStockCount,
        totalNeedToBuy
    };
}

function buildRedZoneTelegramMessage(userData, summary) {
    const nowText = new Date().toLocaleString('ru-RU');
    const patientName = userData?.name || 'Пользователь';
    const topItems = summary.criticalItems.slice(0, 5);

    return [
        'КРАСНАЯ ЗОНА SmartАптечки.',
        `Пациент: ${patientName}.`,
        `Время: ${nowText}.`,
        `Обнаружено лекарств с пропусками подряд: ${summary.criticalItems.length}.`,
        `Максимальная серия пропусков: ${summary.highestStreak}.`,
        '',
        ...topItems.map(item => {
            const startText = item.streakStartAt ? new Date(item.streakStartAt).toLocaleString('ru-RU') : 'н/д';
            return `• ${item.name}: подряд ${item.ongoingMissedStreak}, всего просрочек ${item.overdueDoses}, серия с ${startText}`;
        }),
        '',
        'Рекомендуем срочно связаться с пациентом и проверить приём препаратов.'
    ].join('\n');
}

async function triggerRedZoneTelegramEscalation(summary) {
    if (!summary?.isRedZone || redZoneEscalationInFlight) return;

    const currentUser = getCurrentUser();
    if (!currentUser?.email) return;

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const careSettings = getTelegramCareSettings(userData);
    if (!careSettings.enabled || !careSettings.botToken || careSettings.recipients.length === 0) return;

    const alertState = sanitizeTelegramAlertState(careSettings.alertState);
    const nowTs = Date.now();
    const sameSignature = alertState.redZoneSignature === summary.signature;
    const cooldownActive = nowTs - Number(alertState.redZoneSentAt || 0) < RED_ZONE_TELEGRAM_COOLDOWN_MS;
    if (sameSignature && cooldownActive) return;

    redZoneEscalationInFlight = true;
    try {
        const message = buildRedZoneTelegramMessage(userData, summary);
        const result = await broadcastTelegramTextMessage(careSettings, message);

        if (result.successCount > 0) {
            updateTelegramCareSettingsForCurrentUser({
                alertState: {
                    ...alertState,
                    redZoneSignature: summary.signature,
                    redZoneSentAt: nowTs
                },
                lastError: result.failures[0] || ''
            });
            showToast(`Красная зона: предупреждение отправлено ${result.successCount} контакт(ам).`, 'warning');
        } else if (result.failures.length > 0) {
            updateTelegramCareSettingsForCurrentUser({
                lastError: result.failures[0]
            });
        }
    } catch (error) {
        updateTelegramCareSettingsForCurrentUser({
            lastError: error?.message || 'Ошибка авто-эскалации красной зоны'
        });
    } finally {
        redZoneEscalationInFlight = false;
    }
}

function renderRedZoneAlert() {
    const container = document.getElementById('criticalZoneAlert');
    if (!container) return;

    const summary = getRedZoneRiskSummary();
    if (!summary.isRedZone) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="critical-zone-alert alert alert-danger mb-3">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                    <h5 class="mb-2"><i class="fas fa-triangle-exclamation me-2"></i>Красная зона: пропуски приёма подряд</h5>
                    <p class="mb-2">
                        Найдено <strong>${summary.criticalItems.length}</strong> препаратов с серией пропусков от ${RED_ZONE_STREAK_THRESHOLD} и более.
                        Всего просроченных доз: <strong>${summary.totalOverdueDoses}</strong>.
                    </p>
                    <ul class="mb-0 ps-3">
                        ${summary.criticalItems.slice(0, 5).map(item => `
                            <li><strong>${escapeHtml(item.name)}</strong>: подряд ${item.ongoingMissedStreak}, всего просрочек ${item.overdueDoses}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-light" onclick="showSection('profile')">
                        <i class="fas fa-users me-1"></i>Контакты родственников
                    </button>
                    <button class="btn btn-sm btn-dark" onclick="sendEmergencyAlertToRelatives()">
                        <i class="fas fa-bell me-1"></i>SOS родственникам
                    </button>
                </div>
            </div>
        </div>
    `;

    void triggerRedZoneTelegramEscalation(summary);
}

function buildRestockShoppingText(summary) {
    const lines = [
        'Список докупки SmartАптечки:',
        ...summary.urgentItems.map(item => {
            const daysLabel = Number.isFinite(item.daysLeft) ? item.daysLeft.toFixed(1) : '0.0';
            return `- ${item.name}: остаток ${item.leftStock} табл., ~${daysLabel} дн., рекомендовано докупить ${item.recommendedBuy} табл.`;
        }),
        `Итого рекомендовано докупить: ${summary.totalNeedToBuy} табл.`
    ];
    return lines.join('\n');
}

async function copyRestockListToClipboard() {
    const summary = getRestockForecastSummary();
    if (!summary.urgentItems.length) {
        showToast('Список докупки сейчас пуст.', 'info');
        return;
    }

    const text = buildRestockShoppingText(summary);
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            throw new Error('Clipboard API is unavailable');
        }
        showToast('Список докупки скопирован.', 'success');
    } catch (_error) {
        showToast('Не удалось скопировать список. Откройте отчёт вручную.', 'warning');
    }
}

function applyAutoRestockPurchase(medicineId, quantity) {
    const med = medicines.find(item => item.id === medicineId);
    if (!med) return;

    const addQuantity = Math.max(1, Math.round(Number(quantity) || 0));
    const hasStockTracking = Number.isFinite(Number(med.tabletsInStock));
    if (!hasStockTracking) {
        med.tabletsInStock = addQuantity;
        med.tabletsLeft = addQuantity;
    } else {
        const currentStock = Math.max(0, Math.round(Number(med.tabletsInStock)));
        const currentLeft = Math.max(0, Math.round(Number(med.tabletsLeft ?? currentStock)));
        med.tabletsInStock = currentStock + addQuantity;
        med.tabletsLeft = currentLeft + addQuantity;
    }

    saveMedicines();
    showToast(`Запас «${med.name}» пополнен на ${addQuantity} табл.`, 'success');
    showSection('medicines');
}

function applyAutoRestockForAllUrgent() {
    const summary = getRestockForecastSummary();
    if (!summary.urgentItems.length) {
        showToast('Список автозакупки сейчас пуст.', 'info');
        return;
    }

    summary.urgentItems.forEach(item => {
        const med = medicines.find(entry => entry.id === item.id);
        if (!med) return;

        const qty = Math.max(1, Math.round(Number(item.recommendedBuy) || 1));
        const currentStock = Number.isFinite(Number(med.tabletsInStock)) ? Math.max(0, Math.round(Number(med.tabletsInStock))) : 0;
        const currentLeft = Number.isFinite(Number(med.tabletsLeft)) ? Math.max(0, Math.round(Number(med.tabletsLeft))) : currentStock;
        med.tabletsInStock = currentStock + qty;
        med.tabletsLeft = currentLeft + qty;
    });

    saveMedicines();
    showToast('Автозакупка применена для всех критичных позиций.', 'success');
    showSection('medicines');
}

function renderRestockForecastAlert() {
    const container = document.getElementById('restockForecastAlert');
    if (!container) return;

    const summary = getRestockForecastSummary();
    if (!summary.urgentItems.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="restock-forecast-alert alert alert-warning mb-3">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                    <h5 class="mb-2"><i class="fas fa-capsules me-2"></i>Скоро закончатся лекарства</h5>
                    <p class="mb-2">
                        Под контролем препаратов: <strong>${summary.monitoredCount}</strong>. Нужно докупить: <strong>${summary.totalNeedToBuy}</strong> табл.
                        ${summary.outOfStockCount > 0 ? ` Пустых позиций: <strong>${summary.outOfStockCount}</strong>.` : ''}
                    </p>
                    <ul class="mb-0 ps-3">
                        ${summary.urgentItems.slice(0, 6).map(item => `
                            <li>
                                <strong>${escapeHtml(item.name)}</strong>:
                                остаток ${item.leftStock} табл.,
                                примерно на ${item.daysLeft.toFixed(1)} дн.,
                                докупить ${item.recommendedBuy} табл.
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-outline-primary" onclick="copyRestockListToClipboard()">
                        <i class="fas fa-copy me-1"></i>Скопировать список
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="showSection('map')">
                        <i class="fas fa-map-marker-alt me-1"></i>Открыть карту аптек
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==================== ПОИСК ЛЕКАРСТВ ====================
function findMedsBySymptoms(userSymptoms) {
    if (!Array.isArray(userSymptoms) || userSymptoms.length === 0) return [];
    
    if (typeof medsDatabase === 'undefined' || !Array.isArray(medsDatabase)) {
        console.error('❌ База medsDatabase не загружена');
        return [];
    }

    const results = [];
    for (const med of medsDatabase) {
        let matchCount = 0;
        const matchedSymptoms = [];

        for (const dbSymptom of med.symptoms) {
            const dbLower = dbSymptom.toLowerCase();
            for (const userSymptom of userSymptoms) {
                if (dbLower.includes(userSymptom) || userSymptom.includes(dbLower)) {
                    matchCount++;
                    matchedSymptoms.push(dbSymptom);
                    break;
                }
            }
        }

        if (matchCount > 0) {
            results.push({
                ...med,
                matchedSymptoms: matchedSymptoms,
                matchScore: matchCount
            });
        }
    }
    return results.sort((a, b) => b.matchScore - a.matchScore);
}

function displaySearchResults(results, originalQuery, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.setAttribute('aria-live', 'polite');

    if (results.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                По запросу "<strong>${escapeHtml(originalQuery)}</strong>" ничего не найдено.
                <div class="mt-2">Попробуйте:</div>
                <div class="d-flex flex-wrap gap-1 mt-1">
                    <span class="badge bg-light text-dark border" onclick="searchSymptom('головная боль')" style="cursor:pointer">головная боль</span>
                    <span class="badge bg-light text-dark border" onclick="searchSymptom('температура')" style="cursor:pointer">температура</span>
                    <span class="badge bg-light text-dark border" onclick="searchSymptom('кашель')" style="cursor:pointer">кашель</span>
                    <span class="badge bg-light text-dark border" onclick="searchSymptom('насморк')" style="cursor:pointer">насморк</span>
                </div>
            </div>
            ${getMedicalDisclaimerMarkup()}
        `;
        announceForScreenReader(`По запросу ${originalQuery} ничего не найдено`);
        return;
    }

    let html = `
        <div class="alert alert-success">
            <i class="fas fa-search me-2"></i>
            Найдено: <strong>${results.length}</strong> лекарств(о) по запросу "<strong>${escapeHtml(originalQuery)}</strong>"
        </div>
        <div class="row g-3">
    `;

    results.forEach(med => {
        html += `
            <div class="col-12">
                <div class="medicine-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div style="flex-grow: 1;">
                                <h5 class="card-title mb-2">${escapeHtml(med.name)}</h5>
                                ${renderMedicineGroups(med.name)}
                                <div class="mb-3">
                                    <strong>Подходит для:</strong>
                                    <div class="d-flex flex-wrap gap-1 mt-1">
                                        ${med.matchedSymptoms.map(s => 
                                            `<span class="badge bg-success">${escapeHtml(s)}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-primary add-from-search-btn" data-name="${escapeAttribute(med.name)}">
                                    <i class="fas fa-plus me-1"></i>В аптечку
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>${getMedicalDisclaimerMarkup()}`;
    container.innerHTML = html;
    announceForScreenReader(`Найдено ${results.length} вариантов по запросу ${originalQuery}`);
}

function searchSymptom(symptom) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = symptom;
        performMainSearch();
    }
}

function performSymptomsSearch(query = null, targetId = 'symptomsResults') {
    const input = document.getElementById('symptomsInput');
    const queryText = (query !== null) ? query : (input ? input.value.trim() : '');
    const container = document.getElementById(targetId);

    if (!container) return;
    if (!queryText) {
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>Введите симптомы</div>';
        return;
    }

    const symptoms = queryText
        .replace(/[.!?]+/g, ',')
        .replace(/\s+(?:и|или|а также|также|плюс)\s+/g, ',')
        .split(/[,;]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.toLowerCase());

    if (symptoms.length === 0) {
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>Укажите хотя бы один симптом</div>';
        return;
    }

    const results = findMedsBySymptoms(symptoms);
    displaySearchResults(results, queryText, targetId);
}

function performMainSearch() {
    const input = document.getElementById('searchInput');
    if (input) {
        performSymptomsSearch(input.value.trim(), 'searchResults');
    }
}

function performTopSearch() {
    const input = document.getElementById('topSymptomsInput');
    if (input && input.value.trim()) {
        const query = input.value.trim();
        showSection('search');
        setTimeout(() => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = query;
                performMainSearch();
            }
        }, 100);
    }
}

// ==================== ОТОБРАЖЕНИЕ РАЗДЕЛОВ ====================
function showSection(sectionName, event) {
    clearNextReminderTimer();
    if (screenNarrationActive) {
        stopSpeechNarration();
    }

    if (event) {
        document.querySelectorAll('.mobile-navbar button').forEach(btn => {
            btn.classList.remove('active', 'text-primary');
        });
        document.querySelectorAll('.btn-nav').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.currentTarget.classList.add('active');
        if (event.currentTarget.closest('.mobile-navbar')) {
            event.currentTarget.classList.add('text-primary');
        }
    }

    const content = document.getElementById('content');
    if (!content) return;

    switch(sectionName) {
        case 'medicines':
            const nextReminder = findNextReminder();
            const currentUser = getCurrentUser();
            const { activeCourses, takenDoses, adherenceRate: dashboardAdherenceRate } = getMedicineStats();
            const familyContext = currentUser ? getActiveFamilyContext() : { family: null, profile: null };
            const activeProfileName = familyContext?.profile?.name || 'Мой профиль';
            const firstName = currentUser?.name ? escapeHtml(currentUser.name.split(' ')[0]) : 'друг';
            
            content.innerHTML = `
                <div class="dashboard-hero">
                    <div class="dashboard-hero__content">
                        <span class="dashboard-badge">
                            <i class="fas fa-shield-heart me-2"></i>Умная домашняя аптечка
                        </span>
                        <h2>${currentUser ? `${firstName}, держим лечение под контролем.` : 'Соберите аптечку, которая действительно помогает.'}</h2>
                        <p>Добавляйте лекарства, отслеживайте курс, ищите по симптомам и распознавайте упаковки по фото в одном аккуратном интерфейсе.</p>
                        <div class="dashboard-actions">
                            <button class="btn btn-primary" onclick="showSection('add')">
                                <i class="fas fa-plus me-1"></i>Добавить лекарство
                            </button>
                            <button class="btn btn-outline-light dashboard-outline" onclick="showSection('ocr')">
                                <i class="fas fa-camera me-1"></i>Сканировать фото
                            </button>
                        </div>
                    </div>
                    <div class="dashboard-highlights">
                        <div class="dashboard-highlight">
                            <span class="dashboard-highlight__label">Лекарств в аптечке</span>
                            <strong>${medicines.length}</strong>
                        </div>
                        <div class="dashboard-highlight">
                            <span class="dashboard-highlight__label">Активных курсов</span>
                            <strong>${activeCourses.length}</strong>
                        </div>
                        <div class="dashboard-highlight">
                            <span class="dashboard-highlight__label">Приверженность</span>
                            <strong>${dashboardAdherenceRate}%</strong>
                        </div>
                        <div class="dashboard-highlight">
                            <span class="dashboard-highlight__label">Принято доз</span>
                            <strong>${takenDoses}</strong>
                        </div>
                    </div>
                </div>

                ${!currentUser ? `
                <div class="alert alert-info d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                    <div>
                        <i class="fas fa-user-lock me-2"></i>
                        Чтобы сохранить аптечку и настройки, войдите в аккаунт.
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="showAuthModal()">
                        <i class="fas fa-sign-in-alt me-1"></i>Войти
                    </button>
                </div>
                ` : ''}

                ${currentUser ? `
                <div class="family-profile-banner alert alert-primary d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                        <i class="fas fa-users me-2"></i>
                        Активный профиль семьи: <strong>${escapeHtml(activeProfileName)}</strong>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="showSection('profile')">
                        <i class="fas fa-user-gear me-1"></i>Сменить
                    </button>
                </div>
                ` : ''}
                
                ${nextReminder ? `
                <div class="alert alert-warning d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <i class="fas fa-clock me-2"></i>
                        <strong>Следующий приём:</strong> ${escapeHtml(nextReminder.medicine)}
                        <br><small id="nextReminderStatus">${getReminderStatusText(nextReminder.time)}</small>
                        <div class="small text-muted mt-1" id="nextReminderHint"></div>
                    </div>
                    <button class="btn btn-sm btn-success" id="nextReminderButton" onclick="markAsTaken('${nextReminder.id}', ${nextReminder.time})">
                        <i class="fas fa-hourglass-half me-1"></i>Ожидание
                    </button>
                </div>
                ` : ''}

                ${currentUser ? `
                <div class="emergency-alert-card mb-4">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <strong><i class="fas fa-triangle-exclamation me-2"></i>Экстренный сигнал родственникам</strong>
                            <div class="small text-muted mt-1" id="emergencyAlertHint"></div>
                        </div>
                        <button class="btn btn-danger btn-sm" id="emergencyAlertButton" onclick="sendEmergencyAlertToRelatives()">
                            <i class="fas fa-bell me-1"></i>SOS родственникам
                        </button>
                    </div>
                </div>
                ` : ''}

                <div id="criticalZoneAlert"></div>
                <div id="restockForecastAlert"></div>

                <div class="summary-strip mb-4">
                    <div class="summary-chip">
                        <i class="fas fa-bolt"></i>
                        <span>Быстрое добавление и напоминания</span>
                    </div>
                    <div class="summary-chip">
                        <i class="fas fa-magnifying-glass"></i>
                        <span>Поиск по симптомам и OCR</span>
                    </div>
                    <div class="summary-chip">
                        <i class="fas fa-download"></i>
                        <span>Экспорт и импорт данных</span>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-pills me-2"></i>Мои лекарства</h3>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="sortMedicines('name')">
                            <i class="fas fa-sort-alpha-down me-1"></i>По имени
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="sortMedicines('date')">
                            <i class="fas fa-calendar-alt me-1"></i>По дате
                        </button>
                    </div>
                </div>
                <div id="medicineList"></div>
                <div id="courseSafetyWarnings" class="mt-4"></div>
            `;
            loadMedicines();
            if (nextReminder) {
                setupNextReminderTimer(nextReminder);
            }
            updateEmergencyAlertButtonState();
            renderRedZoneAlert();
            renderRestockForecastAlert();
            break;

        case 'search':
            content.innerHTML = `
                <div class="section-intro">
                    <span class="section-intro__eyebrow">Подбор лекарства</span>
                    <h3><i class="fas fa-search me-2"></i>Поиск по симптомам</h3>
                    <p class="text-muted mb-3">Укажите симптомы через запятую, и SmartАптечка подберёт подходящие препараты из базы.</p>
                </div>
                <div class="row g-2 align-items-stretch mb-3 search-controls-row">
                    <div class="col-12 col-md-7">
                        <input type="text" class="form-control" placeholder="Введите симптомы через запятую..." id="searchInput" aria-label="Поле для поиска лекарств по симптомам">
                    </div>
                    <div class="col-12 col-md-3 d-grid">
                        <button class="btn btn-primary w-100 search-main-btn" onclick="performMainSearch()">
                            <i class="fas fa-search me-1"></i>Найти
                        </button>
                    </div>
                    <div class="col-12 col-md-2 d-grid">
                        <button class="btn btn-outline-primary w-100 voice-search-btn" id="voiceSearchButton" onclick="startVoiceSymptomsSearch()" aria-pressed="false" aria-label="Голосовой ввод симптомов">
                            <i class="fas fa-microphone me-1"></i>Голос
                        </button>
                    </div>
                </div>
                <div class="small text-muted mb-3">
                    <i class="fas fa-circle-info me-1"></i>Можно нажать «Голос» и продиктовать симптомы, затем поиск выполнится автоматически.
                </div>
                ${getMedicalDisclaimerMarkup()}
                <div id="searchResults"></div>
                <div class="mt-4">
                    <h5><i class="fas fa-fire me-2"></i>Популярные симптомы:</h5>
                    <div id="popularSymptoms" class="d-flex flex-wrap gap-2 mt-2"></div>
                </div>
            `;
            showPopularSymptoms();
            updateVoiceSearchButtonState(false);
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        performMainSearch();
                    }
                });
                searchInput.focus();
            }
            break;

        case 'add':
            const plannerSettingsForAdd = getPlannerSettings(getFullCurrentUser());
            content.innerHTML = `
                <div class="section-intro">
                    <span class="section-intro__eyebrow">Новая запись</span>
                    <h3><i class="fas fa-plus-circle me-2"></i>Добавить лекарство</h3>
                    <p class="text-muted mb-3">Создайте карточку препарата, настройте длительность курса и начните отслеживание приёма.</p>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label"><i class="fas fa-pills me-1"></i>Название лекарства</label>
                            <input type="text" class="form-control" placeholder="Например: Парацетамол" id="medicineNameInput">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><i class="fas fa-stethoscope me-1"></i>Симптомы (через запятую)</label>
                            <input type="text" class="form-control" placeholder="головная боль, температура" id="addSymptomsInput">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><i class="fas fa-clock me-1"></i>Количество приёмов в день</label>
                            <select class="form-select" id="dosesPerDay">
                                <option value="1">1 раз в день</option>
                                <option value="2">2 раза в день</option>
                                <option value="3" selected>3 раза в день</option>
                                <option value="4">4 раза в день</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label"><i class="fas fa-list-check me-1"></i>Режим приёма</label>
                            <select class="form-select" id="intakePlannerMode">
                                ${buildIntakePlannerModeOptions(plannerSettingsForAdd.defaultMode)}
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label"><i class="fas fa-weight-hanging me-1"></i>Дозировка одной таблетки (мг)</label>
                            <input type="number" class="form-control" placeholder="Например: 500" id="medicineDoseMg" min="1" step="1" value="500">
                        </div>

                        <div class="mb-3">
                            <label class="form-label"><i class="fas fa-capsules me-1"></i>Количество таблеток в наличии</label>
                            <input type="number" class="form-control" placeholder="Например: 20" id="medicineStockCount" min="1" step="1" value="20">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><i class="fas fa-calendar me-1"></i>Срок приёма (дней)</label>
                            <input type="number" class="form-control" placeholder="Например: 7" id="durationDays" min="1" value="7">
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label"><i class="fas fa-calendar-day me-1"></i>Начало приёма</label>
                            <input type="datetime-local" class="form-control" id="startDate">
                        </div>
                        
                        <button class="btn btn-success w-100" onclick="addMedicine()">
                            <i class="fas fa-plus me-1"></i>Добавить в аптечку
                        </button>
                    </div>
                </div>
            `;
            const now = new Date();
            const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('startDate').value = local;
            break;

        case 'profile':
            let profileUser = getFullCurrentUser();
            if (!profileUser) {
                content.innerHTML = `
                    <div class="profile-section">
                        <h3><i class="fas fa-user me-2"></i>Профиль</h3>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Для доступа к профилю необходимо войти в систему.
                        </div>
                        <button class="btn btn-primary" onclick="showAuthModal()">
                            <i class="fas fa-sign-in-alt me-1"></i>Войти или зарегистрироваться
                        </button>
                    </div>
                `;
                break;
            }

            maybeUnlockAchievements({
                showPopup: false,
                refreshProfile: false
            });
            profileUser = getFullCurrentUser() || profileUser;

            const activeMeds = medicines.filter(m => m.schedule && m.schedule.length > 0);
            const takenMeds = medicines.reduce((sum, med) => {
                return sum + (med.taken ? Object.values(med.taken).filter(v => v).length : 0);
            }, 0);
            const totalMeds = medicines.reduce((sum, med) => {
                return sum + (med.schedule ? med.schedule.length : 0);
            }, 0);
            const adherenceRate = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 0;
            const gamification = getGamificationState(profileUser);
            const familyState = getFamilyStorage(profileUser);
            const activeFamilyProfile = familyState.profiles.find(profile => profile.id === familyState.activeProfileId) || familyState.profiles[0];
            const plannerSettings = getPlannerSettings(profileUser);
            const autoBackupHint = getLatestAutoBackupHint();
            const achievementSnapshot = getAchievementSnapshot(profileUser);
            const avatarMarkup = getUserAvatarMarkup(profileUser);
            const avatarStyle = profileUser?.avatar?.type === 'image'
                ? 'style="background: transparent;"'
                : profileUser?.avatar?.type === 'color'
                    ? `style="background: ${escapeAttribute(profileUser.avatar.data)};"`
                    : '';
            
            content.innerHTML = `
                <div class="profile-section">
                    <div class="user-header">
                        <div class="user-avatar-large" ${avatarStyle}>
                            ${avatarMarkup}
                        </div>
                        <div class="user-info">
                            <span class="profile-eyebrow">Личный профиль</span>
                            <h3>${escapeHtml(profileUser.name)}</h3>
                            <p class="text-muted mb-1">
                                <i class="fas fa-envelope me-1"></i>${escapeHtml(profileUser.email)}
                            </p>
                            <p class="text-muted">
                                <i class="fas fa-calendar me-1"></i>Зарегистрирован: ${formatDate(profileUser.createdAt)}
                            </p>
                        </div>
                        <div class="profile-header-actions">
                            <button class="btn btn-outline-primary" onclick="showAvatarModal()">
                                <i class="fas fa-image me-1"></i>Аватар
                            </button>
                            <button class="btn btn-outline-danger" onclick="logout()">
                                <i class="fas fa-sign-out-alt me-1"></i>Выйти
                            </button>
                        </div>
                    </div>
                    
                    <div class="user-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-pills"></i>
                            </div>
                            <h4>${medicines.length}</h4>
                            <p class="text-muted mb-0">Всего лекарств</p>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h4>${takenMeds}</h4>
                            <p class="text-muted mb-0">Принято лекарств</p>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <h4>${adherenceRate}%</h4>
                            <p class="text-muted mb-0">Приверженность лечению</p>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <h4>${activeMeds.length}</h4>
                            <p class="text-muted mb-0">Активных курсов</p>
                        </div>

                        <div class="stat-card">
                            <div class="stat-icon chicken-coin-stat-icon">
                                <span class="chicken-coin" aria-hidden="true"><i class="fas fa-kiwi-bird"></i></span>
                            </div>
                            <h4>${gamification.coins}</h4>
                            <p class="text-muted mb-0">Монет с курочкой</p>
                        </div>
                    </div>

                    <div class="gamification-panel mt-4">
                        <div class="gamification-panel__header">
                            <div>
                                <h5 class="mb-1"><i class="fas fa-coins me-2"></i>Ежедневные награды</h5>
                                <p class="text-muted mb-0">За вход начисляются монеты. Стрик растет до 7 дней подряд, затем цикл повторяется.</p>
                            </div>
                            <div class="gamification-balance" title="Баланс монет">
                                <span class="chicken-coin" aria-hidden="true"><i class="fas fa-kiwi-bird"></i></span>
                                <strong>${gamification.coins}</strong>
                                <small>монет</small>
                            </div>
                        </div>

                        <div class="streak-track mt-3">
                            ${Array.from({ length: 7 }, (_, idx) => {
                                const day = idx + 1;
                                const isActive = gamification.loginStreak >= day;
                                const reward = getDailyLoginRewardCoins(day);
                                return `
                                    <div class="streak-day ${isActive ? 'is-active' : ''}">
                                        <span class="streak-day__index">День ${day}</span>
                                        <span class="streak-day__reward">+${reward}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div class="customization-shop mt-4">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                <h6 class="mb-0"><i class="fas fa-palette me-2"></i>Магазин кастомизации</h6>
                                <button class="btn btn-sm btn-outline-secondary" onclick="resetActiveCustomization()">
                                    Стандартный стиль
                                </button>
                            </div>
                            <div class="customization-grid">
                                ${CUSTOMIZATION_CATALOG.map(item => {
                                    const isUnlocked = gamification.unlockedCustomizations.includes(item.id);
                                    const isActive = gamification.activeCustomization === item.id;
                                    const canBuy = gamification.coins >= item.cost;
                                    const actionButton = isUnlocked
                                        ? `<button class="btn btn-sm ${isActive ? 'btn-success' : 'btn-outline-success'}" onclick="activateCustomizationItem('${escapeAttribute(item.id)}')" ${isActive ? 'disabled' : ''}>${isActive ? 'Активно' : 'Применить'}</button>`
                                        : `<button class="btn btn-sm ${canBuy ? 'btn-primary' : 'btn-outline-secondary'}" onclick="purchaseCustomizationItem('${escapeAttribute(item.id)}')" ${canBuy ? '' : 'disabled'}>${canBuy ? 'Купить' : 'Недостаточно монет'}</button>`;

                                    return `
                                        <div class="customization-card ${isActive ? 'is-active' : ''}">
                                            <div class="d-flex justify-content-between align-items-start gap-2">
                                                <div>
                                                    <h6 class="mb-1">${escapeHtml(item.name)}</h6>
                                                    <p class="text-muted small mb-2">${escapeHtml(item.description)}</p>
                                                </div>
                                                <span class="customization-card__cost"><span class="chicken-coin" aria-hidden="true"><i class="fas fa-kiwi-bird"></i></span>${item.cost}</span>
                                            </div>
                                            ${actionButton}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="health-progress">
                        <h5><i class="fas fa-chart-bar me-2"></i>Прогресс лечения</h5>
                        ${activeMeds.length > 0 ? activeMeds.map(med => {
                            const total = med.schedule ? med.schedule.length : 0;
                            const taken = med.schedule && med.taken ? 
                                Object.values(med.taken).filter(v => v).length : 0;
                            const progress = total ? Math.round((taken / total) * 100) : 0;
                            return `
                                <div class="progress-item">
                                    <div class="progress-label">
                                        <span>${escapeHtml(med.name)}</span>
                                        <span>${taken}/${total} (${progress}%)</span>
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar" role="progressbar" style="width: ${progress}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('') : `
                            <div class="empty-inline-state">
                                <i class="fas fa-seedling me-2"></i>
                                Добавьте курс лечения, и здесь появится наглядный прогресс.
                            </div>
                        `}
                    </div>
                    
                    <div class="mt-4">
                        <h5>
                            <i class="fas fa-trophy me-2"></i>Достижения
                            <small class="text-muted">(${achievementSnapshot.unlockedCount}/${achievementSnapshot.total})</small>
                        </h5>
                        <div class="achievements">
                            ${achievementSnapshot.items.map(ach => `
                                <div class="achievement ${ach.unlocked ? 'unlocked' : 'locked'}">
                                    <div class="achievement-icon">
                                        <i class="fas ${escapeAttribute(ach.icon || 'fa-trophy')}" aria-hidden="true"></i>
                                    </div>
                                    <h6 class="mb-1">${escapeHtml(ach.name)}</h6>
                                    <p class="text-muted small mb-2">${escapeHtml(ach.description)}</p>
                                    <span class="achievement-status ${ach.unlocked ? 'is-unlocked' : 'is-locked'}">
                                        ${ach.unlocked ? 'Разблокировано' : 'В процессе'}
                                    </span>
                                </div>
                            `).join('')}
                            
                            ${achievementSnapshot.items.length === 0 ? `
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Выполняйте рекомендации по приёму лекарств, чтобы получить достижения!
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h5><i class="fas fa-cog me-2"></i>Настройки</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Получать уведомления о приёме</label>
                                    <select class="form-select" id="notificationSetting">
                                        <option value="enabled" selected>Включено</option>
                                        <option value="disabled">Выключено</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Тема интерфейса</label>
                                    <select class="form-select" id="themeSetting">
                                        <option value="light" selected>Светлая</option>
                                        <option value="dark">Тёмная</option>
                                        <option value="auto">Авто</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="telegram-care-card mt-2">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                <h6 class="mb-0"><i class="fab fa-telegram-plane me-2"></i>Контакты родственников (Telegram)</h6>
                                <div class="form-check form-switch mb-0">
                                    <input class="form-check-input" type="checkbox" role="switch" id="telegramCareEnabledInput">
                                    <label class="form-check-label" for="telegramCareEnabledInput">Включить автооповещение 24/48/72 ч</label>
                                </div>
                            </div>
                            <p class="text-muted small mb-2">Укажите Telegram-бота и контакты родственников. Если приём не подтверждён 24, 48 или 72 часа, бот отправит предупреждение. Токен хранится только в памяти текущей вкладки и не записывается в localStorage.</p>
                            <div class="mb-3">
                                <label class="form-label">Telegram Bot Token</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="telegramBotTokenInput" placeholder="Например: 123456789:AA...">
                                    <button type="button" class="btn btn-outline-secondary" onclick="toggleTelegramTokenVisibility()" aria-label="Показать токен">
                                        <i class="fas fa-eye" id="telegramTokenToggleIcon"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Контакты родственников</label>
                                <textarea class="form-control" id="telegramRelativesInput" rows="3" placeholder="@mama&#10;@brother&#10;-1001234567890"></textarea>
                                <small class="text-muted d-block mt-1">Можно указать @username (каждый с новой строки) или chat_id. Для @username контакт должен сначала написать вашему боту команду /start.</small>
                            </div>
                            <div class="d-flex flex-wrap gap-2">
                                <button class="btn btn-outline-primary" id="telegramCareSaveButton" onclick="saveTelegramCareSettings()">
                                    <i class="fas fa-floppy-disk me-1"></i>Сохранить контакты
                                </button>
                                <button class="btn btn-outline-success" id="telegramCareTestButton" onclick="sendTelegramCareTestMessage()">
                                    <i class="fas fa-paper-plane me-1"></i>Отправить тест
                                </button>
                            </div>
                            <small class="text-muted d-block mt-2" id="telegramCareStatusText"></small>
                        </div>

                        <div class="family-mode-card mt-3">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                <h6 class="mb-0"><i class="fas fa-people-roof me-2"></i>Семейный режим</h6>
                                <span class="badge bg-primary-subtle text-primary">Профилей: ${familyState.profiles.length}</span>
                            </div>
                            <p class="text-muted small mb-2">
                                Профили семьи сейчас работают внутри вашего аккаунта (локально): имя + роль родственника.
                                Привязка разных аккаунтов по email будет отдельным серверным режимом.
                            </p>
                            <div class="row g-2 align-items-end">
                                <div class="col-md-7">
                                    <label class="form-label">Активный профиль</label>
                                    <select class="form-select" id="activeFamilyProfileSelect">
                                        ${familyState.profiles.map(profile => `
                                            <option value="${escapeAttribute(profile.id)}" ${profile.id === familyState.activeProfileId ? 'selected' : ''}>
                                                ${escapeHtml(profile.name)} (${escapeHtml(profile.relation || 'Семья')})
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="col-md-5 d-grid">
                                    <button class="btn btn-outline-primary" onclick="switchFamilyProfileFromProfile()">
                                        <i class="fas fa-repeat me-1"></i>Переключить профиль
                                    </button>
                                </div>
                            </div>
                            <div class="row g-2 mt-1">
                                <div class="col-md-5">
                                    <label class="form-label">Имя родственника</label>
                                    <input class="form-control" id="familyMemberNameInput" placeholder="Например: Мама">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Роль</label>
                                    <input class="form-control" id="familyMemberRelationInput" placeholder="Например: Родитель">
                                </div>
                                <div class="col-md-3 d-grid">
                                    <button class="btn btn-outline-success mt-md-4" onclick="addFamilyMemberProfile()">
                                        <i class="fas fa-user-plus me-1"></i>Добавить
                                    </button>
                                </div>
                            </div>
                            <div class="family-profile-chips mt-3">
                                ${familyState.profiles.map(profile => `
                                    <div class="family-profile-chip ${profile.id === familyState.activeProfileId ? 'is-active' : ''}">
                                        <div>
                                            <strong>${escapeHtml(profile.name)}</strong>
                                            <small class="text-muted d-block">${escapeHtml(profile.relation || 'Семья')}</small>
                                        </div>
                                        ${profile.id !== DEFAULT_FAMILY_PROFILE_ID ? `
                                            <button class="btn btn-sm btn-outline-danger" onclick="removeFamilyMemberProfile('${escapeAttribute(profile.id)}')" aria-label="Удалить профиль">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        ` : `
                                            <span class="badge bg-secondary-subtle text-secondary">Основной</span>
                                        `}
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="planner-settings-card mt-3">
                            <h6 class="mb-2"><i class="fas fa-calendar-check me-2"></i>Планировщик приёма и автозакупка</h6>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Режим приёма по умолчанию</label>
                                    <select class="form-select" id="defaultIntakePlannerModeInput">
                                        ${buildIntakePlannerModeOptions(plannerSettings.defaultMode)}
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Запас на (дней)</label>
                                    <input type="number" class="form-control" id="autoRestockTargetDaysInput" min="${AUTO_RESTOCK_MIN_TARGET_DAYS}" max="${AUTO_RESTOCK_MAX_TARGET_DAYS}" value="${plannerSettings.autoRestockTargetDays}">
                                </div>
                                <div class="col-md-3 d-flex align-items-end">
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="autoRestockEnabledInput" ${plannerSettings.autoRestockEnabled ? 'checked' : ''}>
                                        <label class="form-check-label" for="autoRestockEnabledInput">Автозакупка</label>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex flex-wrap gap-2 mt-3">
                                <button class="btn btn-outline-primary" onclick="savePlannerSettingsFromProfile()">
                                    <i class="fas fa-floppy-disk me-1"></i>Сохранить планировщик
                                </button>
                                <button class="btn btn-outline-success" onclick="showSection('medicines')">
                                    <i class="fas fa-capsules me-1"></i>Вернуться к курсам
                                </button>
                            </div>
                        </div>

                        <div class="backup-sync-card mt-3">
                            <h6 class="mb-2"><i class="fas fa-cloud-arrow-up me-2"></i>Бэкап и синхронизация</h6>
                            <p class="text-muted small mb-2">
                                Можно передать курсы между устройствами через код синхронизации и восстановиться из автобэкапа.
                            </p>
                            <div class="d-flex flex-wrap gap-2">
                                <button class="btn btn-outline-dark" onclick="copySyncCodeToClipboard()">
                                    <i class="fas fa-link me-1"></i>Код синхронизации
                                </button>
                                <button class="btn btn-outline-info" onclick="importSyncCode()">
                                    <i class="fas fa-paste me-1"></i>Вставить код
                                </button>
                                <button class="btn btn-outline-warning" onclick="restoreLatestAutoBackup()">
                                    <i class="fas fa-rotate-left me-1"></i>Восстановить автобэкап
                                </button>
                            </div>
                            <small class="text-muted d-block mt-2">${escapeHtml(autoBackupHint)}</small>
                        </div>
                        
                        <div class="settings-actions d-flex gap-2 mt-3">
                            <button class="btn btn-outline-danger" onclick="clearAll()">
                                <i class="fas fa-trash me-1"></i>Очистить аптечку
                            </button>
                            <button class="btn btn-outline-secondary" onclick="exportData()">
                                <i class="fas fa-download me-1"></i>Экспорт данных
                            </button>
                            <button class="btn btn-outline-primary" onclick="exportCoursesToPDF()">
                                <i class="fas fa-file-pdf me-1"></i>Экспорт курсов PDF
                            </button>
                            <button class="btn btn-outline-info" onclick="importData()">
                                <i class="fas fa-upload me-1"></i>Импорт данных
                            </button>
                            <button class="btn btn-outline-warning" onclick="changePassword()">
                                <i class="fas fa-key me-1"></i>Сменить пароль
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Загрузка настроек пользователя
            const userSettings = getUserSettings();
            if (userSettings) {
                if (userSettings.notifications) {
                    document.getElementById('notificationSetting').value = userSettings.notifications;
                }
                if (userSettings.theme) {
                    document.getElementById('themeSetting').value = userSettings.theme;
                }
            }
            
            // Сохранение настроек при изменении
            document.getElementById('notificationSetting').addEventListener('change', function() {
                saveUserSetting('notifications', this.value);
                showToast('Настройки уведомлений сохранены', 'success');
            });
            
            document.getElementById('themeSetting').addEventListener('change', function() {
                saveUserSetting('theme', this.value);
                showToast('Настройки темы сохранены', 'success');
                applyTheme(this.value);
            });

            const telegramCareToggle = document.getElementById('telegramCareEnabledInput');
            const telegramTokenInput = document.getElementById('telegramBotTokenInput');
            const telegramRecipientsInput = document.getElementById('telegramRelativesInput');
            const telegramStatusText = document.getElementById('telegramCareStatusText');
            const telegramCareSettings = getTelegramCareSettings(profileUser);

            if (telegramCareToggle && telegramTokenInput && telegramRecipientsInput) {
                telegramCareToggle.checked = Boolean(telegramCareSettings.enabled);
                telegramTokenInput.value = telegramCareSettings.botToken || '';
                telegramRecipientsInput.value = formatTelegramRecipientsForInput(telegramCareSettings.recipients);
                setTelegramCareInputsDisabled(!telegramCareToggle.checked);

                if (telegramStatusText) {
                    telegramStatusText.textContent = telegramCareSettings.lastError
                        ? `Последняя ошибка отправки: ${telegramCareSettings.lastError}`
                        : (!telegramCareSettings.botToken && telegramCareSettings.enabled)
                            ? 'Токен бота не сохраняется в localStorage. После перезагрузки страницы введите его заново.'
                            : 'При включении система проверяет пропуски и отправляет предупреждения на 24, 48 и 72 часах.';
                }

                telegramCareToggle.addEventListener('change', function() {
                    setTelegramCareInputsDisabled(!this.checked);
                });
            }

            const familyProfileSelect = document.getElementById('activeFamilyProfileSelect');
            if (familyProfileSelect) {
                familyProfileSelect.value = familyState.activeProfileId;
                familyProfileSelect.addEventListener('change', () => {
                    switchFamilyProfile(familyProfileSelect.value, { silent: true });
                });
            }

            const autoRestockEnabledInput = document.getElementById('autoRestockEnabledInput');
            const autoRestockTargetDaysInput = document.getElementById('autoRestockTargetDaysInput');
            if (autoRestockEnabledInput && autoRestockTargetDaysInput) {
                autoRestockTargetDaysInput.disabled = !autoRestockEnabledInput.checked;
                autoRestockEnabledInput.addEventListener('change', function() {
                    autoRestockTargetDaysInput.disabled = !this.checked;
                });
            }
            break;

        case 'map':
            content.innerHTML = `
                <div class="section-intro">
                    <span class="section-intro__eyebrow">Навигация</span>
                    <h3><i class="fas fa-map-marker-alt me-2"></i>Карта аптек</h3>
                    <p class="text-muted mb-3">Ищите аптеки рядом с вашим местоположением или в текущей области карты. Маршрут строится в один клик.</p>
                </div>
                <div class="pharmacy-map-toolbar mb-3">
                    <div class="d-flex flex-wrap gap-2 align-items-center">
                        <button class="btn btn-primary btn-sm" id="pharmacyLocateBtn" onclick="locateAndSearchPharmacies()">
                            <i class="fas fa-location-crosshairs me-1"></i>Рядом со мной
                        </button>
                        <button class="btn btn-outline-primary btn-sm" id="pharmacySearchAreaBtn" onclick="searchPharmaciesInCurrentArea()">
                            <i class="fas fa-compass me-1"></i>Искать в этой области
                        </button>
                        <label for="pharmacyRadiusSelect" class="small text-muted mb-0">Радиус:</label>
                        <select id="pharmacyRadiusSelect" class="form-select form-select-sm pharmacy-radius-select">
                            <option value="1">1 км</option>
                            <option value="3">3 км</option>
                            <option value="5" selected>5 км</option>
                            <option value="10">10 км</option>
                            <option value="20">20 км</option>
                        </select>
                    </div>
                    <div class="small text-muted mt-2" id="pharmacyMapStatus">
                        Загружаю карту и подбираю ближайшие аптеки...
                    </div>
                </div>
                <div id="pharmacyMap"></div>
                <div id="pharmacyResults" class="pharmacy-results mt-3"></div>
                <div class="mt-3 text-center">
                    <small class="text-muted"><i class="fas fa-map me-1"></i>Используются Яндекс.Карты</small>
                </div>
            `;
            
            setTimeout(() => {
                if (typeof ymaps !== 'undefined') {
                    if (typeof ymaps.ready === 'function') {
                        ymaps.ready(initPharmacyMap);
                    } else {
                        initPharmacyMap();
                    }
                } else {
                    console.error('Yandex Maps не загружены');
                    document.getElementById('pharmacyMap').innerHTML = `
                        <div class="alert alert-warning text-center p-5">
                            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                            <h4>Не удалось загрузить карты</h4>
                            <p class="mb-0">Проверьте подключение к интернету</p>
                        </div>
                    `;
                }
            }, 100);
            break;

        case 'ocr':
            content.innerHTML = `
                <div class="section-intro">
                    <span class="section-intro__eyebrow">Сканирование</span>
                    <h3><i class="fas fa-camera me-2"></i>Поиск по фото</h3>
                    <p class="text-muted mb-3">Сфотографируйте упаковку, рецепт или список препаратов, а SmartАптечка попробует распознать текст и найти лекарства автоматически.</p>
                </div>
                ${getMedicalDisclaimerMarkup()}
                <div class="ocr-container">
                    ${typeof getOCRStatusMarkup === 'function' ? getOCRStatusMarkup() : ''}
                    <div class="upload-area-ocr" id="ocrDropArea">
                        <i class="fas fa-camera fa-3x mb-3" style="color: #4361ee;"></i>
                        <p class="h5 mb-2">Перетащите фото сюда</p>
                        <p class="text-muted mb-3">или нажмите кнопку ниже</p>
                        <input type="file" id="ocrFileInput" accept=".png,.jpg,.jpeg" style="display: none;">
                        <button class="btn btn-primary" onclick="document.getElementById('ocrFileInput').click()">
                            <i class="fas fa-folder-open me-2"></i>Выбрать файл
                        </button>
                        <p class="mt-3 text-muted small">Поддерживаются PNG, JPG (макс. 5MB)</p>
                    </div>
                    
                    <img id="ocrPreview" class="preview-image" style="display: none;" alt="Предпросмотр">
                    
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-success flex-grow-1" id="ocrProcessBtn" onclick="processOCR()" disabled>
                            <i class="fas fa-search me-2"></i>Найти лекарства
                        </button>
                        <button class="btn btn-outline-secondary" onclick="clearOCR()">
                            <i class="fas fa-times me-2"></i>Очистить
                        </button>
                    </div>
                    
                    <div id="ocrLoading" style="display: none; margin: 20px 0; text-align: center;">
                        <div class="spinner mb-2"></div>
                        <p class="mb-0" id="ocrLoadingText">Обработка изображения...</p>
                    </div>
                    
                    <div id="ocrError" class="alert alert-danger" style="display: none; margin-top: 15px;"></div>
                    
                    <div id="ocrFoundMedicines" style="display: none;"></div>
                    <div id="ocrPrescriptionImport" style="display: none;"></div>
                    
                    <div class="mt-4">
                        <h5>Распознанный текст:</h5>
                        <div id="ocrResult" class="ocr-result">Здесь появится распознанный текст.</div>
                        
                        <div id="ocrActions" class="mt-3" style="display: none;">
                            <button class="btn btn-primary me-2 mb-2" onclick="useOCRText()">
                                <i class="fas fa-pills me-1"></i>Добавить лекарство
                            </button>
                            <button class="btn btn-outline-primary mb-2" onclick="searchFromOCR()">
                                <i class="fas fa-search me-1"></i>Поиск по симптомам
                            </button>
                            <button class="btn btn-outline-success ms-md-2 mb-2" onclick="preparePrescriptionImportFromOCR()">
                                <i class="fas fa-file-medical me-1"></i>Импорт назначения врача
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            
            if (typeof initOCRUploader === 'function') {
                initOCRUploader();
            }
            break;

        default:
            content.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Раздел временно недоступен
                </div>
            `;
    }

    currentSection = sectionName;
    updateSidebarStats();
    initEnhancedAccessibility();
    animateSectionEntrance(sectionName);
    try {
        content.focus({ preventScroll: true });
    } catch (_error) {
        content.focus();
    }
    announceForScreenReader(`Открыт раздел: ${sectionName === 'medicines' ? 'Мои лекарства' : sectionName === 'search' ? 'Поиск по симптомам' : sectionName === 'add' ? 'Добавить лекарство' : sectionName === 'profile' ? 'Профиль' : sectionName}`);
}

// ==================== УПРАВЛЕНИЕ ЛЕКАРСТВАМИ ====================
function loadMedicines() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            medicines = [];
            renderMedicines();
            return;
        }
        
        const userData = getUserData(currentUser.email);
        if (!userData) {
            medicines = [];
            renderMedicines();
            return;
        }

        const familyState = getFamilyStorage(userData);
        const activeMedicines = familyState.medicinesByProfile[familyState.activeProfileId];
        medicines = Array.isArray(activeMedicines) ? activeMedicines : [];

        const hasFamilyStructure = Boolean(
            userData.family
            && Array.isArray(userData.family.profiles)
            && userData.family.medicinesByProfile
        );
        if (!hasFamilyStructure) {
            saveUserData(currentUser.email, {
                ...userData,
                family: familyState,
                medicines
            });
        }
        
        // Восстановление типов данных для taken
        medicines.forEach(med => {
            if (med.taken && typeof med.taken === 'object') {
                const fixedTaken = {};
                Object.keys(med.taken).forEach(key => {
                    fixedTaken[Number(key)] = med.taken[key];
                });
                med.taken = fixedTaken;
            }

            if (!Array.isArray(med.symptoms)) {
                med.symptoms = [];
            }

            med.intakePlannerMode = normalizeIntakePlannerMode(med.intakePlannerMode);

            if (!Number.isFinite(Number(med.dosageMg))) {
                med.dosageMg = null;
            } else {
                med.dosageMg = Math.max(1, Math.round(Number(med.dosageMg)));
            }

            const stock = Number(med.tabletsInStock);
            const left = Number(med.tabletsLeft);
            if (Number.isFinite(stock) && stock > 0) {
                med.tabletsInStock = Math.round(stock);
                med.tabletsLeft = Number.isFinite(left)
                    ? Math.max(0, Math.min(Math.round(left), med.tabletsInStock))
                    : med.tabletsInStock;
            } else {
                med.tabletsInStock = null;
                med.tabletsLeft = null;
            }

            if (typeof med.shortInstruction !== 'string' || !med.shortInstruction.trim()) {
                med.shortInstruction = buildShortInstructionForMedicine(med);
            } else {
                med.shortInstruction = needsShortInstructionRuLocalization(med.shortInstruction)
                    ? buildShortInstructionForMedicine(med)
                    : med.shortInstruction.trim();
            }

            if (Array.isArray(med.contraindications)) {
                med.contraindications = med.contraindications.filter(Boolean).join('; ').trim();
            }

            if (typeof med.contraindications !== 'string' || !med.contraindications.trim()) {
                med.contraindications = 'Противопоказания из интернета пока не загружены.';
                med.contraindicationsStatus = 'not_loaded';
            } else {
                med.contraindications = med.contraindications.trim();
                if (/^online contraindications are not loaded yet\.?$/i.test(med.contraindications)) {
                    med.contraindications = 'Противопоказания из интернета пока не загружены.';
                    med.contraindicationsStatus = 'not_loaded';
                } else if (/^no contraindications found in online openfda records/i.test(med.contraindications)) {
                    med.contraindications = getContraindicationsFallbackText();
                    med.contraindicationsStatus = 'not_found';
                }
                med.contraindicationsStatus = med.contraindicationsStatus || 'ready';
            }

            med.contraindicationsLanguage = med.contraindicationsLanguage
                || (containsCyrillicText(med.contraindications) ? 'ru' : 'source');
            med.contraindicationsTranslationStatus = med.contraindicationsTranslationStatus
                || (med.contraindicationsLanguage === 'ru' ? 'ready' : 'idle');

            const lookupVersion = Number(med.contraindicationsLookupVersion || 0);
            if (lookupVersion < CONTRAINDICATIONS_LOOKUP_VERSION && med.contraindicationsStatus !== 'ready') {
                med.contraindicationsStatus = 'pending_auto';
            }
        });
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
        medicines = [];
    }
    maybeUnlockAchievements({
        showPopup: false,
        refreshProfile: false
    });
    renderMedicines();
    updateSidebarStats();
    void runTelegramCareCheck();
}

function saveMedicines() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userData = getUserData(currentUser.email) || { medicines: [] };
    const familyState = getFamilyStorage(userData);
    familyState.medicinesByProfile[familyState.activeProfileId] = medicines;

    saveUserData(currentUser.email, {
        ...userData,
        family: familyState,
        medicines
    });
    maybeStoreAutomaticBackup();
    maybeUnlockAchievements({
        showPopup: true,
        refreshProfile: true
    });
    updateSidebarStats();
}

function renderMedicines() {
    const list = document.getElementById('medicineList');
    if (!list) return;

    if (medicines.length === 0) {
        const currentUser = getCurrentUser();
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">
                    <i class="fas fa-capsules"></i>
                </div>
                <h4>Аптечка пока пустая</h4>
                <p class="text-muted">Добавьте первое лекарство, чтобы видеть курс приёма, прогресс и напоминания в одном месте.</p>
                <div class="empty-state__actions">
                    <button class="btn btn-primary" onclick="showSection('add')">
                        <i class="fas fa-plus me-1"></i>Добавить лекарство
                    </button>
                    <button class="btn btn-outline-primary" onclick="${currentUser ? `showSection('ocr')` : `showAuthModal()`}">
                        <i class="fas ${currentUser ? 'fa-camera' : 'fa-user'} me-1"></i>${currentUser ? 'Сканировать фото' : 'Войти в аккаунт'}
                    </button>
                </div>
            </div>
        `;
        renderCourseSafetyWarnings();
        renderRedZoneAlert();
        renderRestockForecastAlert();
        return;
    }

    list.innerHTML = medicines.map(med => {
        const total = med.schedule ? med.schedule.length : 0;
        const taken = med.schedule && med.taken ? 
            Object.values(med.taken).filter(v => v).length : 0;
        const progress = total ? Math.round((taken / total) * 100) : 0;
        const hasStock = Number.isFinite(Number(med.tabletsInStock));
        const totalStock = hasStock ? Math.max(0, Math.round(Number(med.tabletsInStock))) : null;
        const leftStock = hasStock
            ? Math.max(0, Math.min(Math.round(Number(med.tabletsLeft ?? totalStock)), totalStock))
            : null;

        return `
        <div class="medicine-card" id="medicine-${med.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div style="flex-grow: 1;">
                        <h5 class="card-title mb-2">${escapeHtml(med.name)}</h5>
                        ${renderMedicineGroups(med.name)}
                        <div class="medicine-meta mb-2">
                            <span class="medicine-meta__item">
                                <i class="fas fa-calendar me-1"></i>${escapeHtml(med.date)}
                            </span>
                            ${total > 0 ? `
                                <span class="medicine-meta__item">
                                    <i class="fas fa-clock me-1"></i>${total} доз в расписании
                                </span>
                            ` : `
                                <span class="medicine-meta__item">
                                    <i class="fas fa-circle-info me-1"></i>Без расписания
                                </span>
                            `}
                        </div>
                        <div class="medicine-meta mb-2">
                            <span class="medicine-meta__item">
                                <i class="fas fa-weight-hanging me-1"></i>${med.dosageMg ? `${med.dosageMg} мг / таблетка` : 'Дозировка не указана'}
                            </span>
                            <span class="medicine-meta__item">
                                <i class="fas fa-capsules me-1"></i>${hasStock ? `Остаток: ${leftStock}/${totalStock} табл.` : 'Остаток не указан'}
                            </span>
                        </div>
                        <div class="medicine-meta mb-2">
                            <span class="medicine-meta__item">
                                <i class="fas fa-list-check me-1"></i>${escapeHtml(getIntakePlannerModeLabel(med.intakePlannerMode))}
                            </span>
                        </div>
                        ${med.symptoms.length > 0 ? `
                            <div class="mt-2 mb-3">
                                <strong>Симптомы:</strong>
                                <div class="d-flex flex-wrap gap-1 mt-1">
                                    ${med.symptoms.map(s => `<span class="badge bg-secondary">${escapeHtml(s)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="medicine-instruction mb-3">
                            <i class="fas fa-notes-medical"></i>
                            <span>${escapeHtml(med.shortInstruction || buildShortInstructionForMedicine(med))}</span>
                        </div>

                        <div class="medicine-contraindications mb-3">
                            <i class="fas fa-shield-virus"></i>
                            <div>
                                <strong>Противопоказания:</strong>
                                <span>${escapeHtml(med.contraindications || 'Противопоказания из интернета пока не загружены.')}</span>
                                ${med.contraindicationsSource ? `
                                    <a class="medicine-source-link" href="${escapeAttribute(med.contraindicationsSource)}" target="_blank" rel="noopener noreferrer">Источник</a>
                                ` : ''}
                                ${med.contraindicationsStatus === 'loading' ? `
                                    <small class="text-muted">Загружаю противопоказания из интернета...</small>
                                ` : ''}
                                ${med.contraindicationsStatus === 'not_loaded' || med.contraindicationsStatus === 'not_found' ? `
                                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="enrichMedicineContraindications('${escapeAttribute(med.id)}')">Загрузить из интернета</button>
                                ` : ''}
                            </div>
                        </div>

                        ${total > 0 ? `
                            <div class="mt-3">
                                <small class="d-block mb-1">Прогресс курса: ${taken}/${total} (${progress}%)</small>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar" role="progressbar" style="width: ${progress}%"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="ms-3">
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${med.id}" onclick="deleteMedicineWithAnimation('${med.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    medicines
        .filter(med => med.contraindicationsStatus === 'pending_auto')
        .slice(0, 2)
        .forEach(med => {
            void enrichMedicineContraindications(med.id);
        });

    medicines
        .filter(med =>
            med.contraindicationsStatus === 'ready'
            && med.contraindicationsLanguage !== 'ru'
            && needsContraindicationsRuTranslation(med.contraindications)
            && med.contraindicationsTranslationStatus !== 'loading'
            && med.contraindicationsTranslationStatus !== 'failed'
        )
        .slice(0, 2)
        .forEach(med => {
            void localizeStoredContraindications(med.id);
        });

    renderCourseSafetyWarnings();
    renderRedZoneAlert();
    renderRestockForecastAlert();
}

function deleteMedicineWithAnimation(id) {
    const medicineCard = document.getElementById(`medicine-${id}`);
    if (medicineCard) {
        medicineCard.classList.add('removing');
        
        setTimeout(() => {
            medicines = medicines.filter(med => med.id !== id);
            saveMedicines();
            
            renderMedicines();
            
            showToast('Лекарство удалено', 'success');
        }, 300);
    }
}

function addMedicine() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для добавления лекарств необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }
    
    const nameInput = document.getElementById('medicineNameInput');
    const symptomsInput = document.getElementById('addSymptomsInput');
    const dosesPerDay = document.getElementById('dosesPerDay').value;
    const plannerModeInput = document.getElementById('intakePlannerMode');
    const doseMgInput = document.getElementById('medicineDoseMg');
    const stockInput = document.getElementById('medicineStockCount');
    const durationDays = document.getElementById('durationDays').value;
    const startDate = document.getElementById('startDate').value;

    const name = nameInput.value.trim();
    const symptoms = symptomsInput.value.split(',').map(s => s.trim()).filter(s => s);
    const intakePlannerMode = normalizeIntakePlannerMode(plannerModeInput?.value || getPlannerSettings(getFullCurrentUser()).defaultMode);
    const dosageMg = Math.round(Number(doseMgInput?.value));
    const tabletsInStock = Math.round(Number(stockInput?.value));

    if (!name) {
        showToast('Введите название лекарства!', 'error');
        nameInput.focus();
        return;
    }

    if (!startDate) {
        showToast('Укажите дату начала приёма!', 'error');
        return;
    }

    if (!Number.isFinite(dosageMg) || dosageMg <= 0) {
        showToast('Укажите корректную дозировку в миллиграммах!', 'error');
        doseMgInput?.focus();
        return;
    }

    if (!Number.isFinite(tabletsInStock) || tabletsInStock <= 0) {
        showToast('Укажите количество таблеток в наличии!', 'error');
        stockInput?.focus();
        return;
    }

    const schedule = generateSchedule(startDate, dosesPerDay, durationDays, intakePlannerMode);

    const medicineId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    medicines.push({
        id: medicineId,
        name: name,
        symptoms: symptoms,
        date: new Date().toLocaleDateString(),
        schedule: schedule,
        taken: {},
        intakePlannerMode,
        dosageMg,
        tabletsInStock,
        tabletsLeft: tabletsInStock,
        contraindications: 'Загружаю противопоказания из интернета...',
        contraindicationsStatus: 'pending_auto',
        shortInstruction: buildShortInstructionForMedicine({
            name,
            symptoms,
            dosageMg
        })
    });

    saveMedicines();
    
    nameInput.value = '';
    symptomsInput.value = '';
    if (doseMgInput) doseMgInput.value = '500';
    if (stockInput) stockInput.value = '20';
    document.getElementById('durationDays').value = '7';
    
    showToast(`💊 "${name}" добавлено в аптечку!`, 'success');
    
    setTimeout(() => showSection('medicines'), 500);
}

function addToMyMedicines(name) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для добавления лекарств необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }
    
    if (medicines.some(m => m.name === name)) {
        showToast('Это лекарство уже есть в аптечке!', 'info');
        return;
    }
    
    medicines.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: name,
        symptoms: [],
        date: new Date().toLocaleDateString(),
        schedule: [],
        taken: {}
    });
    
    saveMedicines();
    showToast(`💊 ${name} добавлено в аптечку!`, 'success');
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function formatDate(dateString) {
    try {
        if (!dateString) {
            return 'Дата не указана';
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Дата не указана';
        }
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        console.error('Ошибка форматирования даты:', e);
        return 'Дата не указана';
    }
}

function sortMedicines(type) {
    if (type === 'name') {
        medicines.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        medicines.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    renderMedicines();
    showToast(`Отсортировано по ${type === 'name' ? 'имени' : 'дате'}`, 'info');
}

function clearAll() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ лекарства? Это действие нельзя отменить!')) {
        medicines = [];
        saveMedicines();
        renderMedicines();
        showToast('Все лекарства удалены', 'info');
    }
}

function loadExternalScriptOnce(src, readyCheck) {
    if (typeof readyCheck === 'function' && readyCheck()) {
        return Promise.resolve();
    }

    if (externalScriptLoaders[src]) {
        return externalScriptLoaders[src];
    }

    externalScriptLoaders[src] = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-external-src="${src}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Не удалось загрузить скрипт: ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.externalSrc = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Не удалось загрузить скрипт: ${src}`));
        document.head.appendChild(script);
    }).finally(() => {
        if (!(typeof readyCheck === 'function' && readyCheck())) {
            delete externalScriptLoaders[src];
        }
    });

    return externalScriptLoaders[src];
}

async function loadPdfMakeLibrary() {
    await loadExternalScriptOnce(PDFMAKE_LIBRARY_URL, () => Boolean(window.pdfMake));
    await loadExternalScriptOnce(PDFMAKE_FONTS_URL, () => Boolean(window.pdfMake?.vfs));

    if (!window.pdfMake || !window.pdfMake.vfs) {
        throw new Error('PDF библиотека не готова');
    }

    return window.pdfMake;
}

function formatCourseReportDate(value, includeTime = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString('ru-RU', includeTime
        ? {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
        : {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }
    );
}

function buildMedicineCourseReportRows(nowTs = Date.now()) {
    return medicines
        .filter(med => Array.isArray(med.schedule) && med.schedule.length > 0)
        .map(med => {
            const schedule = med.schedule
                .map(value => Number(value))
                .filter(value => Number.isFinite(value))
                .sort((a, b) => a - b);

            const takenMap = med.taken && typeof med.taken === 'object' ? med.taken : {};
            const totalDoses = schedule.length;
            const takenDoses = schedule.reduce((sum, time) => sum + (takenMap[time] ? 1 : 0), 0);
            const overdueDoses = schedule.reduce((sum, time) => sum + (time < nowTs && !takenMap[time] ? 1 : 0), 0);
            const upcomingDoses = schedule.reduce((sum, time) => sum + (time >= nowTs && !takenMap[time] ? 1 : 0), 0);

            const firstDoseAt = schedule[0] || null;
            const lastDoseAt = schedule.length > 0 ? schedule[schedule.length - 1] : null;
            const durationDays = firstDoseAt && lastDoseAt
                ? Math.max(1, Math.round((lastDoseAt - firstDoseAt) / (24 * 60 * 60 * 1000)) + 1)
                : null;
            const dosesPerDay = durationDays
                ? Math.max(1, Math.round(totalDoses / durationDays))
                : null;
            const adherencePercent = totalDoses > 0
                ? Math.round((takenDoses / totalDoses) * 100)
                : 0;

            let status = 'Завершён';
            if (upcomingDoses > 0 && overdueDoses > 0) {
                status = 'Активный, есть просрочки';
            } else if (upcomingDoses > 0) {
                status = 'Активный';
            } else if (overdueDoses > 0) {
                status = 'Завершён с пропусками';
            }

            const hasStock = Number.isFinite(Number(med.tabletsInStock));
            const totalStock = hasStock ? Math.max(0, Math.round(Number(med.tabletsInStock))) : null;
            const leftStock = hasStock
                ? Math.max(0, Math.min(Math.round(Number(med.tabletsLeft ?? totalStock)), totalStock))
                : null;

            return {
                name: med.name || 'Без названия',
                status,
                startAt: firstDoseAt,
                endAt: lastDoseAt,
                scheduleText: dosesPerDay && durationDays
                    ? `${dosesPerDay} р/д, ${durationDays} дн.`
                    : 'По расписанию',
                takenText: `${takenDoses}/${totalDoses}`,
                overdueText: String(overdueDoses),
                adherenceText: `${adherencePercent}%`,
                stockText: hasStock ? `${leftStock}/${totalStock}` : '—',
                sortTime: firstDoseAt || 0
            };
        })
        .sort((a, b) => b.sortTime - a.sortTime);
}

function buildCourseReportSummary(rows) {
    const activeCourses = rows.filter(row => row.status.includes('Активный')).length;
    const completedCourses = rows.length - activeCourses;
    const coursesWithOverdue = rows.filter(row => Number(row.overdueText) > 0).length;
    const overdueDosesTotal = rows.reduce((sum, row) => sum + Number(row.overdueText || 0), 0);

    return {
        totalCourses: rows.length,
        activeCourses,
        completedCourses,
        coursesWithOverdue,
        overdueDosesTotal
    };
}

function buildCoursePdfDefinition({ userData, rows, summary }) {
    const generatedAt = new Date();
    const tableBody = [
        [
            { text: 'Препарат', style: 'tableHeader' },
            { text: 'Статус', style: 'tableHeader' },
            { text: 'Начало', style: 'tableHeader' },
            { text: 'Окончание', style: 'tableHeader' },
            { text: 'Схема', style: 'tableHeader' },
            { text: 'Принято', style: 'tableHeader' },
            { text: 'Просрочки', style: 'tableHeader' },
            { text: 'Приверж.', style: 'tableHeader' },
            { text: 'Остаток', style: 'tableHeader' }
        ],
        ...rows.map(row => [
            { text: row.name, style: 'tableCell' },
            { text: row.status, style: 'tableCell' },
            { text: formatCourseReportDate(row.startAt), style: 'tableCell' },
            { text: formatCourseReportDate(row.endAt), style: 'tableCell' },
            { text: row.scheduleText, style: 'tableCell' },
            { text: row.takenText, style: 'tableCellCenter' },
            { text: row.overdueText, style: 'tableCellCenter' },
            { text: row.adherenceText, style: 'tableCellCenter' },
            { text: row.stockText, style: 'tableCellCenter' }
        ])
    ];

    return {
        pageSize: 'A4',
        pageMargins: [26, 24, 26, 24],
        content: [
            { text: 'SmartАптечка', style: 'brand' },
            { text: 'Отчет по курсам приема лекарств', style: 'title' },
            {
                text: `Пациент: ${userData?.name || 'Пользователь'}\nEmail: ${userData?.email || '—'}\nДата формирования: ${formatCourseReportDate(generatedAt, true)}`,
                style: 'meta'
            },
            {
                columns: [
                    { text: `Всего курсов: ${summary.totalCourses}`, style: 'summaryChip' },
                    { text: `Активные: ${summary.activeCourses}`, style: 'summaryChip' },
                    { text: `Завершенные: ${summary.completedCourses}`, style: 'summaryChip' },
                    { text: `Курсы с просрочками: ${summary.coursesWithOverdue}`, style: 'summaryChip' }
                ],
                columnGap: 8,
                margin: [0, 8, 0, 4]
            },
            { text: `Всего просроченных доз: ${summary.overdueDosesTotal}`, style: 'metaStrong' },
            {
                margin: [0, 12, 0, 0],
                table: {
                    headerRows: 1,
                    widths: [74, 67, 55, 55, 48, 42, 42, 42, 40],
                    body: tableBody
                },
                layout: {
                    fillColor: (rowIndex) => (rowIndex === 0 ? '#e8f0ff' : null),
                    hLineColor: '#d8e3f6',
                    vLineColor: '#d8e3f6',
                    hLineWidth: () => 0.6,
                    vLineWidth: () => 0.6
                }
            },
            {
                margin: [0, 12, 0, 0],
                text: 'Просрочки = дозы, время которых прошло и прием не подтвержден. Отчет носит информационный характер и не является медицинской рекомендацией.',
                style: 'footerNote'
            }
        ],
        styles: {
            brand: { fontSize: 11, bold: true, color: '#2b50d6' },
            title: { fontSize: 18, bold: true, margin: [0, 4, 0, 8], color: '#1f2a44' },
            meta: { fontSize: 10, color: '#334155', lineHeight: 1.25 },
            metaStrong: { fontSize: 10, bold: true, color: '#1f2a44', margin: [0, 2, 0, 0] },
            summaryChip: { fontSize: 9, bold: true, color: '#2b3a67', margin: [0, 0, 0, 0] },
            tableHeader: { fontSize: 8, bold: true, color: '#1f2a44', margin: [0, 3, 0, 3] },
            tableCell: { fontSize: 8, color: '#0f172a', margin: [0, 2, 0, 2] },
            tableCellCenter: { fontSize: 8, color: '#0f172a', alignment: 'center', margin: [0, 2, 0, 2] },
            footerNote: { fontSize: 8, color: '#475569', italics: true }
        },
        defaultStyle: {
            fontSize: 10
        }
    };
}

function openCourseReportPrintWindow({ userData, rows, summary }) {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        showToast('Разрешите всплывающие окна, чтобы открыть печатный отчет.', 'warning');
        return;
    }

    const tableRows = rows.map(row => `
        <tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.status)}</td>
            <td>${escapeHtml(formatCourseReportDate(row.startAt))}</td>
            <td>${escapeHtml(formatCourseReportDate(row.endAt))}</td>
            <td>${escapeHtml(row.scheduleText)}</td>
            <td>${escapeHtml(row.takenText)}</td>
            <td>${escapeHtml(row.overdueText)}</td>
            <td>${escapeHtml(row.adherenceText)}</td>
            <td>${escapeHtml(row.stockText)}</td>
        </tr>
    `).join('');

    const html = `
        <!doctype html>
        <html lang="ru">
        <head>
            <meta charset="utf-8">
            <title>Отчет по курсам SmartАптечка</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
                h1 { margin: 0 0 6px; color: #1f3bb3; }
                .meta { margin: 0 0 12px; color: #334155; font-size: 14px; line-height: 1.4; }
                .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; font-size: 13px; }
                .chip { padding: 6px 10px; border-radius: 999px; background: #edf2ff; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #d5def2; padding: 7px; text-align: left; }
                th { background: #e8f0ff; }
                .note { margin-top: 12px; font-size: 11px; color: #475569; }
            </style>
        </head>
        <body>
            <h1>SmartАптечка — отчет по курсам</h1>
            <p class="meta">Пациент: ${escapeHtml(userData?.name || 'Пользователь')}<br>Email: ${escapeHtml(userData?.email || '—')}<br>Дата формирования: ${escapeHtml(formatCourseReportDate(new Date(), true))}</p>
            <div class="chips">
                <span class="chip">Всего курсов: ${summary.totalCourses}</span>
                <span class="chip">Активные: ${summary.activeCourses}</span>
                <span class="chip">Завершенные: ${summary.completedCourses}</span>
                <span class="chip">Курсы с просрочками: ${summary.coursesWithOverdue}</span>
                <span class="chip">Просроченных доз: ${summary.overdueDosesTotal}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Препарат</th>
                        <th>Статус</th>
                        <th>Начало</th>
                        <th>Окончание</th>
                        <th>Схема</th>
                        <th>Принято</th>
                        <th>Просрочки</th>
                        <th>Приверж.</th>
                        <th>Остаток</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            <p class="note">Просрочки = дозы, время которых прошло и прием не подтвержден. Отчет носит информационный характер и не является медицинской рекомендацией.</p>
            <script>window.onload = () => window.print();<\/script>
        </body>
        </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
}

async function exportCoursesToPDF() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        showToast('Для экспорта курсов нужно войти в аккаунт.', 'error');
        showAuthModal();
        return;
    }

    const userData = getUserData(currentUser.email) || currentUser;
    const rows = buildMedicineCourseReportRows();
    if (rows.length === 0) {
        showToast('Нет курсов для экспорта: добавьте курс с расписанием.', 'warning');
        return;
    }

    const summary = buildCourseReportSummary(rows);
    const fileDate = new Date().toISOString().slice(0, 10);

    try {
        const pdfMake = await loadPdfMakeLibrary();
        const docDefinition = buildCoursePdfDefinition({ userData, rows, summary });
        pdfMake.createPdf(docDefinition).download(`smart-aptechka-courses-${fileDate}.pdf`);
        showToast('PDF отчет по курсам сформирован.', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showToast('Не удалось собрать PDF автоматически. Открыл печатный режим.', 'warning');
        openCourseReportPrintWindow({ userData, rows, summary });
    }
}

function exportData() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для экспорта данных необходимо войти в систему', 'error');
        return;
    }
    
    const data = {
        user: currentUser,
        medicines: medicines,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-aptechka-backup-${currentUser.email}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    showToast('Данные экспортированы', 'success');
}

function importData() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для импорта данных необходимо войти в систему', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Проверяем совместимость данных
                if (!importedData.medicines || !Array.isArray(importedData.medicines)) {
                    showToast('Некорректный формат файла', 'error');
                    return;
                }
                
                // Подтверждение импорта
                if (confirm(`Найдено ${importedData.medicines.length} лекарств. Импортировать их в вашу аптечку?`)) {
                    medicines = importedData.medicines;
                    saveMedicines();
                    renderMedicines();
                    showToast('Данные успешно импортированы', 'success');
                }
            } catch (error) {
                console.error('Ошибка импорта:', error);
                showToast('Ошибка при чтении файла', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function showPopularSymptoms() {
    const popular = ["головная боль", "температура", "кашель", "насморк", "боль в горле", "изжога", "тошнота", "диарея", "запор", "аллергия", "давление", "стресс"];
    const container = document.getElementById('popularSymptoms');
    if (!container) return;

    container.innerHTML = popular.map(symptom => `
        <span class="badge bg-light text-dark border" style="cursor:pointer;" onclick="searchSymptom('${symptom}')">
            ${escapeHtml(symptom)}
        </span>
    `).join('');
}

function updateSidebarStats() {
    const countElement = document.getElementById('meds-count');
    if (countElement) {
        countElement.textContent = medicines.length;
    }
}

// ==================== РАСПИСАНИЕ И НАПОМИНАНИЯ ====================
function buildDailyDoseOffsetsHours(dosesPerDay, plannerMode) {
    const doses = Math.max(1, Math.round(Number(dosesPerDay) || 1));
    const mode = normalizeIntakePlannerMode(plannerMode);

    if (doses === 1) {
        return [0];
    }

    if (mode === 'evenly') {
        const step = 24 / doses;
        return Array.from({ length: doses }, (_, index) => index * step);
    }

    const totalSpanHours = mode === 'morning_evening' ? 12 : 14;
    const step = totalSpanHours / (doses - 1);
    return Array.from({ length: doses }, (_, index) => index * step);
}

function generateSchedule(startDateStr, dosesPerDay, durationDays, plannerMode = DEFAULT_INTAKE_PLANNER_MODE) {
    const start = new Date(startDateStr);
    if (Number.isNaN(start.getTime())) return [];

    const doses = Math.max(1, Math.round(Number(dosesPerDay) || 1));
    const days = Math.max(1, Math.round(Number(durationDays) || 1));
    const offsetsHours = buildDailyDoseOffsetsHours(doses, plannerMode);
    const schedule = [];

    for (let day = 0; day < days; day += 1) {
        for (const offset of offsetsHours) {
            const time = new Date(start);
            time.setDate(start.getDate() + day);
            time.setHours(start.getHours() + Math.floor(offset));
            time.setMinutes(start.getMinutes() + Math.round((offset % 1) * 60));
            schedule.push(time.getTime());
        }
    }

    return [...new Set(schedule)].sort((a, b) => a - b);
}

function findNextReminder() {
    let next = null;

    for (const med of medicines) {
        if (!Array.isArray(med.schedule)) continue;

        for (const time of [...med.schedule].sort((a, b) => a - b)) {
            if (med.taken && med.taken[time]) continue;

            if (!next || time < next.time) {
                next = { id: med.id, medicine: med.name, time: time };
            }
            break;
        }
    }

    return next;
}

function formatTimeTo(timestamp) {
    const diff = timestamp - Date.now();
    if (diff <= 0) return "сейчас";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours} ч ${minutes} мин`;
    } else if (minutes > 0) {
        return `${minutes} мин`;
    } else {
        return "менее минуты";
    }
}

function markAsTaken(medId, time) {
    if (time > Date.now()) {
        showToast(`Слишком рано. Подтвердить можно через ${formatTimeTo(time)}.`, 'warning');
        return;
    }

    const med = medicines.find(m => m.id === medId);
    if (med) {
        med.taken = med.taken || {};
        med.taken[time] = true;
        saveMedicines();
        showToast(`✅ ${med.name} принято!`, 'success');
        showSection('medicines');
    }
}

// ==================== КАРТА АПТЕК ====================
function addToMyMedicines(name) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для добавления лекарств необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    if (medicines.some(med => med.name === name)) {
        showToast('Это лекарство уже есть в аптечке!', 'info');
        return;
    }

    const medData = Array.isArray(medsDatabase)
        ? medsDatabase.find(med => med.name === name)
        : null;
    const symptomsText = medData?.symptoms?.length
        ? medData.symptoms.map(symptom => escapeHtml(symptom)).join(', ')
        : 'Не указаны';
    const plannerSettings = getPlannerSettings(getFullCurrentUser());

    closeSearchAddMedicineModal();

    const modalHTML = `
        <div class="modal fade show d-block" id="searchAddMedicineModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавить "${escapeHtml(name)}" в аптечку</h5>
                        <button type="button" class="btn-close" onclick="closeSearchAddMedicineModal()"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="searchMedicineName" value="${escapeAttribute(name)}">
                        <p class="mb-3"><strong>Симптомы:</strong> ${symptomsText}</p>

                        <label class="form-label">Количество приёмов в день</label>
                        <select class="form-select mb-3" id="searchMedicineDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3" selected>3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>

                        <label class="form-label">Режим приёма</label>
                        <select class="form-select mb-3" id="searchMedicinePlannerMode">
                            ${buildIntakePlannerModeOptions(plannerSettings.defaultMode)}
                        </select>

                        <label class="form-label">Срок приёма (дней)</label>
                        <label class="form-label">Режим приёма</label>
                        <select class="form-select mb-3" id="searchMedicinePlannerMode">
                            ${buildIntakePlannerModeOptions(plannerSettings.defaultMode)}
                        </select>

                        <input type="number" class="form-control mb-3" id="searchMedicineDurationDays" min="1" value="7">

                        <label class="form-label">Дозировка одной таблетки (мг)</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineDoseMg" min="1" step="1" value="500">

                        <label class="form-label">Количество таблеток в наличии</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineStockCount" min="1" step="1" value="20">

                        <label class="form-label">Начало приёма</label>
                        <input type="datetime-local" class="form-control" id="searchMedicineStartDate">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="closeSearchAddMedicineModal()">Отмена</button>
                        <button type="button" class="btn btn-success" onclick="confirmAddToMyMedicines()">Добавить</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show search-add-modal-backdrop"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const startDateInput = document.getElementById('searchMedicineStartDate');
    if (startDateInput) {
        startDateInput.value = localDateTime;
    }
}

function closeSearchAddMedicineModal() {
    document.getElementById('searchAddMedicineModal')?.remove();
    document.querySelector('.search-add-modal-backdrop')?.remove();
}

function confirmAddToMyMedicines() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для добавления лекарств необходимо войти в систему', 'error');
        closeSearchAddMedicineModal();
        showAuthModal();
        return;
    }

    const medicineName = document.getElementById('searchMedicineName')?.value?.trim();
    const dosesPerDay = document.getElementById('searchMedicineDosesPerDay')?.value;
    const intakePlannerMode = normalizeIntakePlannerMode(
        document.getElementById('searchMedicinePlannerMode')?.value
            || getPlannerSettings(getFullCurrentUser()).defaultMode
    );
    const durationDays = Number(document.getElementById('searchMedicineDurationDays')?.value);
    const dosageMg = Math.round(Number(document.getElementById('searchMedicineDoseMg')?.value));
    const tabletsInStock = Math.round(Number(document.getElementById('searchMedicineStockCount')?.value));
    const startDate = document.getElementById('searchMedicineStartDate')?.value;

    if (!medicineName) {
        showToast('Не удалось определить название лекарства', 'error');
        return;
    }

    if (medicines.some(med => med.name === medicineName)) {
        showToast('Это лекарство уже есть в аптечке!', 'info');
        closeSearchAddMedicineModal();
        return;
    }

    if (!startDate) {
        showToast('Укажите дату начала приёма', 'error');
        return;
    }

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
        showToast('Укажите корректный срок приёма', 'error');
        return;
    }

    if (!Number.isFinite(dosageMg) || dosageMg <= 0) {
        showToast('Укажите корректную дозировку в миллиграммах', 'error');
        return;
    }

    if (!Number.isFinite(tabletsInStock) || tabletsInStock <= 0) {
        showToast('Укажите количество таблеток в наличии', 'error');
        return;
    }

    const medData = Array.isArray(medsDatabase)
        ? medsDatabase.find(med => med.name === medicineName)
        : null;
    const schedule = generateSchedule(startDate, dosesPerDay, durationDays, intakePlannerMode);

    medicines.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: medicineName,
        symptoms: medData?.symptoms || [],
        date: new Date().toLocaleDateString(),
        schedule,
        taken: {},
        intakePlannerMode,
        dosageMg,
        tabletsInStock,
        tabletsLeft: tabletsInStock,
        shortInstruction: buildShortInstructionForMedicine({
            name: medicineName,
            symptoms: medData?.symptoms || [],
            dosageMg
        })
    });

    saveMedicines();
    void enrichMedicineContraindications(medicineId);
    closeSearchAddMedicineModal();
    showToast(`💊 ${medicineName} добавлено в аптечку!`, 'success');
    showSection('medicines');
}

function markAsTaken(medId, time) {
    if (time > Date.now()) {
        showToast(`Слишком рано. Подтвердить можно через ${formatTimeTo(time)}.`, 'warning');
        return;
    }

    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    med.taken = med.taken || {};
    if (med.taken[time]) {
        showToast('Этот приём уже отмечен.', 'info');
        return;
    }

    const hasStockTracking = Number.isFinite(Number(med.tabletsInStock));
    const leftStock = hasStockTracking
        ? Math.max(0, Math.round(Number(med.tabletsLeft ?? med.tabletsInStock)))
        : null;

    if (hasStockTracking && leftStock <= 0) {
        showToast(`Нельзя отметить приём: у ${med.name} закончились таблетки.`, 'warning');
        return;
    }

    med.taken[time] = true;
    if (hasStockTracking) {
        med.tabletsLeft = Math.max(0, leftStock - 1);
    }

    saveMedicines();
    showToast(`вњ… ${med.name} РїСЂРёРЅСЏС‚Рѕ!`, 'success');
    showSection('medicines');
}

function setPharmacyMapStatus(message, type = 'info') {
    const element = document.getElementById('pharmacyMapStatus');
    if (!element) return;

    element.textContent = message;
    element.className = 'small mt-2';
    if (type === 'error') {
        element.classList.add('text-danger');
    } else {
        element.classList.add('text-muted');
    }
}

function setPharmacyMapButtonsLoading(isLoading) {
    const ids = ['pharmacyLocateBtn', 'pharmacySearchAreaBtn', 'pharmacyRadiusSelect'];
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = Boolean(isLoading);
        }
    });
}

function getPharmacyRadiusKm() {
    const select = document.getElementById('pharmacyRadiusSelect');
    const value = Number(select?.value);
    return [1, 3, 5, 10, 20].includes(value) ? value : 5;
}

function formatDistanceKm(distanceKm) {
    if (!Number.isFinite(distanceKm)) return '';
    return distanceKm < 1
        ? `${Math.max(1, Math.round(distanceKm * 1000))} м`
        : `${distanceKm.toFixed(1)} км`;
}

function getDistanceKm(fromCoords, toCoords) {
    if (!Array.isArray(fromCoords) || !Array.isArray(toCoords)) return null;
    const [lat1, lon1] = fromCoords;
    const [lat2, lon2] = toCoords;
    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function getPharmacySearchBounds(centerCoords, radiusKm) {
    const [lat, lon] = centerCoords;
    const safeLat = Number.isFinite(lat) ? lat : 55.751244;
    const safeLon = Number.isFinite(lon) ? lon : 37.618423;
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.max(0.1, Math.cos((safeLat * Math.PI) / 180)));
    return [
        [safeLat - latDelta, safeLon - lonDelta],
        [safeLat + latDelta, safeLon + lonDelta]
    ];
}

function clearPharmacyMapResults() {
    if (pharmacyResultsCollection) {
        pharmacyResultsCollection.removeAll();
    }
}

function toPromise(promiseLike) {
    if (!promiseLike || typeof promiseLike.then !== 'function') {
        return Promise.resolve(promiseLike);
    }

    return new Promise((resolve, reject) => {
        promiseLike.then(resolve, reject);
    });
}

function renderPharmacyResultsList(results) {
    const container = document.getElementById('pharmacyResults');
    if (!container) return;

    if (!Array.isArray(results) || results.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info mb-0">
                <i class="fas fa-circle-info me-2"></i>
                В этой области аптеки не найдены. Увеличьте радиус или переместите карту.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="pharmacy-results-grid">
            ${results.map((result, index) => `
                <div class="pharmacy-result-card" onclick="focusPharmacyResult(${index})">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                        <div>
                            <strong>${escapeHtml(result.name)}</strong>
                            <div class="small text-muted">${escapeHtml(result.address)}</div>
                        </div>
                        ${result.distanceKm !== null ? `
                            <span class="badge bg-light text-dark border">${formatDistanceKm(result.distanceKm)}</span>
                        ` : ''}
                    </div>
                    <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); focusPharmacyResult(${index});">
                            <i class="fas fa-location-dot me-1"></i>На карте
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); navigateToPharmacy(${result.coords[0]}, ${result.coords[1]});">
                            <i class="fas fa-route me-1"></i>Маршрут
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function focusPharmacyResult(index) {
    const result = Array.isArray(pharmacySearchResults) ? pharmacySearchResults[index] : null;
    if (!result || !pharmacyMapInstance) return;

    pharmacyMapInstance.setCenter(result.coords, Math.max(15, pharmacyMapInstance.getZoom()), { duration: 250 });
    if (result.placemark?.balloon) {
        result.placemark.balloon.open();
    }
}

function extractPharmacySearchResults() {
    if (!pharmacySearchControl || typeof pharmacySearchControl.getResultsArray !== 'function') {
        return [];
    }

    const rawResults = pharmacySearchControl.getResultsArray() || [];
    const referenceCoords = pharmacyUserCoords || pharmacyMapInstance?.getCenter() || null;

    return rawResults
        .map((geoObject, index) => {
            const coords = geoObject?.geometry?.getCoordinates?.();
            if (!Array.isArray(coords) || coords.length !== 2) return null;

            const name = String(
                geoObject?.properties?.get('name')
                || geoObject?.properties?.get('text')
                || 'Аптека'
            ).trim();

            const address = String(
                geoObject?.getAddressLine?.()
                || geoObject?.properties?.get('description')
                || 'Адрес не указан'
            ).trim();

            return {
                id: `${index}-${coords[0]}-${coords[1]}`,
                name,
                address,
                coords,
                distanceKm: referenceCoords ? getDistanceKm(referenceCoords, coords) : null
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.distanceKm === null && b.distanceKm === null) return 0;
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
        })
        .slice(0, 30);
}

function extractPharmacyResultsFromGeoObjects(geoObjects, referenceCoords) {
    const extracted = [];
    if (!geoObjects || typeof geoObjects.each !== 'function') {
        return extracted;
    }

    geoObjects.each((geoObject, index) => {
        const coords = geoObject?.geometry?.getCoordinates?.();
        if (!Array.isArray(coords) || coords.length !== 2) return;

        const name = String(
            geoObject?.properties?.get('name')
            || geoObject?.properties?.get('text')
            || 'Аптека'
        ).trim();

        const addressFromMeta = String(
            geoObject?.properties?.get('metaDataProperty.GeocoderMetaData.text')
            || ''
        ).trim();

        const address = String(
            geoObject?.getAddressLine?.()
            || geoObject?.properties?.get('description')
            || addressFromMeta
            || 'Адрес не указан'
        ).trim();

        extracted.push({
            id: `geo-${index}-${coords[0]}-${coords[1]}`,
            name,
            address,
            coords,
            distanceKm: referenceCoords ? getDistanceKm(referenceCoords, coords) : null
        });
    });

    return extracted
        .sort((a, b) => {
            if (a.distanceKm === null && b.distanceKm === null) return 0;
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
        })
        .slice(0, 30);
}

async function searchPharmaciesViaGeocode(center, radiusKm, strictBounds = true) {
    if (typeof ymaps?.geocode !== 'function') return [];

    const bounds = getPharmacySearchBounds(center, radiusKm);
    const geocodeResult = await toPromise(ymaps.geocode('аптека', {
        boundedBy: bounds,
        strictBounds,
        results: 50
    }));

    return extractPharmacyResultsFromGeoObjects(geocodeResult?.geoObjects, center);
}

async function searchPharmaciesViaOverpass(center, radiusKm) {
    const bounds = getPharmacySearchBounds(center, Math.max(radiusKm, 10));
    const left = bounds[0][1];
    const top = bounds[1][0];
    const right = bounds[1][1];
    const bottom = bounds[0][0];

    const query = `
[out:json][timeout:25];
(
  node["amenity"="pharmacy"](${bottom},${left},${top},${right});
  way["amenity"="pharmacy"](${bottom},${left},${top},${right});
  relation["amenity"="pharmacy"](${bottom},${left},${top},${right});
);
out center 120;
`.trim();

    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
        throw new Error(`Overpass API: HTTP ${response.status}`);
    }

    const payload = await response.json();
    const elements = Array.isArray(payload?.elements) ? payload.elements : [];
    const seen = new Set();
    const results = [];

    elements.forEach((element, index) => {
        const lat = Number(element?.lat ?? element?.center?.lat);
        const lon = Number(element?.lon ?? element?.center?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        const key = `${lat.toFixed(6)}:${lon.toFixed(6)}`;
        if (seen.has(key)) return;
        seen.add(key);

        const tags = element?.tags || {};
        const name = String(tags?.name || 'Аптека').trim();
        const street = String(tags?.['addr:street'] || '').trim();
        const house = String(tags?.['addr:housenumber'] || '').trim();
        const city = String(tags?.['addr:city'] || '').trim();
        const composedAddress = [street, house, city].filter(Boolean).join(', ');
        const address = composedAddress || String(tags?.['addr:full'] || '').trim() || 'Адрес не указан';

        results.push({
            id: `overpass-${index}-${element?.id || key}`,
            name,
            address,
            coords: [lat, lon],
            distanceKm: getDistanceKm(center, [lat, lon])
        });
    });

    return results
        .sort((a, b) => {
            if (a.distanceKm === null && b.distanceKm === null) return 0;
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
        })
        .slice(0, 30);
}

function drawPharmacyResultsOnMap(results) {
    clearPharmacyMapResults();
    if (!pharmacyResultsCollection || !Array.isArray(results)) return;

    results.forEach(result => {
        const placemark = new ymaps.Placemark(
            result.coords,
            {
                balloonContent: `
                    <div style="padding: 8px; max-width: 280px;">
                        <h5 style="margin: 0 0 8px 0;">${escapeHtml(result.name)}</h5>
                        <p style="margin: 0 0 8px 0;"><strong>Адрес:</strong> ${escapeHtml(result.address)}</p>
                        <button class="btn btn-sm btn-primary" onclick="navigateToPharmacy(${result.coords[0]}, ${result.coords[1]})">
                            <i class="fas fa-route me-1"></i>Построить маршрут
                        </button>
                    </div>
                `,
                iconCaption: result.distanceKm !== null
                    ? `${escapeHtml(result.name)} · ${formatDistanceKm(result.distanceKm)}`
                    : escapeHtml(result.name)
            },
            {
                preset: 'islands#blueMedicalIcon',
                balloonCloseButton: true
            }
        );

        result.placemark = placemark;
        pharmacyResultsCollection.add(placemark);
    });
}

function searchPharmaciesInCurrentArea() {
    if (!pharmacyMapInstance) return;

    const radiusKm = getPharmacyRadiusKm();
    const center = pharmacyUserCoords || pharmacyMapInstance.getCenter();
    const bounds = getPharmacySearchBounds(center, radiusKm);

    setPharmacyMapButtonsLoading(true);
    setPharmacyMapStatus('Ищу аптеки, подождите...');

    pharmacyMapInstance.setBounds(bounds, {
        checkZoomRange: true,
        duration: 250
    });

    (async () => {
        let results = [];
        let sourceLabel = 'Yandex Search';

        try {
            try {
                pharmacySearchControl.options.set('useMapBounds', true);
                pharmacySearchControl.options.set('strictBounds', true);
                await toPromise(pharmacySearchControl.search('аптека'));
                results = extractPharmacySearchResults();
                if (results.length > 0) {
                    sourceLabel = 'Yandex Search';
                }
            } catch (controlError) {
                console.warn('SearchControl не вернул результат, переключаюсь на geocode:', controlError);
            }

            if (results.length === 0) {
                try {
                    results = await searchPharmaciesViaGeocode(center, radiusKm, true);
                    if (results.length > 0) {
                        sourceLabel = 'Yandex Geocode';
                    }
                } catch (geoError) {
                    console.warn('Yandex geocode strict error:', geoError);
                }
            }
            if (results.length === 0) {
                try {
                    results = await searchPharmaciesViaGeocode(center, Math.max(radiusKm, 10), false);
                    if (results.length > 0) {
                        sourceLabel = 'Yandex Geocode (широкий поиск)';
                    }
                } catch (geoWideError) {
                    console.warn('Yandex geocode wide error:', geoWideError);
                }
            }
            if (results.length === 0) {
                try {
                    results = await searchPharmaciesViaOverpass(center, Math.max(radiusKm, 10));
                    if (results.length > 0) {
                        sourceLabel = 'OpenStreetMap (Overpass)';
                    }
                } catch (overpassError) {
                    console.warn('Overpass fallback error:', overpassError);
                }
            }

            pharmacySearchResults = results;
            drawPharmacyResultsOnMap(results);
            renderPharmacyResultsList(results);

            if (results.length > 0) {
                setPharmacyMapStatus(`Найдено аптек: ${results.length}. Радиус: ${radiusKm} км. Источник: ${sourceLabel}.`);
            } else {
                setPharmacyMapStatus('Аптеки не найдены. Попробуйте увеличить радиус или сместить карту.', 'error');
            }
        } catch (error) {
            console.error('Ошибка поиска аптек:', error);
            const details = error?.message ? ` (${error.message})` : '';
            setPharmacyMapStatus(`Ошибка поиска результатов.${details}`, 'error');
            renderPharmacyResultsList([]);
        } finally {
            setPharmacyMapButtonsLoading(false);
        }
    })();
}

function locateAndSearchPharmacies() {
    if (!pharmacyMapInstance) return;

    if (!navigator.geolocation) {
        showToast('Геолокация недоступна, ищу аптеки в текущей области карты.', 'warning');
        searchPharmaciesInCurrentArea();
        return;
    }

    setPharmacyMapButtonsLoading(true);
    setPharmacyMapStatus('Определяю ваше местоположение...');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const coords = [position.coords.latitude, position.coords.longitude];
            pharmacyUserCoords = coords;

            if (pharmacyUserPlacemark) {
                pharmacyMapInstance.geoObjects.remove(pharmacyUserPlacemark);
            }

            pharmacyUserPlacemark = new ymaps.Placemark(
                coords,
                {
                    balloonContent: 'Ваше местоположение',
                    iconCaption: 'Вы здесь'
                },
                {
                    preset: 'islands#blueCircleDotIcon'
                }
            );

            pharmacyMapInstance.geoObjects.add(pharmacyUserPlacemark);
            pharmacyMapInstance.setCenter(coords, 14, { duration: 250 });
            searchPharmaciesInCurrentArea();
        },
        () => {
            setPharmacyMapButtonsLoading(false);
            setPharmacyMapStatus('Не удалось определить геопозицию. Ищу аптеки в текущей области карты.', 'error');
            searchPharmaciesInCurrentArea();
        },
        {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 60 * 1000
        }
    );
}

function initPharmacyMap() {
    const mapContainer = document.getElementById('pharmacyMap');
    if (!mapContainer) return;

    try {
        if (pharmacyMapInstance && typeof pharmacyMapInstance.destroy === 'function') {
            pharmacyMapInstance.destroy();
        }
        pharmacyMapInstance = null;
        pharmacySearchControl = null;
        pharmacyResultsCollection = null;
        pharmacyUserPlacemark = null;
        pharmacySearchResults = [];

        pharmacyMapInstance = new ymaps.Map('pharmacyMap', {
            center: [55.751244, 37.618423],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
        });

        pharmacyResultsCollection = new ymaps.GeoObjectCollection();
        pharmacyMapInstance.geoObjects.add(pharmacyResultsCollection);

        pharmacySearchControl = new ymaps.control.SearchControl({
            options: {
                provider: 'yandex#search',
                noPlacemark: true,
                noPopup: true,
                resultsPerPage: 40
            }
        });

        pharmacyMapInstance.controls.add(pharmacySearchControl);

        renderPharmacyResultsList([]);
        searchPharmaciesInCurrentArea();
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
        mapContainer.innerHTML = `
            <div class="alert alert-danger text-center p-5">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h4>Не удалось загрузить карту</h4>
                <p class="mb-0">${error.message || 'Проверьте подключение к интернету'}</p>
            </div>
        `;
    }
}

function navigateToPharmacy(lat, lon) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            const url = `https://yandex.ru/maps/?rtext=${userLat},${userLon}~${lat},${lon}&rtt=auto`;
            window.open(url, '_blank');
        }, function() {
            const url = `https://yandex.ru/maps/?ll=${lon},${lat}&z=15`;
            window.open(url, '_blank');
        });
    } else {
        const url = `https://yandex.ru/maps/?ll=${lon},${lat}&z=15`;
        window.open(url, '_blank');
    }
}

// ==================== ТЕМА И НАСТРОЙКИ ====================
function applyTheme(theme) {
    const body = document.body;
    
    // Удаляем предыдущие классы тем
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'dark') {
        body.classList.add('theme-dark');
    } else if (theme === 'light') {
        body.classList.add('theme-light');
    } else if (theme === 'auto') {
        // Авто-тема на основе системных настроек
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('theme-dark');
        } else {
            body.classList.add('theme-light');
        }
    }
}

function showChangePasswordModal() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const modal = document.getElementById('passwordModal');
    const errorElement = document.getElementById('changePasswordError');
    if (!modal || !errorElement) return;

    ['currentPasswordInput', 'newPasswordInput', 'confirmPasswordInput'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    errorElement.style.display = 'none';
    errorElement.textContent = '';
    modal.classList.remove('hidden');
    document.getElementById('currentPasswordInput')?.focus();
}

function hideChangePasswordModal() {
    document.getElementById('passwordModal')?.classList.add('hidden');
}

async function submitPasswordChange() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const oldPassword = document.getElementById('currentPasswordInput')?.value || '';
    const newPassword = document.getElementById('newPasswordInput')?.value || '';
    const confirmPassword = document.getElementById('confirmPasswordInput')?.value || '';
    const errorElement = document.getElementById('changePasswordError');

    if (!errorElement) return;

    errorElement.style.display = 'none';
    errorElement.textContent = '';

    if (!oldPassword || !newPassword || !confirmPassword) {
        errorElement.textContent = 'Заполните все поля';
        errorElement.style.display = 'block';
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) {
        showToast('Профиль пользователя не найден', 'error');
        return;
    }

    if (!(await verifyPassword(oldPassword, userData.password))) {
        errorElement.textContent = 'Текущий пароль введён неверно';
        errorElement.style.display = 'block';
        return;
    }

    const passwordError = typeof validatePasswordComplexity === 'function'
        ? validatePasswordComplexity(newPassword, [currentUser.name, currentUser.email?.split('@')[0], currentUser.email])
        : null;

    if (passwordError) {
        errorElement.textContent = passwordError;
        errorElement.style.display = 'block';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'Новые пароли не совпадают';
        errorElement.style.display = 'block';
        return;
    }

    userData.password = await hashPassword(newPassword);
    saveUserData(currentUser.email, userData);

    hideChangePasswordModal();
    showToast('Пароль успешно изменён', 'success');
}

function changePassword() {
    showChangePasswordModal();
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
// Safe ASCII overrides for medicine-add/taken flow (kept at the end so they win over earlier duplicates).
function addToMyMedicines(name) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Войдите в аккаунт, чтобы добавлять лекарства.', 'error');
        showAuthModal();
        return;
    }

    if (medicines.some(med => med.name === name)) {
        showToast('Это лекарство уже есть в аптечке.', 'info');
        return;
    }

    const medData = Array.isArray(medsDatabase)
        ? medsDatabase.find(med => med.name === name)
        : null;
    const symptomsText = medData?.symptoms?.length
        ? medData.symptoms.map(symptom => escapeHtml(symptom)).join(', ')
        : 'Не указаны';

    closeSearchAddMedicineModal();

    const modalHTML = `
        <div class="modal fade show d-block" id="searchAddMedicineModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавить «${escapeHtml(name)}» в аптечку</h5>
                        <button type="button" class="btn-close" onclick="closeSearchAddMedicineModal()"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="searchMedicineName" value="${escapeAttribute(name)}">
                        <p class="mb-3"><strong>Симптомы:</strong> ${symptomsText}</p>

                        <label class="form-label">Приёмов в день</label>
                        <select class="form-select mb-3" id="searchMedicineDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3" selected>3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>

                        <label class="form-label">Срок приёма (дней)</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineDurationDays" min="1" value="7">

                        <label class="form-label">Дозировка одной таблетки (мг)</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineDoseMg" min="1" step="1" value="500">

                        <label class="form-label">Количество таблеток в наличии</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineStockCount" min="1" step="1" value="20">

                        <label class="form-label">Начало приёма</label>
                        <input type="datetime-local" class="form-control" id="searchMedicineStartDate">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="closeSearchAddMedicineModal()">Отмена</button>
                        <button type="button" class="btn btn-success" onclick="confirmAddToMyMedicines()">Добавить</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show search-add-modal-backdrop"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const startDateInput = document.getElementById('searchMedicineStartDate');
    if (startDateInput) {
        startDateInput.value = localDateTime;
    }
}

function closeSearchAddMedicineModal() {
    document.getElementById('searchAddMedicineModal')?.remove();
    document.querySelector('.search-add-modal-backdrop')?.remove();
}

function confirmAddToMyMedicines() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Войдите в аккаунт, чтобы добавлять лекарства.', 'error');
        closeSearchAddMedicineModal();
        showAuthModal();
        return;
    }

    const medicineName = document.getElementById('searchMedicineName')?.value?.trim();
    const dosesPerDay = document.getElementById('searchMedicineDosesPerDay')?.value;
    const durationDays = Number(document.getElementById('searchMedicineDurationDays')?.value);
    const dosageMg = Math.round(Number(document.getElementById('searchMedicineDoseMg')?.value));
    const tabletsInStock = Math.round(Number(document.getElementById('searchMedicineStockCount')?.value));
    const startDate = document.getElementById('searchMedicineStartDate')?.value;

    if (!medicineName) {
        showToast('Не удалось определить название лекарства.', 'error');
        return;
    }

    if (medicines.some(med => med.name === medicineName)) {
        showToast('Это лекарство уже есть в аптечке.', 'info');
        closeSearchAddMedicineModal();
        return;
    }

    if (!startDate) {
        showToast('Укажите дату начала приёма.', 'error');
        return;
    }

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
        showToast('Укажите корректный срок приёма в днях.', 'error');
        return;
    }

    if (!Number.isFinite(dosageMg) || dosageMg <= 0) {
        showToast('Укажите корректную дозировку в миллиграммах.', 'error');
        return;
    }

    if (!Number.isFinite(tabletsInStock) || tabletsInStock <= 0) {
        showToast('Укажите количество таблеток в наличии.', 'error');
        return;
    }

    const medData = Array.isArray(medsDatabase)
        ? medsDatabase.find(med => med.name === medicineName)
        : null;
    const schedule = generateSchedule(startDate, dosesPerDay, durationDays);

    const medicineId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    medicines.push({
        id: medicineId,
        name: medicineName,
        symptoms: medData?.symptoms || [],
        date: new Date().toLocaleDateString(),
        schedule,
        taken: {},
        dosageMg,
        tabletsInStock,
        tabletsLeft: tabletsInStock,
        contraindications: 'Загружаю противопоказания из интернета...',
        contraindicationsStatus: 'pending_auto',
        shortInstruction: buildShortInstructionForMedicine({
            name: medicineName,
            symptoms: medData?.symptoms || [],
            dosageMg
        })
    });

    saveMedicines();
    void enrichMedicineContraindications(medicineId);
    closeSearchAddMedicineModal();
    showToast(`«${medicineName}» добавлено в аптечку.`, 'success');
    showSection('medicines');
}

function markAsTaken(medId, time) {
    if (time > Date.now()) {
        showToast(`Слишком рано. Подтвердить можно через ${formatTimeTo(time)}.`, 'warning');
        return;
    }

    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    med.taken = med.taken || {};
    if (med.taken[time]) {
        showToast('Этот приём уже отмечен.', 'info');
        return;
    }

    const hasStockTracking = Number.isFinite(Number(med.tabletsInStock));
    const leftStock = hasStockTracking
        ? Math.max(0, Math.round(Number(med.tabletsLeft ?? med.tabletsInStock)))
        : null;

    if (hasStockTracking && leftStock <= 0) {
        showToast(`Нельзя отметить приём: у «${med.name}» закончились таблетки.`, 'warning');
        return;
    }

    med.taken[time] = true;
    if (hasStockTracking) {
        med.tabletsLeft = Math.max(0, leftStock - 1);
    }

    saveMedicines();
    showToast(`Приём «${med.name}» отмечен.`, 'success');
    void runTelegramCareCheck();
    showSection('medicines');
}

function renderRestockForecastAlert() {
    const container = document.getElementById('restockForecastAlert');
    if (!container) return;

    const summary = getRestockForecastSummary();
    if (!summary.urgentItems.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="restock-forecast-alert alert alert-warning mb-3">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                    <h5 class="mb-2"><i class="fas fa-capsules me-2"></i>Скоро закончатся лекарства</h5>
                    <p class="mb-2">
                        Под контролем: <strong>${summary.monitoredCount}</strong>.
                        Целевой запас: <strong>${summary.warningDays}</strong> дн.
                        Нужно докупить: <strong>${summary.totalNeedToBuy}</strong> табл.
                        ${summary.outOfStockCount > 0 ? ` Пустых позиций: <strong>${summary.outOfStockCount}</strong>.` : ''}
                    </p>
                    <ul class="mb-0 ps-3">
                        ${summary.urgentItems.slice(0, 6).map(item => `
                            <li class="mb-2">
                                <div><strong>${escapeHtml(item.name)}</strong>: остаток ${item.leftStock} табл., примерно на ${item.daysLeft.toFixed(1)} дн., докупить ${item.recommendedBuy} табл.</div>
                                ${summary.autoRestockEnabled ? `
                                    <button class="btn btn-sm btn-outline-success mt-1" onclick="applyAutoRestockPurchase('${escapeAttribute(item.id)}', ${item.recommendedBuy})">
                                        <i class="fas fa-cart-plus me-1"></i>Отметить покупку (+${item.recommendedBuy})
                                    </button>
                                ` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-outline-primary" onclick="copyRestockListToClipboard()">
                        <i class="fas fa-copy me-1"></i>Скопировать список
                    </button>
                    ${summary.autoRestockEnabled ? `
                        <button class="btn btn-sm btn-outline-success" onclick="applyAutoRestockForAllUrgent()">
                            <i class="fas fa-basket-shopping me-1"></i>Пополнить всё
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-primary" onclick="showSection('map')">
                        <i class="fas fa-map-marker-alt me-1"></i>Открыть карту аптек
                    </button>
                </div>
            </div>
        </div>
    `;
}

function exportData() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для экспорта данных необходимо войти в систему', 'error');
        return;
    }

    const payload = buildSyncPayloadForCurrentUser();
    if (!payload) {
        showToast('Не удалось подготовить экспорт.', 'error');
        return;
    }

    const dataStr = JSON.stringify(payload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-aptechka-backup-${currentUser.email}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);

    showToast('Данные экспортированы.', 'success');
}

function importData() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Для импорта данных необходимо войти в систему', 'error');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            try {
                const importedData = JSON.parse(loadEvent.target.result);
                applyImportedBackupPayload(importedData, {
                    sourceLabel: `файла ${file.name}`
                });
            } catch (error) {
                console.error('Import error:', error);
                showToast('Ошибка при чтении файла.', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function addToMyMedicines(name) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Войдите в аккаунт, чтобы добавлять лекарства.', 'error');
        showAuthModal();
        return;
    }

    if (medicines.some(med => med.name === name)) {
        showToast('Это лекарство уже есть в аптечке.', 'info');
        return;
    }

    const medData = Array.isArray(medsDatabase)
        ? medsDatabase.find(med => med.name === name)
        : null;
    const symptomsText = medData?.symptoms?.length
        ? medData.symptoms.map(symptom => escapeHtml(symptom)).join(', ')
        : 'Не указаны';
    const plannerSettings = getPlannerSettings(getFullCurrentUser());

    closeSearchAddMedicineModal();

    const modalHTML = `
        <div class="modal fade show d-block" id="searchAddMedicineModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавить «${escapeHtml(name)}» в аптечку</h5>
                        <button type="button" class="btn-close" onclick="closeSearchAddMedicineModal()"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="searchMedicineName" value="${escapeAttribute(name)}">
                        <p class="mb-3"><strong>Симптомы:</strong> ${symptomsText}</p>

                        <label class="form-label">Приёмов в день</label>
                        <select class="form-select mb-3" id="searchMedicineDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3" selected>3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>

                        <label class="form-label">Режим приёма</label>
                        <select class="form-select mb-3" id="searchMedicinePlannerMode">
                            ${buildIntakePlannerModeOptions(plannerSettings.defaultMode)}
                        </select>

                        <label class="form-label">Срок приёма (дней)</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineDurationDays" min="1" value="7">

                        <label class="form-label">Дозировка одной таблетки (мг)</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineDoseMg" min="1" step="1" value="500">

                        <label class="form-label">Количество таблеток в наличии</label>
                        <input type="number" class="form-control mb-3" id="searchMedicineStockCount" min="1" step="1" value="20">

                        <label class="form-label">Начало приёма</label>
                        <input type="datetime-local" class="form-control" id="searchMedicineStartDate">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="closeSearchAddMedicineModal()">Отмена</button>
                        <button type="button" class="btn btn-success" onclick="confirmAddToMyMedicines()">Добавить</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show search-add-modal-backdrop"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const startDateInput = document.getElementById('searchMedicineStartDate');
    if (startDateInput) {
        startDateInput.value = localDateTime;
    }
}

function confirmAddToMyMedicines() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Войдите в аккаунт, чтобы добавлять лекарства.', 'error');
        closeSearchAddMedicineModal();
        showAuthModal();
        return;
    }

    const medicineName = document.getElementById('searchMedicineName')?.value?.trim();
    const dosesPerDay = document.getElementById('searchMedicineDosesPerDay')?.value;
    const intakePlannerMode = normalizeIntakePlannerMode(
        document.getElementById('searchMedicinePlannerMode')?.value
            || getPlannerSettings(getFullCurrentUser()).defaultMode
    );
    const durationDays = Number(document.getElementById('searchMedicineDurationDays')?.value);
    const dosageMg = Math.round(Number(document.getElementById('searchMedicineDoseMg')?.value));
    const tabletsInStock = Math.round(Number(document.getElementById('searchMedicineStockCount')?.value));
    const startDate = document.getElementById('searchMedicineStartDate')?.value;

    if (!medicineName) {
        showToast('Не удалось определить название лекарства.', 'error');
        return;
    }

    if (medicines.some(med => med.name === medicineName)) {
        showToast('Это лекарство уже есть в аптечке.', 'info');
        closeSearchAddMedicineModal();
        return;
    }

    if (!startDate) {
        showToast('Укажите дату начала приёма.', 'error');
        return;
    }

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
        showToast('Укажите корректный срок приёма в днях.', 'error');
        return;
    }

    if (!Number.isFinite(dosageMg) || dosageMg <= 0) {
        showToast('Укажите корректную дозировку в миллиграммах.', 'error');
        return;
    }

    if (!Number.isFinite(tabletsInStock) || tabletsInStock <= 0) {
        showToast('Укажите количество таблеток в наличии.', 'error');
        return;
    }

    const medData = Array.isArray(medsDatabase)
        ? medsDatabase.find(med => med.name === medicineName)
        : null;
    const schedule = generateSchedule(startDate, dosesPerDay, durationDays, intakePlannerMode);

    const medicineId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    medicines.push({
        id: medicineId,
        name: medicineName,
        symptoms: medData?.symptoms || [],
        date: new Date().toLocaleDateString(),
        schedule,
        taken: {},
        intakePlannerMode,
        dosageMg,
        tabletsInStock,
        tabletsLeft: tabletsInStock,
        contraindications: 'Загружаю противопоказания из интернета...',
        contraindicationsStatus: 'pending_auto',
        shortInstruction: buildShortInstructionForMedicine({
            name: medicineName,
            symptoms: medData?.symptoms || [],
            dosageMg
        })
    });

    saveMedicines();
    void enrichMedicineContraindications(medicineId);
    closeSearchAddMedicineModal();
    showToast(`«${medicineName}» добавлено в аптечку.`, 'success');
    showSection('medicines');
}

const CONTRAINDICATIONS_ALIAS_MAP_V2 = {
    paracetamol: ['acetaminophen', 'paracetamol'],
    nurofen: ['ibuprofen'],
    ibuprofen: ['ibuprofen'],
    'no-shpa': ['drotaverine', 'drotaverine hydrochloride'],
    drotaverin: ['drotaverine'],
    aspirin: ['aspirin', 'acetylsalicylic acid'],
    'acetilsalicilovaya kislota': ['aspirin', 'acetylsalicylic acid'],
    amoksicillin: ['amoxicillin'],
    amoksiklav: ['amoxicillin', 'clavulanate'],
    azitromicin: ['azithromycin'],
    klaritromicin: ['clarithromycin'],
    ceftriakson: ['ceftriaxone'],
    loratadin: ['loratadine'],
    cetirizin: ['cetirizine'],
    suprastin: ['chloropyramine'],
    klaritin: ['loratadine'],
    erius: ['desloratadine'],
    omeprazol: ['omeprazole'],
    nolpaza: ['pantoprazole'],
    mezim: ['pancreatin'],
    pankreatin: ['pancreatin'],
    smekta: ['diosmectite', 'smectite'],
    enterosgel: ['polymethylsiloxane polyhydrate'],
    'aktivirovannyy ugol': ['activated charcoal'],
    loperamid: ['loperamide'],
    imodium: ['loperamide'],
    enterofuril: ['nifuroxazide'],
    nifuroksazid: ['nifuroxazide'],
    zyrtec: ['cetirizine'],
    zodak: ['cetirizine'],
    tavegil: ['clemastine'],
    fenistil: ['dimetindene'],
    diklofenak: ['diclofenac'],
    ketorol: ['ketorolac'],
    ketanov: ['ketorolac'],
    nimesulid: ['nimesulide'],
    nazivin: ['oxymetazoline'],
    otrivin: ['xylometazoline'],
    tizin: ['tetryzoline'],
    nazol: ['oxymetazoline'],
    naftizin: ['naphazoline']
};

function transliterateToLatin(text) {
    const map = {
        '\u0430': 'a', '\u0431': 'b', '\u0432': 'v', '\u0433': 'g', '\u0434': 'd', '\u0435': 'e', '\u0451': 'e',
        '\u0436': 'zh', '\u0437': 'z', '\u0438': 'i', '\u0439': 'y', '\u043a': 'k', '\u043b': 'l', '\u043c': 'm',
        '\u043d': 'n', '\u043e': 'o', '\u043f': 'p', '\u0440': 'r', '\u0441': 's', '\u0442': 't', '\u0443': 'u',
        '\u0444': 'f', '\u0445': 'kh', '\u0446': 'ts', '\u0447': 'ch', '\u0448': 'sh', '\u0449': 'sch',
        '\u044a': '', '\u044b': 'y', '\u044c': '', '\u044d': 'e', '\u044e': 'yu', '\u044f': 'ya'
    };

    return String(text || '')
        .toLowerCase()
        .split('')
        .map(char => map[char] ?? char)
        .join('')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeOpenFdaTerm(term) {
    return String(term || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getTermMorphologyVariants(term) {
    const normalized = normalizeOpenFdaTerm(term);
    if (!normalized) return [];

    const variants = new Set([normalized]);
    const tokens = normalized.split(' ').filter(Boolean);

    if (normalized.includes('-')) {
        variants.add(normalized.replace(/-/g, ' '));
        variants.add(normalized.replace(/-/g, ''));
    }

    const endingRules = [
        [/zin$/, 'zine'],
        [/din$/, 'dine'],
        [/rin$/, 'rine'],
        [/zol$/, 'zole'],
        [/azol$/, 'azole'],
        [/prazol$/, 'prazole'],
        [/verin$/, 'verine'],
        [/micin$/, 'mycin']
    ];

    for (const token of tokens) {
        if (token.length < 4) continue;
        for (const [pattern, replacement] of endingRules) {
            if (pattern.test(token)) {
                variants.add(normalized.replace(token, token.replace(pattern, replacement)));
            }
        }
    }

    return [...variants];
}

function getContraindicationLookupTerms(medicineName) {
    const original = String(medicineName || '').trim();
    if (!original) return [];

    const transliterated = transliterateToLatin(original);
    const normalizedKey = normalizeOpenFdaTerm(transliterated);

    const aliases = [
        ...(CONTRAINDICATIONS_ALIAS_MAP_V2[normalizedKey] || []),
        ...(typeof CONTRAINDICATIONS_ALIAS_MAP === 'object' ? (CONTRAINDICATIONS_ALIAS_MAP[original.toLowerCase()] || []) : [])
    ];
    const synonymSeeds = typeof getMedicineSynonyms === 'function'
        ? getMedicineSynonyms(original).map(item => transliterateToLatin(item))
        : [];

    const seedTerms = [transliterated, ...aliases, ...synonymSeeds];
    const expanded = seedTerms.flatMap(getTermMorphologyVariants);
    return [...new Set(expanded.filter(Boolean))].slice(0, 24);
}

async function queryOpenFdaContraindications(term, field) {
    const safeTerm = normalizeOpenFdaTerm(term);
    if (!safeTerm) return null;

    const tokens = safeTerm.split(' ').filter(Boolean);
    const queryCandidates = new Set();

    queryCandidates.add(`${field}:"${safeTerm}"`);
    if (tokens.length === 1) {
        queryCandidates.add(`${field}:${tokens[0]}`);
        if (tokens[0].length >= 4) {
            queryCandidates.add(`${field}:${tokens[0]}*`);
        }
    } else if (tokens.length >= 2) {
        const [first, second] = tokens;
        queryCandidates.add(`${field}:${first} AND ${field}:${second}`);
        if (first.length >= 4 && second.length >= 4) {
            queryCandidates.add(`${field}:${first}* AND ${field}:${second}*`);
        }
    }

    for (const query of queryCandidates) {
        const url = `${OPEN_FDA_BASE_URL}?search=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        const firstResult = Array.isArray(data.results) ? data.results[0] : null;
        const contraindications = extractContraindicationsFromLabelResult(firstResult);
        if (!contraindications) continue;

        return {
            contraindications,
            sourceUrl: url,
            matchedTerm: safeTerm
        };
    }

    return null;
}

async function fetchContraindicationsFromInternet(medicineName) {
    const terms = getContraindicationLookupTerms(medicineName);
    const fields = ['openfda.brand_name', 'openfda.generic_name', 'openfda.substance_name'];

    for (const term of terms) {
        for (const field of fields) {
            try {
                const hit = await queryOpenFdaContraindications(term, field);
                if (hit?.contraindications) {
                    return hit;
                }
            } catch (error) {
                console.warn('OpenFDA lookup failed:', error);
            }
        }
    }

    return null;
}



