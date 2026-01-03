// ==UserScript==
// @name         Dev Multitool v3.0 (Cache + IDB Fix)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Debug tool: Eruda, Console Logs, Cache Inspector, IDB Proxy
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // --- Config & State ---
    const STATE = {
        isOpen: false,
        activeTab: 'logs',
        idbHooks: {
            enabled: false,
            replacements: {} // 'realName': 'mockName'
        }
    };

    // --- UI Styles ---
    const styles = `
        #dev-mt-container {
            position: fixed; bottom: 20px; right: 20px;
            width: 450px; height: 500px;
            background: #1e1e1e; color: #d4d4d4;
            font-family: monospace; font-size: 12px;
            z-index: 99999; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex; flex-direction: column;
            border: 1px solid #333;
            transition: transform 0.2s;
        }
        #dev-mt-container.minimized {
            height: 40px; width: 150px; overflow: hidden;
        }
        #dev-mt-header {
            padding: 8px 12px; background: #252526;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #333; cursor: pointer; user-select: none;
        }
        #dev-mt-tabs {
            display: flex; background: #2d2d2d;
        }
        .dev-mt-tab {
            padding: 6px 12px; cursor: pointer; border-right: 1px solid #3e3e3e;
        }
        .dev-mt-tab:hover { background: #3e3e3e; }
        .dev-mt-tab.active { background: #1e1e1e; font-weight: bold; color: #fff; }
        #dev-mt-content {
            flex: 1; overflow: hidden; display: flex; flex-direction: column;
        }
        .dev-mt-panel {
            display: none; flex: 1; overflow: auto; padding: 10px;
        }
        .dev-mt-panel.active { display: flex; flex-direction: column; }
        
        /* Logs */
        .log-entry { padding: 4px 0; border-bottom: 1px solid #333; word-break: break-all; }
        .log-info { color: #9cdcfe; }
        .log-warn { color: #ce9178; }
        .log-error { color: #f44747; background: rgba(244, 71, 71, 0.1); }
        
        /* UI Elements */
        button.mt-btn {
            background: #0e639c; color: white; border: none;
            padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 5px;
        }
        button.mt-btn:hover { background: #1177bb; }
        input.mt-input {
            background: #3c3c3c; border: 1px solid #555; color: white;
            padding: 4px; margin: 2px;
        }
        
        /* Preview */
        .preview-box {
            background: #111; padding: 8px; border: 1px solid #444;
            margin-top: 5px; white-space: pre-wrap; max-height: 200px; overflow: auto;
        }
        .json-key { color: #9cdcfe; }
        .json-string { color: #ce9178; }
        .json-number { color: #b5cea8; }
    `;

    // --- Inject Styles ---
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // --- Logger Logic ---
    const logs = [];
    const originalConsole = { log: console.log, warn: console.warn, error: console.error };
    
    function bufferLog(type, args) {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logs.push({ type, msg, time: new Date().toLocaleTimeString() });
        if (logs.length > 200) logs.shift();
        renderLogs();
    }

    console.log = function(...args) { bufferLog('info', args); originalConsole.log.apply(console, args); };
    console.warn = function(...args) { bufferLog('warn', args); originalConsole.warn.apply(console, args); };
    console.error = function(...args) { bufferLog('error', args); originalConsole.error.apply(console, args); };

    // --- IndexedDB Hook Logic ---
    const originalOpen = IDBFactory.prototype.open;
    
    function initIDBProxy() {
        IDBFactory.prototype.open = function(name, version) {
            if (STATE.idbHooks.enabled) {
                const subName = STATE.idbHooks.replacements[name];
                if (subName) {
                    originalConsole.log(`[MT-IDB] Swapping DB "${name}" -> "${subName}"`);
                    name = subName;
                } else {
                    originalConsole.log(`[MT-IDB] Opening DB "${name}" (No substitution)`);
                }
            }
            return originalOpen.call(this, name, version);
        };
    }
    initIDBProxy();

    // --- UI Rendering ---
    const container = document.createElement('div');
    container.id = 'dev-mt-container';
    container.className = 'minimized';
    
    container.innerHTML = `
        <div id="dev-mt-header">
            <span>🛠 Dev Multitool</span>
            <button id="mt-toggle-size" style="background:none;border:none;color:#fff;">[+]</button>
        </div>
        <div id="dev-mt-tabs">
            <div class="dev-mt-tab active" data-tab="logs">Logs</div>
            <div class="dev-mt-tab" data-tab="cache">Cache</div>
            <div class="dev-mt-tab" data-tab="idb">IDB Proxy</div>
            <div class="dev-mt-tab" data-tab="tools">Tools</div>
        </div>
        <div id="dev-mt-content">
            <div id="panel-logs" class="dev-mt-panel active"></div>
            <div id="panel-cache" class="dev-mt-panel">
                <div>
                    <button class="mt-btn" id="btn-refresh-cache">Refresh Caches</button>
                </div>
                <div id="cache-list" style="margin-top:10px;"></div>
                <div id="cache-preview" class="preview-box" style="display:none;"></div>
            </div>
            <div id="panel-idb" class="dev-mt-panel">
                <label>
                    <input type="checkbox" id="chk-idb-enable"> Enable IDB Substitution
                </label>
                <div style="margin-top:10px; border-top: 1px solid #444; padding-top:10px;">
                    <div>Add Rule:</div>
                    <input class="mt-input" id="inp-idb-from" placeholder="Original DB Name">
                    <span>-></span>
                    <input class="mt-input" id="inp-idb-to" placeholder="Substitute Name">
                    <button class="mt-btn" id="btn-idb-add">Add</button>
                </div>
                <div id="idb-rules-list" style="margin-top:10px;"></div>
            </div>
            <div id="panel-tools" class="dev-mt-panel">
                <button class="mt-btn" id="btn-load-eruda">Load Eruda</button>
                <p style="margin-top:10px; color:#888;">More tools coming soon...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(container);

    // --- Event Listeners & Logic ---

    // Toggle Min/Max
    const header = container.querySelector('#dev-mt-header');
    header.addEventListener('click', () => {
        container.classList.toggle('minimized');
        const btn = container.querySelector('#mt-toggle-size');
        btn.innerText = container.classList.contains('minimized') ? '[+]' : '[-]';
    });

    // Tabs Switcher
    const tabs = container.querySelectorAll('.dev-mt-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.dev-mt-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // 1. Logs Logic
    const logsContainer = document.getElementById('panel-logs');
    function renderLogs() {
        if (!logsContainer) return;
        logsContainer.innerHTML = logs.map(l => 
            `<div class="log-entry log-${l.type}">
                <span style="opacity:0.6">[${l.time}]</span> ${escapeHtml(l.msg)}
             </div>`
        ).join('');
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
    
    // 2. Eruda Logic
    document.getElementById('btn-load-eruda').addEventListener('click', () => {
        const script = document.createElement('script');
        script.src = "//cdn.jsdelivr.net/npm/eruda";
        script.onload = () => { window.eruda.init(); };
        document.body.appendChild(script);
    });

    // 3. Cache Logic
    document.getElementById('btn-refresh-cache').addEventListener('click', async () => {
        const list = document.getElementById('cache-list');
        list.innerHTML = 'Loading...';
        
        try {
            const keys = await caches.keys();
            if (keys.length === 0) {
                list.innerHTML = 'No Caches found.';
                return;
            }
            
            let html = '';
            for (const key of keys) {
                html += `<div style="margin-bottom:5px; font-weight:bold; color:#fff;">📦 ${key}</div>`;
                const cache = await caches.open(key);
                const requests = await cache.keys();
                
                requests.forEach(req => {
                    html += `
                        <div style="padding-left:15px; cursor:pointer; color:#9cdcfe;" 
                             onclick="window.previewCache('${key}', '${req.url}')">
                             📄 ${req.url.split('/').pop() || req.url}
                        </div>`;
                });
            }
            list.innerHTML = html;
        } catch (e) {
            list.innerText = "Error accessing Cache API: " + e.message;
        }
    });

    // Global function for onclick injection (simplest way for innerHTML)
    window.previewCache = async (cacheName, url) => {
        const previewEl = document.getElementById('cache-preview');
        previewEl.style.display = 'block';
        previewEl.innerHTML = 'Loading content...';
        
        try {
            const cache = await caches.open(cacheName);
            const response = await cache.match(url);
            if (!response) {
                previewEl.innerText = 'Item not found in cache.';
                return;
            }
            
            const text = await response.text();
            try {
                // Try format JSON
                const json = JSON.parse(text);
                previewEl.innerHTML = syntaxHighlight(json);
            } catch {
                // Fallback text
                previewEl.innerText = text.substring(0, 5000) + (text.length > 5000 ? '...' : '');
            }
        } catch (e) {
            previewEl.innerText = "Error: " + e.message;
        }
    };

    // 4. IDB Logic
    const chkIdb = document.getElementById('chk-idb-enable');
    const inpFrom = document.getElementById('inp-idb-from');
    const inpTo = document.getElementById('inp-idb-to');
    const btnAddRule = document.getElementById('btn-idb-add');
    const listRules = document.getElementById('idb-rules-list');

    chkIdb.addEventListener('change', (e) => {
        STATE.idbHooks.enabled = e.target.checked;
    });

    btnAddRule.addEventListener('click', () => {
        const from = inpFrom.value.trim();
        const to = inpTo.value.trim();
        if(from && to) {
            STATE.idbHooks.replacements[from] = to;
            renderIDBRules();
            inpFrom.value = '';
            inpTo.value = '';
        }
    });

    function renderIDBRules() {
        let html = '';
        for (const [orig, sub] of Object.entries(STATE.idbHooks.replacements)) {
            html += `<div style="margin-top:4px;">
                <span style="color:#ce9178">${orig}</span> ➔ <span style="color:#b5cea8">${sub}</span>
                <button class="mt-btn" style="padding:1px 5px; font-size:10px; background:#f44747;"
                onclick="window.removeIDBRule('${orig}')">X</button>
            </div>`;
        }
        listRules.innerHTML = html;
    }

    window.removeIDBRule = (key) => {
        delete STATE.idbHooks.replacements[key];
        renderIDBRules();
    };

    // --- Utilities ---
    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function syntaxHighlight(json) {
        if (typeof json != 'string') {
             json = JSON.stringify(json, undefined, 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

})();
