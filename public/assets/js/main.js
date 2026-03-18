// ============================================================================
//         ПОЛНЫЙ ФУНКЦИОНАЛ С ФИЛЬТРАЦИЕЙ ДЛЯ ПРОРАБОВ
// ============================================================================

Chart.register(ChartDataLabels);

// Исправляем ошибку с масштабированием
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = true;

const ROLES = {
    CREATOR: 'creator',
    FOREMAN: 'foreman',
    CLIENT: 'client'
};

// Данные пользователей с правильными паролями
// !!! ВАЖНО: Здесь вы можете изменить пароль для создателя !!!
// Просто замените '123' на ваш новый пароль в строке ниже
let users = {
    'creator': {password: '123', name: 'Создатель', role: ROLES.CREATOR},
    'dmitry': {password: '111', name: 'Дмитрий', role: ROLES.FOREMAN},
    'ivan': {password: '222', name: 'Иван', role: ROLES.FOREMAN},
    'client': {password: '789', name: 'Заказчик', role: ROLES.CLIENT}
};

let currentUser = null;

// Конфигурация облака с правильными заголовками для CORS
const CLOUD_CONFIG = {
    bucketName: 'arctic-photos-20260213',
    region: 'ru-central1',
    endpoint: 'https://storage.yandexcloud.net',
    accessKeyId: 'YCAJEcWVl28_0_2joN0H2XTLF',
    secretAccessKey: 'YCNH-JrqmwnNpwQoDTnGzja6KGCBVpPwYqTm43On'
};

AWS.config.update({
    accessKeyId: CLOUD_CONFIG.accessKeyId,
    secretAccessKey: CLOUD_CONFIG.secretAccessKey,
    region: CLOUD_CONFIG.region,
    endpoint: CLOUD_CONFIG.endpoint,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    httpOptions: {
        timeout: 30000
    }
});

const s3 = new AWS.S3();

const categoryWorkTypes = {
    apartments: [
        {id: 'floors', name: 'Полы', color: '#3498db'},
        {id: 'walls', name: 'Стены', color: '#2ecc71'},
        {id: 'ceilings', name: 'Потолки', color: '#9b59b6'},
        {id: 'electrical', name: 'Электромонтаж', color: '#f39c12'},
        {id: 'plumbing', name: 'Сантехника', color: '#1abc9c'},
        {id: 'gkl', name: 'ГКЛ работы', color: '#e67e22'}
    ],
    roof: [{id: 'roof', name: 'Кровля', color: '#e67e22'}],
    facade: [{id: 'facade', name: 'Фасад', color: '#3498db'}],
    windows: [{id: 'windows', name: 'Окна', color: '#2ecc71'}],
    water: [{id: 'water', name: 'ГВС/ХВС', color: '#1abc9c'}]
};

const defaultWorks = {
    apartments: [
        {id: 38, type: 'floors', name: "Укладка лаг по перекрытиям"},
        {id: 44, type: 'floors', name: "Основание из фанеры"},
        {id: 46, type: 'floors', name: "Покрытие из линолеума"},
        {id: 48, type: 'floors', name: "Устройство плинтусов"},
        {id: 51, type: 'walls', name: "Штукатурка стен"},
        {id: 55, type: 'walls', name: "Облицовка стен плиткой"},
        {id: 58, type: 'walls', name: "Установка дверных блоков"},
        {id: 101, type: 'gkl', name: "Обшивка стен ГКЛ"},
        {id: 105, type: 'gkl', name: "Шпаклёвка ГКЛ"},
        {id: 62, type: 'ceilings', name: "Шпаклёвка потолков"},
        {id: 64, type: 'ceilings', name: "Окраска потолков"},
        {id: 65, type: 'electrical', name: "Монтаж розеток"},
        {id: 66, type: 'electrical', name: "Монтаж светильников"},
        {id: 68, type: 'electrical', name: "Монтаж электроплит"},
        {id: 69, type: 'plumbing', name: "Установка унитазов"},
        {id: 70, type: 'plumbing', name: "Установка смесителей"},
        {id: 71, type: 'plumbing', name: "Установка ванн"},
        {id: 72, type: 'plumbing', name: "Установка раковин"},
        {id: 73, type: 'plumbing', name: "Монтаж труб (вода)"},
        {id: 74, type: 'plumbing', name: "Монтаж труб (канализация)"}
    ],
    roof: [
        {id: 201, type: 'roof', name: "Демонтаж кровли"},
        {id: 203, type: 'roof', name: "Монтаж утеплителя"},
        {id: 205, type: 'roof', name: "Гидроизоляция"},
        {id: 206, type: 'roof', name: "Монтаж покрытия"},
        {id: 207, type: 'roof', name: "Водосточная система"}
    ],
    facade: [
        {id: 301, type: 'facade', name: "Утепление фасада"},
        {id: 302, type: 'facade', name: "Штукатурка"},
        {id: 304, type: 'facade', name: "Окраска"},
        {id: 305, type: 'facade', name: "Облицовка плиткой"}
    ],
    windows: [
        {id: 402, type: 'windows', name: "Монтаж ПВХ окон"},
        {id: 403, type: 'windows', name: "Монтаж откосов"},
        {id: 404, type: 'windows', name: "Установка подоконников"},
        {id: 405, type: 'windows', name: "Герметизация швов"}
    ],
    water: [
        {id: 501, type: 'water', name: "Монтаж труб ГВС"},
        {id: 502, type: 'water', name: "Монтаж труб ХВС"},
        {id: 503, type: 'water', name: "Установка счетчиков"},
        {id: 506, type: 'water', name: "Монтаж насосов"}
    ]
};

// Проекты
let projects = {
    'lupche_svino': {
        id: 'lupche_svino',
        name: 'Лупче-Свино',
        address: 'Мурманская обл., Лупче-Свино',
        houses: {
            1: [1, 3, 5, 6, 7, 9, 10, 12, 13, 14, 15, 16],
            2: [1, 2, 3, 4, 5, 7, 8, 9, 11, 13, 14, 15, 16],
            3: [4, 5, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
            4: [1, 3, 4, 5, 9, 10, 11, 12, 14, 15, 16, 18, 19, 20, 21, 22, 24]
        },
        logoUrl: null,
        headerUrl: null,
        categoryData: {
            apartments: {
                progress: {
                    'house1_apt1': {
                        38: 100,
                        44: 100,
                        46: 100,
                        48: 100,
                        51: 100,
                        55: 100,
                        58: 100,
                        101: 100,
                        105: 100,
                        62: 100,
                        64: 100,
                        65: 100,
                        66: 100,
                        68: 100,
                        69: 100,
                        70: 100,
                        71: 100,
                        72: 100,
                        73: 100,
                        74: 100
                    },
                    'house1_apt3': {
                        38: 100,
                        44: 100,
                        46: 100,
                        48: 100,
                        51: 100,
                        55: 100,
                        58: 100,
                        101: 100,
                        105: 100,
                        62: 100,
                        64: 100,
                        65: 100,
                        66: 100,
                        68: 100,
                        69: 100,
                        70: 100,
                        71: 100,
                        72: 100,
                        73: 100,
                        74: 100
                    },
                    'house1_apt5': {
                        38: 100,
                        44: 100,
                        46: 100,
                        48: 100,
                        51: 100,
                        55: 100,
                        58: 100,
                        101: 100,
                        105: 100,
                        62: 100,
                        64: 100,
                        65: 100,
                        66: 100,
                        68: 100,
                        69: 100,
                        70: 100,
                        71: 100,
                        72: 100,
                        73: 100,
                        74: 100
                    },
                    'house1_apt6': {
                        38: 100,
                        44: 100,
                        46: 100,
                        48: 100,
                        51: 100,
                        55: 100,
                        58: 100,
                        101: 100,
                        105: 100,
                        62: 100,
                        64: 100,
                        65: 100,
                        66: 100,
                        68: 100,
                        69: 100,
                        70: 100,
                        71: 100,
                        72: 100,
                        73: 100,
                        74: 100
                    },
                    'house1_apt7': {
                        38: 100,
                        44: 100,
                        46: 100,
                        48: 100,
                        51: 100,
                        55: 100,
                        58: 100,
                        101: 100,
                        105: 100,
                        62: 100,
                        64: 100,
                        65: 100,
                        66: 100,
                        68: 100,
                        69: 100,
                        70: 100,
                        71: 100,
                        72: 100,
                        73: 100,
                        74: 100
                    },
                    'house1_apt9': {
                        38: 100,
                        44: 100,
                        46: 100,
                        48: 100,
                        51: 100,
                        55: 100,
                        58: 100,
                        101: 100,
                        105: 100,
                        62: 100,
                        64: 100,
                        65: 100,
                        66: 100,
                        68: 100,
                        69: 100,
                        70: 100,
                        71: 100,
                        72: 100,
                        73: 100,
                        74: 100
                    },
                    'house1_apt10': {
                        38: 75,
                        44: 75,
                        46: 75,
                        48: 75,
                        51: 75,
                        55: 75,
                        58: 75,
                        101: 75,
                        105: 75,
                        62: 75,
                        64: 75,
                        65: 75,
                        66: 75,
                        68: 75,
                        69: 75,
                        70: 75,
                        71: 75,
                        72: 75,
                        73: 75,
                        74: 75
                    },
                    'house1_apt12': {
                        38: 50,
                        44: 50,
                        46: 50,
                        48: 50,
                        51: 50,
                        55: 50,
                        58: 50,
                        101: 50,
                        105: 50,
                        62: 50,
                        64: 50,
                        65: 50,
                        66: 50,
                        68: 50,
                        69: 50,
                        70: 50,
                        71: 50,
                        72: 50,
                        73: 50,
                        74: 50
                    },
                    'house1_apt13': {
                        38: 25,
                        44: 25,
                        46: 25,
                        48: 25,
                        51: 25,
                        55: 25,
                        58: 25,
                        101: 25,
                        105: 25,
                        62: 25,
                        64: 25,
                        65: 25,
                        66: 25,
                        68: 25,
                        69: 25,
                        70: 25,
                        71: 25,
                        72: 25,
                        73: 25,
                        74: 25
                    },
                    'house1_apt14': {
                        38: 0,
                        44: 0,
                        46: 0,
                        48: 0,
                        51: 0,
                        55: 0,
                        58: 0,
                        101: 0,
                        105: 0,
                        62: 0,
                        64: 0,
                        65: 0,
                        66: 0,
                        68: 0,
                        69: 0,
                        70: 0,
                        71: 0,
                        72: 0,
                        73: 0,
                        74: 0
                    },
                    'house1_apt15': {
                        38: 0,
                        44: 0,
                        46: 0,
                        48: 0,
                        51: 0,
                        55: 0,
                        58: 0,
                        101: 0,
                        105: 0,
                        62: 0,
                        64: 0,
                        65: 0,
                        66: 0,
                        68: 0,
                        69: 0,
                        70: 0,
                        71: 0,
                        72: 0,
                        73: 0,
                        74: 0
                    },
                    'house1_apt16': {
                        38: 0,
                        44: 0,
                        46: 0,
                        48: 0,
                        51: 0,
                        55: 0,
                        58: 0,
                        101: 0,
                        105: 0,
                        62: 0,
                        64: 0,
                        65: 0,
                        66: 0,
                        68: 0,
                        69: 0,
                        70: 0,
                        71: 0,
                        72: 0,
                        73: 0,
                        74: 0
                    }
                },
                required: {},
                photos: {},
                workers: {
                    'house1_apt1': 4, 'house1_apt3': 3, 'house1_apt5': 2, 'house1_apt6': 2, 'house1_apt7': 3,
                    'house1_apt9': 4, 'house1_apt10': 2, 'house1_apt12': 1, 'house1_apt13': 2,
                    'house1_apt14': 0, 'house1_apt15': 0, 'house1_apt16': 0
                }
            },
            roof: {
                progress: {
                    'roof_1': {201: 100, 203: 100, 205: 100, 206: 100, 207: 100},
                    'roof_2': {201: 100, 203: 100, 205: 100, 206: 75, 207: 50},
                    'roof_3': {201: 100, 203: 75, 205: 50, 206: 25, 207: 0},
                    'roof_4': {201: 0, 203: 0, 205: 0, 206: 0, 207: 0}
                },
                required: {},
                photos: {},
                workers: {'roof_1': 5, 'roof_2': 4, 'roof_3': 3, 'roof_4': 0}
            },
            facade: {
                progress: {
                    'facade_1': {301: 100, 302: 100, 304: 100, 305: 100},
                    'facade_2': {301: 100, 302: 100, 304: 75, 305: 50},
                    'facade_3': {301: 100, 302: 50, 304: 25, 305: 0},
                    'facade_4': {301: 0, 302: 0, 304: 0, 305: 0}
                },
                required: {},
                photos: {},
                workers: {'facade_1': 4, 'facade_2': 3, 'facade_3': 2, 'facade_4': 0}
            }
        },
        contracts: {
            'contract_1': {id: 'contract_1', name: 'Основной подряд', amount: 15000000, payments: []},
            'contract_2': {id: 'contract_2', name: 'Кровельные работы', amount: 3500000, payments: []},
            'contract_3': {id: 'contract_3', name: 'Фасадные работы', amount: 4200000, payments: []}
        },
        workContracts: {},
        groupContracts: {},
        materials: [
            {name: 'Цемент М500', quantity: 250, price: 350},
            {name: 'Песок', quantity: 15, price: 1200},
            {name: 'Арматура 12мм', quantity: 850, price: 85},
            {name: 'Кирпич рядовой', quantity: 12000, price: 18}
        ],
        customCharts: [
            {id: 'chart_1', type: 'category_progress', category: 'apartments', title: 'Прогресс по квартирам'},
            {id: 'chart_2', type: 'category_progress', category: 'roof', title: 'Прогресс по кровле'},
            {id: 'chart_3', type: 'category_progress', category: 'facade', title: 'Прогресс по фасаду'},
            {id: 'chart_4', type: 'contract_progress', category: '', title: 'Прогресс по контрактам'},
            {id: 'chart_5', type: 'workers_by_house', category: 'apartments', title: 'Рабочие по домам'}
        ],
        foremanAssignments: {
            // Дмитрий отвечает за Окна
            'dmitry': {
                'windows': ['all']
            },
            // Иван отвечает за Квартиры
            'ivan': {
                'apartments': ['all']
            }
        },
        materialsByHouse: {}
    }
};

let currentProject = 'lupche_svino';
let workDefinitions = JSON.parse(JSON.stringify(defaultWorks));
let categoryData = projects.lupche_svino.categoryData;
let contracts = projects.lupche_svino.contracts;
let workContracts = projects.lupche_svino.workContracts || {};
let groupContracts = projects.lupche_svino.groupContracts || {};
let materials = projects.lupche_svino.materials || [];
let materialsByHouse = projects.lupche_svino.materialsByHouse || {};

let isSaving = false;
let currentCalendarDate = new Date();
let currentCategory = 'apartments';
let selectedHouse = 1;
let selectedObject = null;
let selectedObjectId = null;
let allObjects = {apartments: [], roof: [], facade: [], windows: [], water: [], contracts: []};
let chartInstances = [];
let chartsCollapsed = false;

let currentPhotoList = [];
let currentPhotoIndex = 0;

// Кэш назначений для текущего пользователя
let userAssignedCategories = null;
let userAssignedObjects = null;

// Локальное хранилище для резервного копирования
function saveToLocalStorage() {
    try {
        localStorage.setItem('repairSystem_projects', JSON.stringify(projects));
        localStorage.setItem('repairSystem_workDefinitions', JSON.stringify(workDefinitions));
        localStorage.setItem('repairSystem_users', JSON.stringify(users));
        console.log('Данные сохранены в localStorage');
        return true;
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        alert('⚠️ Ошибка сохранения в localStorage! Возможно, переполнение хранилища.');
        return false;
    }
}

function loadFromLocalStorage() {
    try {
        const savedProjects = localStorage.getItem('repairSystem_projects');
        const savedWorkDefinitions = localStorage.getItem('repairSystem_workDefinitions');
        const savedUsers = localStorage.getItem('repairSystem_users');

        if (savedProjects) projects = JSON.parse(savedProjects);
        if (savedWorkDefinitions) workDefinitions = JSON.parse(savedWorkDefinitions);
        if (savedUsers) users = JSON.parse(savedUsers);

        console.log('Данные загружены из localStorage');
        return true;
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
        return false;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С НАЗНАЧЕНИЯМИ ПРОРАБОВ ==========

// Получить назначенные категории для текущего пользователя
function getUserAssignedCategories() {
    if (!currentUser || currentUser.role !== ROLES.FOREMAN) return null;

    const projectAssignments = projects[currentProject]?.foremanAssignments || {};
    return projectAssignments[currentUser.username] || {};
}

// Получить список объектов, назначенных прорабу
function getUserAssignedObjects() {
    if (!currentUser || currentUser.role !== ROLES.FOREMAN) return [];

    const assignments = getUserAssignedCategories();
    const assignedObjects = [];

    for (let [category, objects] of Object.entries(assignments)) {
        if (objects.includes('all')) {
            // Если назначена вся категория, добавляем все объекты этой категории
            (allObjects[category] || []).forEach(obj => {
                assignedObjects.push(obj.id);
            });
        } else {
            // Добавляем конкретные объекты
            assignedObjects.push(...objects);
        }
    }

    return assignedObjects;
}

// Получить доступные категории для прораба
function getAvailableCategoriesForForeman() {
    if (!currentUser || currentUser.role !== ROLES.FOREMAN) return null;

    const assignments = getUserAssignedCategories();
    return Object.keys(assignments);
}

// Проверить, имеет ли прораб доступ к категории
function canAccessCategory(categoryId) {
    if (!currentUser) return false;
    if (currentUser.role === ROLES.CREATOR) return true;
    if (currentUser.role === ROLES.CLIENT) return true; // Клиент видит всё
    if (currentUser.role === ROLES.FOREMAN) {
        const assignments = getUserAssignedCategories();
        return assignments && assignments.hasOwnProperty(categoryId);
    }
    return false;
}

// Обновить отображение бейджа с назначенными категориями
function updateAssignedCategoriesBadge() {
    const badge = document.getElementById('assignedCategoriesBadge');
    if (!badge) return;

    if (currentUser && currentUser.role === ROLES.FOREMAN) {
        const categories = getAvailableCategoriesForForeman();
        if (categories && categories.length > 0) {
            const categoryNames = categories.map(cat => {
                const catObj = (projects[currentProject]?.categories || []).find(c => c.id === cat);
                return catObj ? catObj.name : cat;
            });
            badge.textContent = `📋 ${categoryNames.join(' · ')}`;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } else {
        badge.style.display = 'none';
    }
}

// ========== ФУНКЦИИ ВХОДА ==========
function login() {
    const password = document.getElementById('loginPassword').value;
    let foundUser = null;
    for (let [username, data] of Object.entries(users)) {
        if (data.password === password) {
            foundUser = {username, ...data};
            break;
        }
    }

    if (foundUser) {
        currentUser = foundUser;
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('userNameDisplay').textContent = foundUser.name;
        document.getElementById('roleBadge').textContent =
            foundUser.role === ROLES.CREATOR ? 'Создатель' :
                foundUser.role === ROLES.FOREMAN ? 'Прораб' : 'Заказчик';
        document.getElementById('roleBadge').className = 'role-badge ' +
            (foundUser.role === ROLES.CREATOR ? 'role-creator' :
                foundUser.role === ROLES.FOREMAN ? 'role-foreman' : 'role-client');

        applyPermissions();
        loadSharedData();
    } else {
        document.getElementById('loginError').textContent = 'Неверный пароль';
    }
}

function logout() {
    currentUser = null;
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

function applyPermissions() {
    if (!currentUser) return;

    const isCreator = currentUser.role === ROLES.CREATOR;
    const isForeman = currentUser.role === ROLES.FOREMAN;
    const isClient = currentUser.role === ROLES.CLIENT;

    // Показываем кнопки управления только создателю
    document.getElementById('managementButtonsContainer').style.display = isCreator ? 'flex' : 'none';

    // Обновляем бейдж с назначенными категориями
    updateAssignedCategoriesBadge();

    // Блокируем кнопки для заказчика
    if (isClient) {
        document.querySelectorAll('button:not(.logout-btn):not(.sync-button):not(.btn-album):not(.btn-calendar)').forEach(btn => btn.disabled = true);
        document.getElementById('editableTitle').setAttribute('contenteditable', 'false');
    }

    // Для прораба - дополнительные настройки
    if (isForeman) {
        // Блокируем кнопки, которые не относятся к его работе
        document.getElementById('addChartBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('applyAllBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('progressCompareBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('materialsBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('workEditorBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('contractEditorBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('projectEditorBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('categoryEditorBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('resetProgressBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('exportBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('importBtn')?.setAttribute('disabled', 'disabled');
        document.getElementById('newProjectBtn')?.setAttribute('disabled', 'disabled');
    }

    renderCategoryTabs();
    renderHouseTabs();
    renderMaterialsByHouse();
    renderMaterialsProfessionalTable();
}

function canEditObject(objectId) {
    if (!currentUser) return false;
    if (currentUser.role === ROLES.CREATOR) return true;
    if (currentUser.role === ROLES.CLIENT) return false;
    if (currentUser.role === ROLES.FOREMAN) {
        const assignedObjects = getUserAssignedObjects();
        return assignedObjects.includes(objectId);
    }
    return false;
}

function canViewObject(objectId) {
    if (!currentUser) return false;
    if (currentUser.role === ROLES.CREATOR) return true;
    if (currentUser.role === ROLES.CLIENT) return true;
    if (currentUser.role === ROLES.FOREMAN) {
        // Прораб видит только свои объекты
        const assignedObjects = getUserAssignedObjects();
        return assignedObjects.includes(objectId);
    }
    return false;
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.classList.toggle('visible');
    if (panel.classList.contains('visible')) {
        if (panelId === 'usersPanel') renderUsersGrid();
        if (panelId === 'foremanPanel') renderForemanAssignmentGrid();
        if (panelId === 'materialsPanel') renderMaterialsByHouse();
    }
}

function renderUsersGrid() {
    const grid = document.getElementById('usersGrid');
    let html = '';
    for (let [username, data] of Object.entries(users)) {
        const isCreator = data.role === ROLES.CREATOR;
        html += `<div class="user-card">
                    <h4>${isCreator ? '👑 Создатель' : (data.role === ROLES.FOREMAN ? '👷 Прораб' : '👤 Заказчик')}</h4>
                    <div class="user-field">
                        <label>Имя</label>
                        <input type="text" value="${data.name}" data-username="${username}" class="user-name" id="user_name_${username}">
                    </div>
                    <div class="user-field">
                        <label>Пароль</label>
                        <input type="text" value="${data.password}" data-username="${username}" class="user-password" id="user_pass_${username}">
                    </div>
                    ${!isCreator ? `
                    <div class="user-field">
                        <label>Роль</label>
                        <select data-username="${username}" class="user-role" id="user_role_${username}">
                            <option value="${ROLES.FOREMAN}" ${data.role === ROLES.FOREMAN ? 'selected' : ''}>Прораб</option>
                            <option value="${ROLES.CLIENT}" ${data.role === ROLES.CLIENT ? 'selected' : ''}>Заказчик</option>
                        </select>
                    </div>
                    ` : ''}
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn-sm btn-success" onclick="updateUser('${username}')"><i class="fas fa-save"></i> Сохранить</button>
                        ${!isCreator ? `<button class="btn-sm btn-danger" onclick="deleteUser('${username}')"><i class="fas fa-trash"></i> Удалить</button>` : ''}
                    </div>
                </div>`;
    }
    grid.innerHTML = html;
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ ПОЛЬЗОВАТЕЛЯ
function updateUser(username) {
    const nameInput = document.getElementById(`user_name_${username}`);
    const passInput = document.getElementById(`user_pass_${username}`);
    const roleSelect = document.getElementById(`user_role_${username}`);

    if (users[username]) {
        // Сохраняем старый пароль для сравнения
        const oldPassword = users[username].password;

        // Обновляем данные
        if (nameInput) users[username].name = nameInput.value;
        if (passInput) users[username].password = passInput.value;
        if (roleSelect) users[username].role = roleSelect.value;

        // Принудительно сохраняем в localStorage
        const saved = saveToLocalStorage();

        // Показываем уведомление о смене пароля
        if (oldPassword !== users[username].password) {
            alert(`✅ Пароль для ${users[username].name} изменен с "${oldPassword}" на "${users[username].password}"`);
        } else {
            alert(`✅ Данные пользователя ${users[username].name} сохранены`);
        }

        // Обновляем отображение
        renderUsersGrid();

        // Сохраняем в облако
        saveSharedData();
    }
}

function addNewUser() {
    const username = 'user_' + Date.now();
    users[username] = {password: '123', name: 'Новый пользователь', role: ROLES.FOREMAN};
    renderUsersGrid();
}

function deleteUser(username) {
    if (users[username]?.role === ROLES.CREATOR) {
        alert('Нельзя удалить создателя');
        return;
    }
    if (confirm('Удалить пользователя?')) {
        delete users[username];
        saveSharedData();
        renderUsersGrid();
    }
}

function renderForemanAssignmentGrid() {
    const grid = document.getElementById('foremanAssignmentGrid');
    if (!grid) return;
    let html = '';
    for (let [projectId, project] of Object.entries(projects)) {
        const foremen = Object.entries(users).filter(([_, data]) => data.role === ROLES.FOREMAN);
        if (foremen.length === 0) {
            html += `<div class="foreman-project-card"><h4>${project.name}</h4><p>Нет прорабов. Добавьте в разделе "Управление пользователями".</p></div>`;
            continue;
        }
        const projectAssignments = project.foremanAssignments || {};
        html += `<div class="foreman-project-card"><h4><i class="fas fa-building"></i> ${project.name}</h4>`;
        foremen.forEach(([username, data]) => {
            const foremanAssignments = projectAssignments[username] || {};
            html += `<div class="foreman-row"><div class="foreman-name">${data.name}</div>`;
            (project.categories || []).forEach(cat => {
                if (cat.id === 'contracts') return;
                const assignedObjects = foremanAssignments[cat.id] || [];
                const isAllAssigned = assignedObjects.includes('all');
                html += `<div class="category-checkboxes"><div class="category-header">
                            <input type="checkbox" class="assign-all" data-project="${projectId}" data-foreman="${username}" data-category="${cat.id}" ${isAllAssigned ? 'checked' : ''} onchange="toggleAssignAll(this)">
                            <strong>${cat.name}</strong></div>`;
                if (!isAllAssigned) {
                    html += `<div class="object-list">`;
                    (allObjects[cat.id] || []).forEach(obj => {
                        const isAssigned = assignedObjects.includes(obj.id);
                        html += `<div class="object-item"><input type="checkbox" class="object-checkbox" data-project="${projectId}" data-foreman="${username}" data-category="${cat.id}" data-object="${obj.id}" ${isAssigned ? 'checked' : ''} onchange="toggleObjectCheck(this)"><span>${obj.name}</span></div>`;
                    });
                    html += `</div>`;
                }
                html += `</div>`;
            });
            html += `</div>`;
        });
        html += `</div>`;
    }
    grid.innerHTML = html;
}

function toggleAssignAll(checkbox) {
    const row = checkbox.closest('.category-checkboxes');
    const objectCheckboxes = row.querySelectorAll('.object-checkbox');
    if (checkbox.checked) {
        objectCheckboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = true;
        });
    } else {
        objectCheckboxes.forEach(cb => cb.disabled = false);
    }
}

function toggleObjectCheck(checkbox) {
    const row = checkbox.closest('.category-checkboxes');
    const allCheckbox = row.querySelector('.assign-all');
    if (allCheckbox && allCheckbox.checked) allCheckbox.checked = false;
}

function saveForemanAssignments() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    for (let projectId in projects) projects[projectId].foremanAssignments = {};
    document.querySelectorAll('.assign-all:checked').forEach(checkbox => {
        const p = checkbox.dataset.project, f = checkbox.dataset.foreman, c = checkbox.dataset.category;
        if (!projects[p].foremanAssignments[f]) projects[p].foremanAssignments[f] = {};
        projects[p].foremanAssignments[f][c] = ['all'];
    });
    document.querySelectorAll('.object-checkbox:checked').forEach(checkbox => {
        const p = checkbox.dataset.project, f = checkbox.dataset.foreman, c = checkbox.dataset.category,
            o = checkbox.dataset.object;
        if (!projects[p].foremanAssignments[f]) projects[p].foremanAssignments[f] = {};
        if (!projects[p].foremanAssignments[f][c]) projects[p].foremanAssignments[f][c] = [];
        projects[p].foremanAssignments[f][c].push(o);
    });
    saveSharedData();
    alert('Назначения сохранены');
    togglePanel('foremanPanel');
}

function renderMaterialsByHouse() {
    const grid = document.getElementById('materialsByHouseGrid');
    if (!grid) return;
    let html = '';
    for (let house = 1; house <= 4; house++) {
        html += `<div class="house-material-card"><h4><i class="fas fa-home"></i> Дом ${house}</h4>`;
        (projects[currentProject]?.categories || []).forEach(cat => {
            if (cat.id === 'contracts') return;
            const key = `house${house}_${cat.id}`;
            const status = materialsByHouse[key] || 'none';
            const statusClass = status === 'yes' ? 'badge-yes' : (status === 'partial' ? 'badge-partial' : 'badge-no');
            const statusText = status === 'yes' ? '✅ Есть' : (status === 'partial' ? '🟡 Частично' : '❌ Нет');
            html += `<div class="material-row"><span>${cat.name}</span><span class="material-badge ${statusClass}">${statusText}</span></div>`;
        });
        html += `</div>`;
    }
    grid.innerHTML = html;
}

function openMaterialsEditor() {
    const container = document.getElementById('materialsEditorContent');
    let html = '';
    for (let house = 1; house <= 4; house++) {
        html += `<h3 style="margin-top:20px;">Дом ${house}</h3>`;
        (projects[currentProject]?.categories || []).forEach(cat => {
            if (cat.id === 'contracts') return;
            const key = `house${house}_${cat.id}`;
            const status = materialsByHouse[key] || 'none';
            html += `<div style="display:flex; align-items:center; gap:15px; margin:10px 0; padding:10px; background:var(--input-bg); border-radius:8px;">
                        <span style="width:100px;">${cat.name}</span>
                        <select data-house="${house}" data-category="${cat.id}" class="material-select" style="flex:1; padding:8px; background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px;">
                            <option value="none" ${status === 'none' ? 'selected' : ''}>❌ Нет</option>
                            <option value="partial" ${status === 'partial' ? 'selected' : ''}>🟡 Частично</option>
                            <option value="yes" ${status === 'yes' ? 'selected' : ''}>✅ Есть</option>
                        </select>
                    </div>`;
        });
    }
    container.innerHTML = html;
    document.getElementById('materialsEditorModal').style.display = 'flex';
}

function saveMaterialsByHouse() {
    document.querySelectorAll('.material-select').forEach(select => {
        const house = select.dataset.house, category = select.dataset.category, status = select.value;
        materialsByHouse[`house${house}_${category}`] = status;
    });
    projects[currentProject].materialsByHouse = materialsByHouse;
    saveSharedData();
    renderMaterialsByHouse();
    renderMaterialsProfessionalTable();
    closeModal('materialsEditorModal');
    renderAllCharts();
}

function renderMaterialsProfessionalTable() {
    const now = new Date();
    document.getElementById('materialsDateText').textContent = `Актуально на ${now.toLocaleDateString()} ${now.toLocaleTimeString().slice(0, 5)}`;

    const categories = ['apartments', 'roof', 'facade', 'windows', 'water'];
    const categoryNames = {
        'apartments': 'Квартиры',
        'roof': 'Кровля',
        'facade': 'Фасад',
        'windows': 'Окна',
        'water': 'ГВС/ХВС'
    };

    let totalYes = 0, totalPartial = 0, totalNo = 0;
    const houseData = [];

    for (let house = 1; house <= 4; house++) {
        const houseStats = {house, yes: 0, partial: 0, no: 0, categories: {}};
        categories.forEach(cat => {
            const key = `house${house}_${cat}`;
            const status = materialsByHouse[key] || 'none';
            houseStats.categories[cat] = status;
            if (status === 'yes') {
                totalYes++;
                houseStats.yes++;
            } else if (status === 'partial') {
                totalPartial++;
                houseStats.partial++;
            } else {
                totalNo++;
                houseStats.no++;
            }
        });
        houseData.push(houseStats);
    }

    document.getElementById('materialsStats').innerHTML = `
                <div class="stat-card"><div class="stat-value" style="color:#27ae60;">${totalYes}</div><div class="stat-label">В наличии</div></div>
                <div class="stat-card"><div class="stat-value" style="color:#f39c12;">${totalPartial}</div><div class="stat-label">Частично</div></div>
                <div class="stat-card"><div class="stat-value" style="color:#c0392b;">${totalNo}</div><div class="stat-label">Требуют завоза</div></div>
                <div class="stat-card"><div class="stat-value" style="color:#3498db;">20</div><div class="stat-label">Всего категорий</div></div>
            `;

    let tableHtml = '';
    houseData.forEach(h => {
        tableHtml += `<tr><td><div class="house-cell"><div class="house-icon"><i class="fas fa-building"></i></div>Дом ${h.house}</div></td>`;
        tableHtml += `<td>${getMaterialCell(h.categories.apartments)}</td>`;
        tableHtml += `<td>${getMaterialCell(h.categories.roof)}</td>`;
        tableHtml += `<td>${getMaterialCell(h.categories.facade)}</td>`;
        tableHtml += `<td>${getMaterialCell(h.categories.windows)}</td>`;
        tableHtml += `<td>${getMaterialCell(h.categories.water)}</td>`;
        tableHtml += `<td><div class="house-stats">${h.yes ? `<span class="stat-pill yes" data-tooltip="${getTooltipText(h.categories, 'yes')}"><i class="fas fa-check-circle"></i> ${h.yes}</span>` : ''}${h.partial ? `<span class="stat-pill partial" data-tooltip="${getTooltipText(h.categories, 'partial')}"><i class="fas fa-adjust"></i> ${h.partial}</span>` : ''}${h.no ? `<span class="stat-pill no" data-tooltip="${getTooltipText(h.categories, 'no')}"><i class="fas fa-times-circle"></i> ${h.no}</span>` : ''}</div></td></tr>`;
    });
    document.getElementById('materialsTableBody').innerHTML = tableHtml;

    document.getElementById('materialsAnalytics').innerHTML = `
                <div class="analytics-card"><h4>Распределение</h4>
                    <div style="display:flex; justify-content:space-between;"><span>✅ В наличии</span><span>${totalYes}</span></div>
                    <div class="progress-bar"><div class="progress-fill green" style="width:${totalYes / 20 * 100}%"></div></div>
                    <div style="display:flex; justify-content:space-between;"><span>🟡 Частично</span><span>${totalPartial}</span></div>
                    <div class="progress-bar"><div class="progress-fill yellow" style="width:${totalPartial / 20 * 100}%"></div></div>
                    <div style="display:flex; justify-content:space-between;"><span>❌ Отсутствуют</span><span>${totalNo}</span></div>
                    <div class="progress-bar"><div class="progress-fill red" style="width:${totalNo / 20 * 100}%"></div></div>
                </div>
                <div class="analytics-card"><h4>Приоритетные объекты</h4>
                    ${houseData.filter(h => h.no > 0).sort((a, b) => b.no - a.no).map(h => `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>Дом ${h.house}</span><span style="color:#c0392b;">${h.no} категории</span></div>`).join('')}
                </div>
                <div class="analytics-card"><h4>По категориям</h4>
                    ${categories.map(cat => {
        const yes = houseData.filter(h => h.categories[cat] === 'yes').length;
        const partial = houseData.filter(h => h.categories[cat] === 'partial').length;
        const no = houseData.filter(h => h.categories[cat] === 'no').length;
        return `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>${categoryNames[cat]}</span><span>${yes ? `<span style="color:#27ae60;">${yes}✅</span>` : ''}${partial ? `<span style="color:#f39c12;"> ${partial}🟡</span>` : ''}${no ? `<span style="color:#c0392b;"> ${no}❌</span>` : ''}</span></div>`;
    }).join('')}
                </div>
            `;
}

function getMaterialCell(status) {
    if (status === 'yes') return `<div class="material-status"><div class="status-badge yes"><i class="fas fa-check"></i></div><span>Есть</span></div>`;
    if (status === 'partial') return `<div class="material-status"><div class="status-badge partial"><i class="fas fa-adjust"></i></div><span>Частично</span></div>`;
    return `<div class="material-status"><div class="status-badge no"><i class="fas fa-times"></i></div><span>Нет</span></div>`;
}

function getTooltipText(categories, status) {
    const names = {
        'apartments': 'Квартиры',
        'roof': 'Кровля',
        'facade': 'Фасад',
        'windows': 'Окна',
        'water': 'ГВС/ХВС'
    };
    const items = [];
    for (let [cat, s] of Object.entries(categories)) if (s === status) items.push(names[cat]);
    return items.join(', ');
}

function initProjectCategories(project) {
    if (!project.categories) project.categories = [
        {id: 'apartments', name: 'Квартиры', color: '#3498db'},
        {id: 'roof', name: 'Кровля', color: '#e67e22'},
        {id: 'facade', name: 'Фасад', color: '#2ecc71'},
        {id: 'windows', name: 'Окна', color: '#f39c12'},
        {id: 'water', name: 'ГВС/ХВС', color: '#1abc9c'},
        {id: 'contracts', name: 'Контракты', color: '#e67e22'}
    ];
    if (!project.categoryData) project.categoryData = {};
    project.categories.forEach(cat => {
        if (!project.categoryData[cat.id]) project.categoryData[cat.id] = {
            progress: {},
            required: {},
            photos: {},
            workers: {}
        };
    });
    if (!project.foremanAssignments) project.foremanAssignments = {};
    if (!project.materialsByHouse) project.materialsByHouse = {};
}

function rebuildAllObjects() {
    const houses = projects[currentProject]?.houses || {};
    const cats = projects[currentProject]?.categories || [];
    allObjects = {};
    cats.forEach(cat => {
        if (cat.id === 'contracts') {
            allObjects.contracts = Object.keys(contracts).map(id => ({
                id: `contract_${id}`,
                name: contracts[id].name,
                category: 'contracts',
                contractId: id
            }));
        } else {
            allObjects[cat.id] = [];
            if (cat.id === 'apartments') {
                for (let h = 1; h <= 4; h++) (houses[h] || []).forEach(n => allObjects[cat.id].push({
                    id: `house${h}_apt${n}`,
                    house: h,
                    number: n,
                    name: `Дом ${h}, кв. ${n}`,
                    category: cat.id
                }));
            } else {
                for (let h = 1; h <= 4; h++) allObjects[cat.id].push({
                    id: `${cat.id}_${h}`,
                    house: h,
                    name: `Дом ${h}`,
                    category: cat.id
                });
            }
        }
    });
}

function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return;

    const cats = projects[currentProject]?.categories || [];
    let html = '';

    cats.forEach(cat => {
        // Для прораба показываем только назначенные категории
        if (currentUser?.role === ROLES.FOREMAN && !canAccessCategory(cat.id)) {
            return;
        }

        const activeClass = currentCategory === cat.id ? 'active' : '';

        html += `<button class="category-tab ${activeClass}"
                    data-category="${cat.id}"
                    onclick="switchCategory('${cat.id}')"
                    style="background:${cat.color}20; border-color:${cat.color}">
                    <i class="fas fa-tag"></i> ${cat.name}
                </button>`;
    });

    // Если нет доступных категорий, показываем сообщение
    if (html === '') {
        html = '<div style="padding: 10px; color: var(--text-secondary);">Нет доступных категорий</div>';
    }

    container.innerHTML = html;
}

function renderHouseTabs() {
    const container = document.getElementById('houseTabsContainer');
    if (!container || currentCategory === 'contracts') {
        container.innerHTML = '';
        return;
    }

    // Для прораба проверяем доступ к текущей категории
    if (currentUser?.role === ROLES.FOREMAN && !canAccessCategory(currentCategory)) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    for (let h = 1; h <= 4; h++) {
        const houses = projects[currentProject]?.houses || {};
        if (houses[h] && houses[h].length > 0) {
            // Проверяем, есть ли в этом доме объекты, доступные прорабу
            if (currentUser?.role === ROLES.FOREMAN) {
                const objectsInHouse = allObjects[currentCategory]?.filter(obj => obj.house === h) || [];
                const accessibleObjects = objectsInHouse.filter(obj => canViewObject(obj.id));
                if (accessibleObjects.length === 0) continue;
            }

            const photoCount = getHousePhotoCount(currentCategory, h);
            html += `<button class="house-tab ${selectedHouse === h ? 'active' : ''}" onclick="selectHouse(${h})">
                        Дом ${h} <span class="photo-count">${photoCount}</span>
                    </button>`;
        }
    }

    // Добавляем кнопку "Все дома" только если есть хотя бы один дом
    if (html) {
        html += `<button class="house-tab ${selectedHouse === 0 ? 'active' : ''}" onclick="selectHouse(0)">Все дома</button>`;
    }

    // Кнопка редактора только для создателя
    if (currentUser?.role === ROLES.CREATOR) {
        html += `<button class="house-tab" onclick="openHouseEditorModal()" style="background:#8e44ad;"><i class="fas fa-edit"></i> Редактор</button>`;
    }

    container.innerHTML = html || '<div style="padding: 10px; color: var(--text-secondary);">Нет доступных домов</div>';
}

function getHousePhotoCount(category, houseNum) {
    if (category === 'apartments') {
        const apts = allObjects.apartments.filter(a => a.house === houseNum);
        // Фильтруем для прораба
        let filteredApts = apts;
        if (currentUser?.role === ROLES.FOREMAN) {
            filteredApts = apts.filter(apt => canViewObject(apt.id));
        }
        return filteredApts.reduce((sum, apt) => sum + (categoryData.apartments?.photos[apt.id] || []).length, 0);
    } else {
        const objId = `${category}_${houseNum}`;
        if (currentUser?.role === ROLES.FOREMAN && !canViewObject(objId)) {
            return 0;
        }
        return (categoryData[category]?.photos[objId] || []).length;
    }
}

function renderObjectSelectionArea() {
    const area = document.getElementById('objectSelectionArea');
    if (!area) return;

    if (currentCategory === 'contracts') {
        area.innerHTML = `<div class="selected-object-info"><span>Управление контрактами</span>${currentUser?.role === ROLES.CREATOR ? `<button class="btn-sm btn-primary" onclick="openContractEditorModal()" style="background:var(--contract-color);"><i class="fas fa-edit"></i> Редактор</button>` : ''}</div>`;
        return;
    }

    // Проверка доступа к категории для прораба
    if (currentUser?.role === ROLES.FOREMAN && !canAccessCategory(currentCategory)) {
        area.innerHTML = '<div class="selected-object-info"><span>Нет доступа к этой категории</span></div>';
        return;
    }

    if (currentCategory === 'apartments') renderApartmentsGrid();
    else if (selectedObject) {
        const photoCount = (categoryData[currentCategory]?.photos[selectedObject.id] || []).length;
        const canEdit = canEditObject(selectedObject.id);
        area.innerHTML = `<div class="selected-object-info">
                    <span>Выбран: <strong>${selectedObject.name}</strong> (фото: ${photoCount})</span>
                    ${canEdit ? `<button class="btn-sm btn-primary" onclick="openPhotoModal()"><i class="fas fa-camera"></i> Фото</button>` : ''}
                </div>`;
    } else area.innerHTML = `<div class="selected-object-info"><span>Выберите дом</span></div>`;
}

function renderApartmentsGrid() {
    const area = document.getElementById('objectSelectionArea');
    let list = allObjects.apartments.filter(a => selectedHouse === 0 || a.house === selectedHouse);

    // Фильтруем для прораба
    if (currentUser?.role === ROLES.FOREMAN) {
        list = list.filter(obj => canViewObject(obj.id));
    }

    if (!list.length) {
        area.innerHTML = '<p style="text-align:center;padding:20px;">Нет доступных квартир</p>';
        return;
    }

    let html = '<div class="apartments-grid">';
    list.forEach(apt => {
        const progress = calculateObjectProgress(apt.id);
        const fully = isObjectFullyCompleted(apt.id);
        const stage = getStageFromProgress(progress, fully);
        const photos = (categoryData.apartments?.photos[apt.id] || []).length;
        const canEdit = canEditObject(apt.id);

        html += `<button class="apartment-btn ${selectedObject?.id === apt.id ? 'active' : ''} ${fully ? 'completed' : ''}"
                    onclick='selectObject(${JSON.stringify(apt).replace(/'/g, "&apos;")})'>
                    <span class="apt-number">${apt.number}</span>
                    <div class="stage-badge" style="background:${stage.color};">${stage.short}</div>
                    ${canEdit ? `<div class="apt-photo-icon" onclick="event.stopPropagation(); openPhotoModalForObject('${apt.id}','${apt.name}')"><i class="fas fa-camera"></i> ${photos}</div>` : ''}
                </button>`;
    });
    html += '</div>';
    area.innerHTML = html;
}

function selectObject(obj) {
    if (!canViewObject(obj.id)) {
        alert('У вас нет доступа к этому объекту');
        return;
    }

    selectedObject = obj;
    selectedObjectId = obj.id;
    selectedHouse = obj.house || 1;
    renderHouseTabs();
    renderObjectSelectionArea();
    document.getElementById('selectedObjectTitle').innerText = obj.name;
    updateObjectQuickStats();
    renderTable();
    updatePhotoCounter((categoryData[currentCategory]?.photos[obj.id] || []).length);

    const canEdit = canEditObject(obj.id);
    document.getElementById('objectWorkersBlock').style.display = canEdit ? 'flex' : 'none';
    if (canEdit) {
        document.getElementById('objectWorkersInput').value = categoryData[currentCategory]?.workers[obj.id] || 0;
    }
}

function selectHouse(houseNum) {
    selectedHouse = houseNum;
    renderHouseTabs();
    renderObjectSelectionArea();

    // Находим первый доступный объект в этом доме
    const availableObjects = allObjects[currentCategory]?.filter(obj =>
        obj.house === houseNum && canViewObject(obj.id)
    );

    if (availableObjects && availableObjects.length > 0) {
        selectObject(availableObjects[0]);
    } else {
        selectedObject = null;
        document.getElementById('selectedObjectTitle').innerText = 'Нет доступных объектов';
        document.getElementById('objectQuickStats').innerHTML = '';
        document.getElementById('objectWorkersBlock').style.display = 'none';
        renderTable();
        updatePhotoCounter(0);
    }
}

function switchCategory(categoryId) {
    // Проверка доступа для прораба
    if (currentUser?.role === ROLES.FOREMAN && !canAccessCategory(categoryId)) {
        alert('У вас нет доступа к этой категории');
        return;
    }

    currentCategory = categoryId;
    renderCategoryTabs();
    selectedObject = null;
    renderHouseTabs();
    renderObjectSelectionArea();

    if (categoryId === 'contracts') {
        document.getElementById('selectedObjectTitle').innerText = 'Контракты';
        document.getElementById('objectQuickStats').innerHTML = '';
        document.getElementById('objectWorkersBlock').style.display = 'none';
        renderTable();
        updatePhotoCounter(0);
        return;
    }

    // Выбираем первый доступный объект
    const availableObjects = allObjects[categoryId]?.filter(obj => canViewObject(obj.id)) || [];
    if (availableObjects.length > 0) {
        selectObject(availableObjects[0]);
    } else {
        document.getElementById('selectedObjectTitle').innerText = 'Нет доступных объектов';
        document.getElementById('objectQuickStats').innerHTML = '';
        document.getElementById('objectWorkersBlock').style.display = 'none';
        renderTable();
        updatePhotoCounter(0);
    }
}

function getWorksForCategory(catId) {
    if (catId === 'contracts') {
        let all = [];
        (projects[currentProject]?.categories || []).forEach(c => {
            if (c.id !== 'contracts') (workDefinitions[c.id] || []).forEach(w => all.push({
                ...w,
                sourceCategory: c.id
            }));
        });
        return all;
    }
    return workDefinitions[catId] || [];
}

function getProgressData(cat, objId) {
    return categoryData[cat]?.progress[objId] || {};
}

function getRequiredData(cat, objId) {
    return categoryData[cat]?.required[objId] || {};
}

function calculateObjectProgress(objId) {
    for (let cat of projects[currentProject]?.categories || []) {
        if (cat.id === 'contracts') continue;
        if (!allObjects[cat.id]?.some(o => o.id === objId)) continue;
        const works = getWorksForCategory(cat.id).filter(w => getRequiredData(cat.id, objId)[w.id] !== false);
        if (!works.length) return 100;
        const prog = getProgressData(cat.id, objId);
        let total = 0, cnt = 0;
        works.forEach(w => {
            if (prog[w.id] !== undefined) {
                total += prog[w.id];
                cnt++;
            }
        });
        return cnt ? Math.round(total / cnt) : 0;
    }
    return 0;
}

function isObjectFullyCompleted(objId) {
    for (let cat of projects[currentProject]?.categories || []) {
        if (cat.id === 'contracts') continue;
        if (!allObjects[cat.id]?.some(o => o.id === objId)) continue;
        const works = getWorksForCategory(cat.id).filter(w => getRequiredData(cat.id, objId)[w.id] !== false);
        if (!works.length) return true;
        const prog = getProgressData(cat.id, objId);
        return works.every(w => (prog[w.id] || 0) === 100);
    }
    return false;
}

function getStageFromProgress(p, fully) {
    if (fully) return {short: '100%', color: '#27ae60'};
    if (p >= 75) return {short: '75%', color: '#2ecc71'};
    if (p >= 50) return {short: '50%', color: '#e67e22'};
    if (p >= 25) return {short: '25%', color: '#f39c12'};
    if (p >= 5) return {short: '5%', color: '#3498db'};
    return {short: '0%', color: '#95a5a6'};
}

function updateObjectQuickStats() {
    if (!selectedObject) return;
    const objId = selectedObject.id, cat = selectedObject.category;
    const works = getWorksForCategory(cat).filter(w => getRequiredData(cat, objId)[w.id] !== false);
    const prog = getProgressData(cat, objId);
    const completed = works.filter(w => (prog[w.id] || 0) === 100).length;
    const inProgress = works.filter(w => {
        let p = prog[w.id] || 0;
        return p > 0 && p < 100;
    }).length;
    const notStarted = works.length - completed - inProgress;
    const avg = calculateObjectProgress(objId);
    const stage = getStageFromProgress(avg, isObjectFullyCompleted(objId));
    document.getElementById('objectQuickStats').innerHTML = `
                <div class="quick-stat"><div class="number" style="color:${stage.color};">${stage.short}</div><div class="label">Прогресс</div></div>
                <div class="quick-stat"><div class="number">${completed}</div><div class="label">Завершено</div></div>
                <div class="quick-stat"><div class="number" style="color:var(--warning);">${inProgress}</div><div class="label">В работе</div></div>
                <div class="quick-stat"><div class="number" style="color:var(--text-secondary);">${notStarted}</div><div class="label">Не начато</div></div>`;
}

async function saveObjectWorkers() {
    if (!selectedObject || !canEditObject(selectedObject.id)) return;
    const val = parseInt(document.getElementById('objectWorkersInput').value) || 0;
    if (!categoryData[selectedObject.category].workers) categoryData[selectedObject.category].workers = {};
    categoryData[selectedObject.category].workers[selectedObject.id] = val;
    await saveSharedData();
    renderAllCharts();
}

function renderTable() {
    const tbody = document.querySelector('#workTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let works, cat, objId;
    if (currentCategory === 'contracts') {
        cat = 'contracts';
        objId = 'all';
        works = getWorksForCategory('contracts');
    } else {
        if (!selectedObject) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Выберите объект</td></tr>';
            return;
        }
        cat = selectedObject.category;
        objId = selectedObject.id;
        works = getWorksForCategory(cat);
    }

    const prog = cat !== 'contracts' ? getProgressData(cat, objId) : {};
    const required = cat !== 'contracts' ? getRequiredData(cat, objId) : {};
    const canEdit = selectedObject ? canEditObject(selectedObject.id) : (currentUser?.role === ROLES.CREATOR);

    const contractOptions = ['<option value="">Без контракта</option>'];
    Object.keys(contracts).forEach(id => contractOptions.push(`<option value="${id}">${contracts[id].name}</option>`));

    works.forEach(w => {
        const srcCat = w.sourceCategory || cat;
        const srcObj = objId === 'all' ? null : objId;
        const isRequired = cat !== 'contracts' ? (required[w.id] !== false) : true;
        const wp = (cat !== 'contracts' && prog[w.id]) ? prog[w.id] : 0;
        const row = document.createElement('tr');
        if (!isRequired) row.classList.add('disabled-work');

        let selectHtml = `<select class="progress-select" onchange="updateWorkProgress(${w.id}, this.value)" ${!isRequired || !canEdit ? 'disabled' : ''}>`;
        [0, 5, 25, 50, 75, 100].forEach(v => selectHtml += `<option value="${v}" ${wp == v ? 'selected' : ''}>${v}%</option>`);
        selectHtml += '</select>';

        const groupId = groupContracts[srcCat];
        let current = groupId ? groupId : (srcObj ? getWorkContract(srcCat, srcObj, w.id) : null);

        let contractSelect = `<select class="contract-select" onchange="setWorkContract('${srcCat}', '${srcObj || ''}', ${w.id}, this.value)" ${groupId || !canEdit ? 'disabled' : ''}>`;
        contractSelect += contractOptions.join('');
        if (current) contractSelect = contractSelect.replace(`value="${current}"`, `value="${current}" selected`);
        contractSelect += groupId ? ' (групповой)' : '';
        contractSelect += '</select>';

        row.innerHTML = `<td>${w.id}</td><td><strong>${w.name}</strong></td>
                    <td><div class="apartment-progress">${selectHtml}<div class="apartment-progress-bar"><div class="apartment-progress-fill" style="width:${wp}%"></div></div><div class="percentage-badge">${wp}%</div></div></td>
                    <td><div class="not-required-checkbox"><input type="checkbox" ${!isRequired ? 'checked' : ''} onchange="toggleWorkRequired(${w.id}, this.checked)" ${!canEdit ? 'disabled' : ''}><span>не треб.</span></div></td>
                    <td>${contractSelect}</td>
                    <td>${canEdit ? `<button onclick="applyToAllSimilarWorks(${w.id}, ${wp})" style="padding:5px 10px;" ${!isRequired ? 'disabled' : ''}><i class="fas fa-copy"></i></button>` : ''}</td>`;
        tbody.appendChild(row);
    });
}

async function updateWorkProgress(workId, val) {
    if (!selectedObject || !canEditObject(selectedObject.id)) return;
    const cat = selectedObject.category, objId = selectedObject.id;
    if (!categoryData[cat].progress[objId]) categoryData[cat].progress[objId] = {};
    categoryData[cat].progress[objId][workId] = parseInt(val);
    await saveSharedData();
    updateObjectQuickStats();
    renderTable();
    renderAllCharts();
}

async function toggleWorkRequired(workId, checked) {
    if (!selectedObject || !canEditObject(selectedObject.id)) return;
    const cat = selectedObject.category, objId = selectedObject.id;
    if (!categoryData[cat].required[objId]) categoryData[cat].required[objId] = {};
    categoryData[cat].required[objId][workId] = !checked;
    await saveSharedData();
    updateObjectQuickStats();
    renderTable();
    renderAllCharts();
}

function getWorkContract(cat, objId, workId) {
    if (groupContracts[cat]) return groupContracts[cat];
    return workContracts[cat]?.[objId]?.[workId] || null;
}

async function setWorkContract(cat, objId, workId, contractId) {
    if (!canEditObject(selectedObject?.id)) return;
    if (!workContracts[cat]) workContracts[cat] = {};
    if (!workContracts[cat][objId]) workContracts[cat][objId] = {};
    if (contractId === '') delete workContracts[cat][objId][workId];
    else workContracts[cat][objId][workId] = contractId;
    await saveSharedData();
    renderAllCharts();
}

async function applyToAllSimilarWorks(workId, progress) {
    if (!selectedObject || !canEditObject(selectedObject.id) || !confirm('Применить ко всем доступным объектам?')) return;
    const cat = selectedObject.category;
    allObjects[cat].forEach(obj => {
        if (canEditObject(obj.id)) {
            if (!categoryData[cat].progress[obj.id]) categoryData[cat].progress[obj.id] = {};
            categoryData[cat].progress[obj.id][workId] = progress;
        }
    });
    await saveSharedData();
    alert('Применено к доступным объектам');
    if (selectedObject) {
        updateObjectQuickStats();
        renderTable();
        renderAllCharts();
    }
}

// ========== КОНТРАКТЫ ==========
function getContractSpent(id) {
    return (contracts[id]?.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
}

function getContractProgress(id) {
    let c = contracts[id];
    return c && c.amount ? Math.min(100, Math.round((getContractSpent(id) / c.amount) * 100)) : 0;
}

function getContractRemaining(id) {
    return (contracts[id]?.amount || 0) - getContractSpent(id);
}

async function addContractPayment(id, data) {
    if (!contracts[id] || currentUser?.role === ROLES.CLIENT) return false;
    if (!contracts[id].payments) contracts[id].payments = [];
    contracts[id].payments.push({
        date: data.date || new Date().toISOString().split('T')[0],
        amount: parseFloat(data.amount) || 0,
        comment: data.comment || ''
    });
    await saveSharedData();
    renderAllCharts();
    return true;
}

async function deleteContractPayment(id, idx) {
    if (!contracts[id]?.payments || currentUser?.role === ROLES.CLIENT) return false;
    contracts[id].payments.splice(idx, 1);
    await saveSharedData();
    renderAllCharts();
    return true;
}

function openPaymentsModal(id) {
    window.currentPaymentsContractId = id;
    renderPaymentsModal(id);
    document.getElementById('paymentsModal').style.display = 'flex';
}

function renderPaymentsModal(id) {
    let c = contracts[id];
    if (!c) return;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentsContractName').innerText = c.name;
    document.getElementById('paymentsContractAmount').innerText = formatCurrency(c.amount);
    let spent = getContractSpent(id);
    document.getElementById('paymentsTotalSpent').innerText = formatCurrency(spent);
    document.getElementById('paymentsRemaining').innerText = formatCurrency(c.amount - spent);
    let html = '';
    if (c.payments?.length) {
        c.payments.sort((a, b) => new Date(b.date) - new Date(a.date));
        c.payments.forEach((p, i) => {
            html += `<tr><td>${p.date}</td><td>${formatCurrency(p.amount)}</td><td>${p.comment || '-'}</td>
                            <td>${currentUser?.role !== ROLES.CLIENT ? `<button class="btn-sm btn-danger" onclick="deletePayment('${id}',${i})"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`;
        });
    } else html = '<tr><td colspan="4" style="text-align:center;">Нет платежей</td></tr>';
    document.getElementById('paymentsList').innerHTML = html;
}

async function addPayment() {
    if (currentUser?.role === ROLES.CLIENT) return;
    let id = window.currentPaymentsContractId;
    await addContractPayment(id, {
        date: document.getElementById('paymentDate').value,
        amount: document.getElementById('paymentAmount').value,
        comment: document.getElementById('paymentComment').value
    });
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentComment').value = '';
    renderPaymentsModal(id);
    renderAllCharts();
}

async function deletePayment(id, idx) {
    if (currentUser?.role === ROLES.CLIENT) return;
    if (!confirm('Удалить платеж?')) return;
    await deleteContractPayment(id, idx);
    renderPaymentsModal(id);
    renderAllCharts();
}

function openContractEditorModal() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    const catSelect = document.getElementById('groupContractCategory');
    const cats = (projects[currentProject]?.categories || []).filter(c => c.id !== 'contracts');
    catSelect.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    renderContractsList();
    updateGroupContractSelect();
    document.getElementById('contractEditorModal').style.display = 'flex';
}

function renderContractsList() {
    let html = '';
    Object.keys(contracts).forEach(id => {
        let c = contracts[id];
        let spent = getContractSpent(id), prog = getContractProgress(id);
        html += `<div class="contract-item">
                    <input type="text" value="${c.name}" data-id="${id}" data-field="name" id="contract_name_${id}" ${currentUser?.role !== ROLES.CREATOR ? 'disabled' : ''}>
                    <input type="number" value="${c.amount}" data-id="${id}" data-field="amount" id="contract_amount_${id}" ${currentUser?.role !== ROLES.CREATOR ? 'disabled' : ''}>
                    <span>Освоено: ${prog}% (${formatCurrency(spent)})</span>
                    <div class="contract-actions">
                        <button class="btn-sm btn-payment" onclick="openPaymentsModal('${id}')"><i class="fas fa-credit-card"></i></button>
                        ${currentUser?.role === ROLES.CREATOR ? `<button class="btn-sm btn-danger" onclick="deleteContract('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>`;
    });
    document.getElementById('contractsList').innerHTML = html;

    if (currentUser?.role === ROLES.CREATOR) {
        document.querySelectorAll('.contract-item input').forEach(inp => {
            inp.addEventListener('change', function () {
                let id = this.dataset.id, field = this.dataset.field,
                    val = field === 'amount' ? parseFloat(this.value) || 0 : this.value;
                if (contracts[id]) {
                    contracts[id][field] = val;
                    saveSharedData();
                }
            });
        });
    }
}

function addNewContract() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let id = 'contract_' + Date.now();
    contracts[id] = {id, name: 'Новый контракт', amount: 0, payments: []};
    renderContractsList();
    updateGroupContractSelect();
}

function deleteContract(id) {
    if (currentUser?.role !== ROLES.CREATOR) return;
    if (!confirm('Удалить контракт?')) return;
    delete contracts[id];
    Object.keys(groupContracts).forEach(cat => {
        if (groupContracts[cat] === id) delete groupContracts[cat];
    });
    renderContractsList();
    updateGroupContractSelect();
    renderAllCharts();
    saveSharedData();
}

function updateGroupContractSelect() {
    let sel = document.getElementById('groupContractSelect');
    sel.innerHTML = '<option value="">Выберите контракт</option>' + Object.keys(contracts).map(id => `<option value="${id}">${contracts[id].name}</option>`).join('');
}

function assignGroupContract() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let cat = document.getElementById('groupContractCategory').value,
        id = document.getElementById('groupContractSelect').value;
    if (!id) {
        alert('Выберите контракт');
        return;
    }
    groupContracts[cat] = id;
    delete workContracts[cat];
    updateGroupContractSelect();
    saveSharedData();
    alert('Контракт назначен');
    if (currentCategory === cat) {
        renderTable();
        renderAllCharts();
    }
}

function removeGroupContract() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let cat = document.getElementById('groupContractCategory').value;
    delete groupContracts[cat];
    updateGroupContractSelect();
    saveSharedData();
    alert('Контракт удален');
    if (currentCategory === cat) {
        renderTable();
        renderAllCharts();
    }
}

async function saveContracts() {
    await saveSharedData();
    rebuildAllObjects();
    renderAllCharts();
    if (currentCategory === 'contracts') renderTable();
    alert('Контракты сохранены');
}

// ========== МАТЕРИАЛЫ СКЛАД ==========
function openMaterialModal() {
    if (currentUser?.role === ROLES.CLIENT) {
        alert('Нет доступа');
        return;
    }
    if (currentUser?.role === ROLES.FOREMAN) {
        alert('У вас нет доступа к складу материалов');
        return;
    }
    renderMaterialsTable();
    document.getElementById('materialModal').style.display = 'flex';
}

function renderMaterialsTable() {
    let tbody = document.getElementById('materialsTableBody');
    let totalSpan = document.getElementById('materialTotalSum');
    let html = '', total = 0;
    materials.forEach((m, i) => {
        let sum = (m.quantity || 0) * (m.price || 0);
        total += sum;
        const canEdit = currentUser?.role === ROLES.CREATOR;
        html += `<tr>
                    <td><input type="text" value="${m.name || ''}" onchange="updateMaterial(${i},'name',this.value)" ${!canEdit ? 'disabled' : ''} id="material_name_${i}"></td>
                    <td><input type="number" value="${m.quantity || 0}" onchange="updateMaterial(${i},'quantity',parseFloat(this.value)||0)" ${!canEdit ? 'disabled' : ''} id="material_qty_${i}"></td>
                    <td><input type="number" value="${m.price || 0}" onchange="updateMaterial(${i},'price',parseFloat(this.value)||0)" ${!canEdit ? 'disabled' : ''} id="material_price_${i}"></td>
                    <td>${formatCurrency(sum)}</td>
                    <td>${canEdit ? `<button class="btn-sm btn-danger" onclick="deleteMaterial(${i})"><i class="fas fa-trash"></i></button>` : ''}</td>
                </tr>`;
    });
    tbody.innerHTML = html;
    totalSpan.innerText = formatCurrency(total);
}

function updateMaterial(i, f, v) {
    if (currentUser?.role === ROLES.CREATOR && materials[i]) {
        materials[i][f] = v;
        saveMaterials();
        renderMaterialsTable();
    }
}

function deleteMaterial(i) {
    if (currentUser?.role === ROLES.CREATOR) {
        materials.splice(i, 1);
        saveMaterials();
        renderMaterialsTable();
    }
}

function saveMaterials() {
    saveSharedData();
}

function addMaterialManually() {
    if (currentUser?.role === ROLES.CREATOR) {
        materials.push({name: 'Новый материал', quantity: 0, price: 0});
        renderMaterialsTable();
    }
}

function handleMaterialUpload(e) {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = (e) => {
        e.target.result.split(/\r?\n/).forEach(l => {
            let m = l.match(/([а-яА-Яa-zA-Z\s]+)\s+(\d+(?:[.,]\d+)?)\s*[xх*]\s*(\d+(?:[.,]\d+)?)/i);
            if (m) {
                let name = m[1].trim(), q = parseFloat(m[2].replace(',', '.')), p = parseFloat(m[3].replace(',', '.'));
                if (name && !isNaN(q) && !isNaN(p)) materials.push({name, quantity: q, price: p});
            }
        });
        saveMaterials();
        renderMaterialsTable();
        alert('Материалы импортированы');
    };
    reader.readAsText(file);
}

// ========== ДИАГРАММЫ ==========
function renderAllCharts() {
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];
    const grid = document.getElementById('chartsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    renderMiniCalendar();

    (projects[currentProject]?.customCharts || []).forEach(config => {
        // Для прораба показываем только диаграммы по его категориям
        if (currentUser?.role === ROLES.FOREMAN) {
            const availableCategories = getAvailableCategoriesForForeman();
            if (config.category && !availableCategories.includes(config.category)) {
                return;
            }
        }

        const data = getChartData(config);
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.id = config.id;
        card.draggable = true;
        card.innerHTML = `<h4>${config.title}</h4><canvas id="canvas_${config.id}" width="200" height="150"></canvas>
                                 ${currentUser?.role === ROLES.CREATOR ? `<button class="chart-delete" onclick="deleteChart('${config.id}')"><i class="fas fa-times"></i></button>` : ''}`;
        grid.appendChild(card);

        setTimeout(() => {
            const canvas = document.getElementById(`canvas_${config.id}`);
            if (!canvas) return;

            let chartConfig = {
                type: 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: data.datasets || [{data: data.values || [1], backgroundColor: data.colors || '#2a9d8f'}]
                },
                options: {
                    responsive: true, maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: data.datasets ? data.datasets.length > 1 : false,
                            position: 'bottom',
                            labels: {color: 'white', font: {size: 8}}
                        },
                        datalabels: {
                            color: 'white', font: {size: 8, weight: 'bold'},
                            formatter: (value, ctx) => {
                                if (config.type === 'category_progress' || config.type === 'contract_progress') return value + '%';
                                if (config.type === 'completed_works') {
                                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                    return total > 0 ? Math.round((value / total) * 100) + '%' : '';
                                }
                                return value;
                            },
                            anchor: 'end', align: 'start', offset: 2
                        }
                    },
                    scales: {
                        y: {beginAtZero: true, ticks: {color: 'white'}, grid: {color: 'rgba(255,255,255,0.1)'}},
                        x: {ticks: {color: 'white'}, grid: {display: false}}
                    }
                }
            };

            if (data.labels && data.labels.length <= 2 && !data.datasets) {
                chartConfig.type = 'doughnut';
                chartConfig.options.scales = {display: false};
            }

            const chart = new Chart(canvas, chartConfig);
            chartInstances.push(chart);
        }, 0);
    });

    if (!projects[currentProject]?.customCharts?.length) {
        grid.innerHTML += '<div class="chart-card" style="display:flex;align-items:center;justify-content:center"><p>Нажмите "+ Добавить"</p></div>';
    }
}

function getChartData(config) {
    switch (config.type) {
        case 'category_progress':
            return getCategoryProgressData(config.category);
        case 'contract_progress':
            return getContractProgressData();
        case 'workers_by_house':
            return getWorkersByHouseData(config.category);
        case 'completed_works':
            return getCompletedWorksData(config.category);
        case 'photos_count':
            return getPhotosCountData(config.category);
        case 'materials_cost':
            return getMaterialsCostData();
        case 'materials_by_house':
            return getMaterialsByHouseData();
        default:
            return {labels: ['Нет данных'], values: [1]};
    }
}

function getMaterialsByHouseData() {
    const houses = [1, 2, 3, 4];
    const categories = (projects[currentProject]?.categories || []).filter(c => c.id !== 'contracts');
    const labels = houses.map(h => `Дом ${h}`);
    const datasets = [];
    const categoryColors = {
        'apartments': '#3498db',
        'roof': '#e67e22',
        'facade': '#2ecc71',
        'windows': '#f39c12',
        'water': '#1abc9c'
    };

    categories.forEach(cat => {
        const catData = houses.map(house => {
            const key = `house${house}_${cat.id}`;
            const status = materialsByHouse[key] || 'none';
            return (status === 'yes' || status === 'partial') ? 1 : 0;
        });
        if (catData.some(v => v > 0)) {
            datasets.push({
                label: cat.name,
                data: catData,
                backgroundColor: categoryColors[cat.id] || '#95a5a6',
                borderWidth: 1
            });
        }
    });
    return {labels, datasets};
}

function getCategoryProgressData(category) {
    const objects = allObjects[category] || [];
    // Фильтруем для прораба
    let filteredObjects = objects;
    if (currentUser?.role === ROLES.FOREMAN) {
        filteredObjects = objects.filter(obj => canViewObject(obj.id));
    }

    let total = 0, count = 0;
    filteredObjects.forEach(obj => {
        total += calculateObjectProgress(obj.id);
        count++;
    });
    const avg = count ? Math.round(total / count) : 0;
    return {labels: ['Выполнено', 'Осталось'], values: [avg, 100 - avg], colors: ['#2a9d8f', '#3a4a5a']};
}

function getContractProgressData() {
    const ids = Object.keys(contracts);
    if (!ids.length) return {labels: ['Нет контрактов'], values: [1]};
    const labels = [], values = [];
    ids.forEach(id => {
        values.push(getContractProgress(id));
        labels.push(contracts[id].name.substring(0, 12));
    });
    return {labels, values, colors: '#e67e22'};
}

function getWorkersByHouseData(category) {
    const houses = [1, 2, 3, 4], labels = [], values = [];
    houses.forEach(house => {
        const objectsInHouse = allObjects[category]?.filter(obj => obj.house === house) || [];
        // Фильтруем для прораба
        let filteredObjects = objectsInHouse;
        if (currentUser?.role === ROLES.FOREMAN) {
            filteredObjects = objectsInHouse.filter(obj => canViewObject(obj.id));
        }

        if (!filteredObjects.length) return;

        let totalWorkers = 0;
        filteredObjects.forEach(obj => {
            if (categoryData[category]?.workers) totalWorkers += (categoryData[category].workers[obj.id] || 0);
        });
        labels.push(`Дом ${house}`);
        values.push(totalWorkers);
    });
    return labels.length ? {labels, values, colors: '#3498db'} : {
        labels: ['Нет рабочих'],
        values: [0],
        colors: '#95a5a6'
    };
}

function getCompletedWorksData(category) {
    let completed = 0, total = 0;
    const objects = allObjects[category] || [];
    // Фильтруем для прораба
    let filteredObjects = objects;
    if (currentUser?.role === ROLES.FOREMAN) {
        filteredObjects = objects.filter(obj => canViewObject(obj.id));
    }

    filteredObjects.forEach(obj => {
        const works = getWorksForCategory(category).filter(w => getRequiredData(category, obj.id)[w.id] !== false);
        total += works.length;
        const prog = getProgressData(category, obj.id);
        works.forEach(w => {
            if (prog[w.id] === 100) completed++;
        });
    });
    return {labels: ['Завершено', 'Осталось'], values: [completed, total - completed], colors: ['#2ecc71', '#95a5a6']};
}

function getPhotosCountData(category) {
    let count = 0;
    const objects = allObjects[category] || [];
    // Фильтруем для прораба
    let filteredObjects = objects;
    if (currentUser?.role === ROLES.FOREMAN) {
        filteredObjects = objects.filter(obj => canViewObject(obj.id));
    }

    filteredObjects.forEach(obj => {
        count += (categoryData[category]?.photos[obj.id] || []).length;
    });
    return {labels: ['Фото'], values: [count], colors: '#9b59b6'};
}

function getMaterialsCostData() {
    const total = materials.reduce((s, m) => s + (m.quantity || 0) * (m.price || 0), 0);
    return {labels: ['Материалы'], values: [Math.round(total / 1000)], colors: '#f39c12'};
}

function deleteChart(chartId) {
    if (currentUser?.role !== ROLES.CREATOR) return;
    if (confirm('Удалить диаграмму?')) {
        projects[currentProject].customCharts = (projects[currentProject].customCharts || []).filter(c => c.id !== chartId);
        saveSharedData();
        renderAllCharts();
    }
}

function openChartEditorModal() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    const catSelect = document.getElementById('chartCategory');
    const cats = (projects[currentProject]?.categories || []).filter(c => c.id !== 'contracts');
    catSelect.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('chartEditorModal').style.display = 'flex';
}

function addCustomChart() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    const dataType = document.getElementById('chartDataType').value;
    const category = document.getElementById('chartCategory').value;
    const title = document.getElementById('chartTitle').value || getDefaultChartTitle(dataType, category);
    if (!projects[currentProject].customCharts) projects[currentProject].customCharts = [];
    projects[currentProject].customCharts.push({id: 'chart_' + Date.now(), type: dataType, category, title});
    closeModal('chartEditorModal');
    saveSharedData();
    renderAllCharts();
}

function getDefaultChartTitle(type, category) {
    const catName = (projects[currentProject]?.categories || []).find(c => c.id === category)?.name || category;
    const titles = {
        category_progress: `Прогресс по ${catName}`,
        contract_progress: 'Прогресс по контрактам',
        workers_by_house: `Рабочие по домам (${catName})`,
        completed_works: 'Завершенные работы',
        photos_count: 'Количество фото',
        materials_cost: 'Стоимость материалов',
        materials_by_house: 'Материалы по домам'
    };
    return titles[type] || 'Новая диаграмма';
}

function renderMiniCalendar() {
    const year = currentCalendarDate.getFullYear(), month = currentCalendarDate.getMonth();
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const firstDay = new Date(year, month, 1);
    let firstDayIndex = firstDay.getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let card = document.getElementById('calendarCard');
    if (!card) {
        card = document.createElement('div');
        card.className = 'calendar-card';
        card.id = 'calendarCard';
        card.draggable = true;
        document.getElementById('chartsGrid').appendChild(card);
    }

    let html = `<h4><i class="fas fa-calendar-alt" style="color:var(--photo-accent);"></i> Фото-календарь</h4>
                <div class="mini-calendar"><div class="mini-calendar-header"><span>${monthNames[month]} ${year}</span>
                <div class="mini-calendar-nav"><button onclick="changeMiniCalendarMonth(-1); event.stopPropagation();"><i class="fas fa-chevron-left"></i></button>
                <button onclick="changeMiniCalendarMonth(1); event.stopPropagation();"><i class="fas fa-chevron-right"></i></button></div></div>
                <div class="mini-weekdays"><div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div></div>
                <div class="mini-days">`;

    for (let i = 0; i < firstDayIndex; i++) html += '<div class="mini-day empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const photos = getPhotosForDate(dateStr);
        html += `<div class="mini-day" onclick="showDatePhotos('${dateStr}');"><div class="mini-day-number">${d}</div>`;
        if (photos.length) {
            html += `<div class="mini-day-badge">${photos.length}</div><div class="mini-day-preview">`;
            photos.slice(0, 3).forEach(p => {
                html += `<div class="mini-preview-item" onclick="event.stopPropagation(); openPhotoViewer(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                                <img src="${p.url}"><div class="mini-preview-info">${getWorkTypeName(p.workTypeId, p.category)}</div></div>`;
            });
            if (photos.length > 3) html += `<div>еще ${photos.length - 3}...</div>`;
            html += '</div>';
        }
        html += '</div>';
    }
    html += `</div><div class="calendar-footer"><button onclick="openAllPhotosModal();">Все фото</button></div></div>`;
    card.innerHTML = html;
}

function getPhotosForDate(dateStr) {
    const photos = [];
    (projects[currentProject]?.categories || []).forEach(cat => {
        if (cat.id === 'contracts') return;
        Object.keys(categoryData[cat.id]?.photos || {}).forEach(objId => {
            // Для прораба фильтруем фото
            if (currentUser?.role === ROLES.FOREMAN && !canViewObject(objId)) return;

            (categoryData[cat.id].photos[objId] || []).forEach(p => {
                if (p.timestamp && new Date(p.timestamp).toISOString().split('T')[0] === dateStr) photos.push(p);
            });
        });
    });
    return photos;
}

function changeMiniCalendarMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderMiniCalendar();
}

function showDatePhotos(dateStr) {
    const photos = getPhotosForDate(dateStr);
    if (!photos.length) return;
    let html = '';
    photos.forEach(p => {
        html += `<div class="photo-item" onclick="openPhotoViewer(${JSON.stringify(p).replace(/"/g, '&quot;')})"><img src="${p.url}"><div class="photo-info">${new Date(p.timestamp).toLocaleDateString()}</div></div>`;
    });
    document.getElementById('datePhotosGrid').innerHTML = html;
    document.getElementById('datePhotosTitle').innerText = dateStr;
    document.getElementById('datePhotosModal').style.display = 'flex';
}

function openPhotoModal() {
    if (!selectedObject && currentCategory !== 'contracts') {
        alert('Выберите объект');
        return;
    }
    if (selectedObject && !canEditObject(selectedObject.id) && currentUser?.role !== ROLES.CLIENT) {
        alert('Нет прав на добавление фото');
        return;
    }
    document.getElementById('photoApartmentTitle').innerText = selectedObject ? selectedObject.name : 'Все объекты';

    // Для прораба показываем только его типы работ
    let workTypes = currentCategory === 'contracts' ? [] : (categoryWorkTypes[currentCategory] || []);

    let opts = '<option value="all">Все работы</option>';
    workTypes.forEach(wt => opts += `<option value="${wt.id}">${wt.name}</option>`);

    document.getElementById('photoWorkTypeSelect').innerHTML = opts;
    document.getElementById('photoFilterSelect').innerHTML = opts;
    document.getElementById('photoUploadArea').style.display = (selectedObject && canEditObject(selectedObject.id)) ? 'block' : 'none';
    renderPhotoGrid();
    document.getElementById('photoModal').style.display = 'flex';
}

function openPhotoModalForObject(id, name) {
    for (let c of (projects[currentProject]?.categories || [])) {
        if (c.id === 'contracts') continue;
        let obj = allObjects[c.id]?.find(o => o.id === id);
        if (obj) {
            selectObject(obj);
            openPhotoModal();
            return;
        }
    }
}

function renderPhotoGrid() {
    let grid = document.getElementById('photoGrid');
    let noMsg = document.getElementById('noPhotosMessage');
    if (!grid) return;

    let photos = [];
    let filter = document.getElementById('photoFilterSelect')?.value || 'all';

    if (currentCategory === 'contracts') {
        (projects[currentProject]?.categories || []).forEach(cat => {
            if (cat.id === 'contracts') return;
            Object.keys(categoryData[cat.id]?.photos || {}).forEach(objId => {
                // Для прораба фильтруем фото
                if (currentUser?.role === ROLES.FOREMAN && !canViewObject(objId)) return;

                (categoryData[cat.id].photos[objId] || []).forEach(p => {
                    if (filter === 'all' || p.workTypeId === filter) photos.push(p);
                });
            });
        });
    } else if (selectedObject) {
        photos = (categoryData[currentCategory]?.photos[selectedObject.id] || []).filter(p => filter === 'all' || p.workTypeId === filter);
    }

    if (!photos.length) {
        grid.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';
    let html = '';
    photos.forEach((p, i) => {
        const canEdit = selectedObject ? canEditObject(selectedObject.id) : (currentUser?.role === ROLES.CREATOR);
        html += `<div class="photo-item" onclick="openPhotoViewer(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                    <img src="${p.url}" loading="lazy">
                    <div class="photo-info">${new Date(p.timestamp).toLocaleDateString()}
                    <div class="photo-work-type" style="background:${getWorkTypeColor(p.workTypeId)}">${getWorkTypeName(p.workTypeId, p.category)}</div></div>
                    ${canEdit ? `<button class="delete-photo-btn" onclick="event.stopPropagation(); deletePhoto('${p.key}',${i})"><i class="fas fa-trash"></i></button>` : ''}
                </div>`;
    });
    grid.innerHTML = html;
}

function getWorkTypeName(id, cat) {
    if (!id) return 'Общее';
    for (let c in categoryWorkTypes) {
        let wt = categoryWorkTypes[c]?.find(t => t.id === id);
        if (wt) return wt.name;
    }
    return id;
}

function getWorkTypeColor(id) {
    let colors = {
        floors: '#3498db', walls: '#2ecc71', ceilings: '#9b59b6', electrical: '#f39c12',
        plumbing: '#1abc9c', gkl: '#e67e22', roof: '#e67e22', facade: '#3498db', windows: '#2ecc71', water: '#1abc9c'
    };
    return colors[id] || '#95a5a6';
}

function filterPhotos() {
    renderPhotoGrid();
}

async function handlePhotoUpload(e) {
    let files = e.target.files;
    if (!files?.length || !selectedObject || !canEditObject(selectedObject.id)) return;
    let workType = document.getElementById('photoWorkTypeSelect').value;
    if (workType === 'all') {
        alert('Выберите тип работ');
        return;
    }

    showUploadProgress(10, 'Подготовка...');
    let cat = selectedObject.category, objId = selectedObject.id;
    if (!categoryData[cat].photos[objId]) categoryData[cat].photos[objId] = [];

    for (let i = 0; i < files.length; i++) {
        try {
            showUploadProgress(10 + Math.floor(80 * i / files.length), `Загрузка ${i + 1}/${files.length}...`);
            let data = await uploadFileToCloud(files[i], cat, objId, workType);
            categoryData[cat].photos[objId].push(data);
        } catch (err) {
            console.error(err);
            alert(`Ошибка: ${err.message}`);
        }
    }
    showUploadProgress(100, 'Готово');
    await saveSharedData();
    updatePhotoCounter(categoryData[cat].photos[objId].length);
    renderPhotoGrid();
    renderMiniCalendar();
    renderHouseTabs();
    renderObjectSelectionArea();
    document.getElementById('photoUploadInput').value = '';
}

async function deletePhoto(key, idx) {
    if (!selectedObject || !canEditObject(selectedObject.id)) return;
    if (!confirm('Удалить фото?')) return;
    try {
        await deletePhotoFromCloud(key);
        if (currentCategory === 'contracts') {
            for (let c of (projects[currentProject]?.categories || [])) {
                if (c.id === 'contracts') continue;
                for (let o in categoryData[c.id]?.photos || {}) {
                    categoryData[c.id].photos[o] = (categoryData[c.id].photos[o] || []).filter(p => p.key !== key);
                }
            }
        } else if (selectedObject) {
            let objId = selectedObject.id;
            categoryData[currentCategory].photos[objId] = (categoryData[currentCategory].photos[objId] || []).filter(p => p.key !== key);
            updatePhotoCounter(categoryData[currentCategory].photos[objId].length);
        }
        await saveSharedData();
        renderPhotoGrid();
        renderMiniCalendar();
        renderHouseTabs();
        renderObjectSelectionArea();
    } catch (err) {
        alert('Ошибка удаления');
    }
}

function openAllPhotosModal() {
    let html = '';
    (projects[currentProject]?.categories || []).forEach(cat => {
        if (cat.id === 'contracts') return;
        let photos = [];
        Object.keys(categoryData[cat.id]?.photos || {}).forEach(objId => {
            // Для прораба фильтруем фото
            if (currentUser?.role === ROLES.FOREMAN && !canViewObject(objId)) return;

            (categoryData[cat.id].photos[objId] || []).forEach(p => photos.push(p));
        });
        if (photos.length) {
            html += `<h3>${cat.name}</h3><div class="photo-grid">`;
            photos.forEach(p => {
                html += `<div class="photo-item" onclick="openPhotoViewer(${JSON.stringify(p).replace(/"/g, '&quot;')})"><img src="${p.url}"><div class="photo-info">${getWorkTypeName(p.workTypeId)} · ${new Date(p.timestamp).toLocaleDateString()}</div></div>`;
            });
            html += '</div>';
        }
    });
    if (!html) html = '<p style="text-align:center;">Нет фотографий</p>';
    document.getElementById('allPhotosContainer').innerHTML = html;
    document.getElementById('allPhotosModal').style.display = 'flex';
}

function openSmartAlbum() {
    const catSelect = document.getElementById('albumCategoryFilter');
    const houseSelect = document.getElementById('albumHouseFilter');

    let catOptions = '<option value="all">Все категории</option>';
    (projects[currentProject]?.categories || []).forEach(cat => {
        if (cat.id === 'contracts') return;
        // Для прораба показываем только доступные категории
        if (currentUser?.role === ROLES.FOREMAN && !canAccessCategory(cat.id)) return;

        catOptions += `<option value="${cat.id}" ${currentCategory === cat.id ? 'selected' : ''}>${cat.name}</option>`;
    });
    catSelect.innerHTML = catOptions;

    let houseOptions = '<option value="all">Все дома</option>';
    for (let h = 1; h <= 4; h++) houseOptions += `<option value="${h}">Дом ${h}</option>`;
    houseSelect.innerHTML = houseOptions;

    renderSmartAlbum();
    document.getElementById('smartAlbumModal').style.display = 'flex';
}

function renderSmartAlbum() {
    const container = document.getElementById('smartAlbumContent');
    const categoryFilter = document.getElementById('albumCategoryFilter').value;
    const houseFilter = document.getElementById('albumHouseFilter').value;

    let html = '';
    let categoriesToShow = categoryFilter !== 'all' ? [categoryFilter] : (projects[currentProject]?.categories || []).map(c => c.id).filter(id => id !== 'contracts');

    // Для прораба фильтруем категории
    if (currentUser?.role === ROLES.FOREMAN) {
        categoriesToShow = categoriesToShow.filter(cat => canAccessCategory(cat));
    }

    categoriesToShow.forEach(catId => {
        const catName = (projects[currentProject]?.categories || []).find(c => c.id === catId)?.name || catId;
        let categoryPhotos = [];

        Object.keys(categoryData[catId]?.photos || {}).forEach(objId => {
            // Для прораба фильтруем объекты
            if (currentUser?.role === ROLES.FOREMAN && !canViewObject(objId)) return;

            if (houseFilter !== 'all') {
                const obj = allObjects[catId]?.find(o => o.id === objId);
                if (!obj || obj.house != houseFilter) return;
            }
            (categoryData[catId].photos[objId] || []).forEach(p => categoryPhotos.push(p));
        });

        if (categoryPhotos.length > 0) {
            html += `<h3 style="color: var(--secondary); margin: 20px 0 10px;">${catName} (${categoryPhotos.length} фото)</h3><div class="photo-grid">`;
            categoryPhotos.forEach(p => {
                html += `<div class="photo-item" onclick="openPhotoViewer(${JSON.stringify(p).replace(/"/g, '&quot;')})"><img src="${p.url}"><div class="photo-info">${getWorkTypeName(p.workTypeId)} · ${new Date(p.timestamp).toLocaleDateString()}</div></div>`;
            });
            html += '</div>';
        }
    });

    container.innerHTML = html || '<p style="text-align:center; padding:40px;">Нет фотографий</p>';
}

function openPhotoViewer(photo) {
    currentPhotoList = getAllPhotos();
    currentPhotoIndex = currentPhotoList.findIndex(p => p.key === photo.key);
    if (currentPhotoIndex === -1) currentPhotoIndex = 0;
    updatePhotoViewer();
    document.getElementById('photoViewerModal').style.display = 'flex';
}

function getAllPhotos() {
    const photos = [];
    (projects[currentProject]?.categories || []).forEach(cat => {
        if (cat.id === 'contracts') return;
        Object.keys(categoryData[cat.id]?.photos || {}).forEach(objId => {
            // Для прораба фильтруем фото
            if (currentUser?.role === ROLES.FOREMAN && !canViewObject(objId)) return;

            (categoryData[cat.id].photos[objId] || []).forEach(p => photos.push(p));
        });
    });
    return photos;
}

function updatePhotoViewer() {
    if (!currentPhotoList.length) return;
    const photo = currentPhotoList[currentPhotoIndex];
    document.getElementById('photoViewerImage').src = photo.url;
    document.getElementById('photoViewerCaption').innerHTML = `${currentPhotoIndex + 1} / ${currentPhotoList.length} · ${getWorkTypeName(photo.workTypeId)} · ${new Date(photo.timestamp).toLocaleString()}`;
}

function navigatePhoto(direction) {
    currentPhotoIndex = (currentPhotoIndex + direction + currentPhotoList.length) % currentPhotoList.length;
    updatePhotoViewer();
}

function updatePhotoCounter(cnt) {
    document.getElementById('photoCountBadge').innerText = cnt;
}

function resetProgressOnly() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    if (!confirm('Сбросить весь прогресс?')) return;
    (projects[currentProject]?.categories || []).forEach(cat => {
        if (cat.id === 'contracts') return;
        if (categoryData[cat.id]?.progress) categoryData[cat.id].progress = {};
        if (categoryData[cat.id]?.required) categoryData[cat.id].required = {};
    });
    saveSharedData().then(() => {
        if (selectedObject) {
            updateObjectQuickStats();
            renderTable();
        }
        renderAllCharts();
        alert('Прогресс сброшен');
    });
}

function openProgressModal() {
    if (currentUser?.role === ROLES.CLIENT) {
        alert('Нет доступа');
        return;
    }
    if (currentUser?.role === ROLES.FOREMAN) {
        alert('У вас нет доступа к сравнению прогресса');
        return;
    }

    let ws = document.getElementById('workSelect');
    ws.innerHTML = '<option value="">Выберите работу</option>' + getWorksForCategory('apartments').map(w => `<option value="${w.id}">${w.name}</option>`).join('');

    let html = '<table class="materials-table"><tr><th>Дом</th><th>Прогресс</th></tr>';
    for (let h = 1; h <= 4; h++) {
        let apts = allObjects.apartments.filter(a => a.house === h);
        // Для прораба фильтруем квартиры
        if (currentUser?.role === ROLES.FOREMAN) {
            apts = apts.filter(apt => canViewObject(apt.id));
        }

        if (!apts.length) continue;

        let total = 0, count = 0;
        apts.forEach(a => {
            total += calculateObjectProgress(a.id);
            count++;
        });
        let avg = count ? Math.round(total / count) : 0;
        html += `<tr><td>Дом ${h}</td><td><div class="apartment-progress"><div class="apartment-progress-bar"><div class="apartment-progress-fill" style="width:${avg}%"></div></div><span class="percentage-badge">${avg}%</span></div></td></tr>`;
    }
    html += '</table>';
    document.getElementById('housesComparison').innerHTML = html;
    document.getElementById('progressModal').style.display = 'flex';
}

async function applyMassProgress() {
    if (currentUser?.role === ROLES.CLIENT) return;
    if (currentUser?.role === ROLES.FOREMAN) {
        alert('У вас нет доступа к массовому применению');
        return;
    }

    let workId = document.getElementById('workSelect').value;
    let progress = parseInt(document.getElementById('massProgress').value);
    if (!workId || isNaN(progress)) {
        alert('Выберите работу и укажите прогресс');
        return;
    }
    if (!confirm(`Установить прогресс ${progress}% для всех доступных квартир?`)) return;

    allObjects.apartments.forEach(apt => {
        if (canEditObject(apt.id)) {
            if (!categoryData.apartments.progress[apt.id]) categoryData.apartments.progress[apt.id] = {};
            categoryData.apartments.progress[apt.id][workId] = progress;
        }
    });
    await saveSharedData();
    alert('Применено');
    if (selectedObject) {
        updateObjectQuickStats();
        renderTable();
        renderAllCharts();
    }
    closeModal('progressModal');
}

function openWorkEditorModal() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    const cat = (projects[currentProject]?.categories || []).find(c => c.id === currentCategory);
    document.getElementById('workEditorCategoryTitle').innerText = cat ? cat.name : currentCategory;
    renderWorkEditorTable();
    document.getElementById('workEditorModal').style.display = 'flex';
}

function renderWorkEditorTable() {
    let tbody = document.getElementById('workEditorTableBody');
    let works = workDefinitions[currentCategory] || [];
    let html = '';
    works.forEach((w, i) => {
        html += `<tr>
                    <td><input type="number" value="${w.id}" onchange="updateWork(${i},'id',parseInt(this.value)||0)" id="work_id_${i}"></td>
                    <td><input type="text" value="${w.name}" onchange="updateWork(${i},'name',this.value)" id="work_name_${i}"></td>
                    <td><select onchange="updateWork(${i},'type',this.value)" id="work_type_${i}">${(categoryWorkTypes[currentCategory] || []).map(wt => `<option value="${wt.id}" ${w.type === wt.id ? 'selected' : ''}>${wt.name}</option>`).join('')}</select></td>
                    <td><button class="btn-sm btn-danger" onclick="deleteWork(${i})"><i class="fas fa-trash"></i></button></td>
                </tr>`;
    });
    tbody.innerHTML = html;
}

function updateWork(i, f, v) {
    if (workDefinitions[currentCategory]?.[i]) workDefinitions[currentCategory][i][f] = v;
}

function deleteWork(i) {
    if (confirm('Удалить работу?')) {
        workDefinitions[currentCategory].splice(i, 1);
        renderWorkEditorTable();
    }
}

function addNewWork() {
    if (!workDefinitions[currentCategory]) workDefinitions[currentCategory] = [];
    workDefinitions[currentCategory].push({
        id: Date.now(),
        name: 'Новая работа',
        type: (categoryWorkTypes[currentCategory] || [])[0]?.id || 'general'
    });
    renderWorkEditorTable();
}

function saveWorkDefinitions() {
    saveSharedData();
    if (selectedObject) {
        renderTable();
        renderAllCharts();
    }
    alert('Список работ сохранён');
}

function openHouseEditorModal() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let p = projects[currentProject];
    if (!p) return;
    let html = '';
    for (let h = 1; h <= 4; h++) {
        html += `<div style="background:var(--input-bg);padding:15px;border-radius:8px;margin-bottom:15px;">
                    <h4>Дом ${h}</h4>
                    <input type="text" id="house${h}Apts" value="${(p.houses[h] || []).join(', ')}" placeholder="Номера квартир" style="width:100%;padding:8px;">
                </div>`;
    }
    document.getElementById('houseEditorContainer').innerHTML = html;
    document.getElementById('houseEditorModal').style.display = 'flex';
}

function saveHouseEditor() {
    let p = projects[currentProject];
    if (!p) return;
    for (let h = 1; h <= 4; h++) {
        let inp = document.getElementById(`house${h}Apts`);
        if (inp) p.houses[h] = inp.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
    saveSharedData();
    rebuildAllObjects();
    if (selectedObject) selectObject(selectedObject);
    else switchCategory(currentCategory);
    renderAllCharts();
    closeModal('houseEditorModal');
    alert('Дома сохранены');
}

function openCategoryEditorModal() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    renderCategoriesList();
    document.getElementById('categoryEditorModal').style.display = 'flex';
}

function renderCategoriesList() {
    const cats = projects[currentProject]?.categories || [];
    let html = '';
    cats.forEach((cat, index) => {
        if (cat.id === 'contracts') return;
        html += `<div class="project-row">
                    <input type="color" value="${cat.color || '#3498db'}" onchange="updateCategory('${cat.id}', 'color', this.value)">
                    <input type="text" value="${cat.name}" onchange="updateCategory('${cat.id}', 'name', this.value)" placeholder="Название">
                    <button class="btn-sm btn-danger" onclick="deleteCategory('${cat.id}')" ${cats.length <= 2 ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                </div>`;
    });
    document.getElementById('categoriesList').innerHTML = html;
}

function updateCategory(id, field, value) {
    const cat = (projects[currentProject]?.categories || []).find(c => c.id === id);
    if (cat) cat[field] = value;
}

function addCategory() {
    const newId = 'cat_' + Date.now();
    projects[currentProject].categories.push({id: newId, name: 'Новая категория', color: '#3498db'});
    if (!projects[currentProject].categoryData) projects[currentProject].categoryData = {};
    projects[currentProject].categoryData[newId] = {progress: {}, required: {}, photos: {}, workers: {}};
    if (!workDefinitions[newId]) workDefinitions[newId] = [];
    renderCategoriesList();
}

function deleteCategory(id) {
    if ((projects[currentProject]?.categories || []).length <= 2) {
        alert('Нельзя удалить последнюю категорию');
        return;
    }
    if (!confirm('Удалить категорию?')) return;
    projects[currentProject].categories = projects[currentProject].categories.filter(c => c.id !== id);
    delete projects[currentProject].categoryData[id];
    delete projects[currentProject].workContracts[id];
    delete projects[currentProject].groupContracts[id];
    delete workDefinitions[id];
    if (currentCategory === id) {
        const firstCat = (projects[currentProject]?.categories || [])[0];
        if (firstCat) switchCategory(firstCat.id);
    }
    renderCategoriesList();
    renderCategoryTabs();
    if (selectedObject) selectObject(selectedObject);
    else switchCategory(currentCategory);
}

function saveCategories() {
    saveSharedData();
    renderCategoryTabs();
    if (selectedObject) selectObject(selectedObject);
    else switchCategory(currentCategory);
    renderAllCharts();
    closeModal('categoryEditorModal');
}

function switchProject() {
    let id = document.getElementById('projectSelector').value;
    if (!id) return;
    saveCurrentProjectData();
    currentProject = id;
    let p = projects[id];
    if (p) {
        document.getElementById('editableTitle').innerText = p.name;
        updateProjectLogoDisplay();
    }
    loadProjectData(id);
    rebuildAllObjects();

    // Сбрасываем кэш назначений
    userAssignedCategories = null;
    userAssignedObjects = null;

    if (selectedObject) selectObject(selectedObject);
    else switchCategory((projects[currentProject]?.categories || [])[0]?.id || 'apartments');

    renderAllCharts();
    renderMaterialsByHouse();
    renderMaterialsProfessionalTable();
    updateAssignedCategoriesBadge();
    saveSharedData();
}

function saveCurrentProjectData() {
    let p = projects[currentProject];
    if (!p) return;
    p.categoryData = categoryData;
    p.contracts = contracts;
    p.workContracts = workContracts;
    p.groupContracts = groupContracts;
    p.materials = materials;
    p.logoUrl = document.getElementById('customImagePreview').src;
    p.headerUrl = document.getElementById('customImagePreview').src;
    p.name = document.getElementById('editableTitle').innerText;
    p.workDefinitions = workDefinitions;
    p.materialsByHouse = materialsByHouse;
}

function loadProjectData(id) {
    let p = projects[id];
    if (!p) return;
    initProjectCategories(p);
    categoryData = p.categoryData || {};
    contracts = p.contracts || {};
    workContracts = p.workContracts || {};
    groupContracts = p.groupContracts || {};
    materials = p.materials || [];
    materialsByHouse = p.materialsByHouse || {};
    workDefinitions = p.workDefinitions ? p.workDefinitions : JSON.parse(JSON.stringify(defaultWorks));
    Object.keys(contracts).forEach(id => {
        if (!contracts[id].payments) contracts[id].payments = [];
    });
    updateProjectLogoDisplay();
    renderCategoryTabs();
}

function openProjectEditorModal() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    renderProjectsList();
    document.getElementById('projectEditorModal').style.display = 'flex';
}

function renderProjectsList() {
    let html = '';
    Object.keys(projects).forEach(id => {
        let p = projects[id];
        let isDefault = id === 'lupche_svino';
        html += `<div class="project-row">
                    <input type="text" value="${p.name}" data-id="${id}" data-field="name" id="project_name_${id}" ${isDefault ? 'readonly' : ''}>
                    <input type="text" value="${p.address}" data-id="${id}" data-field="address" id="project_addr_${id}" ${isDefault ? 'readonly' : ''}>
                    <div class="house-editor">
                        ${[1, 2, 3, 4].map(h => `<h5>Дом ${h}</h5><input type="text" data-project="${id}" data-house="${h}" value="${(p.houses[h] || []).join(', ')}" id="project_house_${id}_${h}" ${isDefault ? 'readonly' : ''}>`).join('')}
                    </div>
                    <div class="project-actions">
                        <button class="btn-sm btn-success" onclick="setActiveProject('${id}')"><i class="fas fa-check"></i> Выбрать</button>
                        ${!isDefault ? `<button class="btn-sm btn-danger" onclick="deleteProject('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>`;
    });
    document.getElementById('projectsList').innerHTML = html;

    document.querySelectorAll('.project-row input:not([readonly])').forEach(inp => {
        inp.addEventListener('change', function () {
            if (this.dataset.house) {
                let pid = this.dataset.project, h = this.dataset.house,
                    vals = this.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                if (projects[pid]) {
                    if (!projects[pid].houses) projects[pid].houses = {};
                    projects[pid].houses[h] = vals;
                }
            } else {
                let pid = this.dataset.id, f = this.dataset.field;
                if (projects[pid]) projects[pid][f] = this.value;
            }
            updateProjectSelector();
        });
    });
}

function addNewProject() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let id = 'project_' + Date.now();
    projects[id] = {
        id,
        name: 'Новый проект',
        address: 'Адрес',
        houses: {1: [], 2: [], 3: [], 4: []},
        logoUrl: null,
        headerUrl: null,
        categoryData: {},
        contracts: {},
        workContracts: {},
        groupContracts: {},
        materials: [],
        customCharts: [],
        materialsByHouse: {}
    };
    initProjectCategories(projects[id]);
    renderProjectsList();
    updateProjectSelector();
}

function deleteProject(id) {
    if (currentUser?.role !== ROLES.CREATOR) return;
    if (id === 'lupche_svino') {
        alert('Нельзя удалить основной проект');
        return;
    }
    if (confirm('Удалить проект?')) {
        delete projects[id];
        if (currentProject === id) {
            currentProject = 'lupche_svino';
            loadProjectData('lupche_svino');
        }
        updateProjectSelector();
        switchProject();
    }
}

function setActiveProject(id) {
    document.getElementById('projectSelector').value = id;
    switchProject();
    closeModal('projectEditorModal');
}

function updateProjectSelector() {
    let sel = document.getElementById('projectSelector');
    sel.innerHTML = '<option value="">Проект</option>' + Object.keys(projects).map(id => `<option value="${id}" ${currentProject === id ? 'selected' : ''}>${projects[id].name}</option>`).join('');
}

function saveProjects() {
    saveCurrentProjectData();
    saveSharedData();
    rebuildAllObjects();
    if (selectedObject) selectObject(selectedObject);
    else switchCategory(currentCategory);
    renderAllCharts();
    alert('Проекты сохранены');
}

async function loadSharedData() {
    // Сначала пробуем загрузить из localStorage
    if (loadFromLocalStorage()) {
        document.getElementById('cloudStatusText').innerHTML = '✓ Локальные данные';
    }

    // Затем пробуем загрузить из облака
    try {
        let data = await s3.getObject({Bucket: CLOUD_CONFIG.bucketName, Key: 'data/shared.json'}).promise();
        let loaded = JSON.parse(data.Body.toString());
        if (loaded.projects) projects = loaded.projects;
        if (loaded.workDefinitions) workDefinitions = loaded.workDefinitions;
        if (loaded.users) users = loaded.users;
        document.getElementById('cloudStatusText').innerHTML = '✓ Облако подключено';
    } catch (e) {
        console.log('Облако недоступно, используем локальные данные');
    }

    if (!currentUser) return;

    currentProject = 'lupche_svino';
    loadProjectData('lupche_svino');
    updateProjectSelector();
    rebuildAllObjects();

    // Сбрасываем кэш назначений
    userAssignedCategories = null;
    userAssignedObjects = null;

    // Выбираем первую доступную категорию для прораба
    if (currentUser.role === ROLES.FOREMAN) {
        const availableCats = getAvailableCategoriesForForeman();
        if (availableCats && availableCats.length > 0) {
            switchCategory(availableCats[0]);
        } else {
            switchCategory('apartments');
        }
    } else {
        switchCategory((projects[currentProject]?.categories || [])[0]?.id || 'apartments');
    }

    renderAllCharts();
    renderMaterialsByHouse();
    renderMaterialsProfessionalTable();
    updateAssignedCategoriesBadge();

    const savedTitle = localStorage.getItem('appTitle');
    if (savedTitle) document.getElementById('editableTitle').innerText = savedTitle;
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ ДАННЫХ
async function saveSharedData() {
    if (isSaving) return;
    isSaving = true;
    saveCurrentProjectData();

    // Сохраняем в localStorage как резервную копию
    const localSaved = saveToLocalStorage();

    if (!localSaved) {
        alert('⚠️ Внимание! Не удалось сохранить в localStorage (возможно, переполнение). Сделайте экспорт вручную!');
    }

    // Пробуем сохранить в облако
    try {
        const result = await s3.upload({
            Bucket: CLOUD_CONFIG.bucketName,
            Key: 'data/shared.json',
            Body: JSON.stringify({projects, workDefinitions, users}),
            ContentType: 'application/json',
            ACL: 'public-read'
        }).promise();

        document.getElementById('cloudStatusText').innerHTML = '✓ Сохранено';
        console.log('✅ Данные сохранены в облако');
    } catch (e) {
        document.getElementById('cloudStatusText').innerHTML = '✓ Локально (облако недоступно)';
        console.log('❌ Облако недоступно, данные только в localStorage');

        if (!localSaved) {
            alert('⚠️ КРИТИЧНО: Данные не сохранились никуда! Сделайте экспорт вручную.');
        }
    }
    isSaving = false;
}

async function forceSync() {
    document.getElementById('cloudStatusText').innerHTML = 'Синхронизация...';
    await loadSharedData();
    await saveSharedData();
}

function generateCloudPath(cat, objId, workType) {
    return `projects/${currentProject}/photos/${cat}/${objId}/${workType || 'general'}/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
}

async function compressImageBlob(file) {
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onload = (e) => {
            let img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > 1200) {
                    h = Math.floor(h * 1200 / w);
                    w = 1200;
                }
                let canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function uploadFileToCloud(file, cat, objId, workType) {
    let blob = await compressImageBlob(file);
    let key = generateCloudPath(cat, objId, workType);
    let data = await s3.upload({
        Bucket: CLOUD_CONFIG.bucketName,
        Key: key,
        Body: blob,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
    }).promise();
    return {
        id: key,
        url: data.Location,
        key,
        workTypeId: workType,
        timestamp: Date.now(),
        category: cat,
        objectId: objId
    };
}

async function deletePhotoFromCloud(key) {
    await s3.deleteObject({Bucket: CLOUD_CONFIG.bucketName, Key: key}).promise();
}

function showUploadProgress(pct, txt) {
    let d = document.getElementById('uploadProgress');
    d.style.display = 'block';
    document.getElementById('uploadProgressBar').style.width = pct + '%';
    document.getElementById('uploadStatus').innerText = txt;
    if (pct >= 100) setTimeout(() => d.style.display = 'none', 2000);
}

function updateProjectLogoDisplay() {
    const p = projects[currentProject];
    if (!p) return;
    const headerImg = document.getElementById('customImagePreview');
    const headerPlaceholder = document.getElementById('customImagePlaceholder');
    if (p.logoUrl && p.logoUrl !== 'null' && p.logoUrl !== '') {
        headerImg.src = p.logoUrl;
        headerImg.style.display = 'block';
        headerPlaceholder.style.display = 'none';
    } else {
        headerImg.style.display = 'none';
        headerPlaceholder.style.display = 'block';
    }
}

async function handleCustomImageUpload(e) {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let f = e.target.files[0];
    if (!f) return;
    let r = new FileReader();
    r.onload = async (e) => {
        document.getElementById('customImagePreview').src = e.target.result;
        document.getElementById('customImagePreview').style.display = 'block';
        document.getElementById('customImagePlaceholder').style.display = 'none';
        if (projects[currentProject]) projects[currentProject].logoUrl = e.target.result;
        try {
            await saveSharedData();
        } catch (err) {
            alert('Ошибка сохранения логотипа: ' + err.message);
        }
    };
    r.readAsDataURL(f);
}

function saveTitle(t) {
    if (currentUser?.role !== ROLES.CREATOR) return;
    if (projects[currentProject]) projects[currentProject].name = t;
    localStorage.setItem('appTitle', t);
    saveSharedData();
}

function formatCurrency(a) {
    return new Intl.NumberFormat('ru-RU', {style: 'currency', currency: 'RUB'}).format(a);
}

function updateDateTime() {
    let n = new Date();
    document.getElementById('currentDateTime').innerText = n.toLocaleDateString('ru-RU', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) + ' ' + n.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
}

function exportFullConfig() {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let data = JSON.stringify({
        projects,
        workDefinitions,
        users,
        appTitle: document.getElementById('editableTitle').innerText
    }, null, 2);
    let a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    a.download = 'repair_backup.json';
    a.click();
}

function importFullConfig(e) {
    if (currentUser?.role !== ROLES.CREATOR) return;
    let f = e.target.files[0];
    if (!f) return;
    let r = new FileReader();
    r.onload = (e) => {
        try {
            let imp = JSON.parse(e.target.result);
            if (imp.projects) projects = imp.projects;
            if (imp.workDefinitions) workDefinitions = imp.workDefinitions;
            if (imp.users) users = imp.users;
            if (imp.appTitle) {
                document.getElementById('editableTitle').innerText = imp.appTitle;
                localStorage.setItem('appTitle', imp.appTitle);
            }
            Object.keys(projects).forEach(id => initProjectCategories(projects[id]));
            loadProjectData('lupche_svino');
            updateProjectSelector();
            saveSharedData();
            alert('Импорт выполнен');
            location.reload();
        } catch (err) {
            alert('Ошибка импорта');
        }
    };
    r.readAsText(f);
}

function exportToExcel() {
    if (currentUser?.role === ROLES.FOREMAN) {
        alert('У вас нет доступа к экспорту');
        return;
    }

    let wb = XLSX.utils.book_new();
    let aptData = [['Дом', 'Квартира', 'Прогресс', 'Завершено', 'Рабочих']];

    let apartmentsToExport = allObjects.apartments;
    // Для прораба экспортируем только его объекты
    if (currentUser?.role === ROLES.FOREMAN) {
        apartmentsToExport = apartmentsToExport.filter(a => canViewObject(a.id));
    }

    apartmentsToExport.forEach(a => aptData.push([a.house, a.number, calculateObjectProgress(a.id) + '%', isObjectFullyCompleted(a.id) ? 'Да' : 'Нет', categoryData.apartments?.workers[a.id] || 0]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aptData), 'Квартиры');

    let contData = [['Контракт', 'Сумма', 'Освоено', 'Остаток', 'Прогресс']];
    Object.keys(contracts).forEach(id => {
        let c = contracts[id];
        contData.push([c.name, c.amount, getContractSpent(id), getContractRemaining(id), getContractProgress(id) + '%']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contData), 'Контракты');
    XLSX.writeFile(wb, `repair_${currentProject}.xlsx`);
}

function saveProgress() {
    saveSharedData();
    alert('Прогресс сохранен');
}

async function applyToAllObjects() {
    if (!selectedObject || !canEditObject(selectedObject.id) || !confirm('Скопировать прогресс на все доступные объекты?')) return;
    if (currentUser?.role === ROLES.FOREMAN) {
        alert('У вас нет доступа к массовому копированию');
        return;
    }

    let cat = selectedObject.category;
    let srcProg = categoryData[cat].progress[selectedObject.id] || {};
    let srcReq = categoryData[cat].required[selectedObject.id] || {};
    allObjects[cat].forEach(obj => {
        if (obj.id !== selectedObject.id && canEditObject(obj.id)) {
            categoryData[cat].progress[obj.id] = {...srcProg};
            categoryData[cat].required[obj.id] = {...srcReq};
        }
    });
    await saveSharedData();
    alert('Прогресс скопирован');
    if (selectedObject) {
        updateObjectQuickStats();
        renderTable();
        renderAllCharts();
    }
}

function toggleChartsPanel() {
    chartsCollapsed = !chartsCollapsed;
    document.getElementById('chartsContent').classList.toggle('collapsed', chartsCollapsed);
    document.querySelector('#chartsToggleIcon i').className = chartsCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

function toggleManagementMenu() {
    document.getElementById('managementButtons').classList.toggle('hidden');
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async function () {
    updateDateTime();
    setInterval(updateDateTime, 60000);

    document.getElementById('searchInput').addEventListener('input', e => {
        document.querySelectorAll('#workTable tbody tr').forEach(r => {
            r.style.display = r.textContent.toLowerCase().includes(e.target.value.toLowerCase()) ? '' : 'none';
        });
    });

    document.getElementById('customImageInput').addEventListener('change', handleCustomImageUpload);
    document.getElementById('photoUploadInput').addEventListener('change', handlePhotoUpload);
    document.getElementById('materialFileInput').addEventListener('change', handleMaterialUpload);
    document.getElementById('importFileInput').addEventListener('change', importFullConfig);
    document.getElementById('editableTitle').addEventListener('blur', function () {
        saveTitle(this.innerText);
    });

    initProjectCategories(projects.lupche_svino);
    rebuildAllObjects();

    document.getElementById('loginModal').style.display = 'flex';
});

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};
