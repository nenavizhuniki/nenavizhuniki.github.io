(function() {
    const ID = 'mtl_shadow_host';
    const old = document.getElementById(ID);
    if (old) { old.remove(); return; }

    // --- LOG SNIFFER ---
    window._logs = window._logs || [];
    if (!window._console_hooked) {
        const cap = (t, a) => {
            try {
                window._logs.push({t, time: new Date().toLocaleTimeString(), m: Array.from(a).map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')});
            } catch(e) {}
        };
        const oL=console.log, oE=console.error;
        console.log=function(){ cap('LOG', arguments); oL.apply(console, arguments); };
        console.error=function(){ cap('ERR', arguments); oE.apply(console, arguments); };
        window._console_hooked = true;
    }

    // --- UI SETUP ---
    const host = document.createElement('div');
    host.id = ID;
    host.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({mode: 'open'});
    
    const ui = document.createElement('div');
    ui.style.cssText = 'width:100%;height:100%;background:#050505;color:#00ff41;font-family:monospace;display:flex;flex-direction:column;font-size:13px;line-height:1.2;pointer-events:auto;';
    
    const style = document.createElement('style');
    style.textContent = `
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #00ff41; }
        ::-webkit-scrollbar-track { background: #111; }
        button { border:none; background:none; cursor:pointer; font-family:monospace; }
        .mtl-tab { color: #666; border-bottom: 2px solid transparent; transition: 0.2s; font-weight: bold; font-size: 11px; padding:15px 10px; flex:1; text-align:center; white-space:nowrap; }
        .active-tab { color: #00ff41 !important; border-bottom: 2px solid #00ff41 !important; background: #111; }
        .b-big { background:#111; color:#00ff41; border:1px solid #333; padding:15px 5px; font-family:monospace; cursor:pointer; font-size:11px; font-weight:bold; width:100%; display:flex; align-items:center; justify-content:center; }
        .b-big:active { background:#00ff41; color:#000; }
        .label-txt { color:#888; font-size:10px; margin: 15px 0 5px 0; display:block; font-weight:bold; }
        .editor-area { width:100%; background:#101010; color:#0f0; border:1px solid #333; border-left: 3px solid #00ff41; font-family:'Courier New', monospace; font-size:11px; padding:10px; margin-bottom:5px; outline:none; }
        .row-item { display:flex; justify-content:space-between; align-items:center; padding:8px; border:1px solid #222; margin-bottom:5px; border-radius:4px; background:#0a0a0a; }
        button.sm-btn { background:#222; color:#0f0; border:1px solid #444; padding:5px 8px; font-size:12px; margin-left:5px; border-radius:3px; }
        button.sm-btn:active { background:#0f0; color:#000; }
    `;
    shadow.appendChild(style);

    ui.innerHTML = `
        <div style="background:#111;padding:12px;display:flex;justify-content:space-between;border-bottom:1px solid #00ff41;flex-shrink:0;align-items:center;">
            <b style="letter-spacing:1px;font-size:14px;">TOOLKIT V6.7</b>
            <button id="close_mtl" style="background:#400;color:#f00;border:1px solid #f00;padding:4px 12px;font-weight:bold;border-radius:3px;">CLOSE</button>
        </div>
        <div style="display:flex;background:#000;overflow-x:auto;border-bottom:1px solid #222;flex-shrink:0;">
            <div class="mtl-tab active-tab" data-t="main">CORE</div>
            <div class="mtl-tab" data-t="data">DATA</div>
            <div class="mtl-tab" data-t="files">FILES</div>
            <div class="mtl-tab" data-t="db">DB</div>
            <div class="mtl-tab" data-t="logs">LOGS</div>
        </div>
        <div id="mtl_cnt" style="flex:1;overflow-y:auto;padding:12px;background:#050505;"></div>
    `;

    shadow.appendChild(ui);
    ui.querySelector('#close_mtl').onclick = () => host.remove();
    const cnt = ui.querySelector('#mtl_cnt');

    // --- DOWNLOAD FIX (OCTET-STREAM FORCE) ---
    const downloadBlob = (blob, name) => {
        try {
            // Принудительно меняем тип на binary, чтобы браузер не пытался открыть файл
            const forcedBlob = new Blob([blob], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(forcedBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch(e) {
            alert('Download Error: ' + e.message);
        }
    };

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
                    <button class="b-big" id="btn_er" style="grid-column:span 2;background:#200;border-color:#f00;">LAUNCH ERUDA (CONSOLE)</button>
                </div>
            `;
            cnt.appendChild(d);
            
            d.querySelector('#btn_fs').onclick = () => { document.documentElement.requestFullscreen().catch(()=>{}); host.remove(); };
            d.querySelector('#btn_ed').onclick = () => { document.designMode = document.designMode === 'on' ? 'off' : 'on'; host.remove(); };
            d.querySelector('#btn_ua').onclick = () => {
                Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', configurable: true });
                alert('UA: iOS 17 Applied');
            };
            d.querySelector('#btn_cl').onclick = () => {
                document.querySelectorAll('*').forEach(el => { 
                    const pos = getComputedStyle(el).position;
                    if((pos === 'fixed' || pos === 'sticky') && el.id !== ID) el.remove(); 
                });
            };
            d.querySelector('#btn_er').onclick = () => {
                const s = document.createElement('script'); s.src = "https://cdn.jsdelivr.net/npm/eruda";
                s.onload = () => { eruda.init(); host.remove(); };
                document.body.appendChild(s);
            };
        }

        if (target === 'data') {
            const getJ = (s) => { let o={}; Object.keys(s).sort().forEach(k=>o[k]=s.getItem(k)); return JSON.stringify(o,null,2); };
            const createSection = (title, id, initialData, saveFn) => {
                const label = document.createElement('span'); label.className = 'label-txt'; label.innerText = title;
                const area = document.createElement('textarea'); area.id = id; area.className = 'editor-area'; area.style.height = '140px'; area.value = initialData;
                const btn = document.createElement('button'); btn.className = 'b-big'; btn.innerText = 'SAVE ' + title;
                btn.onclick = () => {
                    try {
                        const data = JSON.parse(area.value);
                        saveFn(data);
                        alert(title + ' Saved! Reloading...');
                        location.reload();
                    } catch(e) { alert('JSON Error: ' + e.message); }
                };
                cnt.appendChild(label); cnt.appendChild(area); cnt.appendChild(btn);
            };
            createSection('LOCAL STORAGE', 'ed_ls', getJ(localStorage), (d) => { localStorage.clear(); Object.keys(d).forEach(k=>localStorage.setItem(k,d[k])); });
            createSection('SESSION STORAGE', 'ed_ss', getJ(sessionStorage), (d) => { sessionStorage.clear(); Object.keys(d).forEach(k=>sessionStorage.setItem(k,d[k])); });
        }

        if (target === 'files') {
            cnt.innerHTML = '<i style="color:#666">Scanning Cache Storage...</i>';
            try {
                const keys = await caches.keys();
                cnt.innerHTML = keys.length ? '' : 'No cache storage found.';
                
                for (const k of keys) {
                    const openCache = await caches.open(k);
                    const items = await openCache.keys();
                    const section = document.createElement('div');
                    section.style.marginBottom = '20px';
                    section.innerHTML = `<div style="background:#222;padding:8px;color:#00ff41;font-size:11px;display:flex;justify-content:space-between">📂 ${k} <span>[${items.length}]</span></div>`;
                    
                    const list = document.createElement('div');
                    list.style.display = items.length > 15 ? 'none' : 'block';
                    
                    if (items.length > 15) {
                        const btnShow = document.createElement('button');
                        btnShow.className = 'sm-btn'; btnShow.style.width = '100%'; btnShow.style.margin = '5px 0';
                        btnShow.innerText = 'Expand ' + items.length + ' files';
                        btnShow.onclick = () => { list.style.display = 'block'; btnShow.remove(); };
                        section.appendChild(btnShow);
                    }

                    items.forEach(req => {
                        const row = document.createElement('div');
                        row.className = 'row-item';
                        const fileName = req.url.split('/').pop().split('?')[0] || 'index.html';
                        row.innerHTML = `<span style="font-size:10px;word-break:break-all;margin-right:10px;">${fileName}</span>`;
                        
                        const acts = document.createElement('div');
                        acts.style.display = 'flex';
                        
                        const btnDl = document.createElement('button'); btnDl.className='sm-btn'; btnDl.innerText = '⬇️';
                        btnDl.onclick = async () => {
                            try {
                                const r = await openCache.match(req.url);
                                const b = await r.blob();
                                // Передаем blob в нашу новую функцию, которая принудительно меняет тип
                                downloadBlob(b, fileName);
                            } catch(e) { alert('Download failed: ' + e); }
                        };
                        
                        const btnUp = document.createElement('button'); btnUp.className='sm-btn'; btnUp.innerText = '✏️';
                        btnUp.onclick = () => {
                            const i = document.createElement('input'); i.type = 'file';
                            i.onchange = async () => {
                                if(!i.files[0]) return;
                                const f = i.files[0];
                                await openCache.put(req.url, new Response(f, {headers: {'Content-Type': f.type || 'application/octet-stream'}}));
                                alert('File replaced in cache!');
                            }; i.click();
                        };

                        acts.appendChild(btnDl); acts.appendChild(btnUp);
                        row.appendChild(acts);
                        list.appendChild(row);
                    });
                    section.appendChild(list);
                    cnt.appendChild(section);
                }
            } catch(e) { cnt.innerHTML = 'Cache Access Error: ' + e.message; }
        }

        if (target === 'db') {
            if (!indexedDB.databases) { cnt.innerHTML = 'IndexedDB API not fully supported.'; return; }
            const dbs = await indexedDB.databases();
            cnt.innerHTML = dbs.length ? '' : 'No Databases.';
            
            for (const dbInfo of dbs) {
                const box = document.createElement('div');
                box.style.background = '#111'; box.style.padding = '10px'; box.style.marginBottom = '10px'; box.style.border = '1px solid #333';
                box.innerHTML = `<b style="color:#00ff41;font-size:12px;">🗄️ ${dbInfo.name}</b><br>`;
                
                const openReq = indexedDB.open(dbInfo.name);
                openReq.onsuccess = (e) => {
                    const db = e.target.result;
                    if(db.objectStoreNames.length === 0) box.innerHTML += '<i style="font-size:10px;color:#555">Empty DB</i>';
                    Array.from(db.objectStoreNames).forEach(storeName => {
                        const row = document.createElement('div');
                        row.className = 'row-item'; row.style.marginTop = '5px';
                        row.innerHTML = `<span style="color:#aaa;font-size:11px;">${storeName}</span>`;
                        
                        const btnDiv = document.createElement('div');
                        
                        const btnEx = document.createElement('button'); btnEx.className='sm-btn'; btnEx.innerText = 'EXPORT';
                        btnEx.onclick = () => {
                            try {
                                const tx = db.transaction(storeName, 'readonly');
                                const store = tx.objectStore(storeName);
                                const req = store.getAll();
                                req.onsuccess = (ev) => {
                                    const res = ev.target.result;
                                    if (!res) { alert('No data to export'); return; }
                                    const jsonStr = JSON.stringify(res, null, 2);
                                    // Здесь тоже меняем тип на octet-stream, чтобы JSON скачался, а не открылся
                                    const blob = new Blob([jsonStr], {type:'application/octet-stream'});
                                    downloadBlob(blob, `${dbInfo.name}_${storeName}.json`);
                                };
                                req.onerror = (err) => alert('Export Read Error: ' + err.target.error);
                            } catch(err) { alert('Export Init Error: ' + err.message); }
                        };
                        
                        const btnIm = document.createElement('button'); btnIm.className='sm-btn'; btnIm.innerText = '✏️ IMPORT';
                        btnIm.onclick = () => {
                             const i = document.createElement('input'); i.type = 'file';
                             i.onchange = (evFile) => {
                                 const f = evFile.target.files[0];
                                 if(!f) return;
                                 const reader = new FileReader();
                                 reader.onload = (res) => {
                                     try {
                                         const jsonData = JSON.parse(res.target.result);
                                         if(!Array.isArray(jsonData)) throw new Error('File must be a JSON Array');
                                         const tx = db.transaction(storeName, 'readwrite');
                                         const store = tx.objectStore(storeName);
                                         const clr = store.clear();
                                         clr.onsuccess = () => {
                                             jsonData.forEach(item => store.put(item));
                                             alert(`Imported ${jsonData.length} items to ${storeName}`);
                                         };
                                         clr.onerror = (err) => alert('Clear failed: ' + err.target.error);
                                     } catch(err) { alert('Import error: ' + err.message); }
                                 };
                                 reader.readAsText(f);
                             };
                             i.click();
                        };

                        btnDiv.appendChild(btnEx);
                        btnDiv.appendChild(btnIm);
                        row.appendChild(btnDiv);
                        box.appendChild(row);
                    });
                };
                openReq.onerror = () => { box.innerHTML += '<span style="color:red"> Access Denied</span>'; };
                cnt.appendChild(box);
            }
        }

        if (target === 'logs') {
            const bCl = document.createElement('button'); bCl.className='b-big'; bCl.style.width='100%'; bCl.innerText = 'CLEAR LOGS';
            bCl.onclick = () => { window._logs = []; show('logs'); };
            cnt.appendChild(bCl);
            
            const logBox = document.createElement('div');
            logBox.style.marginTop = '10px';
            window._logs.slice().reverse().forEach(l => {
                const el = document.createElement('div');
                el.style.cssText = 'border-bottom:1px solid #111;padding:6px 0;font-size:10px;word-break:break-all;';
                el.style.color = l.t === 'ERR' ? '#ff4444' : '#00ff41';
                el.innerText = `[${l.time}] ${l.m}`;
                logBox.appendChild(el);
            });
            cnt.appendChild(logBox);
        }
    };

    ui.querySelectorAll('.mtl-tab').forEach(tab => {
        tab.onclick = () => {
            ui.querySelectorAll('.mtl-tab').forEach(t => t.classList.remove('active-tab'));
            tab.classList.add('active-tab');
            show(tab.dataset.t);
        };
    });

    show('main');
})();
