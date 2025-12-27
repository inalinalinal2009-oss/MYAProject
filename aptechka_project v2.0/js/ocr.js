// Конфигурация
const OCR_CONFIG = {
    serverUrl: 'http://localhost:5000/upload',
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg']
};

// Переменные состояния
let ocrCurrentFile = null;
let ocrCurrentText = '';
let foundMedicines = [];

// Инициализация загрузчика
function initOCRUploader() {
    const fileInput = document.getElementById('ocrFileInput');
    const dropArea = document.getElementById('ocrDropArea');
    
    if (!fileInput || !dropArea) return;
    
    // Обработчик выбора файла
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        handleOCRFile(file);
    });
    
    // Drag & Drop
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', function() {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        handleOCRFile(file);
    });
}

// Обработка выбранного файла
function handleOCRFile(file) {
    const errorDiv = document.getElementById('ocrError');
    const preview = document.getElementById('ocrPreview');
    const processBtn = document.getElementById('ocrProcessBtn');
    
    // Сброс предыдущих данных
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    foundMedicines = [];
    
    // Проверка файла
    if (!file) return;
    
    // Проверка типа
    if (!OCR_CONFIG.allowedTypes.includes(file.type)) {
        showOCRError('Неподдерживаемый формат файла. Используйте PNG или JPG.');
        return;
    }
    
    // Проверка размера
    if (file.size > OCR_CONFIG.maxFileSize) {
        showOCRError(`Файл слишком большой. Максимальный размер: ${OCR_CONFIG.maxFileSize / 1024 / 1024}MB`);
        return;
    }
    
    ocrCurrentFile = file;
    
    // Показываем превью
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    
    // Активируем кнопку
    processBtn.disabled = false;
}

// Показать ошибку OCR
function showOCRError(message) {
    const errorDiv = document.getElementById('ocrError');
    errorDiv.textContent = 'Ошибка: ' + message;
    errorDiv.style.display = 'block';
}

// Очистка OCR
function clearOCR() {
    ocrCurrentFile = null;
    ocrCurrentText = '';
    foundMedicines = [];
    
    const fileInput = document.getElementById('ocrFileInput');
    const preview = document.getElementById('ocrPreview');
    const processBtn = document.getElementById('ocrProcessBtn');
    const resultDiv = document.getElementById('ocrResult');
    const actionsDiv = document.getElementById('ocrActions');
    const errorDiv = document.getElementById('ocrError');
    const loadingDiv = document.getElementById('ocrLoading');
    const medicinesDiv = document.getElementById('ocrFoundMedicines');
    
    if (fileInput) fileInput.value = '';
    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    if (processBtn) processBtn.disabled = true;
    if (resultDiv) resultDiv.textContent = '';
    if (actionsDiv) actionsDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (medicinesDiv) {
        medicinesDiv.innerHTML = '';
        medicinesDiv.style.display = 'none';
    }
}

// Поиск лекарств в тексте
function findMedicinesInText(text) {
    if (!text || !text.trim()) return [];
    
    const found = [];
    const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Проверяем наличие базы данных
    if (typeof medsDatabase === 'undefined' || !Array.isArray(medsDatabase)) {
        console.error('База лекарств не загружена');
        return [];
    }
    
    // Поиск точных совпадений
    for (const med of medsDatabase) {
        const medName = med.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // 1. Проверяем точное вхождение
        if (normalizedText.includes(medName)) {
            found.push({
                ...med,
                matchType: 'exact',
                confidence: 100
            });
            continue;
        }
        
        // 2. Проверяем частичное вхождение (если название длинное)
        const medWords = medName.split(/[\s\-.,;]+/).filter(w => w.length > 2);
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
        
        // 3. Проверяем синонимы и торговые названия
        const synonyms = getMedicineSynonyms(med.name);
        for (const synonym of synonyms) {
            const synName = synonym.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (normalizedText.includes(synName)) {
                found.push({
                    ...med,
                    matchType: 'synonym',
                    confidence: 90
                });
                break;
            }
        }
    }
    
    // Убираем дубликаты
    const uniqueFound = [];
    const seenNames = new Set();
    
    for (const med of found) {
        if (!seenNames.has(med.name)) {
            seenNames.add(med.name);
            uniqueFound.push(med);
        }
    }
    
    // Сортируем по уверенности
    return uniqueFound.sort((a, b) => b.confidence - a.confidence);
}

// Функция для получения синонимов лекарств
function getMedicineSynonyms(medicineName) {
    const synonymsMap = {
        "Но-шпа": ["дротаверин", "дротаверина гидрохлорид"],
        "Нурофен": ["ибупрофен"],
        "Ибупрофен": ["нурофен", "миг", "адвил"],
        "Парацетамол": ["панадол", "эффералган", "калпол"],
        "Анальгин": ["метамизол натрия"],
        "Цитрамон": ["аскофен", "цитропак"],
        "Аспирин": ["ацетилсалициловая кислота"],
        "Ацетилсалициловая кислота": ["аспирин"],
        "Мезим": ["панкреатин"],
        "Панкреатин": ["мезим", "креон", "фестал"],
        "Активированный уголь": ["карболен"],
        "Смекта": ["диосмектит"],
        "Энтеросгель": ["полиметилсилоксана полигидрат"],
        "Валидол": ["ментол"],
        "Корвалол": ["фенобарбитал"],
        "Диклофенак": ["вольтарен", "ортофен"],
        "Левомицетин": ["хлорамфеникол"],
        "Фурацилин": ["нитрофурал"],
        "Супрастин": ["хлоропирамин"],
        "Тавегил": ["клемастин"],
        "Лоратадин": ["кларитин"],
        "Цетрин": ["цетиризин"],
        "Зодак": ["цетиризин"],
        "Зиртек": ["цетиризин"],
        "Кларитин": ["лоратадин"],
        "Эриус": ["дезлоратадин"],
        // Добавьте другие синонимы по мере необходимости
    };
    
    return synonymsMap[medicineName] || [];
}

// Отправка изображения на сервер
async function processOCR() {
    if (!ocrCurrentFile) return;
    
    const loadingDiv = document.getElementById('ocrLoading');
    const errorDiv = document.getElementById('ocrError');
    const resultDiv = document.getElementById('ocrResult');
    const actionsDiv = document.getElementById('ocrActions');
    const processBtn = document.getElementById('ocrProcessBtn');
    const medicinesDiv = document.getElementById('ocrFoundMedicines');
    
    // Показываем индикатор загрузки
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    resultDiv.textContent = '';
    actionsDiv.style.display = 'none';
    if (medicinesDiv) {
        medicinesDiv.innerHTML = '';
        medicinesDiv.style.display = 'none';
    }
    processBtn.disabled = true;
    
    try {
        // Создаем FormData
        const formData = new FormData();
        formData.append('file', ocrCurrentFile);
        
        // Отправляем запрос
        const response = await fetch(OCR_CONFIG.serverUrl, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }
        
        // Сохраняем текст
        ocrCurrentText = data.text || '';
        
        if (ocrCurrentText.trim()) {
            // Показываем оригинальный текст
            resultDiv.textContent = ocrCurrentText;
            
            // Ищем лекарства в тексте
            foundMedicines = findMedicinesInText(ocrCurrentText);
            
            // Показываем найденные лекарства
            if (foundMedicines.length > 0) {
                displayFoundMedicines(foundMedicines);
                actionsDiv.style.display = 'block';
                showToast(`✅ Найдено ${foundMedicines.length} лекарств!`, 'success');
            } else {
                resultDiv.innerHTML += '\n\n❌ Лекарства не найдены в тексте.';
                actionsDiv.style.display = 'block';
                showToast('Лекарства не найдены в тексте', 'info');
            }
        } else {
            resultDiv.textContent = 'Текст не найден на изображении. Попробуйте другое фото.';
        }
        
    } catch (error) {
        console.error('OCR Error:', error);
        showOCRError(error.message || 'Не удалось распознать текст. Проверьте подключение к серверу.');
    } finally {
        loadingDiv.style.display = 'none';
        processBtn.disabled = false;
    }
}

// Отображение найденных лекарств
function displayFoundMedicines(medicines) {
    const medicinesDiv = document.getElementById('ocrFoundMedicines');
    if (!medicinesDiv) return;
    
    medicinesDiv.style.display = 'block';
    medicinesDiv.innerHTML = `
        <h5 class="mt-4 mb-3">💊 Найденные лекарства:</h5>
        <div class="row g-2" id="ocrMedicinesList"></div>
    `;
    
    const listDiv = document.getElementById('ocrMedicinesList');
    if (!listDiv) return;
    
    medicines.forEach((med, index) => {
        const confidenceColor = med.confidence >= 90 ? 'success' : 
                              med.confidence >= 70 ? 'warning' : 'secondary';
        
        listDiv.innerHTML += `
            <div class="col-md-6 col-12">
                <div class="card mb-2">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${escapeHtml(med.name)}</h6>
                                <div class="d-flex flex-wrap gap-1 mb-2">
                                    ${med.symptoms.map(s => 
                                        `<span class="badge bg-light text-dark border">${escapeHtml(s)}</span>`
                                    ).join('')}
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
    
    // Кнопка для добавления всех
    if (medicines.length > 1) {
        medicinesDiv.innerHTML += `
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="addAllFoundMedicines()">
                    <i class="fas fa-plus-circle"></i> Добавить все найденные лекарства
                </button>
            </div>
        `;
    }
}

// Добавить одно найденное лекарство
function addFoundMedicine(index) {
    if (!foundMedicines || !foundMedicines[index]) return;
    
    const med = foundMedicines[index];
    
    // Проверяем, есть ли уже такое лекарство
    if (medicines.some(m => m.name === med.name)) {
        showToast(`${med.name} уже есть в аптечке!`, 'info');
        return;
    }
    
    // Создаем модальное окно для подтверждения
    showAddMedicineModal(med);
}

// Добавить все найденные лекарства
function addAllFoundMedicines() {
    if (!foundMedicines || foundMedicines.length === 0) return;
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const med of foundMedicines) {
        // Пропускаем лекарства с низкой уверенностью
        if (med.confidence < 70) {
            skippedCount++;
            continue;
        }
        
        // Проверяем, есть ли уже такое лекарство
        if (medicines.some(m => m.name === med.name)) {
            skippedCount++;
            continue;
        }
        
        // Добавляем лекарство
        medicines.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            name: med.name,
            symptoms: med.symptoms,
            date: new Date().toLocaleDateString(),
            schedule: [],
            taken: {}
        });
        
        addedCount++;
    }
    
    // Сохраняем и показываем результат
    saveMedicines();
    
    if (addedCount > 0) {
        showToast(`✅ Добавлено ${addedCount} лекарств!`, 'success');
        if (skippedCount > 0) {
            showToast(`${skippedCount} лекарств пропущено (уже есть или низкая уверенность)`, 'info');
        }
        // Обновляем отображение
        setTimeout(() => {
            const medicinesDiv = document.getElementById('ocrFoundMedicines');
            if (medicinesDiv) {
                medicinesDiv.innerHTML += `
                    <div class="alert alert-success mt-3">
                        <i class="fas fa-check-circle"></i> ${addedCount} лекарств добавлено в аптечку!
                    </div>
                `;
            }
        }, 100);
    } else {
        showToast('Не удалось добавить лекарства', 'warning');
    }
}

// Показать модальное окно для добавления лекарства
function showAddMedicineModal(medicine) {
    const modalHTML = `
        <div class="modal fade show d-block" id="addFoundMedicineModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">➕ Добавить "${medicine.name}"</h5>
                        <button type="button" class="btn-close" onclick="closeMedicineModal()"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Симптомы:</strong> ${medicine.symptoms.map(s => escapeHtml(s)).join(', ')}</p>
                        
                        <label class="form-label">Количество приёмов в день</label>
                        <select class="form-select mb-3" id="foundMedicineDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3">3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>
                        
                        <label class="form-label">Срок приёма (дней)</label>
                        <input type="number" class="form-control mb-3" placeholder="Например: 7" id="foundMedicineDurationDays" min="1" value="7">
                        
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
    
    // Устанавливаем текущую дату
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('foundMedicineStartDate').value = local;
}

// Закрыть модальное окно лекарства
function closeMedicineModal() {
    const modal = document.getElementById('addFoundMedicineModal');
    const backdrop = document.querySelector('.modal-backdrop');
    if (modal) modal.remove();
    if (backdrop) backdrop.remove();
}

// Подтвердить добавление лекарства
function confirmAddMedicine(medicineName) {
    const dosesPerDay = document.getElementById('foundMedicineDosesPerDay').value;
    const durationDays = document.getElementById('foundMedicineDurationDays').value;
    const startDate = document.getElementById('foundMedicineStartDate').value;
    
    if (!startDate) {
        showToast('Укажите дату начала приёма!', 'error');
        return;
    }
    
    // Находим лекарство в базе данных
    const medData = medsDatabase.find(m => m.name === medicineName);
    
    // Создаем расписание
    const schedule = generateSchedule(startDate, dosesPerDay, durationDays);
    
    // Добавляем лекарство
    medicines.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: medicineName,
        symptoms: medData ? medData.symptoms : [],
        date: new Date().toLocaleDateString(),
        schedule: schedule,
        taken: {}
    });
    
    // Сохраняем
    saveMedicines();
    
    // Закрываем модальное окно
    closeMedicineModal();
    
    // Показываем уведомление
    showToast(`💊 ${medicineName} добавлено в аптечку!`, 'success');
    
    // Обновляем отображение
    setTimeout(() => {
        const medicinesDiv = document.getElementById('ocrFoundMedicines');
        if (medicinesDiv) {
            medicinesDiv.innerHTML += `
                <div class="alert alert-success mt-3">
                    <i class="fas fa-check-circle"></i> Лекарство "${medicineName}" добавлено в аптечку!
                </div>
            `;
        }
    }, 100);
}

// Использовать распознанный текст для добавления лекарства
function useOCRText() {
    if (!ocrCurrentText.trim()) {
        showToast('Нет текста для добавления', 'error');
        return;
    }
    
    // Переходим в раздел добавления
    showSection('add');
    
    // Через небольшую задержку заполняем поле названия
    setTimeout(() => {
        const nameInput = document.getElementById('medicineNameInput');
        if (nameInput && foundMedicines.length > 0) {
            // Используем первое найденное лекарство
            nameInput.value = foundMedicines[0].name;
            showToast('Название заполнено из найденного лекарства', 'info');
        }
    }, 300);
}

// Поиск по симптомам из распознанного текста
function searchFromOCR() {
    if (!ocrCurrentText.trim()) {
        showToast('Нет текста для поиска', 'error');
        return;
    }
    
    // Переходим в раздел поиска
    showSection('search');
    
    // Через задержку заполняем поле поиска
    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Используем симптомы из найденных лекарств
            if (foundMedicines.length > 0) {
                const allSymptoms = [];
                foundMedicines.forEach(med => {
                    allSymptoms.push(...med.symptoms);
                });
                
                const uniqueSymptoms = [...new Set(allSymptoms)];
                if (uniqueSymptoms.length > 0) {
                    searchInput.value = uniqueSymptoms.slice(0, 3).join(', ');
                    performMainSearch();
                    showToast('Поиск выполнен по симптомам из найденных лекарств', 'info');
                    return;
                }
            }
            
            // Если лекарства не найдены, ищем симптомы в тексте
            const extractedSymptoms = extractSymptomsFromText(ocrCurrentText);
            if (extractedSymptoms.length > 0) {
                searchInput.value = extractedSymptoms.join(', ');
                performMainSearch();
                showToast('Поиск выполнен по распознанным симптомам', 'info');
            } else {
                searchInput.value = ocrCurrentText.substring(0, 100);
                performMainSearch();
            }
        }
    }, 300);
}

// Извлечение симптомов из текста
function extractSymptomsFromText(text) {
    const commonSymptoms = [
        'головная боль', 'температура', 'кашель', 'насморк', 'боль в горле',
        'изжога', 'тошнота', 'рвота', 'диарея', 'запор', 'аллергия',
        'давление', 'бессонница', 'стресс', 'усталость', 'боль', 'воспаление',
        'спазмы', 'тошнота', 'вздутие', 'тяжесть', 'жжение', 'зуд',
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

// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('OCR модуль загружен');
});