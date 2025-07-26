// This function must be in the global scope for the Google script to find it.
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: "en", layout: google.translate.TranslateElement.InlineLayout.SIMPLE },
    "google_translate_element"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element Selectors ---
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
    inputChars = document.querySelector("#input-chars"),
    copyBtn = document.getElementById("copy-btn"),
    typedTextElem = document.getElementById("typed-text"),
    voiceBtnContainer = document.querySelector(".input-wrapper .text-area"),
    yearSpan = document.getElementById("year"),
    speakBtn = document.getElementById("speak-btn");

  let voiceBtn; // Will be assigned when created
  let voices = []; // To store available speech synthesis voices
  // --- Utility ---
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // --- Core Functions ---
  function loadVoices() {
    voices = window.speechSynthesis.getVoices();
  }

  function populateDropdown(dropdown, options) {
    const ul = dropdown.querySelector("ul");
    // Clear only the language options, not the search box
    ul.querySelectorAll(".option").forEach(option => option.remove());

    options.forEach((langOption) => {
      const li = document.createElement("li");
      li.innerHTML = `${langOption.name} (${langOption.native})`;
      li.dataset.value = langOption.code;
      li.classList.add("option");
      // Set default selections
      if (dropdown.id === 'input-language' && langOption.code === 'auto') {
        li.classList.add('active');
        dropdown.querySelector('.selected').innerHTML = li.innerHTML;
        dropdown.querySelector('.selected').dataset.value = li.dataset.value;
      }
      if (dropdown.id === 'output-language' && langOption.code === 'en') {
        li.classList.add('active');
        dropdown.querySelector('.selected').innerHTML = li.innerHTML;
        dropdown.querySelector('.selected').dataset.value = li.dataset.value;
      }
      ul.appendChild(li);
    });
  }

  function updateVoiceButtonState() {
    if (!voiceBtn) return;
    const fromLangCode = inputLanguageDropdown.querySelector(".selected").dataset.value;
    const isDisabled = (fromLangCode === 'auto');
    
    voiceBtn.disabled = isDisabled;
    voiceBtn.title = isDisabled
      ? "Please select a specific language to use voice input"
      : "Use voice input";
  }

  function translate() {
    const inputText = inputTextElem.value.trim();
    const inputLang = inputLanguageDropdown.querySelector(".selected").dataset.value;
    const outputLang = outputLanguageDropdown.querySelector(".selected").dataset.value;

    if (!inputText) {
      outputTextElem.value = "";
      // Reset the auto-detect display text when input is cleared
      if (inputLang === 'auto') {
        const autoDetectOption = inputLanguageDropdown.querySelector('.option[data-value="auto"]');
        if (autoDetectOption) {
            inputLanguageDropdown.querySelector('.selected').innerHTML = autoDetectOption.innerHTML;
        }
      }
      return;
    }

    outputTextElem.value = "Translating...";

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLang}&tl=${outputLang}&dt=t&q=${encodeURI(inputText)}`;
    
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('API request failed');
        return response.json();
      })
      .then((json) => {
        const translatedText = json[0]?.map((item) => item[0]).join("") || "";
        const detectedLangCode = json[2];

        if (inputLang === 'auto' && detectedLangCode) {
          const detectedLang = languages.find(lang => lang.code === detectedLangCode);
          if (detectedLang) {
            inputLanguageDropdown.querySelector('.selected').innerHTML = `Auto Detect (${detectedLang.name})`;
          }
        }

        // If detected language is the same as the target, show a helpful message.
        if (detectedLangCode === outputLang) {
          outputTextElem.value = "Input is already in the target language.";
        } else {
          outputTextElem.value = translatedText;
        }
      })
      .catch((error) => {
        console.error("Translation error:", error);
        outputTextElem.value = "Error: Could not translate.";
      });
  }

  const debouncedTranslate = debounce(translate, 500);

  // --- Event Listeners ---
  function initEventListeners() {
    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector(".dropdown-toggle");
      const options = dropdown.querySelector(".dropdown-menu");

      toggle.addEventListener("click", () => {
        dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('active'); });
        dropdown.classList.toggle("active");
      });

      const searchBox = dropdown.querySelector('.search-box');
      if (searchBox) {
        // Prevent dropdown from closing when clicking the search box
        searchBox.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Filter the language list on input
        searchBox.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          const options = dropdown.querySelectorAll('.option');
          options.forEach(option => {
            const text = option.textContent.toLowerCase();
            // Show or hide the option based on the search term
            option.style.display = text.includes(searchTerm) ? '' : 'none';
          });
        });
      }

      options.addEventListener("click", (e) => {
        if (e.target.classList.contains("option")) {
          dropdown.querySelector(".option.active")?.classList.remove("active");
          e.target.classList.add("active");
          const selected = dropdown.querySelector(".selected");
          selected.innerHTML = e.target.innerHTML;
          selected.dataset.value = e.target.dataset.value;
          translate();
          if (dropdown.id === 'input-language') {
            updateVoiceButtonState();
          }
          // Close the dropdown after selection
          dropdown.classList.remove("active");
        }
      });
    });

    document.addEventListener("click", (e) => {
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("active");
        }
      });
    });

    swapBtn.addEventListener("click", () => {
      [inputTextElem.value, outputTextElem.value] = [outputTextElem.value, inputTextElem.value];
      const inputSelected = inputLanguageDropdown.querySelector(".selected");
      const outputSelected = outputLanguageDropdown.querySelector(".selected");
      [inputSelected.innerHTML, outputSelected.innerHTML] = [outputSelected.innerHTML, inputSelected.innerHTML];
      [inputSelected.dataset.value, outputSelected.dataset.value] = [outputSelected.dataset.value, inputSelected.dataset.value];
      inputLanguageDropdown.querySelector('.option.active')?.classList.remove('active');
      outputLanguageDropdown.querySelector('.option.active')?.classList.remove('active');
      inputLanguageDropdown.querySelector(`.option[data-value="${inputSelected.dataset.value}"]`)?.classList.add('active');
      outputLanguageDropdown.querySelector(`.option[data-value="${outputSelected.dataset.value}"]`)?.classList.add('active');
      updateVoiceButtonState();
      translate();
    });

    // Update character count and trigger translation on text input
    inputTextElem.addEventListener("input", () => {
      const textLength = inputTextElem.value.length;
      inputChars.textContent = Math.min(textLength, 5000);
      debouncedTranslate();
    });

    uploadDocument.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      uploadTitle.innerHTML = file.name;
      const reader = new FileReader();

      if (file.size > 10 * 1024 * 1024) { // 10 MB limit
        alert("File size should be less than 10 MB.");
        return;
      }

      reader.readAsText(file);
      reader.onload = (e) => {
        inputTextElem.value = e.target.result;
        translate();
      };
    });

    downloadBtn.addEventListener("click", () => {
      if (!outputTextElem.value.trim() || outputTextElem.value.includes("Translating...")) return;
      const blob = new Blob([outputTextElem.value], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `translation.txt`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    copyBtn.addEventListener("click", () => {
      const textToCopy = outputTextElem.value;
      if (navigator.clipboard && textToCopy && !textToCopy.includes("Translating...")) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          copyBtn.classList.add("show-tooltip");
          setTimeout(() => {
            copyBtn.classList.remove("show-tooltip");
          }, 2000);
        });
      }
    });

    speakBtn.addEventListener("click", () => {
      const textToSpeak = outputTextElem.value;
      const outputLang = outputLanguageDropdown.querySelector(".selected").dataset.value;

      // Forcefully reset the speech synthesis engine to prevent intermittent failures.
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      if (textToSpeak && !textToSpeak.includes("Translating...") && !textToSpeak.includes("target language")) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const selectedVoice = voices.find(voice => voice.lang === outputLang) || voices.find(voice => voice.lang.startsWith(outputLang));
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          // Fallback to setting the lang property if no specific voice is found
          utterance.lang = outputLang;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    });

    darkModeCheckbox.addEventListener("change", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    });

    window.addEventListener("scroll", () => {
      const aboutSection = document.getElementById("about");
      if (aboutSection.getBoundingClientRect().top < window.innerHeight * 0.75) {
        aboutSection.classList.add("show");
      }
    });
  }

  // --- Initialization ---
  function init() {
    // Pre-load voices for text-to-speech, which can be asynchronous
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    populateDropdown(inputLanguageDropdown, languages);
    populateDropdown(outputLanguageDropdown, languages);

    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark");
      darkModeCheckbox.checked = true;
    }

    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }

    const textToType = " Language Translator!";
    let i = 0;
    function typeEffect() {
      if (i < textToType.length) {
        typedTextElem.innerHTML += textToType.charAt(i++);
        setTimeout(typeEffect, 100);
      }
    }
    typeEffect();

    if (window.particlesJS) {
      particlesJS("particles-js", {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: "#ffffff" },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: false },
          size: { value: 3, random: true },
          line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
          move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out", bounce: false },
        },
        interactivity: { detect_on: "canvas", events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true } },
        retina_detect: true,
      });
    }

    voiceBtn = document.createElement("button");
    voiceBtn.innerHTML = '<ion-icon name="mic-outline"></ion-icon>';
    voiceBtn.classList.add("voice-btn");
    voiceBtnContainer.appendChild(voiceBtn);

    // Safely set up Speech Recognition if supported by the browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();

      recognition.onstart = () => {
        voiceBtn.classList.add("listening");
      };
  
      recognition.onend = () => {
        voiceBtn.classList.remove("listening");
      };

      voiceBtn.addEventListener("click", () => {
        const fromLangCode = inputLanguageDropdown.querySelector(".selected").dataset.value;
        recognition.lang = (fromLangCode === 'auto') ? 'en-US' : fromLangCode;
        try {
          recognition.start();
        } catch (error) {
          alert(`Speech recognition for this language might not be supported by your browser.`);
        }
      });

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        inputTextElem.value = spokenText;
        inputTextElem.dispatchEvent(new Event('input', { bubbles: true }));
      };

      recognition.onerror = (event) => {
        voiceBtn.classList.remove("listening");
        console.error("Speech recognition error", event.error);
        alert("Speech recognition error. Please try again.");
      };
    } else {
      // If the browser doesn't support speech recognition, hide the button.
      voiceBtn.style.display = 'none';
    }

    updateVoiceButtonState(); // Set initial state

    initEventListeners();
  }

  init();
});
