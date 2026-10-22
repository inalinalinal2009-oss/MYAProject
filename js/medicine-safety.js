// ==================== ГРУППЫ И БАЗОВЫЕ ПРЕДУПРЕЖДЕНИЯ ====================

const DISPLAY_GROUPS = [
    {
        id: 'nsaid',
        label: 'НПВС',
        terms: [
            'ибупрофен', 'нурофен', 'кетанов', 'кеторол', 'найз', 'нимесил', 'нимулид',
            'диклофенак', 'кетопрофен', 'кетонал', 'мелоксикам', 'мовалис', 'целекоксиб',
            'эторикоксиб', 'аркоксиа', 'лорноксикам', 'ксефокам', 'пироксикам',
            'теноксикам', 'аспирин', 'ацетилсалицил'
        ],
        includeTopical: false
    },
    {
        id: 'acetaminophen',
        label: 'Парацетамол / жаропонижающее',
        terms: [
            'парацетамол', 'терафлю', 'колдрекс', 'фервекс', 'антигриппин',
            'ринза', 'максиколд', 'панадол', 'гриппостад', 'анвимакс', 'ибуклин'
        ]
    },
    {
        id: 'decongestant',
        label: 'Сосудосуживающее',
        terms: [
            'нафтизин', 'отривин', 'тизин', 'називин', 'ринонорм', 'снуп',
            'ринопронт', 'ксилометазолин', 'оксиметазолин', 'галазолин', 'назол'
        ]
    },
    {
        id: 'sedative',
        label: 'Седативное / снотворное',
        terms: [
            'корвалол', 'валокордин', 'барбовал', 'валосердин', 'донормил',
            'мелаксен', 'сонмил', 'соннат', 'пустырник', 'валериана',
            'ново-пассит', 'персен', 'фенибут'
        ]
    },
    {
        id: 'antibiotic',
        label: 'Антибиотик',
        terms: [
            'амоксиклав', 'амоксициллин', 'азитромицин', 'сумамед', 'цефтриаксон',
            'цефазолин', 'цефотаксим', 'клацид', 'флемоксин', 'доксициклин',
            'тетрациклин', 'левомицетин', 'ципрофлоксацин', 'офлоксацин',
            'эритромицин', 'линкомицин', 'клиндамицин', 'метронидазол'
        ]
    },
    {
        id: 'antispasmodic',
        label: 'Спазмолитик',
        terms: ['но-шпа', 'дротаверин', 'папаверин', 'спазмалгон', 'ревалгин', 'баралгин']
    },
    {
        id: 'antacid',
        label: 'Антацид / желудок',
        terms: [
            'алмагель', 'фосфалюгель', 'гастал', 'ренни', 'маалокс',
            'гевискон', 'омез', 'омепразол', 'нольпаза', 'эманера',
            'де-нол', 'фамотидин', 'ранитидин'
        ]
    },
    {
        id: 'sorbent',
        label: 'Сорбент',
        terms: ['смекта', 'энтеросгель', 'полисорб', 'активированный уголь']
    },
    {
        id: 'antidiarrheal',
        label: 'Противодиарейное',
        terms: ['лоперамид', 'имодиум', 'энтерол', 'энтерофурил', 'стопдиар', 'нифуроксазид']
    },
    {
        id: 'antihistamine',
        label: 'Антигистаминное',
        terms: [
            'зиртек', 'зодак', 'тавегил', 'диазолин', 'кларитин',
            'эриус', 'цетрин', 'лоратадин', 'дезлоратадин', 'левоцитризин',
            'фенистил'
        ]
    },
    {
        id: 'cardiovascular',
        label: 'Сердечно-сосудистое',
        terms: [
            'валидол', 'корвалол', 'нитроглицерин', 'изокет', 'моносан',
            'кардикет', 'нитросорбид', 'милдронат', 'предуктал', 'триметазидин'
        ]
    },
    {
        id: 'antihypertensive',
        label: 'Против давления',
        terms: [
            'энап', 'капотен', 'лозап', 'престариум', 'амлодипин',
            'норваск', 'лизиноприл', 'периндоприл', 'валсартан',
            'индапамид', 'фуросемид', 'лазикс', 'верошпирон', 'спиронолактон'
        ]
    },
    {
        id: 'antiseptic',
        label: 'Антисептик',
        terms: ['мирамистин', 'хлоргексидин', 'перекись', 'йод', 'зелёнка', 'бетадин', 'декасан']
    }
];

const RISK_GROUPS = [
    {
        id: 'nsaid',
        terms: DISPLAY_GROUPS.find(group => group.id === 'nsaid').terms,
        includeTopical: false
    },
    {
        id: 'acetaminophen',
        terms: DISPLAY_GROUPS.find(group => group.id === 'acetaminophen').terms
    },
    {
        id: 'decongestant',
        terms: DISPLAY_GROUPS.find(group => group.id === 'decongestant').terms
    },
    {
        id: 'sedative',
        terms: DISPLAY_GROUPS.find(group => group.id === 'sedative').terms
    },
    {
        id: 'antiplatelet_aspirin',
        terms: ['аспирин кардио', 'кардиомагнил', 'тромбо асс'],
        exact: false
    }
];

const INTERACTION_RULES = [
    {
        id: 'nsaid-duplicate',
        type: 'same-group',
        group: 'nsaid',
        severity: 'danger',
        title: 'Два НПВС в одном курсе',
        message: 'Одновременный приём нескольких НПВС повышает риск кровотечения, язвы, повреждения почек и сердечно-сосудистых осложнений.'
    },
    {
        id: 'acetaminophen-duplicate',
        type: 'same-group',
        group: 'acetaminophen',
        severity: 'danger',
        title: 'Повтор парацетамола из разных препаратов',
        message: 'Парацетамол может скрываться сразу в нескольких средствах от температуры и простуды. Суммарная доза повышает риск токсического поражения печени.'
    },
    {
        id: 'decongestant-duplicate',
        type: 'same-group',
        group: 'decongestant',
        severity: 'warning',
        title: 'Несколько сосудосуживающих одновременно',
        message: 'Комбинация сосудосуживающих может усиливать сердцебиение, повышать давление и риск лекарственного ринита. Такие средства обычно используют коротко и аккуратно.'
    },
    {
        id: 'sedative-duplicate',
        type: 'same-group',
        group: 'sedative',
        severity: 'warning',
        title: 'Несколько седативных / снотворных',
        message: 'Совмещение седативных и снотворных может усиливать сонливость, заторможенность и риск ошибок, падений или опасной слабости.'
    },
    {
        id: 'aspirin-with-nsaid',
        type: 'mixed-groups',
        groups: ['antiplatelet_aspirin', 'nsaid'],
        severity: 'warning',
        title: 'Аспирин-кардио вместе с НПВС',
        message: 'Аспирин для сердца в комбинации с другими НПВС может повышать риск кровотечения и мешать защитному эффекту аспирина.'
    }
];

function normalizeMedicineName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/\s+/g, ' ')
        .trim();
}

function isTopicalMedicine(name) {
    const normalizedName = normalizeMedicineName(name);
    return /(мазь|гель|эмульгель|крем|пластыр|бальзам)/.test(normalizedName);
}

function matchesDefinition(normalizedName, definition, originalName) {
    if (!definition.includeTopical && isTopicalMedicine(originalName)) {
        return false;
    }

    return definition.terms.some(term => normalizedName.includes(term));
}

function getMedicineGroups(name) {
    const normalizedName = normalizeMedicineName(name);
    const groups = DISPLAY_GROUPS.filter(definition => matchesDefinition(normalizedName, definition, name))
        .map(definition => ({ id: definition.id, label: definition.label }));

    return groups.filter((group, index, items) => items.findIndex(item => item.id === group.id) === index);
}

function getMedicineGroupLabels(name) {
    return getMedicineGroups(name).map(group => group.label);
}

function getMedicineRiskGroups(name) {
    const normalizedName = normalizeMedicineName(name);
    const riskGroups = RISK_GROUPS.filter(definition => matchesDefinition(normalizedName, definition, name))
        .map(definition => definition.id);

    return riskGroups.filter((group, index, items) => items.indexOf(group) === index);
}

function getMedicineSafetyMeta(name) {
    return {
        groups: getMedicineGroups(name),
        riskGroups: getMedicineRiskGroups(name)
    };
}

function hasUntakenSchedule(medicine) {
    if (!Array.isArray(medicine?.schedule) || medicine.schedule.length === 0) {
        return false;
    }

    return medicine.schedule.some(time => !(medicine.taken && medicine.taken[time]));
}

function getActiveCourseMedicines(medicinesList = []) {
    return medicinesList.filter(hasUntakenSchedule);
}

function findCourseSafetyWarnings(medicinesList = []) {
    const activeMedicines = getActiveCourseMedicines(medicinesList)
        .map(medicine => ({
            ...medicine,
            safetyMeta: getMedicineSafetyMeta(medicine.name)
        }));

    const warnings = [];

    for (const rule of INTERACTION_RULES) {
        if (rule.type === 'same-group') {
            const matched = activeMedicines.filter(medicine => medicine.safetyMeta.riskGroups.includes(rule.group));
            if (matched.length >= 2) {
                warnings.push({
                    id: rule.id,
                    severity: rule.severity,
                    title: rule.title,
                    message: rule.message,
                    medicines: matched.map(medicine => medicine.name)
                });
            }
            continue;
        }

        if (rule.type === 'mixed-groups') {
            const matchedByGroup = rule.groups.map(groupId =>
                activeMedicines.filter(medicine => medicine.safetyMeta.riskGroups.includes(groupId))
            );

            if (matchedByGroup.every(groupMedicines => groupMedicines.length > 0)) {
                const mergedNames = matchedByGroup.flat().map(medicine => medicine.name);
                warnings.push({
                    id: rule.id,
                    severity: rule.severity,
                    title: rule.title,
                    message: rule.message,
                    medicines: [...new Set(mergedNames)]
                });
            }
        }
    }

    return warnings.filter((warning, index, items) => items.findIndex(item => item.id === warning.id) === index);
}

if (typeof medsDatabase !== 'undefined' && Array.isArray(medsDatabase)) {
    medsDatabase.forEach(medicine => {
        const meta = getMedicineSafetyMeta(medicine.name);
        medicine.groups = meta.groups.map(group => group.label);
        medicine.riskGroups = meta.riskGroups;
    });
}

window.getMedicineGroups = getMedicineGroups;
window.getMedicineGroupLabels = getMedicineGroupLabels;
window.getMedicineRiskGroups = getMedicineRiskGroups;
window.getMedicineSafetyMeta = getMedicineSafetyMeta;
window.findCourseSafetyWarnings = findCourseSafetyWarnings;
