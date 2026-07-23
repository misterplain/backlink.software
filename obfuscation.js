/**
 * obfuscation.js
 *
 * Generator logic for backlink.software.
 *
 * Responsibilities:
 *  - Validate and normalise the target URL supplied by the user.
 *  - Build a self-executing copy-event listener snippet that appends a
 *    "Source: <url>" attribution to any text copied from a host page.
 *  - Obfuscate that snippet (identifier mangling + Base64 string encoding)
 *    so it is not immediately readable in page source.
 *  - Wire up all UI interactions: Generate, Copy output, Peek modal,
 *    Test lab sample selection, and paste verification.
 */

(function () {
  /* ----------------------------------------------------------
     DOM references
  ---------------------------------------------------------- */
  var urlInput = document.getElementById("urlInput");
  var generateButton = document.getElementById("generateButton");
  var peekButton = document.getElementById("peekButton");
  var copyOutputButton = document.getElementById("copyOutputButton");
  var selectTestSampleButton = document.getElementById(
    "selectTestSampleButton",
  );
  var testSampleContent = document.getElementById("testSampleContent");
  var testPasteBox = document.getElementById("testPasteBox");
  var testStatusMessage = document.getElementById("testStatusMessage");
  var testExpectation = document.getElementById("testExpectation");
  var outputCode = document.getElementById("outputCode");
  var statusMessage = document.getElementById("statusMessage");
  var peekModal = document.getElementById("peekModal");
  var peekOutput = document.getElementById("peekOutput");
  var closeModalButton = document.getElementById("closeModalButton");

  /* ----------------------------------------------------------
     Application state
     Holds the last-generated snippet and related metadata so
     that UI actions (Peek, Copy, Test) can access them without
     re-running generation.
  ---------------------------------------------------------- */
  var state = {
    previewCode: "",
    sourceCode: "",
    obfuscatedCode: "",
    normalizedUrl: "",
    testListenerEnabled: false,
  };

  /* ----------------------------------------------------------
     Status helpers
     Drive the aria-live status banner and the test-lab banner
     by setting / clearing the data-state attribute, which CSS
     uses to show the correct colour variant.
  ---------------------------------------------------------- */

  function setStatus(type, message) {
    statusMessage.dataset.state = type;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.removeAttribute("data-state");
    statusMessage.textContent = "";
  }

  function setTestStatus(type, message) {
    testStatusMessage.dataset.state = type;
    testStatusMessage.textContent = message;
  }

  function clearTestStatus() {
    testStatusMessage.removeAttribute("data-state");
    testStatusMessage.textContent = "";
  }

  /**
   * Updates the expectation hint shown above the paste box.
   * @param {string} url - The normalised backlink URL, or empty string to reset.
   */
  function updateTestExpectation(url) {
    if (!url) {
      testExpectation.textContent =
        "Expected result after paste: your copied text + Source: your URL";
      return;
    }

    testExpectation.textContent =
      "Expected result after paste: your copied text + Source: " + url;
  }

  /* ----------------------------------------------------------
     URL validation
     Accepts bare domains (e.g. "example.com") by prepending
     "https://", then uses the URL constructor for strict
     structural validation.
  ---------------------------------------------------------- */

  /**
   * Normalises and validates a raw URL string.
   * @param {string} value - Raw input from the URL field.
   * @returns {{ ok: true, value: string } | { ok: false, error: string }}
   */
  function normalizeUrl(value) {
    var trimmed = value.trim();

    if (!trimmed) {
      return { ok: false, error: "Enter a URL before generating." };
    }

    var candidate = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : "https://" + trimmed;

    try {
      var parsed = new URL(candidate);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { ok: false, error: "Use an http or https URL." };
      }

      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        return {
          ok: false,
          error: "Enter a full domain such as https://example.com.",
        };
      }

      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(parsed.hostname)) {
        return {
          ok: false,
          error: "The URL needs a valid domain ending, like .com.",
        };
      }

      return { ok: true, value: parsed.href };
    } catch (error) {
      return {
        ok: false,
        error: "Enter a valid URL such as https://example.com.",
      };
    }
  }

  /* ----------------------------------------------------------
     Preview snippet
     Returns the human-readable example shown in the Peek modal.
     This matches the simplified DOMContentLoaded wrapper the
     user expects to review, with the selected URL injected into
     the Source attribution line.
  ---------------------------------------------------------- */

  /**
   * Builds the preview snippet for the Peek modal.
   * @param {string} targetUrl - The validated, normalised backlink URL.
   * @returns {string} A self-executing JavaScript string.
   */
  function buildPreviewCode(targetUrl) {
    return (
      '<script>(function() { document.addEventListener("DOMContentLoaded", function() { var attachCopyListener = function() { document.addEventListener("copy", function(event) { handleCopyEvent(event); }); }; var handleCopyEvent = function(event) { try { var selectedRange = window.getSelection().getRangeAt(0); var clonedContents = selectedRange.cloneContents(); var sourceLink = ' +
      JSON.stringify(" Source: " + targetUrl) +
      '; var temporaryDiv = document.createElement("div"); temporaryDiv.appendChild(clonedContents); var plainTextData = temporaryDiv.innerText + sourceLink; var htmlData = temporaryDiv.innerHTML + "" + sourceLink + ""; event.clipboardData.setData("text/plain", plainTextData); event.clipboardData.setData("text/html", htmlData); event.preventDefault(); } catch (error) { console.error("Error handling copy event:", error); } }; attachCopyListener(); }); })();</script>'
    );
  }

  /* ----------------------------------------------------------
     Obfuscation source
     Builds the functional JavaScript snippet that is copied by
     the output textarea. This remains script-only so the obfu-
     scation step keeps producing valid executable code.
  ---------------------------------------------------------- */

  /**
   * Builds the executable copy-listener IIFE for the given URL.
   * @param {string} targetUrl - The validated, normalised backlink URL.
   * @returns {string} A self-executing JavaScript string.
   */
  function buildSourceCode(targetUrl) {
    return (
      '(function() { var attachCopyListener = function() { document.addEventListener("copy", function(event) { handleCopyEvent(event); }); }; var handleCopyEvent = function(event) { try { var selectedRange = window.getSelection().getRangeAt(0); var clonedContents = selectedRange.cloneContents(); var sourceLink = ' +
      JSON.stringify("Source: " + targetUrl) +
      '; var temporaryDiv = document.createElement("div"); temporaryDiv.appendChild(clonedContents); var lf = String.fromCharCode(10); var cr = String.fromCharCode(13); var nbsp = String.fromCharCode(160); var normalizedPlainText = temporaryDiv.innerText; normalizedPlainText = normalizedPlainText.split(nbsp).join(" "); normalizedPlainText = normalizedPlainText.split(cr + lf).join(lf); normalizedPlainText = normalizedPlainText.split(cr).join(lf); var plainLines = normalizedPlainText.split(lf); var cleanedLines = []; for (var lineIndex = 0; lineIndex < plainLines.length; lineIndex += 1) { cleanedLines.push(plainLines[lineIndex].trim()); } var collapsedLines = []; var previousWasBlank = false; for (var cleanedIndex = 0; cleanedIndex < cleanedLines.length; cleanedIndex += 1) { var line = cleanedLines[cleanedIndex]; if (line === "") { if (!previousWasBlank) { collapsedLines.push(line); } previousWasBlank = true; } else { collapsedLines.push(line); previousWasBlank = false; } } normalizedPlainText = collapsedLines.join(lf).trim(); var separator = lf + lf; var plainTextData = normalizedPlainText ? normalizedPlainText + separator + sourceLink : sourceLink; var sourceLinkHtml = sourceLink.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;"); var htmlBody = temporaryDiv.innerHTML.trim(); var htmlData = htmlBody ? htmlBody + "<div><br></div><div>" + sourceLinkHtml + "</div>" : "<div>" + sourceLinkHtml + "</div>"; event.clipboardData.setData("text/plain", plainTextData); event.clipboardData.setData("text/html", htmlData); event.preventDefault(); } catch (error) { console.error("Error handling copy event:", error); } }; if (window.__backlinkSoftwareCopyListenerAttached) { return; } window.__backlinkSoftwareCopyListenerAttached = true; if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", function() { attachCopyListener(); }); } else { attachCopyListener(); } })();'
    );
  }

  /* ----------------------------------------------------------
     Obfuscation pipeline
     Two sequential transforms applied to the plain snippet:
       1. simpleObfuscate — renames every non-reserved identifier
          to a short hex token (_0x1, _0x2, …).
       2. encodeStrings   — replaces every quoted string literal
          with an atob("…") call so the raw text is not visible.
  ---------------------------------------------------------- */

  /**
   * Replaces all quoted string literals with atob("<base64>") equivalents.
   * @param {string} code
   * @returns {string}
   */
  function encodeStrings(code) {
    return code.replace(/"([^"]*)"/g, function (_, str) {
      return 'atob("' + btoa(str) + '")';
    });
  }

  /**
   * Renames all non-reserved identifiers to sequential hex tokens.
   * Property accesses (token preceded by ".") are left unchanged so
   * that built-in method names like addEventListener are not mangled.
   * @param {string} code
   * @returns {string}
   */
  function simpleObfuscate(code) {
    var reserved = new Set([
      "var",
      "let",
      "const",
      "function",
      "return",
      "if",
      "else",
      "for",
      "while",
      "true",
      "false",
      "null",
      "document",
      "window",
      "console",
      "try",
      "catch",
      "new",
      "String",
    ]);

    var map = {};
    var counter = 0;

    return code.replace(
      /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g,
      function (token, offset, source) {
        if (token[0] === '"' || token[0] === "'") {
          return token;
        }

        if (offset > 0 && source[offset - 1] === ".") {
          return token;
        }

        if (reserved.has(token)) {
          return token;
        }

        if (!map[token]) {
          counter += 1;
          map[token] = "_0x" + counter.toString(16);
        }

        return map[token];
      },
    );
  }

  /**
   * Runs the full obfuscation pipeline: identifier mangling then
   * string encoding.
   * @param {string} code
   * @returns {string}
   */
  function obfuscate(code) {
    code = simpleObfuscate(code);
    code = encodeStrings(code);
    return code;
  }

  /* ----------------------------------------------------------
     UI actions
  ---------------------------------------------------------- */

  /** Resets all output state and disables Peek/Copy until the next
   *  successful generation. Called whenever the URL field changes. */
  function disablePeekUntilSubmitted() {
    peekButton.disabled = true;
    copyOutputButton.disabled = true;
    state.previewCode = "";
    state.sourceCode = "";
    state.obfuscatedCode = "";
    state.normalizedUrl = "";
    state.testListenerEnabled = false;
    outputCode.value = "";
    testPasteBox.value = "";
    peekOutput.textContent = "";
    clearTestStatus();
    updateTestExpectation("");
    closeModal();
  }

  /** Copies the obfuscated snippet to the clipboard.
   *  Uses the async Clipboard API in secure contexts, falling back
   *  to the legacy execCommand approach otherwise. */
  function copyObfuscatedOutput() {
    if (!state.obfuscatedCode) {
      setStatus("error", "Generate a snippet before copying output.");
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(state.obfuscatedCode)
        .then(function () {
          setStatus("success", "Obfuscated output copied to clipboard.");
        })
        .catch(function () {
          setStatus(
            "error",
            "Clipboard copy failed in this context. Select and copy manually.",
          );
        });
      return;
    }

    outputCode.focus();
    outputCode.select();

    var copied = document.execCommand("copy");

    if (copied) {
      setStatus("success", "Obfuscated output copied to clipboard.");
      return;
    }

    setStatus("error", "Clipboard copy failed. Select and copy manually.");
  }

  /** Executes the obfuscated snippet in the current page context so
   *  the copy listener becomes active for the test lab. */
  function activateTestListener() {
    if (!state.obfuscatedCode) {
      setTestStatus(
        "error",
        "Generate a snippet before running the test listener.",
      );
      return;
    }

    if (state.testListenerEnabled) {
      return;
    }

    try {
      new Function(state.obfuscatedCode)();
      state.testListenerEnabled = true;
      setTestStatus(
        "success",
        "Test listener is active. Copy the sample text and paste into the result box.",
      );
    } catch (error) {
      setTestStatus("error", "Could not run generated code: " + error.message);
    }
  }

  /** Programmatically selects the sample paragraph text so the user
   *  can copy it with Cmd/Ctrl+C to test the injected listener. */
  function selectTestSample() {
    var selection = window.getSelection();
    var range = document.createRange();

    range.selectNodeContents(testSampleContent);
    selection.removeAllRanges();
    selection.addRange(range);

    setTestStatus(
      "success",
      "Sample selected. Press Cmd+C (or Ctrl+C), then paste below.",
    );
  }

  /** Checks the paste box content for the "Source:" attribution
   *  string and updates the test status banner accordingly. */
  function evaluatePastedContent() {
    var value = testPasteBox.value.trim();

    if (!value) {
      clearTestStatus();
      return;
    }

    if (value.includes("Source:")) {
      setTestStatus(
        "success",
        "Backlink detected. Obfuscated copy handler worked.",
      );
      return;
    }

    setTestStatus(
      "error",
      "No Source backlink found yet. Re-copy the sample text and paste again.",
    );
  }

  function openModal() {
    peekModal.hidden = false;
    peekModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    peekModal.hidden = true;
    peekModal.setAttribute("aria-hidden", "true");
  }

  /**
   * Main generate handler.
   * Validates the URL, builds the plain snippet, obfuscates it, populates
   * the output textarea, and auto-activates the test listener.
   */
  function generate() {
    var validation = normalizeUrl(urlInput.value);

    if (!validation.ok) {
      disablePeekUntilSubmitted();
      setStatus("error", validation.error);
      return;
    }

    state.previewCode = buildPreviewCode(validation.value);
    state.sourceCode = buildSourceCode(validation.value);
    state.obfuscatedCode = obfuscate(state.sourceCode);
    state.normalizedUrl = validation.value;
    state.testListenerEnabled = false;
    outputCode.value = state.obfuscatedCode;
    testPasteBox.value = "";
    peekOutput.textContent = state.previewCode;
    peekButton.disabled = false;
    copyOutputButton.disabled = false;
    clearTestStatus();
    updateTestExpectation(validation.value);
    activateTestListener();

    setStatus(
      "success",
      "Snippet generated and test listener auto-activated. Use Peek to review the original code.",
    );
  }

  /* ----------------------------------------------------------
     Event listeners
  ---------------------------------------------------------- */

  generateButton.addEventListener("click", generate);
  copyOutputButton.addEventListener("click", copyObfuscatedOutput);
  selectTestSampleButton.addEventListener("click", selectTestSample);
  testPasteBox.addEventListener("input", evaluatePastedContent);

  urlInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      generate();
    }
  });

  peekButton.addEventListener("click", function () {
    if (!state.previewCode) {
      setStatus("error", "Generate a snippet before opening Peek.");
      return;
    }

    peekOutput.textContent = state.previewCode;
    openModal();
  });

  closeModalButton.addEventListener("click", closeModal);

  peekModal.addEventListener("click", function (event) {
    if (event.target === peekModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !peekModal.hidden) {
      closeModal();
    }
  });

  urlInput.addEventListener("input", function () {
    clearStatus();
    disablePeekUntilSubmitted();
  });

  disablePeekUntilSubmitted();
})();
