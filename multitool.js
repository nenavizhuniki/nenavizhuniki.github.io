(function() {
    const ID = 'multitool_v6_3';
    const old = document.getElementById(ID);
    if (old) { old.remove(); return; }

    // --- ЛОГИ ---
    window._logs = window._logs || [];
    if (!window._console_hooked) {
        const cap = (t, a) => window._logs.push({t, time: new Date().toLocaleTimeString(), m: Array.from(a).map(x => String(x)).join(' ')});
        const oL=console.log, oE=console.error;
        console.log=function(){ cap('LOG', arguments); oL.apply(console, arguments); };
        console.error=function(){ cap('ERR', arguments); oE.apply(console, arguments); };
        window._console_hooked = true;
    }

    const ui = document.createElement('div');
    ui.id = ID;
    ui.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0a0a0a;z-index:2147483647;color:#0f0;font-family:monospace;display:flex;flex-direction:column;font-size:12px;';
    
    ui.innerHTML = `
        <div style="background:#222;padding:10px;display:flex;justify-content:space-between;border-bottom:1px solid #0f0">
            <b>TOOLKIT V6.3</b>
            <button id="close_mtl" style="background:red;color:white;border:none;padding:5px 10px;">EXIT</button>
        </div>
        <div style="display:flex;background:#111;overflow-x:auto;border-bottom:1px solid #333;">
            <div class="mtl-tab" data-t="main" style="padding:12px;flex:1;text-align:center;cursor:pointer;border-bottom:2px solid #0f0">CORE</div>
            <div class="mtl-tab" data-t="data" style="padding:12px;flex:1;text-align:center;cursor:pointer">DATA</div>
            <div class="mtl-tab" data-t="files" style="padding:12px;flex:1;text-align:center;cursor:pointer">FILES</div>
            <div class="mtl-tab" data-t="db" style="padding:12px;flex:1;text-align:center;cursor:pointer">DB</div>
            <div class="mtl-tab" data-t="logs" style="padding:12px;flex:1;text-align:center;cursor:pointer">LOGS</div>
        </div>
        <div id="mtl_cnt" style="flex:1;overflow:auto;padding:10px;"></div>
    `;

    document.body.appendChild(ui);
    ui.querySelector('#close_mtl').onclick = () => ui.remove();

    const cnt = ui.querySelector('#mtl_cnt');

    // Функция отрисовки
    const show = async (target) => {
        cnt.innerHTML = '';
        
        if (target === 'main') {
            const d = document.createElement('div');
            d.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <button class="b-big" id="btn_fs">FULLSCREEN</button>
                    <button class="b-big" id="btn_ed">EDIT MODE</button>
                    <button class="b-big" id="btn_ua">IOS UA</button>
                    <button class="b-big" id="btn_cl">CLEAN FIX</button>
                    <button class="b-big" id="btn_er" style="grid-column:span 2;background:#300;color:white;border-color:red">LAUNCH ERUDA (CONSOLE)</button>
                </div>
                <style>.b-big{background:#111;color:#0f0;border:1px solid #0f0;padding:15px 5px;font-family:monospace;font-weight:bold;}</style>
            `;
            cnt.appendChild(d);
            
            d.querySelector('#btn_fs').onclick = () => { document.documentElement.requestFullscreen(); ui.remove(); };
            d.querySelector('#btn_ed').onclick = () => { document.designMode = document.designMode === 'on' ? 'off' : 'on'; ui.remove(); };
            d.querySelector('#btn_ua').onclick = () => {
                Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', configurable: true });
                alert('UA set to iOS');
            };
            d.querySelector('#btn_cl').onclick = () => {
                document.querySelectorAll('*').forEach(el => { if(getComputedStyle(el).position === 'fixed' && el.id !== ID) el.remove(); });
            };
            d.querySelector('#btn_er').onclick = () => {
                const s = document.createElement('script'); s.src = "//cdn.jsdelivr.net/npm/eruda";
                s.onload = () => { eruda.init(); ui.remove(); };
                document.body.appendChild(s);
            };
        }

        if (target === 'data') {
            const getJson = (s) => { let o={}; Object.keys(s).sort().forEach(k=>o[k]=s.getItem(k)); return JSON.stringify(o,null,2); };
            cnt.innerHTML = `
                <p style="color:#888;margin:0">LOCAL STORAGE</p>
                <textarea id="ed_ls" style="width:100%;height:120px;background:#000;color:#0f0;border:1px solid #0f0;font-family:monospace">${getJson(localStorage)}</textarea>
                <button id="sv_ls" style="width:100%;padding:10px;margin-bottom:15px">SAVE & RELOAD</button>
                
                <p style="color:#888;margin:0">SESSION STORAGE</p>
                <textarea id="ed_ss" style="width:100%;height:120px;background:#000;color:#0f0;border:1px solid #0f0;font-family:monospace">${getJson(sessionStorage)}</textarea>
                <button id="sv_ss" style="width:100%;padding:10px">SAVE & RELOAD</button>
            `;
            const save = (areaId, store) => {
                try {
                    const data = JSON.parse(document.getElementById(areaId).value);
                    store.clear(); Object.keys(data).forEach(k => store.setItem(k, data[k]));
                    location.reload();
                } catch(e) { alert('JSON ERROR'); }
            };
            cnt.querySelector('#sv_ls').onclick = () => save('ed_ls', localStorage);
            cnt.querySelector('#sv_ss').onclick = () => save('ed_ss', sessionStorage);
        }

        if (target === 'files') {
            cnt.innerHTML = 'Scanning Cache...';
            const keys = await caches.keys();
            cnt.innerHTML = keys.length ? '' : 'No cache storage.';
            for (const k of keys) {
                const openCache = await caches.open(k);
                const items = await openCache.keys();
                const div = document.createElement('div');
                div.style.marginBottom = '15px';
                div.innerHTML = `<div style="background:#222;padding:5px;color:#0f0">📂 ${k} (${items.length})</div>`;
                
                const list = document.createElement('div');
                list.style.display = items.length > 20 ? 'none' : 'block';
                
                if (items.length > 20) {
                    const btnShow = document.createElement('button');
                    btnShow.innerText = 'Show all files';
                    btnShow.style.width = '100%';
                    btnShow.onclick = () => { list.style.display = 'block'; btnShow.remove(); };
                    div.appendChild(btnShow);
                }

                items.forEach(req => {
                    const row = document.createElement('div');
                    row.style.display = 'flex'; row.style.justifyContent='space-between'; row.style.padding='5px'; row.style.borderBottom='1px solid #222';
                    row.innerHTML = `<span style="font-size:10px;overflow:hidden;max-width:70%">${req.url.split('/').pop() || req.url}</span>`;
                    const acts = document.createElement('div');
                    
                    const btnDl = document.createElement('button'); btnDl.innerText = '⬇️';
                    btnDl.onclick = async () => {
                        const r = await openCache.match(req.url);
                        const b = await r.blob();
                        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'file'; a.click();
                    };
                    
                    const btnUp = document.createElement('button'); btnUp.innerText = '✏️';
                    btnUp.onclick = () => {
                        const i = document.createElement('input'); i.type = 'file';
                        i.onchange = async () => {
                            const f = i.files[0];
                            await openCache.put(req.url, new Response(f, {headers: {'Content-Type': f.type}}));
                            alert('Substituted!');
                        }; i.click();
                    };

                    acts.appendChild(btnDl); acts.appendChild(btnUp);
                    row.appendChild(acts);
                    list.appendChild(row);
                });
                div.appendChild(list);
                cnt.appendChild(div);
            }
        }

        if (target === 'db') {
            if (!indexedDB.databases) { cnt.innerHTML = 'Browser not supported'; return; }
            const dbs = await indexedDB.databases();
            cnt.innerHTML = dbs.length ? '' : 'No IndexedDB found.';
            for (const dbInfo of dbs) {
                const box = document.createElement('div');
                box.style.background = '#111'; box.style.padding = '10px'; box.style.marginBottom = '10px';
                box.innerHTML = `<b>${dbInfo.name}</b><br>`;
                
                const openReq = indexedDB.open(dbInfo.name);
                openReq.onsuccess = (e) => {
                    const db = e.target.result;
                    Array.from(db.objectStoreNames).forEach(storeName => {
                        const row = document.createElement('div');
                        row.style.display='flex'; row.style.justifyContent='space-between'; row.style.marginTop='5px';
                        row.innerHTML = `<span style="color:#888">${storeName}</span>`;
                        const btnEx = document.createElement('button'); btnEx.innerText = 'Export';
                        btnEx.onclick = () => {
                            db.transaction(storeName, 'readonly').objectStore(storeName).getAll().onsuccess = (ev) => {
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(new Blob([JSON.stringify(ev.target.result, null, 2)], {type:'application/json'}));
                                a.download = `${dbInfo.name}_${storeName}.json`; a.click();
                            };
                        };
                        row.appendChild(btnEx);
                        box.appendChild(row);
                    });
                    db.close();
                };
                cnt.appendChild(box);
            }
        }

        if (target === 'logs') {
            const bCl = document.createElement('button'); bCl.innerText = 'CLEAR LOGS';
            bCl.style.width='100%'; bCl.style.padding='10px';
            bCl.onclick = () => { window._logs = []; show('logs'); };
            cnt.appendChild(bCl);
            window._logs.slice().reverse().forEach(l => {
                const el = document.createElement('div');
                el.style.cssText = 'border-bottom:1px solid #222;padding:5px;font-size:10px;';
                el.style.color = l.t === 'ERR' ? 'red' : '#0f0';
                el.innerText = `[${l.time}] ${l.m}`;
                cnt.appendChild(el);
            });
        }
    };

    // Логика табов
    ui.querySelectorAll('.mtl-tab').forEach(tab => {
        tab.onclick = () => {
            ui.querySelectorAll('.mtl-tab').forEach(t => t.style.borderBottom = 'none');
            tab.style.borderBottom = '2px solid #0f0';
            show(tab.dataset.t);
        };
    });

    // Запуск
    show('main');
})();
