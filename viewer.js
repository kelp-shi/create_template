const viewerWidthLabel = document.getElementById('viewer-width');
const editorSection = document.getElementById('editor-section');
const viewerSection = document.getElementById('viewer-section');
const resizer = document.getElementById('resizer');
const previewFrame = document.getElementById('preview-frame');

function replaceContexts(content) {
    return content.replace(/{{\s*(\w+\.\w+)\s*}}/g, (match, p1) => {
        const [contextName, contextKey] = p1.split('.');
        // コンテキストが存在する場合に値を置き換える
        const context = contexts[contextName] && contexts[contextName].find(item => item.key === contextKey);
        return context ? context.value : match;
    });
}

function updatePreview() {
    const htmlWithContexts = replaceContexts(htmlContent);
    const cssWithContexts = replaceContexts(cssContent);
    // HTMLのコンテンツをプレビュー用iframeに挿入
    const iframeDocument = previewFrame.contentDocument || previewFrame.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(htmlWithContexts);
    iframeDocument.close();
    // CSSをiframeに追加
    const styleTag = iframeDocument.querySelector('style') || iframeDocument.createElement('style');
    styleTag.textContent = cssWithContexts;
    iframeDocument.head.appendChild(styleTag);
}

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