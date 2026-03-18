@extends('layouts.app-main')



@section('content')

    <!-- МОДАЛЬНОЕ ОКНО ВХОДА -->
    <div class="login-modal" id="loginModal">
        <div class="login-content">
            <h2><i class="fas fa-hard-hat"></i> Вход в систему</h2>
            <input type="password" id="loginPassword" placeholder="Введите пароль" onkeypress="if(event.key==='Enter') login()">
            <button onclick="login()">Войти</button>
            <div class="login-error" id="loginError"></div>
        </div>
    </div>

    <div class="container">
        <!-- ========== ШАПКА ========== -->
        <header>
            <div class="header-left">
                <div class="logo-block">
                    <div class="custom-image-area" id="customImageContainer" onclick="document.getElementById('customImageInput').click();">
                        <img id="customImagePreview" src="" style="display: none;">
                        <span id="customImagePlaceholder"><i class="fas fa-camera"></i></span>
                        <div class="edit-overlay"><i class="fas fa-pencil-alt"></i></div>
                        <input type="file" id="customImageInput" accept="image/*" style="display: none;">
                    </div>
                    <h1 id="editableTitle" contenteditable="false">Лупче-Свино</h1>
                </div>
            </div>

            <div class="header-right">
                <div class="user-info">
                    <span class="user-name" id="userNameDisplay">Гость</span>
                    <span class="role-badge" id="roleBadge">роль</span>
                    <span class="assigned-categories-badge" id="assignedCategoriesBadge" style="display: none;"></span>
                    <button class="logout-btn" onclick="logout()" title="Выйти"><i class="fas fa-sign-out-alt"></i></button>
                </div>
                <div class="project-selector">
                    <select id="projectSelector" onchange="switchProject()">
                        <option value="">Проект</option>
                    </select>
                    <button onclick="openProjectEditorModal()" id="newProjectBtn"><i class="fas fa-plus"></i></button>
                </div>
                <div id="currentDateTime">...</div>
            </div>
        </header>

        <!-- ИНДИКАТОР ОБЛАКА -->
        <div class="cloud-status" id="cloudStatus">
            <i class="fas fa-cloud"></i>
            <span id="cloudStatusText">Подключение...</span>
            <button class="sync-button" onclick="forceSync()"><i class="fas fa-sync-alt"></i></button>
        </div>

        <div class="upload-progress" id="uploadProgress">
            <div><i class="fas fa-cloud-upload-alt"></i> Загрузка...</div>
            <div style="height: 4px; background: var(--border-color); margin: 10px 0;">
                <div id="uploadProgressBar" style="height: 100%; background: var(--success); width: 0%;"></div>
            </div>
            <div id="uploadStatus">Подготовка...</div>
        </div>

        <!-- КНОПКИ УПРАВЛЕНИЯ (только для создателя) -->
        <div class="management-buttons-container" id="managementButtonsContainer" style="display: none;">
            <div class="management-btn creator" onclick="togglePanel('usersPanel')">
                <i class="fas fa-users-cog"></i> <span>Управление пользователями</span>
            </div>
            <div class="management-btn foreman" onclick="togglePanel('foremanPanel')">
                <i class="fas fa-user-tie"></i> <span>Назначение прорабов</span>
            </div>
            <div class="management-btn" onclick="togglePanel('materialsPanel')">
                <i class="fas fa-boxes"></i> <span>Материалы по домам</span>
            </div>
        </div>

        <!-- ПАНЕЛИ УПРАВЛЕНИЯ -->
        <div class="management-panel" id="usersPanel">
            <h3><i class="fas fa-users-cog"></i> Управление пользователями</h3>
            <div class="users-grid" id="usersGrid"></div>
            <button class="btn-success" onclick="addNewUser()" style="margin-top: 15px;"><i class="fas fa-plus"></i> Добавить пользователя</button>
        </div>

        <div class="management-panel" id="foremanPanel">
            <h3><i class="fas fa-user-tie"></i> Назначение прорабов</h3>
            <div class="foreman-assignment-grid" id="foremanAssignmentGrid"></div>
            <button class="btn-success" onclick="saveForemanAssignments()" style="margin-top: 15px;"><i class="fas fa-save"></i> Сохранить</button>
        </div>

        <div class="management-panel" id="materialsPanel">
            <h3><i class="fas fa-boxes"></i> Редактор материалов</h3>
            <div class="materials-by-house-grid" id="materialsByHouseGrid"></div>
            <button class="btn-success" onclick="openMaterialsEditor()" style="margin-top: 15px;"><i class="fas fa-edit"></i> Редактировать</button>
        </div>

        <!-- ОБЩИЕ ДАННЫЕ -->
        <div class="charts-panel" id="chartsPanel">
            <div class="charts-header" onclick="toggleChartsPanel()">
                <h2><i class="fas fa-chart-pie"></i> Общие данные по объекту</h2>
                <div class="chart-controls" onclick="event.stopPropagation()">
                    <button class="btn-sm btn-primary" onclick="openChartEditorModal()" id="addChartBtn"><i class="fas fa-plus"></i> Добавить</button>
                    <span class="toggle-icon" id="chartsToggleIcon"><i class="fas fa-chevron-up"></i></span>
                </div>
            </div>
            <div id="chartsContent" class="charts-content">
                <div class="charts-grid" id="chartsGrid"></div>
            </div>
        </div>

        <!-- ПРОФЕССИОНАЛЬНАЯ ТАБЛИЦА МАТЕРИАЛОВ -->
        <div class="materials-professional" id="materialsProfessionalTable">
            <div class="materials-header">
                <h3><i class="fas fa-cubes"></i> Материалы по домам</h3>
                <div class="date-badge" id="materialsDateBadge">
                    <i class="fas fa-calendar-alt"></i>
                    <span id="materialsDateText">Загрузка...</span>
                </div>
            </div>

            <div class="legend-grid">
                <div class="legend-card">
                    <div class="legend-icon green"><i class="fas fa-check-circle"></i></div>
                    <div class="legend-content">
                        <h4>В наличии</h4>
                        <p>Есть материалы</p>
                    </div>
                </div>
                <div class="legend-card">
                    <div class="legend-icon yellow"><i class="fas fa-adjust"></i></div>
                    <div class="legend-content">
                        <h4>Частично</h4>
                        <p>Требуется дозаказ</p>
                    </div>
                </div>
                <div class="legend-card">
                    <div class="legend-icon red"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="legend-content">
                        <h4>Отсутствуют</h4>
                        <p>Необходим завоз</p>
                    </div>
                </div>
            </div>

            <div class="stats-grid" id="materialsStats"></div>

            <div class="materials-table-container">
                <table class="materials-table" id="materialsTable">
                    <thead>
                    <tr>
                        <th>Объект</th>
                        <th>Квартиры</th>
                        <th>Кровля</th>
                        <th>Фасад</th>
                        <th>Окна</th>
                        <th>ГВС/ХВС</th>
                        <th>Статистика</th>
                    </tr>
                    </thead>
                    <tbody id="materialsTableBody"></tbody>
                </table>
            </div>

            <div class="analytics-footer" id="materialsAnalytics"></div>
        </div>

        <!-- ВЫБОР КАТЕГОРИИ РАБОТ -->
        <div class="category-tabs" id="categoryTabs"></div>

        <!-- ВЫБОР ДОМА -->
        <div class="object-control">
            <div class="house-tabs" id="houseTabsContainer"></div>
            <div id="objectSelectionArea"></div>
        </div>

        <!-- СВОДКА ПО ОБЪЕКТУ -->
        <div class="object-summary" id="objectSummary">
            <div>
                <h3 id="selectedObjectTitle">Выберите объект</h3>
                <div class="quick-stats" id="objectQuickStats"></div>
                <div class="object-workers" id="objectWorkersBlock" style="display: none;">
                    <label><i class="fas fa-hard-hat"></i> Рабочих:</label>
                    <input type="number" id="objectWorkersInput" min="0" value="0" class="worker-object-input">
                    <button class="btn-sm btn-success" onclick="saveObjectWorkers()" id="saveWorkersBtn"><i class="fas fa-save"></i></button>
                </div>
            </div>
            <div style="display: flex; gap: 15px; align-items: center; margin-top: 15px; flex-wrap: wrap;">
                <div class="photo-counter" onclick="openPhotoModal()" id="photoCounterWidget">
                    <i class="fas fa-camera"></i> <span id="photoCountBadge">0</span>
                </div>
                <button class="btn-photo" onclick="openPhotoModal()" id="photoBtn"><i class="fas fa-images"></i> Фото</button>
                <button class="btn-album" onclick="openSmartAlbum()" id="albumBtn"><i class="fas fa-film"></i> Альбом</button>
                <button class="btn-calendar" onclick="openAllPhotosModal()"><i class="fas fa-calendar-alt"></i> Календарь</button>
            </div>
        </div>

        <!-- ПАНЕЛЬ УПРАВЛЕНИЯ -->
        <div class="controls">
            <div style="display: flex; align-items: center; gap: 10px; flex:1;">
                <i class="fas fa-search"></i>
                <input type="text" id="searchInput" placeholder="Поиск работ..." style="padding: 8px 16px; border-radius: 40px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-primary); flex:1;">
            </div>
            <button class="menu-toggle" id="menuToggle" onclick="toggleManagementMenu()"><i class="fas fa-bars"></i> Меню</button>
            <div class="management-buttons hidden" id="managementButtons">
                <button class="btn-primary" onclick="exportToExcel()"><i class="fas fa-file-excel"></i> Excel</button>
                <button class="btn-success" onclick="saveProgress()"><i class="fas fa-save"></i> Сохранить</button>
                <button class="btn-primary" onclick="applyToAllObjects()" id="applyAllBtn"><i class="fas fa-copy"></i> Копировать</button>
                <button class="btn-warning" onclick="openProgressModal()" id="progressCompareBtn"><i class="fas fa-chart-bar"></i> Сравнение</button>
                <button class="btn-photo" onclick="openAllPhotosModal()"><i class="fas fa-film"></i> Все фото</button>
                <button class="btn-material" onclick="openMaterialModal()" id="materialsBtn"><i class="fas fa-boxes"></i> Склад</button>
                <button class="btn-primary" onclick="openWorkEditorModal()" id="workEditorBtn"><i class="fas fa-edit"></i> Работы</button>
                <button class="btn-primary" onclick="openContractEditorModal()" id="contractEditorBtn"><i class="fas fa-file-signature"></i> Контракты</button>
                <button class="btn-project" onclick="openProjectEditorModal()" id="projectEditorBtn"><i class="fas fa-project-diagram"></i> Проекты</button>
                <button class="btn-category" onclick="openCategoryEditorModal()" id="categoryEditorBtn"><i class="fas fa-tags"></i> Категории</button>
                <button class="btn-danger" onclick="resetProgressOnly()" id="resetProgressBtn"><i class="fas fa-redo"></i> Сброс прогресса</button>
                <button class="btn-primary" onclick="exportFullConfig()" id="exportBtn"><i class="fas fa-download"></i> Экспорт</button>
                <button class="btn-primary" onclick="document.getElementById('importFileInput').click()" id="importBtn"><i class="fas fa-upload"></i> Импорт</button>
                <input type="file" id="importFileInput" accept=".json" style="display: none;">
            </div>
        </div>

        <!-- ТАБЛИЦА РАБОТ -->
        <div class="table-container">
            <h3><i class="fas fa-list"></i> <span id="workTypeTitle">Работы</span></h3>
            <table class="work-table" id="workTable">
                <thead>
                <tr>
                    <th width="50">№</th>
                    <th>Вид работ</th>
                    <th width="200">Прогресс</th>
                    <th width="120">Не требуется</th>
                    <th width="150">Контракт</th>
                    <th width="100">Действия</th>
                </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <!-- МОДАЛЬНЫЕ ОКНА -->
    <div id="chartEditorModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
            <span class="close-modal" onclick="closeModal('chartEditorModal')">×</span>
            <h2><i class="fas fa-chart-pie"></i> Добавление диаграммы</h2>
            <div class="chart-editor-row">
                <select id="chartDataType" style="flex:2;">
                    <option value="category_progress">Прогресс по категории</option>
                    <option value="contract_progress">Прогресс по контрактам</option>
                    <option value="workers_by_house">Рабочие по дому</option>
                    <option value="completed_works">Завершенные работы</option>
                    <option value="photos_count">Количество фото</option>
                    <option value="materials_cost">Стоимость материалов</option>
                    <option value="materials_by_house">Материалы по домам</option>
                </select>
                <select id="chartCategory" style="flex:1;"></select>
                <input type="text" id="chartTitle" placeholder="Название" style="flex:2;">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn-success" onclick="addCustomChart()"><i class="fas fa-plus"></i> Добавить</button>
                <button class="btn-danger" onclick="closeModal('chartEditorModal')">Отмена</button>
            </div>
        </div>
    </div>

    <div id="materialsEditorModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
            <span class="close-modal" onclick="closeModal('materialsEditorModal')">×</span>
            <h2><i class="fas fa-boxes"></i> Редактор материалов</h2>
            <div id="materialsEditorContent"></div>
            <button class="btn-success" onclick="saveMaterialsByHouse()" style="margin-top: 20px;"><i class="fas fa-save"></i> Сохранить</button>
        </div>
    </div>

    <div id="photoModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('photoModal')">×</span>
            <h2><i class="fas fa-camera"></i> Фотографии: <span id="photoApartmentTitle"></span></h2>
            <div class="upload-area" onclick="document.getElementById('photoUploadInput').click();" id="photoUploadArea">
                <i class="fas fa-cloud-upload-alt" style="font-size: 32px;"></i>
                <p>Нажмите для загрузки фотографий</p>
                <input type="file" id="photoUploadInput" accept="image/*" multiple style="display: none;">
            </div>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <select id="photoWorkTypeSelect" style="flex:1; padding:8px; background:var(--input-bg); border:1px solid var(--border-color); color:var(--text-primary);"></select>
                <select id="photoFilterSelect" onchange="filterPhotos()" style="width:200px; padding:8px; background:var(--input-bg); border:1px solid var(--border-color); color:var(--text-primary);"></select>
            </div>
            <div class="photo-grid" id="photoGrid"></div>
            <div id="noPhotosMessage" style="text-align:center; padding:40px; display:none;">Нет фотографий</div>
        </div>
    </div>

    <div id="smartAlbumModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('smartAlbumModal')">×</span>
            <h2><i class="fas fa-film"></i> Фотоальбом проекта</h2>
            <div style="margin-bottom: 20px;">
                <select id="albumCategoryFilter" onchange="renderSmartAlbum()" style="padding:8px; background:var(--input-bg); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; margin-right:10px;">
                    <option value="all">Все категории</option>
                </select>
                <select id="albumHouseFilter" onchange="renderSmartAlbum()" style="padding:8px; background:var(--input-bg); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px;">
                    <option value="all">Все дома</option>
                </select>
            </div>
            <div id="smartAlbumContent" style="max-height:70vh; overflow-y:auto;"></div>
        </div>
    </div>

    <div id="allPhotosModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('allPhotosModal')">×</span>
            <h2><i class="fas fa-calendar-alt"></i> Все фотографии по датам</h2>
            <div id="allPhotosContainer" style="max-height:70vh; overflow-y:auto;"></div>
        </div>
    </div>

    <div id="photoViewerModal" class="modal photo-viewer-modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('photoViewerModal')">×</span>
            <div class="photo-viewer-container">
                <img id="photoViewerImage" src="" alt="">
                <div class="photo-viewer-info">
                    <p id="photoViewerCaption"></p>
                    <div class="photo-viewer-nav">
                        <button onclick="navigatePhoto(-1)"><i class="fas fa-chevron-left"></i> Предыдущее</button>
                        <button onclick="navigatePhoto(1)">Следующее <i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="materialModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('materialModal')">×</span>
            <h2><i class="fas fa-boxes"></i> Склад материалов</h2>
            <div class="upload-area" onclick="document.getElementById('materialFileInput').click();">
                <i class="fas fa-file-upload" style="font-size:32px;"></i>
                <p>Загрузите счет (.txt, .csv)</p>
                <input type="file" id="materialFileInput" accept=".txt,.csv" style="display:none;">
            </div>
            <button class="btn-success" onclick="addMaterialManually()" id="addMaterialBtn"><i class="fas fa-plus"></i> Добавить вручную</button>
            <table class="materials-table">
                <thead><tr><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th><th></th></tr></thead>
                <tbody id="materialsTableBody"></tbody>
                <tfoot><tr><td colspan="3" style="text-align:right;">ИТОГО:</td><td id="materialTotalSum">0 ₽</td><td></td></tr></tfoot>
            </table>
        </div>
    </div>

    <div id="progressModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('progressModal')">×</span>
            <h2>Сравнение прогресса</h2>
            <select id="workSelect" style="width:100%; margin:10px 0;"></select>
            <div style="display:flex; gap:10px; margin:20px 0;">
                <input type="number" id="massProgress" min="0" max="100" value="0">
                <button class="btn-success" onclick="applyMassProgress()" id="applyMassBtn">Применить</button>
            </div>
            <div id="housesComparison"></div>
        </div>
    </div>

    <div id="houseEditorModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('houseEditorModal')">×</span>
            <h2>Редактор домов</h2>
            <div id="houseEditorContainer"></div>
            <button class="btn-success" onclick="saveHouseEditor()">Сохранить</button>
        </div>
    </div>

    <div id="projectEditorModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('projectEditorModal')">×</span>
            <h2>Управление проектами</h2>
            <button class="btn-success" onclick="addNewProject()" id="addProjectBtn"><i class="fas fa-plus"></i> Новый проект</button>
            <div id="projectsList" class="projects-section"></div>
            <button class="btn-primary" onclick="saveProjects()">Сохранить</button>
        </div>
    </div>

    <div id="workEditorModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('workEditorModal')">×</span>
            <h2>Редактор работ: <span id="workEditorCategoryTitle"></span></h2>
            <button class="btn-success" onclick="addNewWork()" id="addWorkBtn"><i class="fas fa-plus"></i> Добавить</button>
            <table class="work-editor-table">
                <thead><tr><th>ID</th><th>Название</th><th>Тип</th><th></th></tr></thead>
                <tbody id="workEditorTableBody"></tbody>
            </table>
            <button class="btn-primary" onclick="saveWorkDefinitions()">Сохранить</button>
        </div>
    </div>

    <div id="contractEditorModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('contractEditorModal')">×</span>
            <h2>Редактор контрактов</h2>
            <button class="btn-success" onclick="addNewContract()" id="addContractBtn"><i class="fas fa-plus"></i> Добавить</button>
            <div class="group-contracts-section">
                <h3>Групповые контракты</h3>
                <div class="group-contract-row">
                    <select id="groupContractCategory"></select>
                    <select id="groupContractSelect"></select>
                    <button class="btn-success" onclick="assignGroupContract()">Назначить</button>
                    <button class="btn-warning" onclick="removeGroupContract()">Удалить</button>
                </div>
            </div>
            <div class="contracts-list" id="contractsList"></div>
            <button class="btn-primary" onclick="saveContracts()">Сохранить</button>
        </div>
    </div>

    <div id="paymentsModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('paymentsModal')">×</span>
            <h2>Платежи: <span id="paymentsContractName"></span></h2>
            <div style="display:flex; justify-content:space-between; margin:20px 0; padding:15px; background:var(--input-bg);">
                <div>Сумма: <span id="paymentsContractAmount">0 ₽</span></div>
                <div>Освоено: <span id="paymentsTotalSpent">0 ₽</span></div>
                <div>Остаток: <span id="paymentsRemaining">0 ₽</span></div>
            </div>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="date" id="paymentDate">
                <input type="number" id="paymentAmount" placeholder="Сумма">
                <input type="text" id="paymentComment" placeholder="Комментарий">
                <button class="btn-success" onclick="addPayment()" id="addPaymentBtn">Добавить</button>
            </div>
            <table class="materials-table">
                <thead><tr><th>Дата</th><th>Сумма</th><th>Комментарий</th><th></th></tr></thead>
                <tbody id="paymentsList"></tbody>
            </table>
        </div>
    </div>

    <div id="datePhotosModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('datePhotosModal')">×</span>
            <h2>Фотографии за <span id="datePhotosTitle"></span></h2>
            <div class="photo-grid" id="datePhotosGrid"></div>
        </div>
    </div>

    <div id="categoryEditorModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('categoryEditorModal')">×</span>
            <h2><i class="fas fa-tags"></i> Редактор категорий</h2>
            <button class="btn-success" onclick="addCategory()" id="addCategoryBtn"><i class="fas fa-plus"></i> Добавить категорию</button>
            <div id="categoriesList" class="projects-section" style="margin-top:20px;"></div>
            <button class="btn-primary" onclick="saveCategories()">Сохранить</button>
        </div>
    </div>

@endsection
