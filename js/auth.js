﻿// ==================== СИСТЕМА АУТЕНТИФИКАЦИИ ====================

const PASSWORD_HASH_PREFIX = 'sha256:';
const LEGACY_HASH_PREFIX = 'legacy:';
const DEFAULT_USER_SETTINGS = {
    notifications: 'enabled',
    theme: 'light'
};
const DEFAULT_GAMIFICATION_STATE = {
    coins: 0,
    loginStreak: 0,
    bestLoginStreak: 0,
    lastLoginRewardDay: '',
    unlockedAchievements: [],
    unlockedCustomizations: [],
    activeCustomization: ''
};
const MIN_PASSWORD_LENGTH = 10;
const COMMON_WEAK_PASSWORDS = [
    '12345678', '123456789', '1234567890', 'qwerty123', 'password123',
    'пароль123', 'admin123', '123qweasd', '1111111111'
];
const MAX_AVATAR_UPLOAD_BYTES = 10 * 1024 * 1024;
const NICKNAME_REGEX = /^[\p{L}\p{N}](?:[\p{L}\p{N}._-]{1,18}[\p{L}\p{N}])?$/u;

// ==================== БАЗОВЫЕ УТИЛИТЫ ====================

function toBase64Utf8(value) {
    try {
        return btoa(unescape(encodeURIComponent(value)));
    } catch (error) {
        console.error('Ошибка кодирования строки:', error);
        return '';
    }
}

function validateNickname(value) {
    const nickname = String(value || '').trim();
    if (nickname.length < 3) {
        return 'Никнейм должен быть не короче 3 символов';
    }
    if (nickname.length > 20) {
        return 'Никнейм должен быть не длиннее 20 символов';
    }
    if (!NICKNAME_REGEX.test(nickname)) {
        return 'Никнейм: только буквы, цифры, . _ -, без пробелов и спецсимволов по краям';
    }
    if (/[._-]{2,}/.test(nickname)) {
        return 'Никнейм не должен содержать подряд несколько спецсимволов';
    }
    return null;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function getInitials(name) {
    return String(name || 'Пользователь')
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            resolve(loadEvent.target?.result || '');
        };
        reader.onerror = function() {
            reject(new Error('Не удалось прочитать файл'));
        };
        reader.readAsDataURL(file);
    });
}

function togglePasswordVisibility(inputId, triggerButton) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const shouldShow = input.type === 'password';
    input.type = shouldShow ? 'text' : 'password';

    if (triggerButton) {
        const icon = triggerButton.querySelector('i');
        if (icon) {
            icon.className = `fas ${shouldShow ? 'fa-eye-slash' : 'fa-eye'}`;
        }
        triggerButton.setAttribute('aria-label', shouldShow ? 'Скрыть пароль' : 'Показать пароль');
        triggerButton.setAttribute('title', shouldShow ? 'Скрыть пароль' : 'Показать пароль');
    }
}

// ==================== ХЕШИРОВАНИЕ ПАРОЛЕЙ ====================

async function hashPassword(password) {
    if (window.crypto?.subtle && window.TextEncoder) {
        const data = new TextEncoder().encode(password);
        const buffer = await window.crypto.subtle.digest('SHA-256', data);
        const hash = Array.from(new Uint8Array(buffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
        return `${PASSWORD_HASH_PREFIX}${hash}`;
    }

    return `${LEGACY_HASH_PREFIX}${toBase64Utf8(password)}`;
}

function matchesLegacyPassword(password, storedHash) {
    const legacyHash = toBase64Utf8(password);
    return storedHash === legacyHash || storedHash === `${LEGACY_HASH_PREFIX}${legacyHash}`;
}

async function verifyPassword(password, storedHash) {
    if (!storedHash) return false;

    if (storedHash.startsWith(PASSWORD_HASH_PREFIX)) {
        return storedHash === await hashPassword(password);
    }

    return matchesLegacyPassword(password, storedHash);
}

function validatePasswordComplexity(password, relatedValues = []) {
    const normalizedPassword = String(password || '').trim();
    if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
        return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`;
    }

    if (!/[A-Z\p{Lu}]/u.test(normalizedPassword)) {
        return 'Добавьте хотя бы одну заглавную букву';
    }

    if (!/[a-z\p{Ll}]/u.test(normalizedPassword)) {
        return 'Добавьте хотя бы одну строчную букву';
    }

    if (!/\d/.test(normalizedPassword)) {
        return 'Добавьте хотя бы одну цифру';
    }

    if (!/[^\w\s]/.test(normalizedPassword)) {
        return 'Добавьте хотя бы один специальный символ';
    }

    if (/(.)\1{3,}/.test(normalizedPassword)) {
        return 'Не используйте длинные повторы одного символа';
    }

    if (/1234|abcd|qwer|йцук/i.test(normalizedPassword)) {
        return 'Не используйте простые последовательности вроде 1234 или qwerty';
    }

    if (COMMON_WEAK_PASSWORDS.includes(normalizedPassword.toLowerCase())) {
        return 'Этот пароль слишком простой';
    }

    const loweredPassword = normalizedPassword.toLowerCase();
    const hasPersonalData = relatedValues
        .filter(Boolean)
        .map(value => String(value).toLowerCase())
        .some(value => value.length >= 3 && loweredPassword.includes(value));

    if (hasPersonalData) {
        return 'Не используйте в пароле своё имя, почту или другие личные данные';
    }

    return null;
}

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================

function buildCurrentUser(userData = {}, fallback = {}) {
    return {
        name: userData.name || fallback.name || 'Пользователь',
        email: userData.email || fallback.email || '',
        createdAt: userData.createdAt || fallback.createdAt || null
    };
}

function normalizeGamificationRecord(rawValue = {}) {
    const raw = rawValue && typeof rawValue === 'object' ? rawValue : {};
    const unlockedAchievements = Array.isArray(raw.unlockedAchievements)
        ? [...new Set(raw.unlockedAchievements.map(item => String(item || '').trim()).filter(Boolean))]
        : [];
    const unlockedCustomizations = Array.isArray(raw.unlockedCustomizations)
        ? [...new Set(raw.unlockedCustomizations.map(item => String(item || '').trim()).filter(Boolean))]
        : [];
    const activeCustomization = String(raw.activeCustomization || '').trim();

    return {
        coins: Math.max(0, Math.floor(Number(raw.coins) || 0)),
        loginStreak: Math.max(0, Math.min(7, Math.floor(Number(raw.loginStreak) || 0))),
        bestLoginStreak: Math.max(0, Math.floor(Number(raw.bestLoginStreak) || 0)),
        lastLoginRewardDay: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.lastLoginRewardDay || ''))
            ? String(raw.lastLoginRewardDay)
            : '',
        unlockedAchievements,
        unlockedCustomizations,
        activeCustomization: unlockedCustomizations.includes(activeCustomization) ? activeCustomization : ''
    };
}

function normalizeUserRecord(userData = {}, fallbackEmail = '') {
    const source = userData && typeof userData === 'object' ? userData : {};

    return {
        ...source,
        name: source.name || 'Пользователь',
        email: source.email || fallbackEmail,
        password: source.password || '',
        createdAt: source.createdAt || new Date().toISOString(),
        medicines: Array.isArray(source.medicines) ? source.medicines : [],
        settings: {
            ...DEFAULT_USER_SETTINGS,
            ...(source.settings || {})
        },
        avatar: source.avatar || null,
        gamification: normalizeGamificationRecord({
            ...DEFAULT_GAMIFICATION_STATE,
            ...(source.gamification || {})
        })
    };
}

function getAllUsers() {
    try {
        const rawUsers = JSON.parse(localStorage.getItem('users') || '{}');
        return Object.fromEntries(
            Object.entries(rawUsers).map(([email, userData]) => [
                email,
                normalizeUserRecord(userData, email)
            ])
        );
    } catch (error) {
        console.error('Ошибка чтения пользователей:', error);
        return {};
    }
}

function saveAllUsers(users) {
    try {
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения пользователей:', error);
        return false;
    }
}

function getUserData(email) {
    if (!email) return null;

    const users = getAllUsers();
    return users[email] || null;
}

function syncCurrentUser(userData) {
    const currentUser = getCurrentUser();
    if (currentUser?.email && currentUser.email === userData?.email) {
        setCurrentUser(buildCurrentUser(userData, currentUser));
    }
}

function saveUserData(email, userData) {
    if (!email) return null;

    const users = getAllUsers();
    const normalizedUser = normalizeUserRecord(
        {
            ...(users[email] || {}),
            ...userData,
            email
        },
        email
    );

    users[email] = normalizedUser;
    const isSaved = saveAllUsers(users);
    if (!isSaved) {
        return null;
    }
    syncCurrentUser(normalizedUser);

    return normalizedUser;
}

// ==================== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ====================

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (error) {
        console.error('Ошибка чтения текущего пользователя:', error);
        return null;
    }
}

function setCurrentUser(user) {
    try {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(buildCurrentUser(user)));
        } else {
            localStorage.removeItem('currentUser');
        }
    } catch (error) {
        console.error('Ошибка сохранения текущего пользователя:', error);
    }
}

function getUserSettings() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    const userData = getUserData(currentUser.email);
    return userData?.settings || { ...DEFAULT_USER_SETTINGS };
}

function saveUserSetting(key, value) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    saveUserData(currentUser.email, {
        ...userData,
        settings: {
            ...userData.settings,
            [key]: value
        }
    });
}

// ==================== РЕГИСТРАЦИЯ (ЛОКАЛЬНАЯ) ====================

async function register() {
    const name = document.getElementById('registerName')?.value.trim() || '';
    const email = document.getElementById('registerEmail')?.value.trim().toLowerCase() || '';
    const password = document.getElementById('registerPassword')?.value || '';
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value || '';
    const errorElement = document.getElementById('registerError');
    const privacyCheckbox = document.getElementById('privacyCheckbox');

    if (!errorElement) return;
    errorElement.style.display = 'none';

    if (!privacyCheckbox?.checked) {
        errorElement.textContent = 'Необходимо согласиться с политикой конфиденциальности';
        errorElement.style.display = 'block';
        return;
    }

    if (!name || !email || !password || !confirmPassword) {
        errorElement.textContent = 'Все поля обязательны для заполнения';
        errorElement.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        errorElement.textContent = 'Пароли не совпадают';
        errorElement.style.display = 'block';
        return;
    }

    if (!validateEmail(email)) {
        errorElement.textContent = 'Введите корректный email адрес';
        errorElement.style.display = 'block';
        return;
    }

    const nicknameError = validateNickname(name);
    if (nicknameError) {
        errorElement.textContent = nicknameError;
        errorElement.style.display = 'block';
        return;
    }

    const passwordError = validatePasswordComplexity(password, [name, email.split('@')[0], email]);
    if (passwordError) {
        errorElement.textContent = passwordError;
        errorElement.style.display = 'block';
        return;
    }

    const users = getAllUsers();
    if (users[email]) {
        errorElement.textContent = 'Пользователь с таким email уже существует';
        errorElement.style.display = 'block';
        return;
    }

    const newUser = normalizeUserRecord({
        name,
        email,
        password: await hashPassword(password)
    }, email);

    users[email] = newUser;
    const isSaved = saveAllUsers(users);
    if (!isSaved) {
        errorElement.textContent = 'Не удалось сохранить профиль в браузере';
        errorElement.style.display = 'block';
        return;
    }

    loginUser(newUser);
    hideAuthModal();
    showToast(`Добро пожаловать, ${name}!`, 'success');
}

// ==================== ВХОД (ЛОКАЛЬНЫЙ) ====================

async function login() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');

    errorElement.style.display = 'none';

    if (!email || !password) {
        errorElement.textContent = 'Введите email и пароль';
        errorElement.style.display = 'block';
        return;
    }

    const userData = getUserData(email);
    if (!userData) {
        errorElement.textContent = 'Пользователь не найден';
        errorElement.style.display = 'block';
        return;
    }

    const isValidPassword = await verifyPassword(password, userData.password);
    if (!isValidPassword) {
        errorElement.textContent = 'Неверный пароль';
        errorElement.style.display = 'block';
        return;
    }

    // Обновляем хеш пароля на новый стандарт, если нужно
    if (!userData.password.startsWith(PASSWORD_HASH_PREFIX)) {
        userData.password = await hashPassword(password);
        saveUserData(email, userData);
    }

    loginUser(userData);
    hideAuthModal();
    showToast(`С возвращением, ${userData.name}!`, 'success');
}

function loginUser(user) {
    const latestUserData = user?.email ? getUserData(user.email) || user : user;
    setCurrentUser(buildCurrentUser(latestUserData, user));
    if (typeof awardDailyLoginCoins === 'function') {
        awardDailyLoginCoins({ silent: false });
    }
    if (typeof applyCustomizationThemeForCurrentUser === 'function') {
        applyCustomizationThemeForCurrentUser();
    }
    updateUserInterface();
    loadMedicines();
    showSection('medicines');
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        setCurrentUser(null);
        updateUserInterface();
        if (typeof clearCustomizationThemeClasses === 'function') {
            clearCustomizationThemeClasses();
        }
        medicines = [];
        showSection('medicines');
        showToast('Вы успешно вышли из системы', 'info');
    }
}

// ==================== ИНТЕРФЕЙС АУТЕНТИФИКАЦИИ ====================

function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.getElementById('loginEmail')?.focus();
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function applyAvatarToElement(element, userData, fallbackName) {
    if (!element) return;

    const initials = getInitials(fallbackName || userData?.name || 'Пользователь');
    element.style.background = 'linear-gradient(135deg, #4361ee, #7209b7)';

    if (userData?.avatar?.type === 'image') {
        element.style.background = 'transparent';
        element.innerHTML = '<img src="' + userData.avatar.data + '" alt="Аватар" class="avatar-preview">';
        return;
    }

    if (userData?.avatar?.type === 'color') {
        element.style.background = userData.avatar.data;
    }

    element.innerHTML = `<span>${initials}</span>`;
}

function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = function() {
            resolve(image);
        };
        image.onerror = function() {
            reject(new Error('Не удалось обработать изображение'));
        };
        image.src = dataUrl;
    });
}

function ensureAvatarPreviewTextElement(avatarPreview) {
    if (!avatarPreview) return null;

    let avatarPreviewText = document.getElementById('avatarPreviewText');
    if (!avatarPreviewText) {
        avatarPreviewText = document.createElement('span');
        avatarPreviewText.id = 'avatarPreviewText';
        avatarPreview.appendChild(avatarPreviewText);
    } else if (avatarPreviewText.parentElement !== avatarPreview) {
        avatarPreview.appendChild(avatarPreviewText);
    }

    return avatarPreviewText;
}

function setAvatarPreviewImage(avatarPreview, avatarPreviewText, imageDataUrl) {
    if (!avatarPreview || !avatarPreviewText) return;

    let image = avatarPreview.querySelector('img.avatar-preview');
    if (!image) {
        image = document.createElement('img');
        image.className = 'avatar-preview';
        image.alt = 'Аватар';
        avatarPreview.appendChild(image);
    }

    image.src = imageDataUrl;
    avatarPreview.style.background = 'transparent';
    avatarPreviewText.style.display = 'none';
}

function setAvatarPreviewInitials(avatarPreview, avatarPreviewText, initials, background) {
    if (!avatarPreview || !avatarPreviewText) return;

    avatarPreview.querySelectorAll('img.avatar-preview').forEach(image => image.remove());
    avatarPreview.style.background = background;
    avatarPreviewText.textContent = initials;
    avatarPreviewText.style.display = 'flex';
}

async function optimizeAvatarDataUrl(dataUrl) {
    const image = await loadImageFromDataUrl(dataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 256;

    canvas.width = size;
    canvas.height = size;

    const sourceSize = Math.min(image.width, image.height);
    const offsetX = (image.width - sourceSize) / 2;
    const offsetY = (image.height - sourceSize) / 2;

    ctx.drawImage(
        image,
        offsetX,
        offsetY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
    );

    return canvas.toDataURL('image/jpeg', 0.82);
}

function updateUserInterface() {
    const currentUser = getCurrentUser();
    const userAvatar = document.getElementById('userAvatar');
    const loginButton = document.getElementById('loginButton');
    const avatarInitials = document.getElementById('avatarInitials');

    if (currentUser) {
        const userData = getUserData(currentUser.email) || currentUser;

        if (userAvatar) {
            userAvatar.style.display = 'flex';
            applyAvatarToElement(userAvatar, userData, currentUser.name);
        }

        if (avatarInitials) {
            avatarInitials.textContent = getInitials(currentUser.name);
        }

        if (loginButton) {
            loginButton.style.display = 'none';
        }
    } else {
        if (userAvatar) {
            userAvatar.style.display = 'none';
            userAvatar.innerHTML = '<span></span>';
            userAvatar.style.background = 'linear-gradient(135deg, #4361ee, #7209b7)';
        }

        if (loginButton) {
            loginButton.style.display = 'block';
        }
    }
}

function checkAuth() {
    const currentUser = getCurrentUser();
    if (!currentUser?.email) {
        updateUserInterface();
        return;
    }

    const userData = getUserData(currentUser.email);
    if (!userData) {
        setCurrentUser(null);
    } else {
        setCurrentUser(buildCurrentUser(userData, currentUser));
    }

    updateUserInterface();
}

// ==================== МОДАЛЬНОЕ ОКНО АВАТАРА ====================

function showAvatarModal() {
    const modal = document.getElementById('avatarModal');
    const currentUser = getCurrentUser();
    if (!modal || !currentUser) return;

    const userData = getUserData(currentUser.email);
    const avatarPreview = document.getElementById('currentAvatarPreview');
    const avatarPreviewText = ensureAvatarPreviewTextElement(avatarPreview);
    const avatarInput = document.getElementById('avatarInput');
    if (!avatarPreview || !avatarPreviewText) return;

    if (avatarInput) {
        avatarInput.value = '';
    }

    delete avatarPreview.dataset.tempAvatar;
    delete avatarPreview.dataset.tempColor;

    if (userData?.avatar?.type === 'image') {
        setAvatarPreviewImage(avatarPreview, avatarPreviewText, userData.avatar.data);
    } else {
        const background = userData?.avatar?.type === 'color'
            ? userData.avatar.data
            : 'linear-gradient(135deg, #4361ee, #7209b7)';
        setAvatarPreviewInitials(avatarPreview, avatarPreviewText, getInitials(currentUser.name), background);
    }

    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.color === userData?.avatar?.data);
    });

    modal.classList.remove('hidden');
    initAvatarUploader();
}

function hideAvatarModal() {
    const modal = document.getElementById('avatarModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function initAvatarUploader() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('currentAvatarPreview');
    const avatarPreviewText = ensureAvatarPreviewTextElement(avatarPreview);
    const currentUser = getCurrentUser();
    if (!avatarInput || !avatarPreview || !avatarPreviewText || !currentUser) return;

    avatarInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
            showToast('Файл слишком большой (макс. 10 МБ)', 'error');
            avatarInput.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('Выберите изображение', 'error');
            avatarInput.value = '';
            return;
        }

        readFileAsDataUrl(file)
            .then((dataUrl) => {
                if (!dataUrl) {
                    throw new Error('Пустое изображение');
                }
                setAvatarPreviewImage(avatarPreview, avatarPreviewText, dataUrl);
                avatarPreview.dataset.tempAvatar = dataUrl;
                delete avatarPreview.dataset.tempColor;
            })
            .catch((error) => {
                console.error('Ошибка чтения файла аватара:', error);
                showToast('Не удалось загрузить выбранное изображение', 'error');
                avatarInput.value = '';
            });
    };

    document.querySelectorAll('.color-option').forEach(option => {
        option.onclick = function() {
            document.querySelectorAll('.color-option').forEach(item => item.classList.remove('selected'));
            this.classList.add('selected');

            setAvatarPreviewInitials(
                avatarPreview,
                avatarPreviewText,
                getInitials(currentUser.name),
                this.dataset.color
            );
            avatarPreview.dataset.tempColor = this.dataset.color;
            delete avatarPreview.dataset.tempAvatar;
        };
    });
}

async function saveAvatar() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const avatarPreview = document.getElementById('currentAvatarPreview');
    const avatarInput = document.getElementById('avatarInput');
    const userData = getUserData(currentUser.email);
    if (!avatarPreview || !userData) return;

    const updatedUser = { ...userData };
    let tempAvatarData = avatarPreview.dataset.tempAvatar || '';

    if (!tempAvatarData && avatarInput?.files?.[0]) {
        try {
            tempAvatarData = await readFileAsDataUrl(avatarInput.files[0]);
        } catch (error) {
            console.error('Ошибка чтения файла перед сохранением:', error);
            showToast('Не удалось обработать выбранный файл', 'error');
            return;
        }
    }

    if (tempAvatarData) {
        try {
            const optimizedAvatar = await optimizeAvatarDataUrl(tempAvatarData);
            updatedUser.avatar = {
                type: 'image',
                data: optimizedAvatar
            };
        } catch (error) {
            console.error('Ошибка подготовки аватара, сохраняем исходное изображение:', error);
            updatedUser.avatar = {
                type: 'image',
                data: tempAvatarData
            };
        }
    } else if (avatarPreview.dataset.tempColor) {
        updatedUser.avatar = {
            type: 'color',
            data: avatarPreview.dataset.tempColor
        };
    }

    const savedUser = saveUserData(currentUser.email, updatedUser);
    if (!savedUser) {
        showToast('Не удалось сохранить аватар. Попробуйте изображение поменьше.', 'error');
        return;
    }

    hideAvatarModal();
    updateUserInterface();
    if (typeof showSection === 'function' && typeof currentSection !== 'undefined' && currentSection === 'profile') {
        showSection('profile');
    }
    showToast('Аватар сохранён', 'success');
}

function removeAvatar() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const userData = getUserData(currentUser.email);
    if (!userData) return;

    const savedUser = saveUserData(currentUser.email, {
        ...userData,
        avatar: null
    });

    if (!savedUser) {
        showToast('Не удалось удалить аватар', 'error');
        return;
    }

    hideAvatarModal();
    updateUserInterface();
    if (typeof showSection === 'function' && typeof currentSection !== 'undefined' && currentSection === 'profile') {
        showSection('profile');
    }
    showToast('Аватар удалён', 'info');
}

// ==================== ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ ====================

function showPrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hidePrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginTab && registerTab && loginForm && registerForm) {
        loginTab.addEventListener('click', function() {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            document.getElementById('loginError').style.display = 'none';
            document.getElementById('registerError').style.display = 'none';
        });

        registerTab.addEventListener('click', function() {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            document.getElementById('loginError').style.display = 'none';
            document.getElementById('registerError').style.display = 'none';
        });
    }

    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', function(event) {
            if (event.target === authModal) {
                hideAuthModal();
            }
        });
    }

    document.getElementById('loginEmail')?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') login();
    });

    document.getElementById('loginPassword')?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') login();
    });

    document.getElementById('registerName')?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') register();
    });

    document.getElementById('registerEmail')?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') register();
    });

    document.getElementById('registerPassword')?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') register();
    });

    document.getElementById('registerConfirmPassword')?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') register();
    });
});

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================

window.hashPassword = hashPassword;
window.verifyPassword = verifyPassword;
window.validatePasswordComplexity = validatePasswordComplexity;
window.getAllUsers = getAllUsers;
window.saveAllUsers = saveAllUsers;
window.getUserData = getUserData;
window.saveUserData = saveUserData;
window.getUserSettings = getUserSettings;
window.saveUserSetting = saveUserSetting;
window.checkAuth = checkAuth;
window.showAvatarModal = showAvatarModal;
window.hideAvatarModal = hideAvatarModal;
window.saveAvatar = saveAvatar;
window.removeAvatar = removeAvatar;
window.showPrivacyModal = showPrivacyModal;
window.hidePrivacyModal = hidePrivacyModal;
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.login = login;
window.register = register;
window.logout = logout;
window.togglePasswordVisibility = togglePasswordVisibility;