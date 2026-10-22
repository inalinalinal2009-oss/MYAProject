document.addEventListener('DOMContentLoaded', function () {
    if (typeof medsDatabase === 'undefined') {
        console.error('medsDatabase не загружена. Проверьте путь к js/meds-database.js');
    } else {
        console.log('База лекарств загружена, количество:', medsDatabase.length);
    }

    checkAuth();
    initAccessibilityMode();
    initEnhancedAccessibility();

    const currentUser = getCurrentUser();
    if (currentUser) {
        const userSettings = getUserSettings();
        if (userSettings?.theme) {
            applyTheme(userSettings.theme);
        }
        awardDailyLoginCoins({ silent: false });
        applyCustomizationThemeForCurrentUser();
    } else {
        clearCustomizationThemeClasses();
    }

    loadMedicines();
    startTelegramCareWatcher();
    showSection('medicines');

    document.addEventListener('click', function (event) {
        if (event.target.closest('.add-from-search-btn')) {
            const button = event.target.closest('.add-from-search-btn');
            const medicineName = button.dataset.name;
            if (medicineName) {
                addToMyMedicines(medicineName);
            }
        }

        if (event.target.closest('[onclick*="searchSymptom"]')) {
            event.preventDefault();
            const onclickValue = event.target
                .closest('[onclick*="searchSymptom"]')
                .getAttribute('onclick');
            const symptomMatch = onclickValue && onclickValue.match(/'([^']+)'/);
            if (symptomMatch?.[1]) {
                searchSymptom(symptomMatch[1]);
            }
        }
    });

    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.addEventListener('click', function (event) {
            if (event.target === passwordModal) {
                hideChangePasswordModal();
            }
        });
    }

    ['currentPasswordInput', 'newPasswordInput', 'confirmPasswordInput'].forEach((id) => {
        document.getElementById(id)?.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                submitPasswordChange();
            }
        });
    });

    document.addEventListener('keydown', function (event) {
        if (!event.altKey || event.key.toLowerCase() !== 'v') return;
        if (currentSection !== 'search') return;
        event.preventDefault();
        startVoiceSymptomsSearch();
    });
});

window.deleteMedicineWithAnimation = deleteMedicineWithAnimation;
window.showSection = showSection;
window.performMainSearch = performMainSearch;
window.performTopSearch = performTopSearch;
window.startVoiceSymptomsSearch = startVoiceSymptomsSearch;
window.speakCurrentSection = speakCurrentSection;
window.stopSpeechNarration = stopSpeechNarration;
window.addMedicine = addMedicine;
window.addToMyMedicines = addToMyMedicines;
window.confirmAddToMyMedicines = confirmAddToMyMedicines;
window.closeSearchAddMedicineModal = closeSearchAddMedicineModal;
window.enrichMedicineContraindications = enrichMedicineContraindications;
window.sortMedicines = sortMedicines;
window.clearAll = clearAll;
window.exportData = exportData;
window.exportCoursesToPDF = exportCoursesToPDF;
window.importData = importData;
window.searchSymptom = searchSymptom;
window.markAsTaken = markAsTaken;
window.navigateToPharmacy = navigateToPharmacy;
window.locateAndSearchPharmacies = locateAndSearchPharmacies;
window.searchPharmaciesInCurrentArea = searchPharmaciesInCurrentArea;
window.focusPharmacyResult = focusPharmacyResult;
window.changePassword = changePassword;
window.showChangePasswordModal = showChangePasswordModal;
window.hideChangePasswordModal = hideChangePasswordModal;
window.submitPasswordChange = submitPasswordChange;
window.toggleAccessibilityMode = toggleAccessibilityMode;
window.toggleTelegramTokenVisibility = toggleTelegramTokenVisibility;
window.saveTelegramCareSettings = saveTelegramCareSettings;
window.sendTelegramCareTestMessage = sendTelegramCareTestMessage;
window.sendEmergencyAlertToRelatives = sendEmergencyAlertToRelatives;
window.copyRestockListToClipboard = copyRestockListToClipboard;
window.applyAutoRestockPurchase = applyAutoRestockPurchase;
window.applyAutoRestockForAllUrgent = applyAutoRestockForAllUrgent;
window.savePlannerSettingsFromProfile = savePlannerSettingsFromProfile;
window.switchFamilyProfile = switchFamilyProfile;
window.switchFamilyProfileFromProfile = switchFamilyProfileFromProfile;
window.addFamilyMemberProfile = addFamilyMemberProfile;
window.removeFamilyMemberProfile = removeFamilyMemberProfile;
window.copySyncCodeToClipboard = copySyncCodeToClipboard;
window.importSyncCode = importSyncCode;
window.restoreLatestAutoBackup = restoreLatestAutoBackup;
window.awardDailyLoginCoins = awardDailyLoginCoins;
window.purchaseCustomizationItem = purchaseCustomizationItem;
window.activateCustomizationItem = activateCustomizationItem;
window.resetActiveCustomization = resetActiveCustomization;
window.applyCustomizationThemeForCurrentUser = applyCustomizationThemeForCurrentUser;
window.clearCustomizationThemeClasses = clearCustomizationThemeClasses;
