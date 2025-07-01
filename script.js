const input = document.getElementById("input");
const output = document.getElementById("output");
const suggestions = document.getElementById("suggestions");
let history = JSON.parse(localStorage.getItem("history") || "[]");
let historyIndex = history.length;

const commands = {
  help: "Available commands: help, clear, ascii, trace, weather, scan, decrypt, sudo, exit, ai",
  ascii: "Welcome to\n██╗░░░░░██╗███╗░░░███╗██████╗░\n██║░░░░░██║████╗░████║██╔══██╗\n██║░░░░░██║██╔████╔██║██║░░██║\n██║░░░░░██║██║╚██╔╝██║██║░░██║\n███████╗██║██║░╚═╝░██║██████╔╝\n╚══════╝╚═╝╚═╝░░░░░╚═╝╚═════╝░",
  clear: "__CLEAR__",
  exit: "Exiting terminal... (not really)",
  sudo: "Permission denied: You are not root 😉",
  decrypt: "Decrypting... 🔓\nCode fragment identified: {0xAC19...EF4D}",
  scan: "Scanning... 🔍\nPorts open: 22, 80, 443\nServices running: ssh, http, https"
};

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const cmd = input.value.trim();
    if (!cmd) return;
    history.push(cmd);
    historyIndex = history.length;
    localStorage.setItem("history", JSON.stringify(history));
    runCommand(cmd);
    input.value = "";
    suggestions.innerHTML = "";
  } else if (e.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex];
    }
  } else if (e.key === "ArrowDown") {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
    } else {
      input.value = "";
    }
  } else {
    showSuggestions(input.value.trim());
  }
});

function appendOutput(text, glitch = false) {
  const result = document.createElement("div");
  result.textContent = text;
  if (glitch) result.classList.add("glitch");
  output.appendChild(result);
  output.scrollTop = output.scrollHeight;
}

async function runCommand(cmd) {
  const div = document.createElement("div");
  div.innerHTML = `<span class="text-purple-400">$ ${cmd}</span>`;
  output.appendChild(div);

  if (commands[cmd]) {
    if (commands[cmd] === "__CLEAR__") {
      output.innerHTML = "";
      return;
    }
    appendOutput(commands[cmd]);
  } else if (cmd === "trace") {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    appendOutput(`Tracing route...
IP: ${data.ip}
City: ${data.city}
Region: ${data.region}
Country: ${data.country_name}
Org: ${data.org}`);
  } else if (cmd === "weather") {
    const res = await fetch("https://wttr.in/?format=3");
    const text = await res.text();
    appendOutput(`Weather: ${text}`);
  } else if (cmd.startsWith("ai")) {
    const prompt = cmd.slice(3).trim() || "Hello, who are you?";
    const aiRes = await fetch("https://openrouter.ai/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: "openai/gpt-3.5-turbo"
      })
    }).then(res => res.json()).catch(() => null);
    if (aiRes && aiRes.choices) {
      appendOutput("🤖 " + aiRes.choices[0].message.content);
    } else {
      appendOutput("AI unavailable or limit reached.");
    }
  } else {
    appendOutput("Command not found.", true);
  }
}

function showSuggestions(inputText) {
  suggestions.innerHTML = "";
  if (!inputText) return;
  Object.keys(commands).forEach((cmd) => {
    if (cmd.startsWith(inputText)) {
      const btn = document.createElement("button");
      btn.textContent = cmd;
      btn.className = "px-2 py-1 bg-green-700 text-sm text-white rounded hover:bg-green-800";
      btn.onclick = () => {
        input.value = cmd;
        suggestions.innerHTML = "";
        input.focus();
      };
      suggestions.appendChild(btn);
    }
  });
}

// Voice command via Web Speech API
if ("webkitSpeechRecognition" in window) {
  const micBtn = document.createElement("button");
  micBtn.textContent = "🎤";
  micBtn.className = "ml-2 px-2 py-1 bg-cyan-700 text-white rounded";
  micBtn.onclick = () => {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      input.value = transcript;
    };
    recognition.start();
  };
  document.querySelector(".flex.items-center").appendChild(micBtn);
}
