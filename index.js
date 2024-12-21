require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor/min/vs' } });

require(['vs/editor/editor.main'], function () {
    let currentEditor = null;
    let htmlContent = '<!DOCTYPE html>\n<html>\n  <head>\n  </head>\n  <body>\n    <!--inner-->\n  </body>\n</html>';
    let cssContent = 'body {\n    font-family: Arial, sans-serif;\n}';
    let currentTab = 'html';
    const contexts = {};
    const editorContainer = document.getElementById('editor-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const contextNameInput = document.getElementById('context-name');
    const keyValuePairsContainer = document.getElementById('key-value-pairs');
    const addKeyValueButton = document.getElementById('add-key-value');
    const addContextButton = document.getElementById('add-context');
    const contextList = document.getElementById('context-list');

    // コンテキスト追加
    addKeyValueButton.addEventListener('click', () => {
        const newKeyValuePair = document.createElement('div');
        newKeyValuePair.classList.add('key-value-pair');
        newKeyValuePair.innerHTML = `
            <label>Key: <input type="text" class="context-key" placeholder="e.g., email"></label>
            <label>Value: <input type="text" class="context-value" placeholder="e.g., user@example.com"></label>
        `;
        keyValuePairsContainer.appendChild(newKeyValuePair);
    });

    addContextButton.addEventListener('click', () => {
        const name = contextNameInput.value.trim();
        const keyValuePairs = Array.from(document.querySelectorAll('.key-value-pair')).map(pair => {
            const key = pair.querySelector('.context-key').value.trim();
            const value = pair.querySelector('.context-value').value.trim();
            return { key, value };
        });

        if (name && keyValuePairs.length > 0) {
            if (!contexts[name]) {
                contexts[name] = [];
            }
            contexts[name].push(...keyValuePairs);
            updateContextList();
            updatePreview();
        }
    });

    //コンテキスト更新処理
    function updateContextList() {
        contextList.innerHTML = Object.entries(contexts)
            .map(([name, keyValuePairs]) => {
                const keyValueHtml = keyValuePairs.map(({ key, value }) => {
                    return `<div class="context-item">
                        <span>{{ ${name}.${key} }}: ${value}</span>
                        <button class="delete-btn" data-name="${name}" data-key="${key}">Delete</button>
                    </div>`;
                }).join('');
                return `<div><strong>${name}</strong><div>${keyValueHtml}</div></div>`;
            })
            .join('');

        // 削除ボタンの設定
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.getAttribute('data-name');
                const key = e.target.getAttribute('data-key');
                contexts[name] = contexts[name].filter(item => item.key !== key);
                if (contexts[name].length === 0) {
                    delete contexts[name];
                }
                updateContextList();
                updatePreview();
            });
        });
    }

    //エディター初期化処理
    function initializeEditor(language, value) {
        if (currentEditor) {
            currentEditor.dispose();
        }
        currentEditor = monaco.editor.create(editorContainer, {
            value: value,
            language: language,
            theme: 'vs-light',
            automaticLayout: true
        });

        currentEditor.onDidChangeModelContent(() => {
            if (currentTab === 'html') {
                htmlContent = currentEditor.getValue();
            } else {
                cssContent = currentEditor.getValue();
            }
            updatePreview();
        });
    }

    //タブ切り替え処理
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.getAttribute('data-lang');
            if (currentTab === 'html') {
                initializeEditor('html', htmlContent);
            } else {
                initializeEditor('css', cssContent);
            }
        });
    });

    initializeEditor('html', htmlContent);
});
