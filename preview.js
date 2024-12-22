export function initializePreview(tabButtons, editor, editors, previewFrame) {
  let currentLanguage = "html";

  function updatePreview() {
    const previewDocument =
      previewFrame.contentDocument || previewFrame.contentWindow.document;

    // HTML の更新
    const bodyContent = editors.html;
    previewDocument.body.innerHTML = bodyContent;

    // CSS の更新
    let styleTag = previewDocument.head.querySelector("style");
    if (!styleTag) {
      styleTag = previewDocument.createElement("style");
      previewDocument.head.appendChild(styleTag);
    }
    styleTag.textContent = editors.css;

    // JavaScript の更新
    let scriptTag = previewDocument.body.querySelector("script");
    if (scriptTag) {
      scriptTag.remove(); // 古いスクリプトを削除
    }
    scriptTag = previewDocument.createElement("script");
    scriptTag.textContent = editors.javascript;
    previewDocument.body.appendChild(scriptTag);
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // エディタを切り替え
      currentLanguage = button.dataset.lang;
      editor.setValue(editors[currentLanguage]);
      monaco.editor.setModelLanguage(editor.getModel(), currentLanguage);
    });
  });

  editor.onDidChangeModelContent(() => {
    editors[currentLanguage] = editor.getValue();
    updatePreview(); // 内容の変更があった場合のみ更新
  });

  // 初期プレビューの設定
  updatePreview();
}
