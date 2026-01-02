(function() {
    const ID = 'god_mode_ui';
    if (document.getElementById(ID)) { document.getElementById(ID).remove(); return; }

    // --- 1. ПЕРЕХВАТ КОНСОЛИ (LOG SNIFFER) ---
    window._logs = window._logs || [];
    const capture = (type, args) => {
        window._logs.push({
            type: type,
            time: new Date().toLocaleTimeString(),
            msg: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
        });
    };
    const origLog = console.log, origErr = console.error, origWarn = console.warn;
    console.log = function() { capture('LOG', arguments); origLog.apply(console, arguments); };
    console.error = function() { capture('ERROR', arguments); origErr.apply(console, arguments); };
    console.warn = function() { capture('WARN', arguments); origWarn.apply(console, arguments); };

    // --- 2. СТИЛИ ---
    const style = `
        #${ID} { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,10,10,0.95); z-index: 1000000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; color-scheme: light !important; }
        #${ID} header { padding: 15px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
        #${ID} .close-btn { background: #ff4444; color: #fff; border: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; }
        #${ID} .tabs { display: flex; background: #222; overflow-x: auto; border-bottom: 1px solid #333; }
        #${ID} .tab { flex: 1; padding: 12px; text-align: center; white-space: nowrap; cursor: pointer; font-size: 13px; border-bottom: 3px solid transparent; }
        #${ID} .tab.active { border-bottom-color: #00E676; color: #00E676; background: #2a2a2a; }
        #${ID} .content { flex: 1; overflow-y: auto; padding: 15px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-big { background: #333; color: #fff; border: 1px solid #444; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; text-align: center; }
        .btn-big:active { background: #444; border-color: #00E676; }
        textarea.editor { width: 100%; background: #000; color: #0f0; border: 1px solid #333; font-family: monospace; font-size: 11px; margin-top: 5px; padding: 8px; box-sizing: border-box; outline: none; }
        .log-item { font-family: monospace; font-size: 11px; border-bottom: 1px solid #222; padding: 5px 0; word-break: break-all; }
        .label { font-size: 11px; color: #888; margin-top: 10px; display: block; font-weight: bold; }
    `;

    // --- 3. ИНТЕРФЕЙС ---
    const ui = document.createElement('div');
    ui.id = ID;
    ui.innerHTML = `<style>${style}</style>
        <header><span>🚀 TOOLKIT V5</span><button class="close-btn">ЗАКРЫТЬ</button></header>
        <div class="tabs">
            <div class="tab active" data-target="main">Пульт</div>
            <div class="tab" data-target="storage">Данные</div>
            <div class="tab" data-target="db">Базы</div>
            <div class="tab" data-target="logs">Логи</div>
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
                    <div class="btn-big" id="fn_full">📺 Экран</div>
                    <div class="btn-big" id="fn_edit">✏️ Правка</div>
                    <div class="btn-big" id="fn_ua">📱 iOS UA</div>
                    <div class="btn-big" id="fn_clean">🧹 Очистка</div>
                    <div class="btn-big" id="fn_eruda" style="grid-column: span 2; background: #4a148c;">🛠️ ЗАПУСТИТЬ ERUDA (CONSOLE)</div>
                </div>`;
            
            document.getElementById('fn_full').onclick = () => { document.documentElement.requestFullscreen(); ui.remove(); };
            document.getElementById('fn_edit').onclick = () => { 
                let s = document.designMode === 'on';
                document.designMode = s ? 'off' : 'on';
                document.body.contentEditable = !s;
                ui.remove();
            };
            document.getElementById('fn_ua').onclick = () => {
                const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
                Object.defineProperty(navigator, 'userAgent', { get: () => ua });
                Object.defineProperty(navigator, 'platform', { get: () => 'iPhone' });
                alert('iOS UA применен'); ui.remove();
            };
            document.getElementById('fn_clean').onclick = () => {
                document.querySelectorAll('*').forEach(el => {
                    if (getComputedStyle(el).position === 'fixed') el.remove();
                });
                ui.remove();
            };
            document.getElementById('fn_eruda').onclick = () => {
                const s = document.createElement('script');
                s.src = "https://cdn.jsdelivr.net/npm/eruda";
                document.body.appendChild(s);
                s.onload = () => { eruda.init(); ui.remove(); };
            };
        }

        if(target === 'storage') {
            cnt.innerHTML = `
                <span class="label">LocalStorage (Сортировка: 0-9, A-Z)</span>
                <textarea id="ls_data" class="editor" style="height:220px; border-left: 3px solid #00E676;"></textarea>
                <button id="ls_save" class="btn-big" style="width:100%; margin: 5px 0 10px 0; border-color:#00E676;">💾 СОХРАНИТЬ И ОБНОВИТЬ</button>
                <span class="label">Cookies (Raw)</span>
                <textarea id="ck_data" class="editor" style="height:80px;"></textarea>
                <button id="ck_save" class="btn-big" style="width:100%; margin-top:5px;">💾 ОБНОВИТЬ COOKIES</button>`;
            
            const ls = {};
            Object.keys(localStorage).sort().forEach(k => ls[k] = localStorage.getItem(k));
            document.getElementById('ls_data').value = JSON.stringify(ls, null, 4);
            document.getElementById('ck_data').value = document.cookie;

            document.getElementById('ls_save').onclick = () => {
                try {
                    const data = JSON.parse(document.getElementById('ls_data').value);
                    localStorage.clear();
                    for(let k in data) localStorage.setItem(k, data[k]);
                    location.reload();
                } catch(e) { alert('Ошибка в JSON!'); }
            };
            document.getElementById('ck_save').onclick = () => {
                document.cookie = document.getElementById('ck_data').value;
                alert('Cookies обновлены');
            };
        }

        if(target === 'db') {
            cnt.innerHTML = '<h3>IndexedDB Explorer</h3>';
            if(!indexedDB.databases) { cnt.innerHTML += 'IDB не поддерживается'; return; }
            indexedDB.databases().then(dbs => {
                dbs.forEach(dbInfo => {
                    const box = document.createElement('div');
                    box.style.cssText = 'background:#1a1a1a; padding:10px; margin-bottom:10px; border-radius:5px;';
                    box.innerHTML = `<b style="color:#00E676">${dbInfo.name}</b>`;
                    cnt.appendChild(box);
                    const req = indexedDB.open(dbInfo.name);
                    req.onsuccess = (e) => {
                        const db = e.target.result;
                        Array.from(db.objectStoreNames).forEach(sN => {
                            const row = document.createElement('div');
                            row.style.cssText = 'display:flex; justify-content:space-between; margin-top:5px; border-top:1px solid #222; padding-top:5px; font-size:12px;';
                            row.innerHTML = `<span>${sN}</span><div><button onclick="window._exDB('${dbInfo.name}','${sN}')">⬇️</button> <button onclick="window._imDB('${dbInfo.name}','${sN}')">⬆️</button></div>`;
                            box.appendChild(row);
                        });
                    };
                });
            });
        }

        if(target === 'logs') {
            cnt.innerHTML = '<button id="log_clear" class="btn-big" style="width:100%; margin-bottom:10px;">ОЧИСТИТЬ ЛОГИ</button>';
            const lBox = document.createElement('div');
            window._logs.forEach(l => {
                const item = document.createElement('div');
                item.className = 'log-item';
                item.style.color = (l.type==='ERROR') ? '#ff4444' : (l.type==='WARN' ? '#ffb300' : '#00ff00');
                item.innerText = `[${l.time}] [${l.type}] ${l.msg}`;
                lBox.appendChild(item);
            });
            cnt.appendChild(lBox);
            document.getElementById('log_clear').onclick = () => { window._logs = []; render('logs'); };
        }
    };

    // Глобальные хелперы для кнопок в HTML строках
    window._exDB = (n, s) => {
        indexedDB.open(n).onsuccess = (e) => {
            e.target.result.transaction(s, 'readonly').objectStore(s).getAll().onsuccess = (ev) => {
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
                const data = JSON.parse(re.target.result);
                indexedDB.open(n).onsuccess = (ev) => {
                    const tx = ev.target.result.transaction(s, 'readwrite');
                    tx.objectStore(s).clear();
                    data.forEach(item => tx.objectStore(s).put(item));
                    alert('Готово!');
                };
            };
            r.readAsText(e.target.files[0]);
        };
        i.click();
    };

    ui.querySelectorAll('.tab').forEach(t => {
        t.onclick = () => {
            ui.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            render(t.dataset.target);
        };
    });

    render('main');
})();
