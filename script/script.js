const dropdowns = document.querySelectorAll(".dropdown-container"),
  inputLanguageDropdown = document.querySelector("#input-language"),
  outputLanguageDropdown = document.querySelector("#output-language"),
  inputTextElem = document.querySelector("#input-text"),
  outputTextElem = document.querySelector("#output-text"),
  swapBtn = document.querySelector(".swap-position"),
  downloadBtn = document.querySelector("#download-btn"),
  darkModeCheckbox = document.getElementById("dark-mode-btn"),
  uploadDocument = document.querySelector("#upload-document"),
  uploadTitle = document.querySelector("#upload-title"),
  inputChars = document.querySelector("#input-chars");

// Populate language dropdowns
function populateDropdown(dropdown, options) {
  dropdown.querySelector("ul").innerHTML = "";
  options.forEach((option) => {
    const li = document.createElement("li");
    li.innerHTML = option.name + " (" + option.native + ")";
    li.dataset.value = option.code;
    li.classList.add("option");
    dropdown.querySelector("ul").appendChild(li);
  });
}

populateDropdown(inputLanguageDropdown, languages);
populateDropdown(outputLanguageDropdown, languages);

// Dropdown selection logic
dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", () => dropdown.classList.toggle("active"));
  dropdown.querySelectorAll(".option").forEach((item) => {
    item.addEventListener("click", () => {
      dropdown.querySelectorAll(".option").forEach((item) => item.classList.remove("active"));
      item.classList.add("active");
      dropdown.querySelector(".selected").innerHTML = item.innerHTML;
      dropdown.querySelector(".selected").dataset.value = item.dataset.value;
      translate();
    });
  });
});

document.addEventListener("click", (e) => {
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("active");
  });
});

// Swap languages and text
swapBtn.addEventListener("click", () => {
  const tempLang = inputLanguageDropdown.querySelector(".selected").innerHTML;
  inputLanguageDropdown.querySelector(".selected").innerHTML = outputLanguageDropdown.querySelector(".selected").innerHTML;
  outputLanguageDropdown.querySelector(".selected").innerHTML = tempLang;

  const tempCode = inputLanguageDropdown.querySelector(".selected").dataset.value;
  inputLanguageDropdown.querySelector(".selected").dataset.value = outputLanguageDropdown.querySelector(".selected").dataset.value;
  outputLanguageDropdown.querySelector(".selected").dataset.value = tempCode;

  const tempText = inputTextElem.value;
  inputTextElem.value = outputTextElem.value;
  outputTextElem.value = tempText;

  translate();
});

// Translation function
function translate() {
  const inputText = inputTextElem.value;
  const inputLang = inputLanguageDropdown.querySelector(".selected").dataset.value;
  const outputLang = outputLanguageDropdown.querySelector(".selected").dataset.value;

  if (!inputText.trim()) return;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLang}&tl=${outputLang}&dt=t&q=${encodeURI(inputText)}`;
  fetch(url)
    .then((response) => response.json())
    .then((json) => outputTextElem.value = json[0].map((item) => item[0]).join(""))
    .catch((error) => console.error("Translation error:", error));
}

// Input text listener
inputTextElem.addEventListener("input", () => {
  if (inputTextElem.value.length > 5000) inputTextElem.value = inputTextElem.value.slice(0, 5000);
  inputChars.innerHTML = inputTextElem.value.length;
  translate();
});

// File upload
uploadDocument.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
    alert("Please upload a valid file");
    return;
  }

  uploadTitle.innerHTML = file.name;
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = (e) => {
    inputTextElem.value = e.target.result;
    translate();
  };
});

// Download translation
downloadBtn.addEventListener("click", () => {
  if (!outputTextElem.value.trim()) return;
  const outputLang = outputLanguageDropdown.querySelector(".selected").dataset.value;
  const blob = new Blob([outputTextElem.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = `translated-to-${outputLang}.txt`;
  a.href = url;
  a.click();
});

// Dark mode toggle
darkModeCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  setTimeout(applyDarkModeToGoogleTranslate, 500);
});

// Apply dark mode to Google Translate dropdown
function applyDarkModeToGoogleTranslate() {
  let iframe = document.querySelector('.goog-te-menu-frame');
  if (iframe) {
    let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    let styles = `
      body, .goog-te-menu2 { background-color: #222 !important; color: white !important; }
      .goog-te-menu2 a { color: white !important; }
      .goog-te-menu2 a:hover { background-color: #444 !important; }
    `;
    let styleSheet = iframeDoc.createElement("style");
    styleSheet.innerText = styles;
    iframeDoc.head.appendChild(styleSheet);
  }
}

// Typing effect for header
document.addEventListener("DOMContentLoaded", function () {
  const text = " Language Translator!";
  let index = 0;
  function typeText() {
    if (index < text.length) {
      document.getElementById("typed-text").innerHTML += text.charAt(index);
      index++;
      setTimeout(typeText, 100);
    }
  }
  typeText();
});

// Voice input button (single, larger)
const voiceBtn = document.createElement("button");
voiceBtn.innerHTML = '<ion-icon name="mic-outline"></ion-icon>';
voiceBtn.classList.add("voice-btn");
document.querySelector(".text-area").appendChild(voiceBtn);

// Style the voice button (larger size)
voiceBtn.style.fontSize = "12px";
voiceBtn.style.padding = "4px 8px";
voiceBtn.style.borderRadius = "4px";
voiceBtn.style.cursor = "pointer";

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = false;

voiceBtn.addEventListener("click", () => recognition.start());

recognition.onresult = (event) => {
  const spokenText = event.results[0][0].transcript;
  inputTextElem.value = spokenText;
  translate();
};

recognition.onerror = (event) => {
  console.error("Speech recognition error", event.error);
  alert("Speech recognition error. Please try again.");
};

// Scroll animation for About section
window.addEventListener("scroll", function() {
  const aboutSection = document.getElementById("about");
  if (aboutSection.getBoundingClientRect().top < window.innerHeight * 0.75) {
    aboutSection.classList.add("show");
  }
});
