(function() {
    const ID = 'god_mode_ui';
    if (document.getElementById(ID)) { document.getElementById(ID).remove(); return; }

    const style = `
        #${ID} { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,10,10,0.95); z-index: 1000000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; color-scheme: light !important; }
        #${ID} header { padding: 15px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
        #${ID} .close-btn { background: #ff4444; color: #fff; border: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; }
        #${ID} .tabs { display: flex; background: #222; overflow-x: auto; }
        #${ID} .tab { flex: 1; padding: 12px; text-align: center; white-space: nowrap; cursor: pointer; font-size: 14px; border-bottom: 3px solid transparent; }
        #${ID} .tab.active { border-bottom-color: #00E676; color: #00E676; background: #2a2a2a; }
        #${ID} .content { flex: 1; overflow-y: auto; padding: 15px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-big { background: #333; color: #fff; border: 1px solid #444; padding: 15px; border-radius: 8px; font-size: 14px; font-weight: bold; text-align: center; }
        .btn-big:active { background: #444; border-color: #00E676; }
        textarea.editor { width: 100%; background: #000; color: #0f0; border: 1px solid #333; font-family: monospace; font-size: 12px; margin-top: 5px; padding: 8px; box-sizing: border-box; }
        .db-item { background: #1a1a1a; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #333; }
        .store-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-top: 1px solid #222; }
        .label { font-size: 12px; color: #888; margin-top: 10px; display: block; }
    `;

    const ui = document.createElement('div');
    ui.id = ID;
    ui.innerHTML = `<style>${style}</style>
        <header><span>🚀 BROWSER TOOLKIT V4</span><button class="close-btn">ЗАКРЫТЬ</button></header>
        <div class="tabs">
            <div class="tab active" data-target="main">Пульт</div>
            <div class="tab" data-target="storage">Хранилище</div>
            <div class="tab" data-target="db">Базы (IDB)</div>
        </div>
        <div class="content" id="ui_content"></div>`;
    document.body.appendChild(ui);

    ui.querySelector('.close-btn').onclick = () => ui.remove();

    const render = (target) => {
        const cnt = document.getElementById('ui_content');
        cnt.innerHTML = '';
        
        if(target === 'main') {
            cnt.innerHTML = `
                <div class="grid">
                    <div class="btn-big" id="fn_full">📺 Полный экран</div>
                    <div class="btn-big" id="fn_edit">✏️ Режим правки</div>
                    <div class="btn-big" id="fn_ua">📱 iOS UserAgent</div>
                    <div class="btn-big" id="fn_clean">🧹 Очистка (Fixed)</div>
                </div>`;
            
            document.getElementById('fn_full').onclick = () => { document.documentElement.requestFullscreen(); ui.remove(); };
            document.getElementById('fn_edit').onclick = () => { 
                let s = document.designMode === 'on';
                document.designMode = s ? 'off' : 'on';
                document.body.contentEditable = !s;
                alert('Редактирование: ' + (s ? 'ВЫКЛ' : 'ВКЛ'));
                ui.remove();
            };
            document.getElementById('fn_ua').onclick = () => {
                const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
                Object.defineProperty(navigator, 'userAgent', { get: () => ua });
                Object.defineProperty(navigator, 'platform', { get: () => 'iPhone' });
                alert('UA подменен на iPhone (до релоада)');
                ui.remove();
            };
            document.getElementById('fn_clean').onclick = () => {
                document.querySelectorAll('*').forEach(el => {
                    if (getComputedStyle(el).position === 'fixed') el.remove();
                });
                ui.remove();
            };
        }

        if(target === 'storage') {
    cnt.innerHTML = `
        <span class="label">📝 LocalStorage (Сортировка: А-Я)</span>
        <textarea id="ls_data" class="editor" style="height:250px; border: 2px solid #00E676;"></textarea>
        <button id="ls_save" class="btn-big" style="width:100%; margin-top:5px; background:#004D40;">💾 СОХРАНИТЬ И ПЕРЕЗАГРУЗИТЬ</button>
        
        <span class="label">🍪 Cookies (Текст)</span>
        <textarea id="ck_data" class="editor" style="height:80px;"></textarea>
        <button id="ck_save" class="btn-big" style="width:100%; margin-top:5px;">💾 ОБНОВИТЬ COOKIES</button>
    `;
    
    // Сбор данных с сортировкой
    const ls = {};
    Object.keys(localStorage).sort().forEach(k => {
        ls[k] = localStorage.getItem(k);
    });

    // Добавляем визуальные разделители в начало и конец JSON для удобства
    const rawJson = JSON.stringify(ls, null, 4);
    document.getElementById('ls_data').value = rawJson;

    document.getElementById('ls_save').onclick = () => {
        try {
            const data = JSON.parse(document.getElementById('ls_data').value);
            localStorage.clear();
            for(let k in data) localStorage.setItem(k, data[k]);
            location.reload();
        } catch(e) { alert('ОШИБКА В JSON! Проверь запятые и кавычки.'); }
    };
    
    document.getElementById('ck_data').value = document.cookie;
    document.getElementById('ck_save').onclick = () => {
        document.cookie = document.getElementById('ck_data').value;
        alert('Cookies записаны');
    };
}

        if(target === 'db') {
            cnt.innerHTML = '<h3>IndexedDB Explorer</h3>';
            if(!indexedDB.databases) { cnt.innerHTML += 'Не поддерживается'; return; }
            indexedDB.databases().then(dbs => {
                dbs.forEach(dbInfo => {
                    const box = document.createElement('div');
                    box.className = 'db-item';
                    box.innerHTML = `<b style="color:#00E676">${dbInfo.name}</b>`;
                    const list = document.createElement('div');
                    box.appendChild(list);
                    cnt.appendChild(box);

                    const req = indexedDB.open(dbInfo.name);
                    req.onsuccess = (e) => {
                        const db = e.target.result;
                        Array.from(db.objectStoreNames).forEach(sName => {
                            const row = document.createElement('div');
                            row.className = 'store-item';
                            row.innerHTML = `<span>${sName}</span><div><button id="ex_${dbInfo.name}_${sName}">⬇️</button><button id="im_${dbInfo.name}_${sName}">⬆️</button></div>`;
                            list.appendChild(row);
                            
                            // Логика экспорта/импорта (аналогично v3)
                            document.getElementById(`ex_${dbInfo.name}_${sName}`).onclick = () => exportDB(dbInfo.name, sName);
                            document.getElementById(`im_${dbInfo.name}_${sName}`).onclick = () => importDB(dbInfo.name, sName);
                        });
                    };
                });
            });
        }
    };

    // Функции экспорта/импорта (как в прошлом сообщении)
    function exportDB(n, s) {
        const req = indexedDB.open(n);
        req.onsuccess = (e) => {
            const db = e.target.result;
            db.transaction(s, 'readonly').objectStore(s).getAll().onsuccess = (ev) => {
                const blob = new Blob([JSON.stringify(ev.target.result, null, 2)], {type: 'application/json'});
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `${n}_${s}.json`; a.click();
            };
        };
    }

    function importDB(n, s) {
        const i = document.createElement('input'); i.type = 'file';
        i.onchange = (e) => {
            const f = e.target.files[0];
            const r = new FileReader();
            r.onload = (re) => {
                const data = JSON.parse(re.target.result);
                const req = indexedDB.open(n);
                req.onsuccess = (ev) => {
                    const db = ev.target.result;
                    const tx = db.transaction(s, 'readwrite');
                    const store = tx.objectStore(s);
                    store.clear();
                    data.forEach(item => store.put(item));
                    tx.oncomplete = () => alert('Готово! Перезагрузите страницу.');
                };
            };
            r.readAsText(f);
        };
        i.click();
    }

    ui.querySelectorAll('.tab').forEach(t => {
        t.onclick = () => {
            ui.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            render(t.dataset.target);
        };
    });

    render('main');
})();
