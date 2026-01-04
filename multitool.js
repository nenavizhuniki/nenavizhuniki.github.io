(function() {
    const ID = 'god_mode_ui_v6_2';
    if (document.getElementById(ID)) { document.getElementById(ID).remove(); return; }

    // --- 1. ЛОГИ ---
    window._logs = window._logs || [];
    if (!window._console_hooked) {
        const capture = (type, args) => {
            window._logs.push({
                type: type, time: new Date().toLocaleTimeString(),
                msg: Array.from(args).map(a => {
                    try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } 
                    catch(e) { return '[Obj]'; }
                }).join(' ')
            });
        };
        const oL=console.log, oE=console.error, oW=console.warn;
        console.log=function(){ capture('LOG', arguments); oL.apply(console, arguments); };
        console.error=function(){ capture('ERROR', arguments); oE.apply(console, arguments); };
        console.warn=function(){ capture('WARN', arguments); oW.apply(console, arguments); };
        window._console_hooked = true;
    }

    // --- 2. СТИЛИ ---
    const style = `
        #${ID} { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #0a0a0a; z-index: 2147483647; color: #00ff41; font-family: monospace; display: flex; flex-direction: column; }
        #${ID} header { padding: 10px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #00ff41; }
        #${ID} .tabs { display: flex; background: #111; overflow-x: auto; flex-shrink: 0; border-bottom: 1px solid #333; }
        #${ID} .tab { flex: 1; padding: 12px 5px; text-align: center; cursor: pointer; font-size: 11px; color: #666; white-space: nowrap; }
        #${ID} .tab.active { color: #00ff41; background: #222; border-bottom: 2px solid #00ff41; }
        #${ID} .content { flex: 1; overflow-y: auto; padding: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .btn-big { background: #1a1a1a; color: #00ff41; border: 1px solid #00ff41; padding: 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-align: center; cursor: pointer; }
        .btn-big:active { background: #00ff41; color: #000; }
        textarea.editor { width: 100%; background: #000; color: #00ff41; border: 1px solid #00ff41; font-family: monospace; font-size: 11px; padding: 8px; margin: 5px 0; outline: none; }
        .item-row { display: flex; justify-content: space-between; align-items: center; background: #111; padding: 8px; margin-bottom: 5px; border: 1px solid #222; border-radius: 4px; }
        .btn-sm { background: #222; border: 1px solid #444; color: #00ff41; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer; }
        .label { font-size: 10px; color: #888; margin-top: 10px; display: block; text-transform: uppercase; }
    `;

    // --- 3. ГЛОБАЛЬНЫЕ ХЕЛПЕРЫ ---
    window._tk = {
        close: () => document.getElementById(ID).remove(),
        clean: () => {
            document.querySelectorAll('*').forEach(el => {
                if (getComputedStyle(el).position === 'fixed' && !el.id.includes('god_mode')) el.remove();
            });
            window._tk.close();
        },
        ua: () => {
            const ios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
            Object.defineProperty(navigator, 'userAgent', { get: () => ios, configurable: true });
            alert('UA: iOS Set');
        },
        eruda: () => {
            const s = document.createElement('script'); s.src = "//cdn.jsdelivr.net/npm/eruda";
            s.onload = () => { eruda.init(); window._tk.close(); };
            document.body.appendChild(s);
        },
        saveStore: (id, store) => {
            try {
                const d = JSON.parse(document.getElementById(id).value);
                store.clear(); Object.keys(d).forEach(k => store.setItem(k, d[k]));
                location.reload();
            } catch(e) { alert('JSON Error'); }
        },
        // Cache Helpers
        cAct: async (a, n, u) => {
            const c = await caches.open(n);
            if (a==='dl') {
                const r = await c.match(u); const b = await r.blob();
                const lnk = document.createElement('a'); lnk.href = URL.createObjectURL(b);
                lnk.download = u.split('/').pop() || 'file'; lnk.click();
            } else if (a==='del') {
                if(confirm('Delete?')) await c.delete(u);
            } else if (a==='up') {
                const i = document.createElement('input'); i.type = 'file';
                i.onchange = async () => {
                    const f = i.files[0]; await c.put(u, new Response(f, {headers:{'Content-Type':f.type}}));
                    alert('Done');
                }; i.click();
            }
        },
        // DB Helpers
        dbEx: (n, s) => {
            indexedDB.open(n).onsuccess = (e) => {
                e.target.result.transaction(s,'readonly').objectStore(s).getAll().onsuccess = (ev) => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(new Blob([JSON.stringify(ev.target.result,null,2)],{type:'application/json'}));
                    a.download=`${n}_${s}.json`; a.click();
                };
            };
        },
        dbIm: (n, s) => {
            const i = document.createElement('input'); i.type = 'file';
            i.onchange = (e) => {
                const r = new FileReader();
                r.onload = (re) => {
                    const data = JSON.parse(re.target.result);
                    indexedDB.open(n).onsuccess = (ev) => {
                        const tx = ev.target.result.transaction(s,'readwrite');
                        const os = tx.objectStore(s); os.clear();
                        data.forEach(item => os.put(item)); alert('Imported!');
                    };
                }; r.readAsText(e.target.files[0]);
            }; i.click();
        }
    };

    const ui = document.createElement('div');
    ui.id = ID;
    ui.innerHTML = `<style>${style}</style>
        <header><span>MTL-V6.2:GOLD</span><button class="btn-sm" style="color:red;border-color:red" onclick="window._tk.close()">EXIT</button></header>
        <div class="tabs">
            <div class="tab active" onclick="render('main', this)">CORE</div>
            <div class="tab" onclick="render('storage', this)">DATA</div>
            <div class="tab" onclick="render('cache', this)">FILES</div>
            <div class="tab" onclick="render('db', this)">DB</div>
            <div class="tab" onclick="render('logs', this)">LOGS</div>
        </div>
        <div class="content" id="ui_cnt"></div>`;
    document.body.appendChild(ui);

    window.render = async (target, el) => {
        if(el) {
            ui.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
        }
        const cnt = document.getElementById('ui_cnt');
        cnt.innerHTML = '';

        if(target === 'main') {
            cnt.innerHTML = `<div class="grid">
                <div class="btn-big" onclick="document.documentElement.requestFullscreen();window._tk.close()">FULLSCREEN</div>
                <div class="btn-big" onclick="document.designMode=(document.designMode==='on'?'off':'on');window._tk.close()">EDIT MODE</div>
                <div class="btn-big" onclick="window._tk.ua()">IOS UA</div>
                <div class="btn-big" onclick="window._tk.clean()">CLEAN FIXED</div>
                <div class="btn-big" style="grid-column:span 2;background:#300" onclick="window._tk.eruda()">LAUNCH ERUDA (CONSOLE)</div>
            </div>`;
        }

        if(target === 'storage') {
            const getS = (s) => { let o={}; Object.keys(s).sort().forEach(k=>o[k]=s.getItem(k)); return JSON.stringify(o,null,2); };
            cnt.innerHTML = `
                <span class="label">Local Storage</span>
                <textarea id="ls_e" class="editor" style="height:120px">${getS(localStorage)}</textarea>
                <button class="btn-big" style="width:100%" onclick="window._tk.saveStore('ls_e', localStorage)">SAVE LOCAL</button>
                <span class="label">Session Storage</span>
                <textarea id="ss_e" class="editor" style="height:120px">${getS(sessionStorage)}</textarea>
                <button class="btn-big" style="width:100%" onclick="window._tk.saveStore('ss_e', sessionStorage)">SAVE SESSION</button>
            `;
        }

        if(target === 'cache') {
            const keys = await caches.keys();
            if(!keys.length) cnt.innerHTML = 'No cache found.';
            for(const k of keys) {
                const o = await caches.open(k); const rs = await o.keys();
                const div = document.createElement('div');
                div.innerHTML = `<div class="label" style="color:#00ff41">📂 ${k} (${rs.length})</div>`;
                const list = document.createElement('div');
                list.style.display = rs.length > 20 ? 'none' : 'block';
                if(rs.length > 20) {
                    const b = document.createElement('button'); b.className='btn-sm'; b.innerText='Show files';
                    b.onclick=() => { list.style.display='block'; b.remove(); };
                    div.appendChild(b);
                }
                rs.forEach(r => {
                    const row = document.createElement('div'); row.className='item-row';
                    row.innerHTML = `<span style="font-size:10px;overflow:hidden">${r.url.split('/').pop()||r.url}</span>
                        <div style="display:flex"><button class="btn-sm" onclick="window._tk.cAct('dl','${k}','${r.url}')">⬇️</button>
                        <button class="btn-sm" onclick="window._tk.cAct('up','${k}','${r.url}')">✏️</button></div>`;
                    list.appendChild(row);
                });
                div.appendChild(list); cnt.appendChild(div);
            }
        }

        if(target === 'db') {
            if(!indexedDB.databases) { cnt.innerHTML = 'Not supported'; return; }
            const dbs = await indexedDB.databases();
            for(const d of dbs) {
                const box = document.createElement('div'); box.className='item-row'; box.style.flexDirection='column'; box.style.alignItems='flex-start';
                box.innerHTML = `<b style="color:#00ff41">${d.name} (v${d.version})</b>`;
                const req = indexedDB.open(d.name);
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    Array.from(db.objectStoreNames).forEach(sn => {
                        const r = document.createElement('div'); r.style.width='100%'; r.style.display='flex'; r.style.justifyContent='space-between'; r.style.marginTop='5px';
                        r.innerHTML = `<span style="font-size:10px">table: ${sn}</span>
                            <div><button class="btn-sm" onclick="window._tk.dbEx('${d.name}','${sn}')">⬇️</button>
                            <button class="btn-sm" onclick="window._tk.dbIm('${d.name}','${sn}')">⬆️</button></div>`;
                        box.appendChild(r);
                    });
                    db.close();
                };
                cnt.appendChild(box);
            }
        }

        if(target === 'logs') {
            cnt.innerHTML = `<button class="btn-big" style="width:100%" onclick="window._logs=[];render('logs')">CLEAR</button>`;
            window._logs.slice().reverse().forEach(l => {
                const item = document.createElement('div'); item.style.fontSize='10px'; item.style.borderBottom='1px solid #222'; item.style.padding='5px';
                item.style.color = l.type==='ERROR'?'#f44':(l.type==='WARN'?'#fb0':'#0f4');
                item.innerText = `[${l.time}] ${l.msg}`;
                cnt.appendChild(item);
            });
        }
    };

    render('main');
})();
