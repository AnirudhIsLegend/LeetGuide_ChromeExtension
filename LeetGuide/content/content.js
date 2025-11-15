console.log("LeetGuide content script loaded ✅");
// Inject script into page context so we can access Monaco editor
try {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("content/inject.js");
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(script);
  } else {
    console.error("Could not find head or documentElement for script injection");
  }
} catch (err) {
  console.error("Failed to inject script:", err);
}




// Wait for body to be ready
function initChatbot() {
  if (!document.body) {
    setTimeout(initChatbot, 100);
    return;
  }

// Create the Ask AI button
const aiButton = document.createElement("button");
aiButton.innerText = "💡 Ask AI";
aiButton.id = "leetguide-ai-btn";
Object.assign(aiButton.style, {
  position: "fixed",
  bottom: "20px",
  left: "20px",
  zIndex: "9999",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: "14px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
});
document.body.appendChild(aiButton);

// Create the chat container (hidden by default)
const chatContainer = document.createElement("div");
chatContainer.id = "leetguide-chat";
Object.assign(chatContainer.style, {
  position: "fixed",
  bottom: "70px",
  left: "20px",
  width: "450px",
  height: "550px",
  backgroundColor: "black",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  display: "none",
  flexDirection: "column",
  overflow: "hidden",
  zIndex: "10000",
});
chatContainer.innerHTML = `
  <div id="chatMessages" style="flex:1; padding:10px; overflow-y:auto; font-size:14px;"></div>
  <div style="display:flex; border-top:1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.2);">
    <input id="chatInput" type="text" placeholder="Ask LeetGuide..." 
      style="flex:1; border:none; padding:10px; outline:none; background: transparent; color: white; font-size: 14px;">
    <button id="sendBtn" style="border:none; color:white; padding:10px 14px; cursor:pointer; font-size: 14px;">Send</button>
  </div>
`;
document.body.appendChild(chatContainer);

// Toggle chat visibility
aiButton.addEventListener("click", () => {
  chatContainer.style.display = chatContainer.style.display === "none" ? "flex" : "none";
});

// Handle chat interaction - set up after elements are created
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("chatInput");
if (sendBtn && input) {
  const sendMessage = async () => {
    const messages = document.getElementById("chatMessages");
    if (!messages) return;
    
    const userMsg = input.value.trim();
    if (!userMsg) return;

    messages.innerHTML += `<div class="user-message"><div class="message-bubble">${escapeHtml(userMsg)}</div></div>`;
    input.value = "";

    const apiKey = await getGeminiKey();
    if (!apiKey) {
      messages.innerHTML += `<div class="system-message"><div class="message-bubble">⚠️ LeetGuide: Please add your Gemini API key in the popup.</div></div>`;
      console.warn("⚠️ No key found in storage");
      return;
    }

    // Combine question with problem text and user's code
    const problemText = getProblemText();
    let userCode = await fetchUserCode();
    const prompt = `
You are helping the user solve a LeetCode problem. 
Follow these rules carefully:

1. **Do NOT give the final answer or full code unless the user explicitly asks for it.**
2. First, **explain the problem in simple terms** so the user clearly understands what is being asked.
3. When the user is stuck, **look at their code**, point out mistakes, give hints, and guide them step-by-step.
4. Provide **the next step or correction**, not the entire solved solution.
5. Only provide full code or the full solution when the user clearly says they want it.

## Problem
${problemText}

## User Code
\`\`\`
${userCode}
\`\`\`

## User Question
${userMsg}

Give a clear, structured, mentor-style explanation.
`;


    messages.innerHTML += `<div class="thinking-message"><i>Thinking...</i></div>`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      const data = await response.json();
      console.log("Gemini API response:", data);

      if (data?.candidates && data.candidates.length > 0) {
        const aiText = data.candidates[0].content.parts
          .map(p => p.text)
          .join(" ");
        // Remove "Thinking..." message before adding response
        const thinkingMsg = messages.querySelector('.thinking-message');
        if (thinkingMsg) thinkingMsg.remove();
        // Format the response for better readability
        const formattedText = formatResponse(aiText);
        messages.innerHTML += `<div class="api-message"><div class="message-bubble">${formattedText}</div></div>`;
      } else if (data.error) {
        const thinkingMsg = messages.querySelector('.thinking-message');
        if (thinkingMsg) thinkingMsg.remove();
        const errorMsg = data.error.message || 'Unknown error';
        messages.innerHTML += `<div class="system-message"><div class="message-bubble">⚠️ API Error: ${escapeHtml(errorMsg)}</div></div>`;
      } else {
        const thinkingMsg = messages.querySelector('.thinking-message');
        if (thinkingMsg) thinkingMsg.remove();
        messages.innerHTML += `<div class="system-message"><div class="message-bubble">⚠️ No valid response from Gemini.</div></div>`;
      }

      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      const thinkingMsg = messages.querySelector('.thinking-message');
      if (thinkingMsg) thinkingMsg.remove();
      messages.innerHTML += `<div class="system-message"><div class="message-bubble">⚠️ Error: ${escapeHtml(err.message)}</div></div>`;
      console.error("Gemini fetch failed", err);
    }
  };
  
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
} else {
  console.error("Send button or input not found");
}

}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}

// Fetch Gemini API key properly
async function getGeminiKey() {
  return new Promise(resolve => {
    chrome.storage.local.get("geminiApiKey", data => {
      if (data && data.geminiApiKey) resolve(data.geminiApiKey);
      else resolve(null);
    });
  });
}

// Get problem text (fallback if not found)
function getProblemText() {
  // 1. Try to get the problem title
  const titleEl = document.querySelector('div.text-title-large.font-semibold.text-text-primary');
  const title = titleEl ? titleEl.textContent.trim() : "Unknown Problem";

  // 2. Try to get the main problem description
  const descriptionEl = document.querySelector('div[data-track-load="description_content"]');
  const description = descriptionEl ? descriptionEl.innerText.trim() : "⚠️ Could not extract problem description.";

  // 3. Try to get all examples (if any)
  const examples = Array.from(document.querySelectorAll('strong.example'))
    .map(example => {
      const pre = example.closest('p')?.nextElementSibling?.outerText ?? "";
      return `${example.innerText}\n${pre}`;
    })
    .join("\n\n");

  // 4. Combine everything nicely
  return `${title}\n\n${description}\n\n${examples}`;
}

function fetchUserCode() {
  return new Promise(resolve => {
    window.addEventListener("leetguide-code-response", e => {
      resolve(e.detail.code || "⚠️ Unable to extract code.");
    }, { once: true });

    window.dispatchEvent(new Event("leetguide-get-code"));
  });
}






// Format AI response text for better readability
function formatResponse(text) {
  if (!text) return '';

  // Step 1: Protect code blocks first (they should not be processed)
  const codeBlocks = [];
  let codeBlockIndex = 0;
  let formatted = text.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
    codeBlocks[codeBlockIndex] = match;
    codeBlockIndex++;
    return placeholder;
  });

  // Step 2: Process bold markdown (**text**) BEFORE HTML escaping
  // Use safe placeholders that don't contain markdown characters (underscores only)
  let boldIndex = 0;
  formatted = formatted.replace(/\*\*([^*\n]+?)\*\*/g, (match, content) => {
    const placeholder = `__BOLD_START_${boldIndex}__${content}__BOLD_END_${boldIndex}__`;
    boldIndex++;
    return placeholder;
  });

  // Step 3: Escape HTML to prevent XSS (placeholders use underscores, which are safe)
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Step 4: Restore code blocks and format them properly
  codeBlocks.forEach((block, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    const codeMatch = block.match(/```(?:\w+)?\n?([\s\S]*?)```/);
    if (codeMatch) {
      const code = codeMatch[1].trim();
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      formatted = formatted.replace(placeholder, 
        `<pre class="code-block"><code class="code-content">${escapedCode}</code></pre>`);
    }
  });

  // Step 5: Convert inline code (`...`) - but not inside code blocks (already replaced)
  formatted = formatted.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');

  // Step 6: Convert *italic* text (safe placeholders won't be matched by this regex)
  formatted = formatted.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  // Step 7: Restore bold placeholders to HTML <strong> tags
  // Pattern: __BOLD_START_N__content__BOLD_END_N__ (content may be HTML-escaped)
  formatted = formatted.replace(/__BOLD_START_(\d+)__(.+?)__BOLD_END_\1__/g, 
    '<strong>$2</strong>');

  // Step 8: Process lists (preserve code blocks)
  const parts = formatted.split(/(<pre[\s\S]*?<\/pre>)/g);
  const processedParts = parts.map(part => {
    if (part.startsWith('<pre')) {
      return part; // Keep code blocks as-is
    }
    
    // Convert numbered lists (1. item)
    part = part.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="list-item">$2</li>');
    
    // Convert bullet lists (- item or * item at start of line)
    part = part.replace(/^[-*]\s+(.+)$/gm, '<li class="list-item">$1</li>');
    
    // Wrap consecutive list items
    part = part.replace(/(<li class="list-item">[^<]+<\/li>(?:\s*<li class="list-item">[^<]+<\/li>)*)/g, (match) => {
      const firstItem = match.match(/<li class="list-item">(.+?)<\/li>/);
      if (firstItem && /^\d+\./.test(firstItem[1].trim())) {
        return `<ol class="numbered-list">${match}</ol>`;
      }
      return `<ul class="bullet-list">${match}</ul>`;
    });
    
    return part;
  });
  formatted = processedParts.join('');

  // Step 9: Process paragraphs (preserve code blocks and lists)
  const paraParts = formatted.split(/(<pre[\s\S]*?<\/pre>|<ol[\s\S]*?<\/ol>|<ul[\s\S]*?<\/ul>)/g);
  const processedParaParts = paraParts.map(part => {
    if (part.startsWith('<pre') || part.startsWith('<ol') || part.startsWith('<ul')) {
      return part; // Keep code blocks and lists as-is
    }
    
    // Split by double line breaks for paragraphs
    const paragraphs = part.split(/\n\n+/);
    return paragraphs.map(para => {
      para = para.trim();
      if (!para) return '';
      // Don't wrap lists in paragraphs (shouldn't happen here, but safety check)
      if (para.startsWith('<ol') || para.startsWith('<ul')) {
        return para;
      }
      // Check if it's just whitespace or empty after processing
      const textOnly = para.replace(/<[^>]+>/g, '').trim();
      if (!textOnly) return '';
      return `<p class="response-paragraph">${para}</p>`;
    }).filter(p => p).join('');
  });
  formatted = processedParaParts.join('');

  // Step 10: Convert remaining single line breaks to <br> (but not in code blocks)
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Step 11: Remove <br> tags inside code blocks (they should preserve actual newlines)
  formatted = formatted.replace(/(<pre[\s\S]*?<code[^>]*>)([\s\S]*?)(<\/code>[\s\S]*?<\/pre>)/g, (match, start, code, end) => {
    const cleanedCode = code.replace(/<br>/g, '\n');
    return start + cleanedCode + end;
  });

  return formatted;
}


// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
