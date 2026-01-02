(function() {
    // --- 1. ПРОВЕРКА И ОЧИСТКА ---
    const ID = 'god_mode_ui';
    if (document.getElementById(ID)) {
        document.getElementById(ID).remove();
        return;
    }

    // --- 2. СТИЛИ И UI ---
    const style = `
        #${ID} {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.92); z-index: 1000000;
            color: #fff; font-family: monospace; display: flex; flex-direction: column;
            backdrop-filter: blur(5px);
        }
        #${ID} header {
            padding: 15px; background: #222; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444;
        }
        #${ID} .close-btn {
            background: #ff4444; color: white; border: none; padding: 5px 15px; border-radius: 4px; font-weight: bold;
        }
        #${ID} .tabs {
            display: flex; background: #333;
        }
        #${ID} .tab {
            flex: 1; padding: 15px; text-align: center; cursor: pointer; border-bottom: 2px solid transparent;
        }
        #${ID} .tab.active {
            border-bottom: 2px solid #00E676; background: #444; color: #00E676;
        }
        #${ID} .content {
            flex: 1; overflow-y: auto; padding: 15px;
        }
        .db-item {
            background: #2a2a2a; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #444;
        }
        .db-name { color: #00E676; font-weight: bold; margin-bottom: 5px; }
        .store-list { margin-left: 10px; margin-top: 5px; }
        .store-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px; border-top: 1px solid #333; font-size: 12px;
        }
        .btn {
            background: #444; color: #fff; border: 1px solid #666; padding: 5px 10px; border-radius: 3px; margin-left: 5px;
        }
        .btn-action { background: #007bff; border-color: #0056b3; }
        .btn-danger { background: #dc3545; border-color: #bd2130; }
        textarea.json-editor {
            width: 100%; height: 300px; background: #111; color: #0f0; border: 1px solid #333; font-family: monospace; font-size: 11px;
        }
    `;

    const ui = document.createElement('div');
    ui.id = ID;
    ui.innerHTML = `<style>${style}</style>
        <header>
            <span>🛠️ GOD MODE</span>
            <button class="close-btn">X</button>
        </header>
        <div class="tabs">
            <div class="tab active" data-target="tab-db">IndexedDB</div>
            <div class="tab" data-target="tab-ls">LocalStorage</div>
            <div class="tab" data-target="tab-info">Info</div>
        </div>
        <div class="content" id="tab-content">Загрузка...</div>
    `;
    document.body.appendChild(ui);

    // Закрытие
    ui.querySelector('.close-btn').onclick = () => ui.remove();

    // Переключение табов
    const tabs = ui.querySelectorAll('.tab');
    tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        renderTab(t.dataset.target);
    });

    // --- 3. ЛОГИКА INDEXED DB ---
    async function getDBs() {
        if (!indexedDB.databases) return [];
        return await indexedDB.databases();
    }

    function exportStore(dbName, storeName) {
        const req = indexedDB.open(dbName);
        req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            store.getAll().onsuccess = (ev) => {
                const data = ev.target.result;
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${dbName}_${storeName}.json`;
                a.click();
            };
        };
    }

    function importStore(dbName, storeName) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (rev) => {
                try {
                    const data = JSON.parse(rev.target.result);
                    if (!Array.isArray(data)) throw new Error("JSON должен быть массивом объектов!");
                    
                    const req = indexedDB.open(dbName);
                    req.onsuccess = (ev) => {
                        const db = ev.target.result;
                        const tx = db.transaction(storeName, 'readwrite');
                        const store = tx.objectStore(storeName);
                        
                        store.clear(); // Очищаем старое
                        data.forEach(item => store.put(item)); // Записываем новое
                        
                        tx.oncomplete = () => alert(`✅ Успешно импортировано ${data.length} записей! Обнови страницу.`);
                    };
                } catch (err) {
                    alert('❌ Ошибка JSON: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async function renderIndexedDB(container) {
        container.innerHTML = '<h3>📂 Базы данных сайта</h3>';
        const dbs = await getDBs();
        
        if (dbs.length === 0) {
            container.innerHTML += '<p>Базы данных не найдены.</p>';
            return;
        }

        for (const dbInfo of dbs) {
            const div = document.createElement('div');
            div.className = 'db-item';
            div.innerHTML = `<div class="db-name">🗄️ ${dbInfo.name} (v${dbInfo.version})</div>`;
            
            const storeList = document.createElement('div');
            storeList.className = 'store-list';
            div.appendChild(storeList);
            container.appendChild(div);

            // Открываем БД чтобы узнать таблицы
            const req = indexedDB.open(dbInfo.name);
            req.onsuccess = (e) => {
                const db = e.target.result;
                const names = Array.from(db.objectStoreNames);
                if (names.length === 0) storeList.innerHTML = '<i>Пусто</i>';
                
                names.forEach(storeName => {
                    const row = document.createElement('div');
                    row.className = 'store-item';
                    row.innerHTML = `<span>📄 ${storeName}</span>`;
                    
                    const btnGroup = document.createElement('div');
                    
                    // Кнопка Экспорт
                    const btnExp = document.createElement('button');
                    btnExp.className = 'btn btn-action';
                    btnExp.innerText = '⬇️ JSON';
                    btnExp.onclick = () => exportStore(dbInfo.name, storeName);
                    
                    // Кнопка Импорт
                    const btnImp = document.createElement('button');
                    btnImp.className = 'btn btn-danger';
                    btnImp.innerText = '⬆️ Load';
                    btnImp.onclick = () => importStore(dbInfo.name, storeName);

                    btnGroup.append(btnExp, btnImp);
                    row.appendChild(btnGroup);
                    storeList.appendChild(row);
                });
            };
        }
    }

    // --- 4. ЛОГИКА LOCALSTORAGE ---
    function renderLocalStorage(container) {
        container.innerHTML = '<h3>📝 LocalStorage Editor</h3>';
        
        const area = document.createElement('textarea');
        area.className = 'json-editor';
        
        const data = {};
        for(let key in localStorage) {
            if(localStorage.hasOwnProperty(key)) data[key] = localStorage.getItem(key);
        }
        area.value = JSON.stringify(data, null, 2);
        
        const btnSave = document.createElement('button');
        btnSave.className = 'btn btn-action';
        btnSave.style.width = '100%';
        btnSave.style.marginTop = '10px';
        btnSave.style.padding = '10px';
        btnSave.innerText = '💾 Сохранить LocalStorage и обновить';
        btnSave.onclick = () => {
            try {
                const newData = JSON.parse(area.value);
                localStorage.clear();
                for (let k in newData) localStorage.setItem(k, newData[k]);
                location.reload();
            } catch (e) { alert('Ошибка JSON: ' + e); }
        };

        container.append(area, btnSave);
    }

    // --- 5. РОУТЕР ТАБОВ ---
    function renderTab(tabName) {
        const c = document.getElementById('tab-content');
        c.innerHTML = '';
        if (tabName === 'tab-db') renderIndexedDB(c);
        if (tabName === 'tab-ls') renderLocalStorage(c);
        if (tabName === 'tab-info') {
            c.innerHTML = `
                <h3>ℹ️ О скрипте</h3>
                <p>User Agent: ${navigator.userAgent}</p>
                <p>Cookie Length: ${document.cookie.length}</p>
                <p>URL: ${location.href}</p>
                <button class="btn" onclick="document.querySelectorAll('*').forEach(x=>{if(getComputedStyle(x).position==='fixed')x.remove()})">🧹 Удалить липкое</button>
            `;
        }
    }

    // Старт
    renderTab('tab-db');
})();
