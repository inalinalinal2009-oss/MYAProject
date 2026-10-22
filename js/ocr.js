// ==================== OCR ====================

function getConfiguredOCRUrl() {
    const metaUrl = document
        .querySelector('meta[name="smart-aptechka-ocr-url"]')
        ?.getAttribute('content')
        ?.trim();

    const runtimeUrl = typeof window.SMART_APTECHKA_OCR_URL === 'string'
        ? window.SMART_APTECHKA_OCR_URL.trim()
        : '';

    return runtimeUrl || metaUrl || '';
}

const OCR_CONFIG = {
    serverUrl: getConfiguredOCRUrl(),
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    language: 'rus+eng'
};

let ocrCurrentFile = null;
let ocrCurrentText = '';
let foundMedicines = [];
let prescriptionImportItems = [];

function hasBrowserOCR() {
    return typeof window.Tesseract !== 'undefined';
}

function getOCRStatusMarkup() {
    if (OCR_CONFIG.serverUrl) {
        return `
            <div class="ocr-status ocr-status--ready">
                <i class="fas fa-wifi me-2"></i>
                OCR подключён к серверу распознавания.
            </div>
        `;
    }

    if (hasBrowserOCR()) {
        return `
            <div class="ocr-status ocr-status--browser">
                <i class="fas fa-microchip me-2"></i>
                Распознавание будет выполняться прямо в браузере. Первый запуск может занять немного времени.
            </div>
        `;
    }

    return `
        <div class="ocr-status ocr-status--warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            OCR пока не готов: подключите интернет для браузерного распознавания или укажите URL OCR-сервера.
        </div>
    `;
}

function setOCRLoadingMessage(message) {
    const loadingText = document.getElementById('ocrLoadingText');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

function initOCRUploader() {
    const fileInput = document.getElementById('ocrFileInput');
    const dropArea = document.getElementById('ocrDropArea');

    if (!fileInput || !dropArea) return;

    fileInput.onchange = function(event) {
        handleOCRFile(event.target.files[0]);
    };

    dropArea.ondragover = function(event) {
        event.preventDefault();
        dropArea.classList.add('dragover');
    };

    dropArea.ondragleave = function() {
        dropArea.classList.remove('dragover');
    };

    dropArea.ondrop = function(event) {
        event.preventDefault();
        dropArea.classList.remove('dragover');
        handleOCRFile(event.dataTransfer.files[0]);
    };
}

function handleOCRFile(file) {
    const errorDiv = document.getElementById('ocrError');
    const preview = document.getElementById('ocrPreview');
    const processBtn = document.getElementById('ocrProcessBtn');
    const resultDiv = document.getElementById('ocrResult');
    const prescriptionDiv = document.getElementById('ocrPrescriptionImport');

    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    foundMedicines = [];
    prescriptionImportItems = [];
    if (prescriptionDiv) {
        prescriptionDiv.innerHTML = '';
        prescriptionDiv.style.display = 'none';
    }

    if (!file) return;

    if (!OCR_CONFIG.allowedTypes.includes(file.type)) {
        showOCRError('Неподдерживаемый формат файла. Используйте PNG или JPG.');
        return;
    }

    if (file.size > OCR_CONFIG.maxFileSize) {
        showOCRError(`Файл слишком большой. Максимальный размер: ${OCR_CONFIG.maxFileSize / 1024 / 1024} МБ.`);
        return;
    }

    ocrCurrentFile = file;

    const reader = new FileReader();
    reader.onload = function(event) {
        if (preview) {
            preview.src = event.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);

    if (resultDiv) {
        resultDiv.textContent = 'Файл готов к обработке. Нажмите "Найти лекарства".';
    }

    if (processBtn) {
        processBtn.disabled = false;
    }
}

function showOCRError(message) {
    const errorDiv = document.getElementById('ocrError');
    if (!errorDiv) return;

    errorDiv.textContent = `Ошибка: ${message}`;
    errorDiv.style.display = 'block';
}

function clearOCR() {
    ocrCurrentFile = null;
    ocrCurrentText = '';
    foundMedicines = [];
    prescriptionImportItems = [];

    const fileInput = document.getElementById('ocrFileInput');
    const preview = document.getElementById('ocrPreview');
    const processBtn = document.getElementById('ocrProcessBtn');
    const resultDiv = document.getElementById('ocrResult');
    const actionsDiv = document.getElementById('ocrActions');
    const errorDiv = document.getElementById('ocrError');
    const loadingDiv = document.getElementById('ocrLoading');
    const medicinesDiv = document.getElementById('ocrFoundMedicines');
    const prescriptionDiv = document.getElementById('ocrPrescriptionImport');

    if (fileInput) fileInput.value = '';
    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    if (processBtn) processBtn.disabled = true;
    if (resultDiv) resultDiv.textContent = 'Здесь появится распознанный текст.';
    if (actionsDiv) actionsDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (medicinesDiv) {
        medicinesDiv.innerHTML = '';
        medicinesDiv.style.display = 'none';
    }
    if (prescriptionDiv) {
        prescriptionDiv.innerHTML = '';
        prescriptionDiv.style.display = 'none';
    }
}

function findMedicinesInText(text) {
    if (!text || !text.trim()) return [];

    const found = [];
    const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (typeof medsDatabase === 'undefined' || !Array.isArray(medsDatabase)) {
        console.error('База лекарств не загружена');
        return [];
    }

    for (const med of medsDatabase) {
        const medName = med.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (normalizedText.includes(medName)) {
            found.push({
                ...med,
                matchType: 'exact',
                confidence: 100
            });
            continue;
        }

        const medWords = medName.split(/[\s\-.,;]+/).filter(word => word.length > 2);
        let partialMatch = false;
        let matchedWords = 0;

        for (const word of medWords) {
            if (normalizedText.includes(word)) {
                matchedWords++;
                if (matchedWords >= Math.ceil(medWords.length / 2)) {
                    partialMatch = true;
                }
            }
        }

        if (partialMatch) {
            found.push({
                ...med,
                matchType: 'partial',
                confidence: Math.round((matchedWords / medWords.length) * 100)
            });
        }

        const synonyms = getMedicineSynonyms(med.name);
        for (const synonym of synonyms) {
            const normalizedSynonym = synonym.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (normalizedText.includes(normalizedSynonym)) {
                found.push({
                    ...med,
                    matchType: 'synonym',
                    confidence: 90
                });
                break;
            }
        }
    }

    const uniqueFound = [];
    const seenNames = new Set();

    for (const med of found) {
        if (!seenNames.has(med.name)) {
            seenNames.add(med.name);
            uniqueFound.push(med);
        }
    }

    return uniqueFound.sort((a, b) => b.confidence - a.confidence);
}

function getMedicineSynonyms(medicineName) {
    const synonymsMap = {
        'Но-шпа': ['дротаверин', 'дротаверина гидрохлорид'],
        'Нурофен': ['ибупрофен'],
        'Ибупрофен': ['нурофен', 'миг', 'адвил'],
        'Парацетамол': ['панадол', 'эффералган', 'калпол'],
        'Анальгин': ['метамизол натрия'],
        'Цитрамон': ['аскофен', 'цитропак'],
        'Аспирин': ['ацетилсалициловая кислота'],
        'Ацетилсалициловая кислота': ['аспирин'],
        'Мезим': ['панкреатин'],
        'Панкреатин': ['мезим', 'креон', 'фестал'],
        'Активированный уголь': ['карболен'],
        'Смекта': ['диосмектит'],
        'Энтеросгель': ['полиметилсилоксана полигидрат'],
        'Валидол': ['ментол'],
        'Корвалол': ['фенобарбитал'],
        'Диклофенак': ['вольтарен', 'ортофен'],
        'Левомицетин': ['хлорамфеникол'],
        'Фурацилин': ['нитрофурал'],
        'Супрастин': ['хлоропирамин'],
        'Тавегил': ['клемастин'],
        'Лоратадин': ['кларитин'],
        'Цетрин': ['цетиризин'],
        'Зодак': ['цетиризин'],
        'Зиртек': ['цетиризин'],
        'Кларитин': ['лоратадин'],
        'Эриус': ['дезлоратадин']
    };

    return synonymsMap[medicineName] || [];
}

async function recognizeTextOnServer(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(OCR_CONFIG.serverUrl, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'OCR-сервер вернул ошибку');
    }

    return data.text || '';
}

async function recognizeTextInBrowser(file) {
    if (!hasBrowserOCR()) {
        throw new Error('Браузерное OCR недоступно');
    }

    setOCRLoadingMessage('Загружаю движок распознавания...');

    const result = await window.Tesseract.recognize(file, OCR_CONFIG.language, {
        logger: message => {
            if (message.status === 'recognizing text') {
                const progress = Math.round((message.progress || 0) * 100);
                setOCRLoadingMessage(`Распознаю текст... ${progress}%`);
            }
        }
    });

    return result?.data?.text || '';
}

function finalizeOCR(text) {
    const resultDiv = document.getElementById('ocrResult');
    const actionsDiv = document.getElementById('ocrActions');

    ocrCurrentText = text || '';

    if (!resultDiv || !actionsDiv) return;

    if (!ocrCurrentText.trim()) {
        resultDiv.textContent = 'Текст не найден. Попробуйте более чёткое фото без бликов.';
        actionsDiv.style.display = 'none';
        showToast('Не удалось распознать текст на фото', 'warning');
        return;
    }

    resultDiv.textContent = ocrCurrentText;
    foundMedicines = findMedicinesInText(ocrCurrentText);

    if (foundMedicines.length > 0) {
        displayFoundMedicines(foundMedicines);
        actionsDiv.style.display = 'block';
        showToast(`Найдено ${foundMedicines.length} лекарств`, 'success');
    } else {
        actionsDiv.style.display = 'block';
        resultDiv.textContent += '\n\nЛекарства не найдены автоматически. Можно использовать текст вручную.';
        showToast('Текст распознан, но лекарства не определены автоматически', 'info');
    }
}

async function processOCR() {
    if (!ocrCurrentFile) return;

    const loadingDiv = document.getElementById('ocrLoading');
    const errorDiv = document.getElementById('ocrError');
    const resultDiv = document.getElementById('ocrResult');
    const actionsDiv = document.getElementById('ocrActions');
    const processBtn = document.getElementById('ocrProcessBtn');
    const medicinesDiv = document.getElementById('ocrFoundMedicines');
    const prescriptionDiv = document.getElementById('ocrPrescriptionImport');

    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
    if (resultDiv) resultDiv.textContent = '';
    if (actionsDiv) actionsDiv.style.display = 'none';
    if (medicinesDiv) {
        medicinesDiv.innerHTML = '';
        medicinesDiv.style.display = 'none';
    }
    if (prescriptionDiv) {
        prescriptionDiv.innerHTML = '';
        prescriptionDiv.style.display = 'none';
    }
    if (processBtn) processBtn.disabled = true;

    try {
        setOCRLoadingMessage('Подготавливаю изображение...');

        let recognizedText = '';

        if (OCR_CONFIG.serverUrl) {
            try {
                setOCRLoadingMessage('Отправляю изображение на OCR-сервер...');
                recognizedText = await recognizeTextOnServer(ocrCurrentFile);
            } catch (serverError) {
                console.warn('OCR сервер недоступен, пробуем браузерный режим:', serverError);
                if (hasBrowserOCR()) {
                    showToast('OCR-сервер недоступен, пробую распознавание в браузере', 'warning');
                } else {
                    throw serverError;
                }
            }
        }

        if (!recognizedText.trim()) {
            recognizedText = await recognizeTextInBrowser(ocrCurrentFile);
        }

        finalizeOCR(recognizedText);
    } catch (error) {
        console.error('OCR Error:', error);
        showOCRError(error.message || 'Не удалось распознать текст.');
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (processBtn) processBtn.disabled = false;
        setOCRLoadingMessage('Обработка изображения...');
    }
}

function displayFoundMedicines(medicines) {
    const medicinesDiv = document.getElementById('ocrFoundMedicines');
    if (!medicinesDiv) return;

    medicinesDiv.style.display = 'block';
    medicinesDiv.innerHTML = `
        <h5 class="mt-4 mb-3">Найденные лекарства</h5>
        <div class="row g-2" id="ocrMedicinesList"></div>
    `;

    const listDiv = document.getElementById('ocrMedicinesList');
    if (!listDiv) return;

    medicines.forEach((med, index) => {
        const confidenceColor = med.confidence >= 90
            ? 'success'
            : med.confidence >= 70
                ? 'warning'
                : 'secondary';

        listDiv.innerHTML += `
            <div class="col-md-6 col-12">
                <div class="card mb-2 ocr-found-card">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${escapeHtml(med.name)}</h6>
                                ${typeof renderMedicineGroups === 'function' ? renderMedicineGroups(med.name) : ''}
                                <div class="d-flex flex-wrap gap-1 mb-2">
                                    ${med.symptoms.map(symptom => `
                                        <span class="badge bg-light text-dark border">${escapeHtml(symptom)}</span>
                                    `).join('')}
                                </div>
                                <small class="text-muted">
                                    <span class="badge bg-${confidenceColor}">
                                        ${med.confidence}% совпадение
                                    </span>
                                </small>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-success" onclick="addFoundMedicine(${index})">
                                    <i class="fas fa-plus"></i> Добавить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    if (medicines.length > 1) {
        medicinesDiv.innerHTML += `
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="addAllFoundMedicines()">
                    <i class="fas fa-plus-circle me-1"></i> Добавить все найденные лекарства
                </button>
            </div>
        `;
    }

    if (typeof getMedicalDisclaimerMarkup === 'function') {
        medicinesDiv.innerHTML += getMedicalDisclaimerMarkup();
    }
}

function addFoundMedicine(index) {
    if (!foundMedicines || !foundMedicines[index]) return;

    const med = foundMedicines[index];
    if (medicines.some(item => item.name === med.name)) {
        showToast(`${med.name} уже есть в аптечке`, 'info');
        return;
    }

    showAddMedicineModal(med);
}

function addAllFoundMedicines() {
    if (!foundMedicines || foundMedicines.length === 0) return;

    let addedCount = 0;
    let skippedCount = 0;

    for (const med of foundMedicines) {
        if (med.confidence < 70 || medicines.some(item => item.name === med.name)) {
            skippedCount++;
            continue;
        }

        medicines.push({
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${addedCount}`,
            name: med.name,
            symptoms: med.symptoms,
            date: new Date().toLocaleDateString(),
            schedule: [],
            taken: {}
        });

        addedCount++;
    }

    saveMedicines();

    if (addedCount > 0) {
        showToast(`Добавлено ${addedCount} лекарств`, 'success');
        if (skippedCount > 0) {
            showToast(`${skippedCount} позиций пропущено`, 'info');
        }
    } else {
        showToast('Не удалось добавить лекарства', 'warning');
    }
}

function showAddMedicineModal(medicine) {
    const modalHTML = `
        <div class="modal fade show d-block" id="addFoundMedicineModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавить "${escapeHtml(medicine.name)}"</h5>
                        <button type="button" class="btn-close" onclick="closeMedicineModal()"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Симптомы:</strong> ${medicine.symptoms.map(symptom => escapeHtml(symptom)).join(', ')}</p>

                        <label class="form-label">Количество приёмов в день</label>
                        <select class="form-select mb-3" id="foundMedicineDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3">3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>

                        <label class="form-label">Срок приёма (дней)</label>
                        <input type="number" class="form-control mb-3" id="foundMedicineDurationDays" min="1" value="7">

                        <label class="form-label">Начало приёма</label>
                        <input type="datetime-local" class="form-control mb-3" id="foundMedicineStartDate">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="closeMedicineModal()">Отмена</button>
                        <button type="button" class="btn btn-success" onclick="confirmAddMedicine('${escapeHtml(medicine.name)}')">Добавить</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    document.getElementById('foundMedicineStartDate').value = localDateTime;
}

function closeMedicineModal() {
    document.getElementById('addFoundMedicineModal')?.remove();
    document.querySelector('.modal-backdrop')?.remove();
}

function confirmAddMedicine(medicineName) {
    const dosesPerDay = document.getElementById('foundMedicineDosesPerDay').value;
    const durationDays = document.getElementById('foundMedicineDurationDays').value;
    const startDate = document.getElementById('foundMedicineStartDate').value;

    if (!startDate) {
        showToast('Укажите дату начала приёма', 'error');
        return;
    }

    const medData = medsDatabase.find(med => med.name === medicineName);
    const schedule = generateSchedule(startDate, dosesPerDay, durationDays);

    medicines.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: medicineName,
        symptoms: medData ? medData.symptoms : [],
        date: new Date().toLocaleDateString(),
        schedule,
        taken: {}
    });

    saveMedicines();
    closeMedicineModal();
    showToast(`${medicineName} добавлено в аптечку`, 'success');
}

function useOCRText() {
    if (!ocrCurrentText.trim()) {
        showToast('Нет текста для добавления', 'error');
        return;
    }

    showSection('add');

    setTimeout(() => {
        const nameInput = document.getElementById('medicineNameInput');
        if (nameInput && foundMedicines.length > 0) {
            nameInput.value = foundMedicines[0].name;
            showToast('Название заполнено по OCR', 'info');
        }
    }, 300);
}

function searchFromOCR() {
    if (!ocrCurrentText.trim()) {
        showToast('Нет текста для поиска', 'error');
        return;
    }

    showSection('search');

    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        if (foundMedicines.length > 0) {
            const uniqueSymptoms = [...new Set(foundMedicines.flatMap(med => med.symptoms))];
            if (uniqueSymptoms.length > 0) {
                searchInput.value = uniqueSymptoms.slice(0, 3).join(', ');
                performMainSearch();
                showToast('Поиск выполнен по найденным симптомам', 'info');
                return;
            }
        }

        const extractedSymptoms = extractSymptomsFromText(ocrCurrentText);
        if (extractedSymptoms.length > 0) {
            searchInput.value = extractedSymptoms.join(', ');
            performMainSearch();
            showToast('Поиск выполнен по распознанным симптомам', 'info');
            return;
        }

        searchInput.value = ocrCurrentText.substring(0, 100);
        performMainSearch();
    }, 300);
}

function extractSymptomsFromText(text) {
    const commonSymptoms = [
        'головная боль', 'температура', 'кашель', 'насморк', 'боль в горле',
        'изжога', 'тошнота', 'рвота', 'диарея', 'запор', 'аллергия',
        'давление', 'бессонница', 'стресс', 'усталость', 'боль', 'воспаление',
        'спазмы', 'вздутие', 'тяжесть', 'жжение', 'зуд',
        'покраснение', 'отек', 'судороги', 'головокружение'
    ];

    const foundSymptoms = [];
    const lowerText = text.toLowerCase();

    for (const symptom of commonSymptoms) {
        if (lowerText.includes(symptom)) {
            foundSymptoms.push(symptom);
        }
    }

    return foundSymptoms;
}

function addAllFoundMedicines() {
    if (!foundMedicines || foundMedicines.length === 0) return;
    showToast('Для каждого лекарства нужно заполнить курс, дозировку и остаток вручную.', 'info');
}

function showAddMedicineModal(medicine) {
    closeMedicineModal();

    const modalHTML = `
        <div class="modal fade show d-block" id="addFoundMedicineModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавить "${escapeHtml(medicine.name)}"</h5>
                        <button type="button" class="btn-close" onclick="closeMedicineModal()"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="foundMedicineName" value="${escapeAttribute(medicine.name)}">
                        <p><strong>Симптомы:</strong> ${medicine.symptoms.map(symptom => escapeHtml(symptom)).join(', ')}</p>

                        <label class="form-label">Количество приёмов в день</label>
                        <select class="form-select mb-3" id="foundMedicineDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3" selected>3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>

                        <label class="form-label">Срок приёма (дней)</label>
                        <input type="number" class="form-control mb-3" id="foundMedicineDurationDays" min="1" value="7">

                        <label class="form-label">Дозировка одной таблетки (мг)</label>
                        <input type="number" class="form-control mb-3" id="foundMedicineDoseMg" min="1" step="1" value="500">

                        <label class="form-label">Количество таблеток в наличии</label>
                        <input type="number" class="form-control mb-3" id="foundMedicineStockCount" min="1" step="1" value="20">

                        <label class="form-label">Начало приёма</label>
                        <input type="datetime-local" class="form-control mb-3" id="foundMedicineStartDate">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="closeMedicineModal()">Отмена</button>
                        <button type="button" class="btn btn-success" onclick="confirmAddMedicine()">Добавить</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show ocr-medicine-modal-backdrop"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    document.getElementById('foundMedicineStartDate').value = localDateTime;
}

function closeMedicineModal() {
    document.getElementById('addFoundMedicineModal')?.remove();
    document.querySelector('.ocr-medicine-modal-backdrop')?.remove();
}

function confirmAddMedicine() {
    const medicineName = document.getElementById('foundMedicineName')?.value?.trim();
    const dosesPerDay = document.getElementById('foundMedicineDosesPerDay')?.value;
    const durationDays = Number(document.getElementById('foundMedicineDurationDays')?.value);
    const dosageMg = Math.round(Number(document.getElementById('foundMedicineDoseMg')?.value));
    const tabletsInStock = Math.round(Number(document.getElementById('foundMedicineStockCount')?.value));
    const startDate = document.getElementById('foundMedicineStartDate')?.value;

    if (!medicineName) {
        showToast('Не удалось определить название лекарства', 'error');
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

    if (medicines.some(item => item.name === medicineName)) {
        showToast(`${medicineName} уже есть в аптечке`, 'info');
        closeMedicineModal();
        return;
    }

    const medData = medsDatabase.find(med => med.name === medicineName);
    const schedule = generateSchedule(startDate, dosesPerDay, durationDays);

    const medicineId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    medicines.push({
        id: medicineId,
        name: medicineName,
        symptoms: medData ? medData.symptoms : [],
        date: new Date().toLocaleDateString(),
        schedule,
        taken: {},
        dosageMg,
        tabletsInStock,
        tabletsLeft: tabletsInStock,
        contraindications: 'Загружаю противопоказания из интернета...',
        contraindicationsStatus: 'pending_auto',
        shortInstruction: typeof buildShortInstructionForMedicine === 'function'
            ? buildShortInstructionForMedicine({
                name: medicineName,
                symptoms: medData ? medData.symptoms : [],
                dosageMg
            })
            : ''
    });

    saveMedicines();
    if (typeof enrichMedicineContraindications === 'function') {
        void enrichMedicineContraindications(medicineId);
    }
    closeMedicineModal();
    showToast(`${medicineName} добавлено в аптечку`, 'success');
    showSection('medicines');
}

// Safe ASCII overrides for OCR add flow (kept at the end so they win over earlier duplicates).
function addAllFoundMedicines() {
    if (!foundMedicines || foundMedicines.length === 0) return;
    showToast('Добавляйте лекарства по одному, чтобы заполнить курс, дозировку и остаток таблеток.', 'info');
}

function showAddMedicineModal(medicine) {
    closeMedicineModal();

    const modalHTML = `
        <div class="modal fade show d-block" id="addFoundMedicineModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Добавить «${escapeHtml(medicine.name)}»</h5>
                        <button type="button" class="btn-close" onclick="closeMedicineModal()"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="foundMedicineName" value="${escapeAttribute(medicine.name)}">
                        <p><strong>Симптомы:</strong> ${medicine.symptoms.map(symptom => escapeHtml(symptom)).join(', ')}</p>

                        <label class="form-label">Приёмов в день</label>
                        <select class="form-select mb-3" id="foundMedicineDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3" selected>3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>

                        <label class="form-label">Срок приёма (дней)</label>
                        <input type="number" class="form-control mb-3" id="foundMedicineDurationDays" min="1" value="7">

                        <label class="form-label">Дозировка одной таблетки (мг)</label>
                        <input type="number" class="form-control mb-3" id="foundMedicineDoseMg" min="1" step="1" value="500">

                        <label class="form-label">Количество таблеток в наличии</label>
                        <input type="number" class="form-control mb-3" id="foundMedicineStockCount" min="1" step="1" value="20">

                        <label class="form-label">Начало приёма</label>
                        <input type="datetime-local" class="form-control mb-3" id="foundMedicineStartDate">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="closeMedicineModal()">Отмена</button>
                        <button type="button" class="btn btn-success" onclick="confirmAddMedicine()">Добавить</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show ocr-medicine-modal-backdrop"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    document.getElementById('foundMedicineStartDate').value = localDateTime;
}

function closeMedicineModal() {
    document.getElementById('addFoundMedicineModal')?.remove();
    document.querySelector('.ocr-medicine-modal-backdrop')?.remove();
}

function confirmAddMedicine() {
    const medicineName = document.getElementById('foundMedicineName')?.value?.trim();
    const dosesPerDay = document.getElementById('foundMedicineDosesPerDay')?.value;
    const durationDays = Number(document.getElementById('foundMedicineDurationDays')?.value);
    const dosageMg = Math.round(Number(document.getElementById('foundMedicineDoseMg')?.value));
    const tabletsInStock = Math.round(Number(document.getElementById('foundMedicineStockCount')?.value));
    const startDate = document.getElementById('foundMedicineStartDate')?.value;

    if (!medicineName) {
        showToast('Не удалось определить название лекарства.', 'error');
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

    if (medicines.some(item => item.name === medicineName)) {
        showToast(`«${medicineName}» уже есть в аптечке.`, 'info');
        closeMedicineModal();
        return;
    }

    const medData = medsDatabase.find(med => med.name === medicineName);
    const schedule = generateSchedule(startDate, dosesPerDay, durationDays);

    const medicineId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    medicines.push({
        id: medicineId,
        name: medicineName,
        symptoms: medData ? medData.symptoms : [],
        date: new Date().toLocaleDateString(),
        schedule,
        taken: {},
        dosageMg,
        tabletsInStock,
        tabletsLeft: tabletsInStock,
        contraindications: 'Загружаю противопоказания из интернета...',
        contraindicationsStatus: 'pending_auto',
        shortInstruction: typeof buildShortInstructionForMedicine === 'function'
            ? buildShortInstructionForMedicine({
                name: medicineName,
                symptoms: medData ? medData.symptoms : [],
                dosageMg
            })
            : ''
    });

    saveMedicines();
    if (typeof enrichMedicineContraindications === 'function') {
        void enrichMedicineContraindications(medicineId);
    }
    closeMedicineModal();
    showToast(`«${medicineName}» добавлено в аптечку.`, 'success');
    showSection('medicines');
}

function normalizeOCRSearchText(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[ё]/g, 'е')
        .replace(/[^a-zа-я0-9\s\-]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getNowLocalDateTimeValue() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

function clampInt(value, min, max, fallback) {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
}

function findFirstNumberByPatterns(source, patterns, min, max) {
    for (const pattern of patterns) {
        const match = source.match(pattern);
        if (!match) continue;
        const value = Math.round(Number((match[1] || '').replace(',', '.')));
        if (!Number.isFinite(value)) continue;
        if (value < min || value > max) continue;
        return value;
    }
    return null;
}

function collectMedicineContext(text, medicineName) {
    const lines = String(text || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (!lines.length) return '';

    const normalizedName = normalizeOCRSearchText(medicineName);
    const tokens = normalizedName.split(/\s+/).filter(token => token.length >= 3);
    const hitIndexes = [];

    lines.forEach((line, index) => {
        const normalizedLine = normalizeOCRSearchText(line);
        const fullMatch = normalizedName && normalizedLine.includes(normalizedName);
        const tokenMatchCount = tokens.filter(token => normalizedLine.includes(token)).length;
        if (fullMatch || tokenMatchCount >= Math.min(2, tokens.length)) {
            hitIndexes.push(index);
        }
    });

    if (!hitIndexes.length) {
        return lines.join('\n');
    }

    const selected = new Set();
    hitIndexes.forEach(index => {
        for (let cursor = index - 2; cursor <= index + 2; cursor += 1) {
            if (cursor >= 0 && cursor < lines.length) {
                selected.add(cursor);
            }
        }
    });

    return [...selected]
        .sort((a, b) => a - b)
        .map(index => lines[index])
        .join('\n');
}

function parsePrescriptionHintsFromText(rawText) {
    const source = String(rawText || '');
    const normalized = normalizeOCRSearchText(source);

    const intervalHours = findFirstNumberByPatterns(normalized, [
        /(?:каждые|через|every)\s*(\d{1,2})\s*(?:час|ч|hours?)/i
    ], 1, 24);

    let dosesPerDay = findFirstNumberByPatterns(normalized, [
        /(?:по|take)?\s*(\d{1,2})\s*(?:раза?|times?)\s*(?:в|per)?\s*(?:день|сутки|day)/i,
        /(\d{1,2})\s*(?:р\/д|x|х)\b/i
    ], 1, 12);

    if (!dosesPerDay && intervalHours) {
        dosesPerDay = clampInt(Math.round(24 / intervalHours), 1, 12, 3);
    }
    if (!dosesPerDay) {
        dosesPerDay = 3;
    }

    let durationDays = findFirstNumberByPatterns(normalized, [
        /(\d{1,3})\s*(?:дн(?:ей|я)?|сут(?:ок|ки)?|days?)/i,
        /курс(?:ом)?\s*(\d{1,3})/i
    ], 1, 365);
    if (!durationDays) {
        durationDays = 7;
    }

    let dosageMg = findFirstNumberByPatterns(normalized, [
        /(\d{2,4})\s*(?:мг|mg)\b/i
    ], 1, 5000);

    if (!dosageMg) {
        const gramsMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:г|g)\b/i);
        if (gramsMatch) {
            const grams = Number((gramsMatch[1] || '').replace(',', '.'));
            const converted = Math.round(grams * 1000);
            if (Number.isFinite(converted) && converted >= 1 && converted <= 5000) {
                dosageMg = converted;
            }
        }
    }
    if (!dosageMg) {
        dosageMg = 500;
    }

    const tabletsInStock = findFirstNumberByPatterns(normalized, [
        /(?:в\s*наличии|остаток|осталось|stock)\D{0,12}(\d{1,4})/i,
        /(?:№|#|n)\s*(\d{1,4})\b/i,
        /(\d{1,4})\s*(?:таб(?:лет(?:ок|ки)?)?|шт|pcs|caps?)/i
    ], 0, 5000);

    return {
        dosesPerDay: clampInt(dosesPerDay, 1, 12, 3),
        durationDays: clampInt(durationDays, 1, 365, 7),
        dosageMg: clampInt(dosageMg, 1, 5000, 500),
        tabletsInStock: clampInt(tabletsInStock ?? 0, 0, 5000, 0)
    };
}

function toMedicineTextPosition(text, medicineName) {
    const normalizedText = normalizeOCRSearchText(text);
    const normalizedName = normalizeOCRSearchText(medicineName);
    if (!normalizedText || !normalizedName) return Number.MAX_SAFE_INTEGER;
    const index = normalizedText.indexOf(normalizedName);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function recomputePrescriptionImportItem(index) {
    const item = prescriptionImportItems[index];
    if (!item) return;

    item.requiredTablets = Math.max(1, item.dosesPerDay) * Math.max(1, item.durationDays);
    item.toBuy = Math.max(0, item.requiredTablets - Math.max(0, item.tabletsInStock));

    const requiredEl = document.getElementById(`ocrImportNeed_${index}`);
    const buyEl = document.getElementById(`ocrImportBuy_${index}`);
    if (requiredEl) {
        requiredEl.textContent = `${item.requiredTablets} таб. на курс`;
    }
    if (buyEl) {
        buyEl.textContent = item.toBuy > 0
            ? `Купить: ${item.toBuy} таб.`
            : 'Покупка не требуется';
        buyEl.className = item.toBuy > 0
            ? 'ocr-import-buy text-danger fw-semibold'
            : 'ocr-import-buy text-success fw-semibold';
    }
}

function renderPrescriptionImportSummary() {
    const summaryEl = document.getElementById('ocrPrescriptionSummary');
    if (!summaryEl) return;

    const totalNeed = prescriptionImportItems.reduce((sum, item) => sum + item.requiredTablets, 0);
    const totalBuy = prescriptionImportItems.reduce((sum, item) => sum + item.toBuy, 0);
    const selectedForImport = prescriptionImportItems.filter(item => item.include && !item.alreadyInKit).length;
    const alreadyInKit = prescriptionImportItems.filter(item => item.alreadyInKit).length;

    summaryEl.innerHTML = `
        <div><strong>На курс:</strong> ${totalNeed} таб.</div>
        <div><strong>Купить:</strong> ${totalBuy} таб.</div>
        <div><strong>К добавлению:</strong> ${selectedForImport}</div>
        ${alreadyInKit > 0 ? `<div><strong>Уже в аптечке:</strong> ${alreadyInKit}</div>` : ''}
    `;
}

function renderPrescriptionImportBlock() {
    const container = document.getElementById('ocrPrescriptionImport');
    if (!container) return;

    if (!Array.isArray(prescriptionImportItems) || prescriptionImportItems.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = `
        <div class="ocr-prescription-panel mt-4">
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <h5 class="mb-0"><i class="fas fa-file-medical me-2"></i>Импорт назначения врача</h5>
                <span class="badge bg-info text-dark">${prescriptionImportItems.length} поз.</span>
            </div>
            <p class="text-muted small mb-3">
                Проверьте дозировки перед сохранением. Это не лечебная рекомендация. Перед применением проконсультируйтесь с врачом.
            </p>
            <div class="ocr-prescription-list">
                ${prescriptionImportItems.map((item, index) => `
                    <div class="ocr-prescription-item" id="ocrPrescriptionItem_${index}">
                        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                            <div>
                                <h6 class="mb-1">${escapeHtml(item.name)}</h6>
                                ${Array.isArray(item.symptoms) && item.symptoms.length
                                    ? `<small class="text-muted">Симптомы: ${item.symptoms.map(symptom => escapeHtml(symptom)).join(', ')}</small>`
                                    : ''}
                            </div>
                            ${item.alreadyInKit
                                ? '<span class="badge bg-warning text-dark">Уже в аптечке</span>'
                                : `<label class="form-check ocr-import-check">
                                    <input class="form-check-input" type="checkbox" id="ocrImportInclude_${index}" ${item.include ? 'checked' : ''} onchange="togglePrescriptionImportItem(${index})">
                                    <span class="form-check-label">Добавить</span>
                                </label>`
                            }
                        </div>
                        <div class="row g-2">
                            <div class="col-6 col-md-3">
                                <label class="form-label">Приёмов/день</label>
                                <input type="number" class="form-control" min="1" max="12" id="ocrImportDoses_${index}" value="${item.dosesPerDay}" onchange="updatePrescriptionImportItem(${index})">
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label">Дней курса</label>
                                <input type="number" class="form-control" min="1" max="365" id="ocrImportDays_${index}" value="${item.durationDays}" onchange="updatePrescriptionImportItem(${index})">
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label">мг/таблетка</label>
                                <input type="number" class="form-control" min="1" max="5000" id="ocrImportMg_${index}" value="${item.dosageMg}" onchange="updatePrescriptionImportItem(${index})">
                            </div>
                            <div class="col-6 col-md-3">
                                <label class="form-label">В наличии (таб.)</label>
                                <input type="number" class="form-control" min="0" max="5000" id="ocrImportStock_${index}" value="${item.tabletsInStock}" onchange="updatePrescriptionImportItem(${index})">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Начало курса</label>
                                <input type="datetime-local" class="form-control" id="ocrImportStart_${index}" value="${escapeAttribute(item.startDate)}" onchange="updatePrescriptionImportItem(${index})">
                            </div>
                        </div>
                        <div class="d-flex flex-wrap gap-3 mt-2">
                            <span class="small text-muted" id="ocrImportNeed_${index}"></span>
                            <span class="small" id="ocrImportBuy_${index}"></span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="ocr-prescription-summary mt-3" id="ocrPrescriptionSummary"></div>
            <div class="d-flex flex-wrap gap-2 mt-3">
                <button class="btn btn-success" onclick="applyPrescriptionImportToKit()">
                    <i class="fas fa-plus-circle me-1"></i>Добавить в аптечку
                </button>
                <button class="btn btn-outline-primary" onclick="copyPrescriptionShoppingList()">
                    <i class="fas fa-clipboard-list me-1"></i>Скопировать список покупок
                </button>
            </div>
        </div>
    `;

    prescriptionImportItems.forEach((_, index) => recomputePrescriptionImportItem(index));
    renderPrescriptionImportSummary();
}

function updatePrescriptionImportItem(index) {
    const item = prescriptionImportItems[index];
    if (!item) return;

    const dosesInput = document.getElementById(`ocrImportDoses_${index}`);
    const daysInput = document.getElementById(`ocrImportDays_${index}`);
    const mgInput = document.getElementById(`ocrImportMg_${index}`);
    const stockInput = document.getElementById(`ocrImportStock_${index}`);
    const startInput = document.getElementById(`ocrImportStart_${index}`);

    item.dosesPerDay = clampInt(dosesInput?.value, 1, 12, item.dosesPerDay || 3);
    item.durationDays = clampInt(daysInput?.value, 1, 365, item.durationDays || 7);
    item.dosageMg = clampInt(mgInput?.value, 1, 5000, item.dosageMg || 500);
    item.tabletsInStock = clampInt(stockInput?.value, 0, 5000, item.tabletsInStock || 0);
    item.startDate = startInput?.value || item.startDate || getNowLocalDateTimeValue();

    if (dosesInput) dosesInput.value = String(item.dosesPerDay);
    if (daysInput) daysInput.value = String(item.durationDays);
    if (mgInput) mgInput.value = String(item.dosageMg);
    if (stockInput) stockInput.value = String(item.tabletsInStock);
    if (startInput && !startInput.value) startInput.value = item.startDate;

    recomputePrescriptionImportItem(index);
    renderPrescriptionImportSummary();
}

function togglePrescriptionImportItem(index) {
    const item = prescriptionImportItems[index];
    if (!item || item.alreadyInKit) return;
    const includeInput = document.getElementById(`ocrImportInclude_${index}`);
    item.include = Boolean(includeInput?.checked);
    renderPrescriptionImportSummary();
}

function buildPrescriptionShoppingListText() {
    const shortages = prescriptionImportItems
        .filter(item => item.toBuy > 0)
        .map(item => `- ${item.name}: купить ${item.toBuy} таб. (${item.dosageMg} мг), курс ${item.durationDays} дн., ${item.dosesPerDay} раз/день, в наличии ${item.tabletsInStock} таб.`);

    if (shortages.length === 0) {
        return '';
    }

    return [
        'Список покупок по назначению врача:',
        ...shortages,
        '',
        'Это не лечебная рекомендация. Перед применением проконсультируйтесь с врачом.'
    ].join('\n');
}

async function copyPrescriptionShoppingList() {
    if (!Array.isArray(prescriptionImportItems) || prescriptionImportItems.length === 0) {
        showToast('Сначала сформируйте импорт назначения из OCR.', 'warning');
        return;
    }

    const text = buildPrescriptionShoppingListText();
    if (!text) {
        showToast('Покупка не требуется: таблеток хватает на курс.', 'success');
        return;
    }

    try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }
        showToast('Список покупок скопирован.', 'success');
    } catch (error) {
        console.error('Copy shopping list error:', error);
        showToast('Не удалось скопировать список покупок.', 'error');
    }
}

function preparePrescriptionImportFromOCR() {
    if (!ocrCurrentText || !ocrCurrentText.trim()) {
        showToast('Сначала распознайте текст на фото.', 'warning');
        return;
    }

    const sourceMedicines = Array.isArray(foundMedicines) && foundMedicines.length > 0
        ? foundMedicines
        : findMedicinesInText(ocrCurrentText);

    const filtered = sourceMedicines
        .filter(med => med && med.name)
        .filter(med => med.matchType === 'exact' || med.matchType === 'synonym' || med.confidence >= 70);

    const uniqueByName = [];
    const seenNames = new Set();
    filtered
        .sort((a, b) => toMedicineTextPosition(ocrCurrentText, a.name) - toMedicineTextPosition(ocrCurrentText, b.name))
        .forEach(med => {
            if (seenNames.has(med.name)) return;
            seenNames.add(med.name);
            uniqueByName.push(med);
        });

    if (uniqueByName.length === 0) {
        const container = document.getElementById('ocrPrescriptionImport');
        if (container) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="alert alert-warning mt-3 mb-0">
                    Не удалось надёжно распознать лекарства для импорта. Проверьте OCR-текст или добавьте препараты вручную.
                </div>
            `;
        }
        showToast('Лекарства для импорта не распознаны.', 'warning');
        return;
    }

    prescriptionImportItems = uniqueByName.map((med, index) => {
        const context = collectMedicineContext(ocrCurrentText, med.name);
        const hints = parsePrescriptionHintsFromText(context || ocrCurrentText);
        const existingMed = Array.isArray(medicines)
            ? medicines.find(item => item.name === med.name)
            : null;
        const existingStock = Number.isFinite(Number(existingMed?.tabletsLeft))
            ? Math.max(0, Math.round(Number(existingMed.tabletsLeft)))
            : null;
        const initialStock = existingStock ?? hints.tabletsInStock;

        const item = {
            key: `${Date.now()}-${index}`,
            name: med.name,
            symptoms: Array.isArray(med.symptoms) ? med.symptoms : [],
            dosesPerDay: hints.dosesPerDay,
            durationDays: hints.durationDays,
            dosageMg: hints.dosageMg,
            tabletsInStock: initialStock,
            startDate: getNowLocalDateTimeValue(),
            include: !existingMed,
            alreadyInKit: Boolean(existingMed),
            requiredTablets: 0,
            toBuy: 0
        };

        item.requiredTablets = item.dosesPerDay * item.durationDays;
        item.toBuy = Math.max(0, item.requiredTablets - item.tabletsInStock);
        return item;
    });

    renderPrescriptionImportBlock();
    showToast(`Подготовлен импорт назначения: ${prescriptionImportItems.length} поз.`, 'success');
}

function applyPrescriptionImportToKit() {
    if (!Array.isArray(prescriptionImportItems) || prescriptionImportItems.length === 0) {
        showToast('Нет данных для импорта.', 'warning');
        return;
    }

    let addedCount = 0;
    let skippedCount = 0;
    const createdIds = [];

    prescriptionImportItems.forEach(item => {
        if (!item.include || item.alreadyInKit) {
            skippedCount += 1;
            return;
        }

        if (medicines.some(existing => existing.name === item.name)) {
            item.alreadyInKit = true;
            item.include = false;
            skippedCount += 1;
            return;
        }

        const medData = Array.isArray(medsDatabase)
            ? medsDatabase.find(med => med.name === item.name)
            : null;
        const safeStartDate = item.startDate && !Number.isNaN(new Date(item.startDate).getTime())
            ? item.startDate
            : getNowLocalDateTimeValue();
        const schedule = generateSchedule(safeStartDate, item.dosesPerDay, item.durationDays);
        const medicineId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${addedCount}`;

        medicines.push({
            id: medicineId,
            name: item.name,
            symptoms: medData?.symptoms || item.symptoms || [],
            date: new Date().toLocaleDateString(),
            schedule,
            taken: {},
            dosageMg: item.dosageMg,
            tabletsInStock: item.tabletsInStock,
            tabletsLeft: item.tabletsInStock,
            contraindications: 'Загружаю противопоказания из интернета...',
            contraindicationsStatus: 'pending_auto',
            shortInstruction: typeof buildShortInstructionForMedicine === 'function'
                ? buildShortInstructionForMedicine({
                    name: item.name,
                    symptoms: medData?.symptoms || item.symptoms || [],
                    dosageMg: item.dosageMg
                })
                : ''
        });

        item.alreadyInKit = true;
        item.include = false;
        createdIds.push(medicineId);
        addedCount += 1;
    });

    if (addedCount === 0) {
        showToast('Новых лекарств для добавления нет.', 'info');
        renderPrescriptionImportBlock();
        return;
    }

    saveMedicines();
    if (typeof enrichMedicineContraindications === 'function') {
        createdIds.forEach(id => {
            void enrichMedicineContraindications(id);
        });
    }

    renderPrescriptionImportBlock();
    showToast(`Добавлено в аптечку: ${addedCount}. Пропущено: ${skippedCount}.`, 'success');
    showSection('medicines');
}

window.getOCRStatusMarkup = getOCRStatusMarkup;
window.initOCRUploader = initOCRUploader;
window.processOCR = processOCR;
window.clearOCR = clearOCR;
window.addFoundMedicine = addFoundMedicine;
window.addAllFoundMedicines = addAllFoundMedicines;
window.useOCRText = useOCRText;
window.searchFromOCR = searchFromOCR;
window.closeMedicineModal = closeMedicineModal;
window.confirmAddMedicine = confirmAddMedicine;
window.preparePrescriptionImportFromOCR = preparePrescriptionImportFromOCR;
window.updatePrescriptionImportItem = updatePrescriptionImportItem;
window.togglePrescriptionImportItem = togglePrescriptionImportItem;
window.copyPrescriptionShoppingList = copyPrescriptionShoppingList;
window.applyPrescriptionImportToKit = applyPrescriptionImportToKit;
