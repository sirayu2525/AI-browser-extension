chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({ id: "explain", title: "選択部分の詳しい解説", contexts: ["selection"] });
    chrome.contextMenus.create({ id: "related", title: "選択部分に関連したものを検索", contexts: ["selection"] });
    chrome.contextMenus.create({ id: "rewrite", title: "文章を変えてプロンプトに入力", contexts: ["selection"] });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info) => {
    const selectedText = info.selectionText;
    if (info.menuItemId === "rewrite") {
      chrome.storage.local.set({ rewriteText: selectedText });
      chrome.action.openPopup();
      return;
    }
  
    let prompt = "";
    if (info.menuItemId === "explain") {
      prompt = `以下の文章を詳しく解説してください：\n${selectedText}`;
    } else if (info.menuItemId === "related") {
      prompt = `この文章に関連するトピックや背景を教えてください：\n${selectedText}`;
    }
  
    const urls = [
      { url: "https://chat.openai.com", name: "chatgpt" },
      { url: "https://gemini.google.com/app", name: "gemini" }
    ];
  
    for (const { url, name } of urls) {
      chrome.tabs.create({ url }, (newTab) => {
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          func: (prompt, site) => {
            const waitForEditorAndSendPrompt = (prompt, site) => {
              const selector = site === "chatgpt"
                ? "#prompt-textarea"
                : 'div[contenteditable="true"][role="textbox"]';
  
              const targetNode = document.body;
  
              const observer = new MutationObserver((mutations, obs) => {
                const editor = document.querySelector(selector);
                if (editor && editor.isContentEditable) {
                  obs.disconnect();
                  editor.focus();
  
                  const selection = window.getSelection();
                  const range = document.createRange();
                  range.selectNodeContents(editor);
                  range.deleteContents();
                  selection.removeAllRanges();
                  selection.addRange(range);
  
                  document.execCommand("insertText", false, prompt);
  
                  editor.dispatchEvent(new KeyboardEvent("keydown", {
                    bubbles: true,
                    cancelable: true,
                    key: "Enter",
                    code: "Enter",
                    keyCode: 13
                  }));
                }
              });
  
              observer.observe(targetNode, {
                childList: true,
                subtree: true
              });
  
              // タイムアウトで自動停止（10秒）
              setTimeout(() => observer.disconnect(), 10000);
            };
  
            waitForEditorAndSendPrompt(prompt, site);
          },
          args: [prompt, name],
        });
      });
    }
  });
  