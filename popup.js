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
                console.log("🔍 selector:", selector);
  
                const targetNode = document.body;
  
                const observer = new MutationObserver((mutations, obs) => {
                  const editor = document.querySelector(selector);
                  console.log("🎯 editor:", document.querySelector('#prompt-textarea'));

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
  