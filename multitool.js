(function() {
    const ID = 'god_mode_ui_v6';
    if (document.getElementById(ID)) { document.getElementById(ID).remove(); return; }

    // --- 1. ЛОГИ (LOG SNIFFER) ---
    window._logs = window._logs || [];
    const capture = (type, args) => {
        window._logs.push({
            type: type,
            time: new Date().toLocaleTimeString(),
            msg: Array.from(args).map(a => {
                try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } 
                catch(e) { return '[Cyclic/Object]'; }
            }).join(' ')
        });
    };
    // Перехватываем только если еще не перехвачено
    if (!window._console_hooked) {
        const origLog = console.log, origErr = console.error, origWarn = console.warn;
        console.log = function() { capture('LOG', arguments); origLog.apply(console, arguments); };
        console.error = function() { capture('ERROR', arguments); origErr.apply(console, arguments); };
        console.warn = function() { capture('WARN', arguments); origWarn.apply(console, arguments); };
        window._console_hooked = true;
    }

    // --- 2. СТИЛИ ---
    const style = `
        #${ID} { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,10,10,0.95); z-index: 2147483647; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; color-scheme: dark; }
        #${ID} * { box-sizing: border-box; }
        #${ID} header { padding: 12px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
        #${ID} .close-btn { background: #d32f2f; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        #${ID} .tabs { display: flex; background: #222; overflow-x: auto; border-bottom: 1px solid #333; flex-shrink: 0; }
        #${ID} .tab { flex: 1; padding: 12px; text-align: center; white-space: nowrap; cursor: pointer; font-size: 13px; border-bottom: 3px solid transparent; min-width: 60px; }
        #${ID} .tab.active { border-bottom-color: #00E676; color: #00E676; background: #2a2a2a; }
        #${ID} .content { flex: 1; overflow-y: auto; padding: 15px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-big { background: #333; color: #fff; border: 1px solid #444; padding: 12px; border-radius: 6px; font-size: 13px; font-weight: bold; text-align: center; cursor: pointer; }
        .btn-big:active { background: #555; border-color: #00E676; }
        .btn-sm { background: #444; border: 1px solid #555; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-left: 4px; cursor: pointer; }
        textarea.editor { width: 100%; background: #000; color: #0f0; border: 1px solid #333; font-family: monospace; font-size: 11px; margin-top: 5px; padding: 8px; outline: none; resize: vertical; min-height: 100px; }
        .log-item { font-family: monospace; font-size: 11px; border-bottom: 1px solid #222; padding: 4px 0; word-break: break-all; }
        .label { font-size: 11px; color: #aaa; margin-top: 15px; display: block; font-weight: bold; text-transform: uppercase; }
        .item-row { display: flex; justify-content: space-between; align-items: center; background: #1e1e1e; padding: 8px; margin-bottom: 5px; border-radius: 4px; border: 1px solid #333; }
        .item-name { font-size: 12px; word-break: break-all; margin-right: 10px; color: #ddd; }
        .cache-box { margin-bottom: 15px; border: 1px solid #333; border-radius: 5px; overflow: hidden; }
        .cache-header { background: #2a2a2a; padding: 10px; font-weight: bold; color: #00E676; display: flex; justify-content: space-between; align-items: center; }
    `;

    // --- 3. ИНТЕРФЕЙС ---
    const ui = document.createElement('div');
    ui.id = ID;
    ui.innerHTML = `<style>${style}</style>
        <header><span>🚀 TOOLKIT V6</span><button class="close-btn">ЗАКРЫТЬ</button></header>
        <div class="tabs">
            <div class="tab active" data-target="main">Пульт</div>
            <div class="tab" data-target="storage">Данные</div>
            <div class="tab" data-target="cache">Кэш/Файлы</div>
            <div class="tab" data-target="db">Базы</div>
            <div class="tab" data-target="logs">Логи</div>
        </div>
        <div class="content" id="ui_content"></div>`;
    document.body.appendChild(ui);

    ui.querySelector('.close-btn').onclick = () => ui.remove();

    // --- ГЛОБАЛЬНЫЕ ФУНКЦИИ (для onclick в HTML) ---
    window._tk_dl_cache = async (cName, url) => {
        try {
            const cache = await caches.open(cName);
            const resp = await cache.match(url);
            if (!resp) return alert('Файл не найден');
            const blob = await resp.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = url.split('/').pop() || 'downloaded_file';
            a.click();
        } catch(e) { alert('Ошибка: ' + e); }
    };

    window._tk_del_cache = async (cName, url) => {
        if(!confirm('Удалить этот файл из кеша?')) return;
        try {
            const cache = await caches.open(cName);
            await cache.delete(url);
            alert('Удалено. Обновите список.');
        } catch(e) { alert('Ошибка: ' + e); }
    };

    window._tk_upl_cache = (cName, url) => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const cache = await caches.open(cName);
                // Создаем Response из файла. Важно: тип контента должен совпадать
                const newResp = new Response(file, {
                    status: 200,
                    statusText: "OK",
                    headers: { 'Content-Type': file.type || 'application/octet-stream' }
                });
                await cache.put(url, newResp);
                alert('Файл подменен! Перезагрузите страницу для эффекта.');
            } catch(err) { alert('Ошибка подмены: ' + err); }
        };
        inp.click();
    };

    // --- РЕНДЕР КОНТЕНТА ---
    const render = (target) => {
        const cnt = document.getElementById('ui_content');
        cnt.innerHTML = '';
        
        // === Вкладка MAIN ===
        if(target === 'main') {
            cnt.innerHTML = `
                <div class="grid">
                    <div class="btn-big" id="fn_full">📺 Полный экран</div>
                    <div class="btn-big" id="fn_edit">✏️ Режим правки</div>
                    <div class="btn-big" id="fn_ua">📱 iOS UserAgent</div>
                    <div class="btn-big" id="fn_clean">🧹 Убрать фикс. эл.</div>
                    <div class="btn-big" id="fn_eruda" style="grid-column: span 2; background: #4a148c; border-color: #7c43bd;">🛠️ ЗАПУСТИТЬ ERUDA</div>
                </div>`;
            
            document.getElementById('fn_full').onclick = () => { document.documentElement.requestFullscreen(); ui.remove(); };
            document.getElementById('fn_edit').onclick = () => { 
                document.designMode = document.designMode === 'on' ? 'off' : 'on';
                ui.remove();
            };
            document.getElementById('fn_ua').onclick = () => {
                const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
                try {
                    Object.defineProperty(navigator, 'userAgent', { get: () => ua });
                    Object.defineProperty(navigator, 'platform', { get: () => 'iPhone' });
                    alert('iOS UA установлен (виртуально)');
                } catch(e) { alert('Браузер блокирует смену UA'); }
                ui.remove();
            };
            document.getElementById('fn_clean').onclick = () => {
                document.querySelectorAll('*').forEach(el => {
                    if (getComputedStyle(el).position === 'fixed' && el.id !== ID) el.remove();
                });
                ui.remove();
            };
            document.getElementById('fn_eruda').onclick = () => {
                const s = document.createElement('script');
                s.src = "https://cdn.jsdelivr.net/npm/eruda";
                s.onload = () => { eruda.init(); ui.remove(); };
                document.body.appendChild(s);
            };
        }

        // === Вкладка STORAGE (Local + Session + Cookies) ===
        if(target === 'storage') {
            cnt.innerHTML = `
                <span class="label">LocalStorage</span>
                <textarea id="ls_data" class="editor"></textarea>
                <button id="ls_save" class="btn-big" style="width:100%; margin: 5px 0;">💾 Сохранить LocalStorage</button>
                
                <span class="label">SessionStorage</span>
                <textarea id="ss_data" class="editor"></textarea>
                <button id="ss_save" class="btn-big" style="width:100%; margin: 5px 0;">💾 Сохранить SessionStorage</button>

                <span class="label">Cookies</span>
                <textarea id="ck_data" class="editor" style="height:60px;"></textarea>
                <button id="ck_save" class="btn-big" style="width:100%; margin: 5px 0;">💾 Обновить Cookies</button>
            `;
            
            // Helper to get formatted JSON
            const getStore = (s) => {
                const o = {};
                try {
                    Object.keys(s).sort().forEach(k => o[k] = s.getItem(k));
                    return JSON.stringify(o, null, 4);
                } catch(e) { return '{}'; }
            };

            document.getElementById('ls_data').value = getStore(localStorage);
            document.getElementById('ss_data').value = getStore(sessionStorage);
            document.getElementById('ck_data').value = document.cookie;

            const saveStore = (name, node, storageObj) => {
                document.getElementById(name).onclick = () => {
                    try {
                        const data = JSON.parse(document.getElementById(node).value);
                        storageObj.clear();
                        for(let k in data) storageObj.setItem(k, data[k]);
                        alert('Сохранено! Перезагружаю...');
                        location.reload();
                    } catch(e) { alert('Ошибка JSON: ' + e); }
                };
            };

            saveStore('ls_save', 'ls_data', localStorage);
            saveStore('ss_save', 'ss_data', sessionStorage);

            document.getElementById('ck_save').onclick = () => {
                document.cookie = document.getElementById('ck_data').value;
                alert('Куки обновлены');
            };
        }

        // === Вкладка CACHE (Новая) ===
        if(target === 'cache') {
            cnt.innerHTML = '<div style="text-align:center; margin-bottom:10px;"><button id="scan_cache" class="btn-big">📂 Сканировать кэш хранилища</button></div><div id="cache_list"></div>';
            
            document.getElementById('scan_cache').onclick = async () => {
                const list = document.getElementById('cache_list');
                list.innerHTML = 'Сканирование...';
                if (!window.caches) { list.innerHTML = 'Cache API не поддерживается'; return; }
                
                try {
                    const keys = await caches.keys();
                    list.innerHTML = '';
                    if (keys.length === 0) list.innerHTML = 'Кэшей не найдено.';
                    
                    for (const key of keys) {
                        const box = document.createElement('div');
                        box.className = 'cache-box';
                        // Заголовок кэша + кнопка удалить весь кэш
                        box.innerHTML = `<div class="cache-header">
                            <span>${key}</span>
                            <button class="btn-sm" style="background:red" onclick="caches.delete('${key}').then(()=>this.parentNode.parentNode.remove())">🗑</button>
                        </div>`;
                        
                        const contentBox = document.createElement('div');
                        contentBox.style.padding = '10px';
                        box.appendChild(contentBox);
                        list.appendChild(box);

                        // Листинг файлов внутри
                        const cache = await caches.open(key);
                        const requests = await cache.keys();
                        
                        if(requests.length > 50) contentBox.innerHTML = `<i>Слишком много файлов (${requests.length}). Показать все? <button class="btn-sm" onclick="this.parentNode.nextElementSibling.style.display='block';this.remove()">Да</button></i><div style="display:none"></div>`;
                        
                        const container = requests.length > 50 ? contentBox.lastElementChild : contentBox;

                        requests.forEach(req => {
                            const row = document.createElement('div');
                            row.className = 'item-row';
                            // Сокращаем URL для красоты
                            const urlShort = req.url.replace(location.origin, '');
                            row.innerHTML = `
                                <div class="item-name" title="${req.url}">${urlShort}</div>
                                <div style="flex-shrink:0">
                                    <button class="btn-sm" onclick="window._tk_dl_cache('${key}', '${req.url}')">⬇️</button>
                                    <button class="btn-sm" onclick="window._tk_upl_cache('${key}', '${req.url}')">✏️</button>
                                    <button class="btn-sm" style="color:#ff5555" onclick="window._tk_del_cache('${key}', '${req.url}')">✕</button>
                                </div>
                            `;
                            container.appendChild(row);
                        });
                    }
                } catch(e) { list.innerHTML = 'Ошибка доступа к Cache API: ' + e; }
            };
        }

        // === Вкладка DB (IndexedDB) ===
        if(target === 'db') {
            cnt.innerHTML = '<h3>IndexedDB</h3>';
            if(!indexedDB.databases) { cnt.innerHTML += 'Функция databases() не поддерживается браузером'; return; }
            
            // Глобальные хелперы для экспорта/импорта IDB (они должны быть доступны для onclick строк)
            window._exDB = (n, s) => {
                const req = indexedDB.open(n);
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    const tx = db.transaction(s, 'readonly');
                    tx.objectStore(s).getAll().onsuccess = (ev) => {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(new Blob([JSON.stringify(ev.target.result, null, 2)], {type:'application/json'}));
                        a.download = `${n}_${s}.json`; a.click();
                    };
                };
            };
            window._imDB = (n, s) => {
                const i = document.createElement('input'); i.type = 'file';
                i.onchange = (e) => {
                    const r = new FileReader();
                    r.onload = (re) => {
                        try {
                            const data = JSON.parse(re.target.result);
                            const req = indexedDB.open(n);
                            req.onsuccess = (ev) => {
                                const db = ev.target.result;
                                const tx = db.transaction(s, 'readwrite');
                                const os = tx.objectStore(s);
                                os.clear();
                                data.forEach(item => os.put(item));
                                alert('База импортирована!');
                            };
                        } catch(err) { alert('Ошибка JSON'); }
                    };
                    r.readAsText(e.target.files[0]);
                };
                i.click();
            };

            indexedDB.databases().then(dbs => {
                if(dbs.length === 0) cnt.innerHTML += 'Баз данных не найдено.';
                dbs.forEach(dbInfo => {
                    const box = document.createElement('div');
                    box.style.cssText = 'background:#1e1e1e; padding:10px; margin-bottom:10px; border-radius:5px; border:1px solid #333;';
                    box.innerHTML = `<b style="color:#00E676">${dbInfo.name}</b> <span style="font-size:10px; color:#888">v${dbInfo.version}</span>`;
                    cnt.appendChild(box);
                    
                    const req = indexedDB.open(dbInfo.name);
                    req.onsuccess = (e) => {
                        const db = e.target.result;
                        Array.from(db.objectStoreNames).forEach(sN => {
                            const row = document.createElement('div');
                            row.className = 'item-row';
                            row.style.marginTop = '5px';
                            row.innerHTML = `<span class="item-name">${sN}</span><div><button class="btn-sm" onclick="window._exDB('${dbInfo.name}','${sN}')">⬇️</button> <button class="btn-sm" onclick="window._imDB('${dbInfo.name}','${sN}')">⬆️</button></div>`;
                            box.appendChild(row);
                        });
                        db.close();
                    };
                });
            });
        }

        // === Вкладка LOGS ===
        if(target === 'logs') {
            cnt.innerHTML = `
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button id="log_clear" class="btn-big" style="flex:1;">ОЧИСТИТЬ</button>
                    <button id="log_re" class="btn-big" style="flex:1;">ОБНОВИТЬ</button>
                </div>
                <div id="log_container"></div>`;
            
            const renderLogs = () => {
                const box = document.getElementById('log_container');
                box.innerHTML = '';
                if(window._logs.length === 0) box.innerHTML = '<span style="color:#666">Логов пока нет</span>';
                window._logs.slice().reverse().forEach(l => {
                    const item = document.createElement('div');
                    item.className = 'log-item';
                    item.style.color = (l.type==='ERROR') ? '#ff5555' : (l.type==='WARN' ? '#ffb300' : '#00E676');
                    item.innerText = `[${l.time}] [${l.type}] ${l.msg}`;
                    box.appendChild(item);
                });
            };
            renderLogs();
            document.getElementById('log_clear').onclick = () => { window._logs = []; renderLogs(); };
            document.getElementById('log_re').onclick = renderLogs;
        }
    };

    // Переключение табов
    ui.querySelectorAll('.tab').forEach(t => {
        t.onclick = () => {
            ui.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            render(t.dataset.target);
        };
    });

    // Старт
    render('main');
})();
