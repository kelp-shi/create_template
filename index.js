require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor/min/vs' } });

require(['vs/editor/editor.main'], function () {
    let currentEditor = null;
    let htmlContent = '<!DOCTYPE html>\n<html>\n<head>\n<style>\n</style>\n</head>\n<body>\n{{ greeting }}\n</body>\n</html>';
    let cssContent = 'body {\n    font-family: Arial, sans-serif;\n}';
    let currentTab = 'html';
    const contexts = {};

    const editorContainer = document.getElementById('editor-container');
    const previewFrame = document.getElementById('preview-frame');
    const tabButtons = document.querySelectorAll('.tab-button');
    const viewerWidthLabel = document.getElementById('viewer-width');
    const editorSection = document.getElementById('editor-section');
    const viewerSection = document.getElementById('viewer-section');
    const resizer = document.getElementById('resizer');
    const contextNameInput = document.getElementById('context-name');
    const keyValuePairsContainer = document.getElementById('key-value-pairs');
    const addKeyValueButton = document.getElementById('add-key-value');
    const addContextButton = document.getElementById('add-context');
    const contextList = document.getElementById('context-list');

    // コンテキスト操作
    addKeyValueButton.addEventListener('click', () => {
        const newKeyValuePair = document.createElement('div');
        newKeyValuePair.classList.add('key-value-pair');
        newKeyValuePair.innerHTML = `
            <label>Key: <input type="text" class="context-key" placeholder="e.g., name"></label>
            <label>Value: <input type="text" class="context-value" placeholder="e.g., yuuya"></label>
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
            clearInputs();  // 入力フィールドをクリア
            updatePreview();
        }
    });

    function updateContextList() {
        contextList.innerHTML = Object.entries(contexts)
            .map(([name, keyValuePairs]) => {
                const keyValueHtml = keyValuePairs.map(({ key, value }) => {
                    return `<div class="context-item">
                        <span>${key} : ${value}</span>
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

    function clearInputs() {
        contextNameInput.value = '';
        const keyValueInputs = document.querySelectorAll('.key-value-pair input');
        keyValueInputs.forEach(input => input.value = '');
    }

    function replaceContexts(content) {
        return content.replace(/{{\s*(\w+\.\w+)\s*}}/g, (match, p1) => {
            const [contextName, contextKey] = p1.split('.');
            return contexts[contextName] && contexts[contextName].find(item => item.key === contextKey) ? contexts[contextName].find(item => item.key === contextKey).value : match;
        });
    }

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

    function updatePreview() {
        const content = currentTab === 'html' ? replaceContexts(htmlContent) : cssContent;
        previewFrame.contentDocument.body.innerHTML = content;
    }

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

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();  // デフォルトの動作（テキスト選択など）を防ぐ
    
        const startX = e.clientX;  // 初期のマウス位置
        const startEditorWidth = editorSection.offsetWidth;  // エディターセクションの初期幅
    
        // ドラッグ中はプレビューエリアのインタラクションを無効にする
        document.body.style.userSelect = 'none';
    
        function onMouseMove(e) {
            // マウスの移動量に基づいて新しい幅を計算
            const newWidth = startEditorWidth + (e.clientX - startX);
            const minWidth = 300;  // エディターの最小幅
            const maxWidth = window.innerWidth - 300;  // 最大幅（ビューアセクションにスペースを残す）
    
            // 新しい幅が最小・最大幅の範囲内に収まるように制限
            const newEditorWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
            const newViewerWidth = window.innerWidth - newEditorWidth;
    
            // エディターとビューアの幅を更新
            editorSection.style.width = `${newEditorWidth}px`;
            viewerSection.style.width = `${newViewerWidth}px`;
    
            // ビューアセクションに現在の幅を表示
            viewerWidthLabel.textContent = `Width: ${Math.round(newViewerWidth)}px`;
        }
    
        function onMouseUp() {
            // ドラッグ終了時にmousemoveとmouseupのイベントリスナーを削除
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
    
            // ドラッグ終了後にテキスト選択を再度有効にする
            document.body.style.userSelect = '';
        }
    
        // mousemoveとmouseupのイベントリスナーをdocumentに追加
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    

    initializeEditor('html', htmlContent);
});
