(function() {
    const ID = 'god_mode_ui_v6_1';
    if (document.getElementById(ID)) { document.getElementById(ID).remove(); return; }

    // --- 1. ПЕРЕХВАТ КОНСОЛИ (LOG SNIFFER) ---
    window._logs = window._logs || [];
    if (!window._console_hooked) {
        const capture = (type, args) => {
            window._logs.push({
                type: type,
                time: new Date().toLocaleTimeString(),
                msg: Array.from(args).map(a => {
                    try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } 
                    catch(e) { return '[Object]'; }
                }).join(' ')
            });
        };
        const origLog = console.log, origErr = console.error, origWarn = console.warn;
        console.log = function() { capture('LOG', arguments); origLog.apply(console, arguments); };
        console.error = function() { capture('ERROR', arguments); origErr.apply(console, arguments); };
        console.warn = function() { capture('WARN', arguments); origWarn.apply(console, arguments); };
        window._console_hooked = true;
    }

    // --- 2. СТИЛИ ---
    const style = `
        #${ID} { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10,10,10,0.98); z-index: 2147483647; color: #fff; font-family: monospace; display: flex; flex-direction: column; color-scheme: dark; }
        #${ID} header { padding: 12px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #00E676; }
        #${ID} .close-btn { background: #ff4444; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
        #${ID} .tabs { display: flex; background: #222; overflow-x: auto; flex-shrink: 0; }
        #${ID} .tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; font-size: 12px; border-bottom: 2px solid transparent; min-width: 70px; color: #888; }
        #${ID} .tab.active { border-bottom-color: #00E676; color: #00E676; background: #2a2a2a; }
        #${ID} .content { flex: 1; overflow-y: auto; padding: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .btn-big { background: #222; color: #00E676; border: 1px solid #333; padding: 10px; border-radius: 5px; font-size: 12px; font-weight: bold; text-align: center; }
        .btn-big:active { background: #00E676; color: #000; }
        textarea.editor { width: 100%; background: #050505; color: #00ff41; border: 1px solid #333; font-family: 'Courier New', monospace; font-size: 11px; padding: 8px; box-sizing: border-box; outline: none; border-left: 3px solid #00E676; }
        .item-row { display: flex; justify-content: space-between; align-items: center; background: #161616; padding: 6px; margin-bottom: 4px; border-radius: 3px; border: 1px solid #222; }
        .item-name { font-size: 11px; color: #aaa; overflow: hidden; text-overflow: ellipsis; }
        .btn-sm { background: #333; border: 1px solid #444; color: #fff; padding: 3px 6px; border-radius: 3px; font-size: 10px; margin-left: 3px; }
        .label { font-size: 10px; color: #00E676; margin: 10px 0 5px 0; display: block; font-weight: bold; opacity: 0.8; }
    `;

    // --- 3. ИНТЕРФЕЙС ---
    const ui = document.createElement('div');
    ui.id = ID;
    ui.innerHTML = `<style>${style}</style>
        <header><span>MTL-V6.1:STABLE</span><button class="close-btn">X</button></header>
        <div class="tabs">
            <div class="tab active" data-target="main">CORE</div>
            <div class="tab" data-target="storage">STORAGE</div>
            <div class="tab" data-target="cache">FILES</div>
            <div class="tab" data-target="db">DB</div>
            <div class="tab" data-target="logs">LOGS</div>
        </div>
        <div class="content" id="ui_content"></div>`;
    document.body.appendChild(ui);
    ui.querySelector('.close-btn').onclick = () => ui.remove();

    // Вспомогательные функции для работы с кешем
    window._tk_act = async (act, cName, url) => {
        const cache = await caches.open(cName);
        if (act === 'dl') {
            const res = await cache.match(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = url.split('/').pop() || 'file';
            a.click();
        } else if (act === 'del') {
            if (confirm('Delete?')) await cache.delete(url);
        } else if (act === 'up') {
            const i = document.createElement('input'); i.type = 'file';
            i.onchange = async () => {
                const f = i.files[0];
                await cache.put(url, new Response(f, { headers: {'Content-Type': f.type} }));
                alert('Success');
            };
            i.click();
        }
    };

    const render = async (target) => {
        const cnt = document.getElementById('ui_content');
        cnt.innerHTML = '';

        if (target === 'main') {
            cnt.innerHTML = `
                <div class="grid">
                    <div class="btn-big" onclick="document.documentElement.requestFullscreen();document.getElementById('${ID}').remove()">FULLSCREEN</div>
                    <div class="btn-big" onclick="document.designMode=(document.designMode==='on'?'off':'on');document.getElementById('${ID}').remove()">EDIT MODE</div>
                    <div class="btn-big" id="set_ua">IOS UA</div>
                    <div class="btn-big" id="clean_fx">CLEAN FIXED</div>
                    <div class="btn-big" id="run_eruda" style="grid-column: span 2; background: #4a148c; color: white;">LAUNCH ERUDA (CONSOLE)</div>
                </div>`;
            document.getElementById('set_ua').onclick = () => {
                Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
                alert('UA Changed');
            };
            document.getElementById('run_eruda').onclick = () => {
                const s = document.createElement('script'); s.src = "//cdn.jsdelivr.net/npm/eruda";
                s.onload = () => { eruda.init(); ui.remove(); };
                document.body.appendChild(s);
            };
        }

        if (target === 'storage') {
            cnt.innerHTML = `
                <span class="label">LOCAL STORAGE</span>
                <textarea id="ls_ed" class="editor" style="height:150px"></textarea>
                <button class="btn-big" style="width:100%; margin-top:5px" id="ls_sv">SAVE & RELOAD</button>
                <span class="label">SESSION STORAGE</span>
                <textarea id="ss_ed" class="editor" style="height:150px"></textarea>
                <button class="btn-big" style="width:100%; margin-top:5px" id="ss_sv">SAVE & RELOAD</button>
                <span class="label">COOKIES</span>
                <textarea id="ck_ed" class="editor" style="height:60px"></textarea>
                <button class="btn-big" style="width:100%; margin-top:5px" id="ck_sv">UPDATE COOKIE</button>`;
            
            const getS = (s) => { let o={}; Object.keys(s).sort().forEach(k=>o[k]=s.getItem(k)); return JSON.stringify(o,null,2); };
            document.getElementById('ls_ed').value = getS(localStorage);
            document.getElementById('ss_ed').value = getS(sessionStorage);
            document.getElementById('ck_ed').value = document.cookie;

            const save = (id, store) => {
                try {
                    const data = JSON.parse(document.getElementById(id).value);
                    store.clear(); Object.keys(data).forEach(k => store.setItem(k, data[k]));
                    location.reload();
                } catch(e) { alert('JSON Error'); }
            };
            document.getElementById('ls_sv').onclick = () => save('ls_ed', localStorage);
            document.getElementById('ss_sv').onclick = () => save('ss_ed', sessionStorage);
            document.getElementById('ck_sv').onclick = () => { document.cookie = document.getElementById('ck_ed').value; alert('Updated'); };
        }

        if (target === 'cache') {
            cnt.innerHTML = '<i>Scanning Cache Storage...</i>';
            const keys = await caches.keys();
            cnt.innerHTML = '';
            for (const key of keys) {
                const section = document.createElement('div');
                section.innerHTML = `<div style="color:#00E676; padding:5px; background:#222; margin-top:10px; font-size:11px;">📂 ${key}</div>`;
                const c = await caches.open(key);
                const reqs = await c.keys();
                
                const listWrap = document.createElement('div');
                if (reqs.length > 30) {
                    const btn = document.createElement('button');
                    btn.className = 'btn-big'; btn.style.width='100%';
                    btn.innerText = `Show ${reqs.length} files`;
                    btn.onclick = () => { listWrap.style.display = 'block'; btn.remove(); };
                    listWrap.style.display = 'none';
                    section.appendChild(btn);
                }
                
                reqs.forEach(r => {
                    const row = document.createElement('div');
                    row.className = 'item-row';
                    row.innerHTML = `<span class="item-name">${r.url.split('/').pop() || r.url}</span>
                        <div>
                            <button class="btn-sm" onclick="window._tk_act('dl','${key}','${r.url}')">⬇️</button>
                            <button class="btn-sm" onclick="window._tk_act('up','${key}','${r.url}')">✏️</button>
                            <button class="btn-sm" onclick="window._tk_act('del','${key}','${r.url}')">✕</button>
                        </div>`;
                    listWrap.appendChild(row);
                });
                section.appendChild(listWrap);
                cnt.appendChild(section);
            }
        }

        if (target === 'logs') {
            cnt.innerHTML = '<button class="btn-big" style="width:100%" onclick="window._logs=[];render(\'logs\')">CLEAR LOGS</button><div id="l_b"></div>';
            const lb = document.getElementById('l_b');
            window._logs.slice().reverse().forEach(l => {
                const d = document.createElement('div');
                d.style.fontSize = '10px'; d.style.borderBottom = '1px solid #222'; d.style.padding = '4px';
                d.style.color = l.type === 'ERROR' ? '#f44' : (l.type === 'WARN' ? '#fb0' : '#0f4');
                d.innerText = `[${l.time}] ${l.msg}`;
                lb.appendChild(d);
            });
        }
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
