document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("rewriteText", (data) => {
      document.getElementById("editor").value = data.rewriteText || "";
    });
  
    document.getElementById("send").addEventListener("click", () => {
      const prompt = document.getElementById("editor").value;
      const urls = [
        { url: "https://chat.openai.com", name: "chatgpt" }
        // { url: "https://gemini.google.com/app", name: "gemini" }
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
                  
                    const observer = new MutationObserver((_, obs) => {
                      const editor = document.querySelector(selector);
                  
                      if (editor && editor.isContentEditable) {
                        console.log("✅ editor 見つかったよ！");
                        obs.disconnect(); // 一度見つけたら監視終了
                  
                        // 🕒 3秒待機してから処理開始（任意）
                        setTimeout(() => {
                          editor.focus();
                  
                          // ✏️ テキストを直接代入
                          editor.textContent = prompt;
                  
                          // 📢 InputEvent を発火して「入力された」と認識させる
                          editor.dispatchEvent(new InputEvent("input", {
                            bubbles: true,
                            cancelable: true,
                            inputType: "insertText",
                            data: prompt
                          }));
                  
                          // 🚀 Enter キーイベントを発火して送信（必要なら）
                          editor.dispatchEvent(new KeyboardEvent("keydown", {
                            bubbles: true,
                            cancelable: true,
                            key: "Enter",
                            code: "Enter",
                            keyCode: 13
                          }));
                  
                          console.log("🎉 入力＆送信完了！");
                        }, 3000);
                      }
                    });
                  
                    observer.observe(targetNode, {
                      childList: true,
                      subtree: true
                    });
                  
                    // タイムアウト保険：10秒後に監視停止
                    setTimeout(() => observer.disconnect(), 10000);
                  };
  
              waitForEditorAndSendPrompt(prompt, site);
            },
            args: [prompt, name],
          });
        });
      }
      window.close();
    });
  });
  