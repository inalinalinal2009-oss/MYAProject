let currentSection = 'medicines';
let medicines = [];

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed bottom-0 end-0 m-3`;
    toast.style.zIndex = '1000';
    toast.style.maxWidth = '300px';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

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

    if (results.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                По запросу "<strong>${escapeHtml(originalQuery)}</strong>" ничего не найдено.
                Попробуйте: <em>головная боль</em>, <em>температура</em>.
            </div>
        `;
        return;
    }

    let html = `
        <div class="alert alert-success">
            Найдено: <strong>${results.length}</strong> лекарств(о)
        </div>
        <div class="row g-3">
    `;

    results.forEach(med => {
        html += `
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(med.name)}</h5>
                        <div class="mb-2">
                            <strong>Подходит для:</strong>
                            ${med.matchedSymptoms.map(s => 
                                `<span class="badge bg-success me-1">${escapeHtml(s)}</span>`
                            ).join('')}
                        </div>
                        <button class="btn btn-sm btn-primary mt-2 add-from-search-btn" data-name="${med.name}">
                            ➕ В аптечку
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function performSymptomsSearch(query = null, targetId = 'symptomsResults') {
    const input = document.getElementById('symptomsInput');
    const queryText = (query !== null) ? query : (input ? input.value.trim() : '');
    const container = document.getElementById(targetId);

    if (!container) return;
    if (!queryText) {
        container.innerHTML = '<div class="alert alert-warning">Введите симптомы</div>';
        return;
    }

    const symptoms = queryText
        .split(/[,;]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.toLowerCase());

    if (symptoms.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">Укажите хотя бы один симптом</div>';
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

function showSection(sectionName, event) {
    if (event) {
        document.querySelectorAll('.mobile-navbar button').forEach(btn => {
            btn.classList.remove('active', 'text-primary');
        });
        document.querySelectorAll('.sidebar .list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        if (event.currentTarget.closest('.mobile-navbar')) {
            event.currentTarget.classList.add('text-primary');
        }
    }

    const content = document.getElementById('content');
    const isDesktop = window.innerWidth > 991;

    switch(sectionName) {
        case 'medicines':
    const nextReminder = findNextReminder();
    
    content.innerHTML = isDesktop ? `
        <div class="welcome-box">
            <h2>👋 Добро пожаловать!</h2>
            <p>Забота о здоровье начинается с регулярного приёма лекарств.</p>
        </div>
        
        ${nextReminder ? `
        <div class="alert alert-warning d-flex justify-content-between align-items-center mb-4">
            <div>
                <i class="fas fa-clock me-2"></i>
                <strong>Следующий приём:</strong> ${nextReminder.medicine}
                <br><small>Через ${formatTimeTo(nextReminder.time)}</small>
            </div>
            <button class="btn btn-sm btn-success" onclick="markAsTaken('${nextReminder.id}', ${nextReminder.time})">
                ✅ Принято!
            </button>
        </div>
        ` : ''}
        
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>💊 Мои лекарства</h3>
            <div>
                <button class="btn btn-outline-primary me-2" onclick="sortMedicines('name')">
                    <i class="fas fa-sort-alpha-down"></i> По имени
                </button>
                <button class="btn btn-outline-primary" onclick="sortMedicines('date')">
                    <i class="fas fa-sort-numeric-down"></i> По дате
                </button>
            </div>
        </div>
        <div class="medicines-grid" id="medicineList"></div>
    ` : `
        <div class="welcome-box">
            <h2>👋 Привет!</h2>
            <p>Ваша аптечка под контролем.</p>
        </div>
        
        ${nextReminder ? `
        <div class="alert alert-warning mb-3">
            <strong>Следующий приём:</strong> ${nextReminder.medicine}
            <br><small>Через ${formatTimeTo(nextReminder.time)}</small>
            <button class="btn btn-sm btn-success w-100 mt-2" onclick="markAsTaken('${nextReminder.id}', ${nextReminder.time})">
                ✅ Принято!
            </button>
        </div>
        ` : ''}
        
        <h3>💊 Мои лекарства</h3>
        <div id="medicineList"></div>
    `;
    loadMedicines();
    break;

        case 'search':
            content.innerHTML = `
                <h3>🔍 Поиск по симптомам</h3>
                <div class="row">
                    <div class="col-md-8">
                        <input type="text" class="form-control" placeholder="Симптомы через запятую..." id="searchInput">
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-primary w-100" onclick="performMainSearch()">
                            <i class="fas fa-search"></i> Найти
                        </button>
                    </div>
                </div>
                <div id="searchResults" class="mt-3"></div>
            `;
            break;

    case 'add':
    content.innerHTML = `
        <h3>➕ Добавить лекарство</h3>
        <div class="row">
            <div class="col-md-6">
                <input type="text" class="form-control mb-3" placeholder="Название лекарства" id="medicineNameInput">
                <input type="text" class="form-control mb-3" placeholder="Симптомы (через запятую)" id="addSymptomsInput">
                
                <label class="form-label">Количество приёмов в день</label>
                <select class="form-select mb-3" id="dosesPerDay">
                    <option value="1">1 раз в день</option>
                    <option value="2">2 раза в день</option>
                    <option value="3">3 раза в день</option>
                    <option value="4">4 раза в день</option>
                </select>
                
                <label class="form-label">Срок приёма (дней)</label>
                <input type="number" class="form-control mb-3" placeholder="Например: 7" id="durationDays" min="1" value="7">
                
                <label class="form-label">Начало приёма</label>
                <input type="datetime-local" class="form-control mb-3" id="startDate">
                
                <button class="btn btn-success w-100" onclick="addMedicine()">
                    <i class="fas fa-plus"></i> Добавить в аптечку
                </button>
            </div>
        </div>
    `;
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('startDate').value = local;
    
    break;

        case 'profile':
            content.innerHTML = `
                <h3>👋 Профиль</h3>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5>Статистика</h5>
                                <p>📊 Всего лекарств: <strong>${medicines.length}</strong></p>
                                <p>⚡ Активных: <strong>${medicines.length}</strong></p>
                                <p>📅 Добавлено сегодня: <strong>0</strong></p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5>Действия</h5>
                                <button class="btn btn-outline-danger w-100 mb-2" onclick="clearAll()">
                                    <i class="fas fa-trash"></i> Очистить всё
                                </button>
                                <button class="btn btn-outline-secondary w-100" onclick="exportData()">
                                    <i class="fas fa-download"></i> Экспорт данных
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            case 'map':
                    content.innerHTML = `
                        <h3>📍 Карта аптек</h3>
                        <p class="text-muted">Ближайшие аптеки в вашем городе</p>
                        <div id="pharmacyMap" style="width: 100%; height: 500px; border-radius: 10px; overflow: hidden;"></div>
                `;
            case 'ocr':
                content.innerHTML = `
                    <h3><i class="fas fa-camera me-2"></i>Распознать рецепт по фото</h3>
                    <div class="ocr-container">
                        <p class="text-muted mb-3">Загрузите фото рецепта или упаковки лекарства. Система автоматически найдет лекарства в тексте!</p>
                        
                        <div class="upload-area-ocr" id="ocrDropArea">
                            <i class="fas fa-cloud-upload-alt fa-3x mb-3" style="color: #4361ee;"></i>
                            <p>Перетащите фото сюда или</p>
                            <input type="file" id="ocrFileInput" accept=".png,.jpg,.jpeg" style="display: none;">
                            <button class="btn btn-primary" onclick="document.getElementById('ocrFileInput').click()">
                                <i class="fas fa-folder-open me-2"></i>Выбрать файл
                            </button>
                            <p class="mt-2 text-muted">Поддерживаются PNG, JPG (макс. 5MB)</p>
                        </div>
                        
                        <img id="ocrPreview" class="preview-image" style="display: none;" alt="Предпросмотр">
                        
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-success" id="ocrProcessBtn" onclick="processOCR()" disabled>
                                <i class="fas fa-magic me-2"></i>Найти лекарства в тексте
                            </button>
                            <button class="btn btn-outline-secondary" onclick="clearOCR()">
                                <i class="fas fa-times me-2"></i>Очистить
                            </button>
                        </div>
                        
                        <div id="ocrLoading" style="display: none; margin: 15px 0;">
                            <div class="spinner"></div>
                            <span class="ms-2">Обработка изображения и поиск лекарств...</span>
                        </div>
                        
                        <div id="ocrError" class="alert alert-danger" style="display: none; margin-top: 15px;"></div>
                        
                        <div id="ocrFoundMedicines" style="display: none;"></div>
                        
                        <div class="mt-4">
                            <h5>Распознанный текст:</h5>
                            <div id="ocrResult" class="ocr-result"></div>
                            
                            <div id="ocrActions" class="mt-3" style="display: none;">
                                <button class="btn btn-primary btn-sm me-2" onclick="useOCRText()">
                                    <i class="fas fa-pills me-1"></i>Добавить в лекарства
                                </button>
                                <button class="btn btn-outline-primary btn-sm" onclick="searchFromOCR()">
                                    <i class="fas fa-search me-1"></i>Поиск по симптомам
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Инициализируем загрузчик OCR
                initOCRUploader();
                break;
        if (typeof ymaps !== 'undefined') {
            ymaps.ready(initPharmacyMap);
            myMap.controls.add('geolocationControl');
        } else {
            content.innerHTML += '<div class="alert alert-warning">Карта загружается...</div>';
            setTimeout(() => {
                if (typeof ymaps !== 'undefined') {
                    ymaps.ready(initPharmacyMap);
                }
            }, 1000);
    }   
            break;

        default:
            content.innerHTML = `<h3>Раздел временно недоступен</h3>`;
    }

    currentSection = sectionName;
    updateSidebarStats();
}

function loadMedicines() {
     try {
        const saved = localStorage.getItem('medicines');
        medicines = saved ? JSON.parse(saved) : [];
        medicines.forEach(med => {
            if (med.taken && typeof med.taken === 'object') {
                const fixedTaken = {};
                Object.keys(med.taken).forEach(key => {
                    fixedTaken[Number(key)] = med.taken[key];
                });
                med.taken = fixedTaken;
            }
        });
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
        medicines = [];
        localStorage.removeItem('medicines');
    }
    renderMedicines();
    updateSidebarStats();
}
document.addEventListener('click', function(e) {
    if (e.target.closest('.add-from-search-btn')) {
        const btn = e.target.closest('.add-from-search-btn');
        const medName = btn.dataset.name;
        if (medName) {
            openAddFromSearch(medName);
        }
    }
});

function addMedicine() { 
    const nameInput = document.getElementById('medicineNameInput');
    const symptomsInput = document.getElementById('addSymptomsInput');
    const dosesPerDay = document.getElementById('dosesPerDay').value;
    const durationDays = document.getElementById('durationDays').value;
    const startDate = document.getElementById('startDate').value;

    const name = nameInput.value.trim();
    const symptoms = symptomsInput.value.split(',').map(s => s.trim()).filter(s => s);

    if (!name || !startDate) {
        showToast('Заполните название и дату начала!', 'error');
        return;
    }

    const schedule = generateSchedule(startDate, dosesPerDay, durationDays);

    medicines.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: name,
        symptoms: symptoms,
        date: new Date().toLocaleDateString(),
        schedule: schedule, 
        taken: {} 
    });

    saveMedicines();
    nameInput.value = '';
    symptomsInput.value = '';
    showToast('💊 Лекарство добавлено с расписанием!', 'success');
    showSection('medicines');
}

function addToMyMedicines(name) {
    if (medicines.some(m => m.name === name)) {
        showToast('Уже в аптечке!', 'info');
        return;
    }
    medicines.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: name,
        symptoms: [],
        date: new Date().toLocaleDateString()
    });
    saveMedicines();
    showToast(`💊 ${name} добавлено!`, 'success');
}

function saveMedicines() {
    localStorage.setItem('medicines', JSON.stringify(medicines));
    updateSidebarStats();
}

function renderMedicines() {
    const list = document.getElementById('medicineList');
    if (!list) return;

    if (medicines.length === 0) {
        list.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-pills fa-3x mb-3"></i>
                <p>Лекарств пока нет</p>
                <button class="btn btn-primary" onclick="showSection('add')">
                    <i class="fas fa-plus"></i> Добавить первое лекарство
                </button>
            </div>
        `;
        return;
    }

    list.innerHTML = medicines.map(med => `
        <div class="medicine-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${escapeHtml(med.name)}</h5>
                        <p class="card-text">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>${escapeHtml(med.date)}
                            </small>
                        </p>
                        ${med.symptoms.length > 0 ? `
                            <div class="mt-2">
                                <strong>Симптомы:</strong>
                                <div class="d-flex flex-wrap gap-1 mt-1">
                                    ${med.symptoms.map(s => `<span class="badge bg-secondary">${escapeHtml(s)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <button class="btn btn-danger btn-sm" data-id="${med.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function deleteMedicine(id) {
    medicines = medicines.filter(med => med.id !== id);
    saveMedicines();
    renderMedicines();
    showToast('Лекарство удалено', 'info');
}

function sortMedicines(type) {
    if (type === 'name') {
        medicines.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        medicines.sort((a, b) => b.id.toString().localeCompare(a.id.toString()));
    }
    renderMedicines();
    showToast(`Отсортировано по ${type === 'name' ? 'имени' : 'дате'}`, 'info');
}

function updateSidebarStats() {
    document.getElementById('meds-count').textContent = medicines.length;
    document.getElementById('sidebar-count').textContent = medicines.length;
    document.getElementById('urgent-count').textContent = '0';
}

function clearAll() {
    if (confirm('Удалить ВСЕ лекарства? Это действие нельзя отменить!')) {
        medicines = [];
        saveMedicines();
        renderMedicines();
        showToast('Все лекарства удалены', 'info');
    }
}

function exportData() {
    const dataStr = JSON.stringify(medicines, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-aptechka-backup.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    showToast('Данные экспортированы', 'success');
}

function showPopularSymptoms() {
    const popular = ["головная боль", "температура", "кашель", "насморк", "боль в горле", "изжога", "тошнота"];
    const container = document.getElementById('popularSymptoms');
    if (!container) return;

    container.innerHTML = popular.map(symptom => `
        <span class="badge bg-light text-dark me-1 mb-1" style="cursor:pointer;border:1px solid #ddd;"
              onclick="symptomClick('${symptom}')">
            ${escapeHtml(symptom)}
        </span>
    `).join('');
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
        }, 150);
    }
}
function symptomClick(symptom) {
    const input = document.getElementById('symptomsInput');
    if (input) {
        input.value = symptom;
        performSymptomsSearch();
    }
}

document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-danger')) {
        const id = e.target.closest('.btn-danger').dataset.id;
        if (id) deleteMedicine(id);
    }
    if (e.target.closest('[data-name]')) {
        const name = e.target.closest('[data-name]').dataset.name;
        if (name) addToMyMedicines(name);
    }
});

let sidebarSearchTimeout;
document.getElementById('symptomsInput')?.addEventListener('input', function() {
    clearTimeout(sidebarSearchTimeout);
    sidebarSearchTimeout = setTimeout(() => {
        performSymptomsSearch();
    }, 500);
});
function initPharmacyMap() {
    const mapContainer = document.getElementById('pharmacyMap');
    if (mapContainer) {
        mapContainer.innerHTML = '';
    }
    const center = [55.751244, 37.618423];
    const zoom = 10;
    const myMap = new ymaps.Map('pharmacyMap', {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'fullscreenControl']
    });

    // тут на рандом делал так чо
    const pharmacies = [
        { name: "Аптека 36.6", address: "ул. Тверская, 1", coords: [55.7580, 37.6010] },
        { name: "Ригла", address: "просп. Мира, 15", coords: [55.7849, 37.6282] },
        { name: "Самсон-Фарма", address: "Ленинский просп., 25", coords: [55.7107, 37.5645] },
        { name: "Вита", address: "ул. Арбат, 10", coords: [55.7495, 37.5887] }
    ];

    pharmacies.forEach(ph => {
        const placemark = new ymaps.Placemark(
            ph.coords,
            {
                balloonContent: `<b>${ph.name}</b><br>${ph.address}`
            },
            {
                preset: 'islands#bluePharmacyIcon'
            }
        );
        myMap.geoObjects.add(placemark);
    });
}
// приемы
function generateSchedule(startDateStr, dosesPerDay, durationDays) {
    const start = new Date(startDateStr);
    const schedule = [];
    const intervalHours = 24 / dosesPerDay;

    for (let day = 0; day < durationDays; day++) {
        for (let dose = 0; dose < dosesPerDay; dose++) {
            const time = new Date(start);
            time.setDate(start.getDate() + day);
            time.setHours(start.getHours() + Math.floor(dose * intervalHours));
            time.setMinutes(start.getMinutes() + Math.floor((dose * intervalHours % 1) * 60));
            schedule.push(time.getTime()); 
        }
    }

    return schedule.sort((a, b) => a - b); 
}
//ближприём
function findNextReminder() {
    const now = Date.now();
    let next = null;

    for (const med of medicines) {
        if (!med.schedule) continue;
        for (const time of med.schedule) {
            if (time > now && !med.taken[time]) {
                if (!next || time < next.time) {
                    next = { id: med.id, medicine: med.name, time: time };
                }
            }
        }
    }

    return next;
}
function formatTimeTo(timestamp) {
    const diff = timestamp - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours} ч ${minutes} мин`;
    } else if (minutes > 0) {
        return `${minutes} мин`;
    } else {
        return "сейчас";
    }
}

//принято
function markAsTaken(medId, time) {
    const med = medicines.find(m => m.id === medId);
    if (med) {
        med.taken = med.taken || {};
        med.taken[time] = true;
        saveMedicines();
        showToast('✅ Принято!', 'success');
        showSection('medicines');
    }
}

function renderMedicines() {
    const list = document.getElementById('medicineList');
    if (!list) return;

    if (medicines.length === 0) {
        list.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-pills fa-3x mb-3"></i>
                <p>Лекарств пока нет</p>
                <button class="btn btn-primary" onclick="showSection('add')">
                    <i class="fas fa-plus"></i> Добавить первое лекарство
                </button>
            </div>
        `;
        return;
    }

    list.innerHTML = medicines.map(med => {
        const total = med.schedule ? med.schedule.length : 0;
        const taken = med.schedule && med.taken ? 
            Object.values(med.taken).filter(v => v).length : 0;
        const progress = total ? Math.round((taken / total) * 100) : 0;

        return `
        <div class="medicine-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${escapeHtml(med.name)}</h5>
                        <p class="card-text">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>${escapeHtml(med.date)}
                            </small>
                        </p>
                        ${med.symptoms.length > 0 ? `
                            <div class="mt-2">
                                <strong>Симптомы:</strong>
                                <div class="d-flex flex-wrap gap-1 mt-1">
                                    ${med.symptoms.map(s => `<span class="badge bg-secondary">${escapeHtml(s)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${total > 0 ? `
                            <div class="mt-2">
                                <small>Прогресс: ${taken}/${total} (${progress}%)</small>
                                <div class="progress mt-1" style="height: 6px;">
                                    <div class="progress-bar" role="progressbar" style="width: ${progress}%"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <button class="btn btn-danger btn-sm" data-id="${med.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}
function openAddFromSearch(medicineName) {
    if (medicines.some(m => m.name === medicineName)) {
        showToast('Это лекарство уже в аптечке!', 'info');
        return;
    }

    const modalHTML = `
        <div class="modal fade show d-block" id="addFromSearchModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">➕ Добавить "${medicineName}"</h5>
                        <button type="button" class="btn-close" onclick="closeModal()"></button>
                    </div>
                    <div class="modal-body">
                        <input type="text" class="form-control mb-3" value="${escapeHtml(medicineName)}" id="modalMedicineName" readonly>
                        
                        <label class="form-label">Симптомы (через запятую)</label>
                        <input type="text" class="form-control mb-3" placeholder="Необязательно" id="modalSymptoms">
                        
                        <label class="form-label">Количество приёмов в день</label>
                        <select class="form-select mb-3" id="modalDosesPerDay">
                            <option value="1">1 раз в день</option>
                            <option value="2">2 раза в день</option>
                            <option value="3">3 раза в день</option>
                            <option value="4">4 раза в день</option>
                        </select>
                        
                        <label class="form-label">Срок приёма (дней)</label>
                        <input type="number" class="form-control mb-3" placeholder="Например: 7" id="modalDurationDays" min="1" value="7">
                        
                        <label class="form-label">Начало приёма</label>
                        <input type="datetime-local" class="form-control mb-3" id="modalStartDate">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                        <button type="button" class="btn btn-success" onclick="addFromSearch('${escapeHtml(medicineName)}')">Добавить</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('modalStartDate').value = local;
}

function closeModal() {
    const modal = document.getElementById('addFromSearchModal');
    const backdrop = document.querySelector('.modal-backdrop');
    if (modal) modal.remove();
    if (backdrop) backdrop.remove();
}
function addFromSearch(medicineName) {
    const symptoms = document.getElementById('modalSymptoms').value.split(',').map(s => s.trim()).filter(s => s);
    const dosesPerDay = document.getElementById('modalDosesPerDay').value;
    const durationDays = document.getElementById('modalDurationDays').value;
    const startDate = document.getElementById('modalStartDate').value;

    if (!startDate) {
        showToast('Укажите дату начала приёма!', 'error');
        return;
    }

    const schedule = generateSchedule(startDate, dosesPerDay, durationDays);

    medicines.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: medicineName,
        symptoms: symptoms,
        date: new Date().toLocaleDateString(),
        schedule: schedule,
        taken: {}
    });

    saveMedicines();
    closeModal();
    showToast(`💊 ${medicineName} добавлено!`, 'success');
    const currentQuery = document.getElementById('searchInput')?.value || 
                          document.getElementById('symptomsInput')?.value || '';
    if (currentQuery) {
        setTimeout(() => {
            if (document.getElementById('searchInput')) {
                performMainSearch();
            } else if (document.getElementById('symptomsInput')) {
                performSymptomsSearch();
            }
        }, 100);
    }
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});
document.addEventListener('click', function(e) {
    if (e.target.closest('.modal') === null && document.getElementById('addFromSearchModal')) {
        closeModal();
    }
});
document.addEventListener('DOMContentLoaded', function() {
    if (typeof medsDatabase === 'undefined') {
        console.error('❌ medsDatabase не загружена! Проверьте путь к js/meds-database.js');
    } else {
        console.log('✅ База лекарств загружена, количество:', medsDatabase.length);
    }
    loadMedicines();
    showPopularSymptoms();
    showSection('medicines');
});
