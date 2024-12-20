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
    const contextKeyInput = document.getElementById('context-key');
    const contextValueInput = document.getElementById('context-value');
    const addContextButton = document.getElementById('add-context');
    const contextList = document.getElementById('context-list');

    // コンテキスト操作
    addContextButton.addEventListener('click', () => {
        const name = contextNameInput.value.trim();
        const key = contextKeyInput.value.trim();
        const value = contextValueInput.value.trim();

        if (name && key && value) {
            if (!contexts[name]) {
                contexts[name] = {};
            }
            contexts[name][key] = value;
            updateContextList();
            updatePreview();
        }
    });

    function updateContextList() {
        contextList.innerHTML = Object.entries(contexts)
            .map(([name, keys]) => {
                const keysHtml = Object.entries(keys)
                    .map(([key, value]) => {
                        return `<div class="context-item">
                            <span>{{ ${name}.${key} }}: ${value}</span>
                            <button class="delete-btn" data-name="${name}" data-key="${key}">Delete</button>
                        </div>`;
                    })
                    .join('');
                return `<div><strong>${name}</strong><div>${keysHtml}</div></div>`;
            })
            .join('');

        // 削除ボタンの設定
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.getAttribute('data-name');
                const key = e.target.getAttribute('data-key');
                delete contexts[name][key];
                if (Object.keys(contexts[name]).length === 0) {
                    delete contexts[name];
                }
                updateContextList();
                updatePreview();
            });
        });
    }

    function replaceContexts(content) {
        return content.replace(/{{\s*(\w+\.\w+)\s*}}/g, (match, p1) => {
            const [contextName, contextKey] = p1.split('.');
            return contexts[contextName] && contexts[contextName][contextKey] ? contexts[contextName][contextKey] : match;
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
            } else if (currentTab === 'css') {
                cssContent = currentEditor.getValue();
            }
            updatePreview();
        });
    }

    function updatePreview() {
        const cssWithStyle = `<style>${cssContent}</style>`;
        const frameContent = replaceContexts(`<!DOCTYPE html>
<html>
<head>
${cssWithStyle}
</head>
<body>
${htmlContent}
</body>
</html>`);
        const frameDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(frameContent);
        frameDoc.close();
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            currentTab = button.getAttribute('data-lang');
            if (currentTab === 'html') {
                initializeEditor('html', htmlContent);
            } else if (currentTab === 'css') {
                initializeEditor('css', cssContent);
            }
        });
    });

    resizer.addEventListener('mousedown', function (e) {
        document.body.style.cursor = 'col-resize';
        const startX = e.pageX;
        const startWidth = editorSection.offsetWidth;

        function onMouseMove(e) {
            const delta = e.pageX - startX;
            const newWidth = startWidth + delta;
            editorSection.style.width = `${newWidth}px`;
            viewerWidthLabel.textContent = `Width: ${viewerSection.offsetWidth}px`;
        }

        function onMouseUp() {
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    initializeEditor('html', htmlContent);
    updatePreview();
});
