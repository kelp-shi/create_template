Split(["#one", "#two", "#three"], {
  sizes: [10, 35, 55],
  gutterSize: 10,
  minSize: 200,
});
require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  const tabButtons = document.querySelectorAll(".tab-button");
  const previewFrame = document.getElementById("preview-frame");
  const editorContainer = document.getElementById("editor-container");
	//コンテキストエリア要素
	const addKeyValueButton = document.getElementById('add-key-value');
	const keyValuePairsContainer = document.getElementById('key-value-pairs');
	const contextNameInput = document.getElementById('context-name');
  const contextList = document.getElementById('context-list');
  const addContextButton = document.getElementById('add-context');
  const contexts = {};
  //フレーム更新
  const refreshButton = document.getElementById('refresh');

  let currentLanguage = "html";
  const editors = {
    html: "<!DOCTYPE html>\n<html>\n  <head>\n    <title>Document</title>\n  </head>\n  <body>\n    Hello, world!\n  </body>\n</html>",
    css: "body {\n  font-family: Arial, sans-serif;\n}",
    javascript: 'console.log("Hello, world!");',
  };

  //フレーム再読み込み
  refreshButton.addEventListener('click', () => {
    previewFrame.contentWindow.location.reload();
  });


	//コンテキストのキーペア追加
	addKeyValueButton.addEventListener('click', () => {
    const newKeyValuePair = document.createElement('div');
    newKeyValuePair.classList.add('key-value-pair');
    newKeyValuePair.innerHTML = `
      <label>Key: <input type="text" class="context-key" placeholder="e.g., name"></label>
      <label>Value: <input type="text" class="context-value" placeholder="e.g., yuuya"></label>
      <button class="remove-pair-btn">Remove</button>
    `;
    // 新しいキーとバリューのペアを追加
    keyValuePairsContainer.appendChild(newKeyValuePair);
    // <hr>タグを追加
    const hr = document.createElement('hr');
    keyValuePairsContainer.appendChild(hr);
    // 削除ボタンのイベントリスナーを追加
    const removeButton = newKeyValuePair.querySelector('.remove-pair-btn');
    removeButton.addEventListener('click', () => {
      keyValuePairsContainer.removeChild(newKeyValuePair);
      keyValuePairsContainer.removeChild(hr);  // <hr>も削除
    });
  });

  //コンテキスト登録処理
  //keyが入力されている場合は登録（valueはnullも可能）未入力は登録されない
  addContextButton.addEventListener('click', () =>{
    const name = contextNameInput.value.trim();
    const keyValuePairs = Array.from(document.querySelectorAll('.key-value-pair')).map(pair => {
      const key = pair.querySelector('.context-key').value.trim();
      const value = pair.querySelector('.context-value').value.trim();
      return { key, value };
    })
    .filter(pair => pair.key || (pair.key && !pair.value));

    if (name&&keyValuePairs.length>0){
      if (!contexts[name]) {
        contexts[name] = [];
      }
      keyValuePairs.forEach(({ key, value }) => {
        const existingPair = contexts[name].find(item => item.key === key);
        if (existingPair) {
          // 既存のvalueを更新
          existingPair.value = value;
        } else {
          // 新しいペアを追加
          contexts[name].push({ key, value });
        }
      });
      updateContextList();
      clearInputs();
      updatePreview();
    }
  });

  //画面に反映
  function updateContextList() {
    contextList.innerHTML = Object.entries(contexts)
    .map(([name, keyValuePairs]) => {
      const keyValueHtml = keyValuePairs.map(({ key, value }) => {
        return `<div class="context-item">
        <button class="delete-btn" data-name="${name}" data-key="${key}">Delete</button>
          <span>${key} : ${value}</span>
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

  //コンテキスト登録後、インプットの値を空文字に
  function clearInputs() {
    contextNameInput.value = '';
    const keyValueInputs = document.querySelectorAll('.key-value-pair input');
    keyValueInputs.forEach(input => input.value = '');
  }

  //viewerへの反映
  function replaceContexts(content) {
    return content.replace(/{{\s*(\w+\.\w+)\s*}}/g, (match, p1) => {
      const [contextName, contextKey] = p1.split('.');
      return contexts[contextName] && contexts[contextName].find(item => item.key === contextKey) ? contexts[contextName].find(item => item.key === contextKey).value : match;
    });
  }

  let editor = monaco.editor.create(editorContainer, {
    value: editors[currentLanguage],
    language: currentLanguage,
    theme: "vs-dark",
    automaticLayout: true,
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentLanguage = button.dataset.lang;

      editor.setValue(editors[currentLanguage]);
      monaco.editor.setModelLanguage(editor.getModel(), currentLanguage);
    });
  });

  editor.onDidChangeModelContent(() => {
    editors[currentLanguage] = editor.getValue();
    updatePreview();
  });

  const updatePreview = () => {
    const htmlContent = replaceContexts(editors.html);
    const cssContent = replaceContexts(editors.css);
    const jsContent = replaceContexts(editors.javascript);
    const previewDocument =
      previewFrame.contentDocument || previewFrame.contentWindow.document;
      previewDocument.open();
      previewDocument.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <style>${cssContent}</style>
      </head>
      <body>
        ${htmlContent}
        <script>${jsContent}<\/script>
      </body>
      </html>
    `);
    previewDocument.close();
  };

  // Initialize preview
  updatePreview();
});
