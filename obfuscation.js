/**
 * obfuscation.js
 *
 * Generator logic for backlink.software.
 */

(function () {
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

  var state = {
    previewCode: "",
    sourceCode: "",
    obfuscatedCode: "",
    normalizedUrl: "",
    whitelistedHost: "",
    testListenerEnabled: false,
  };

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

  function canonicalizeHost(host) {
    return host.toLowerCase().replace(/^www\./i, "");
  }

  function isHostWhitelisted(currentHost, whitelistedHost) {
    if (!whitelistedHost) {
      return false;
    }

    var normalizedCurrent = canonicalizeHost(currentHost || "");

    return (
      normalizedCurrent === whitelistedHost ||
      normalizedCurrent.endsWith("." + whitelistedHost)
    );
  }

  function isCurrentHostWhitelisted(whitelistedHost) {
    return isHostWhitelisted(window.location.hostname || "", whitelistedHost);
  }

  function updateTestExpectation(whitelistedHost) {
    if (!whitelistedHost) {
      testExpectation.textContent =
        "Expected result after paste: on a whitelisted host, copied text + Source: current page URL";
      return;
    }

    if (isCurrentHostWhitelisted(whitelistedHost)) {
      testExpectation.textContent =
        "Current host is whitelisted. Expected result: copied text + Source: current page URL.";
      return;
    }

    testExpectation.textContent =
      "Current host is not whitelisted (" +
      whitelistedHost +
      "). Expected result here: no Source line.";
  }

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

      return {
        ok: true,
        value: parsed.href,
        whitelistedHost: canonicalizeHost(parsed.hostname),
      };
    } catch (error) {
      return {
        ok: false,
        error: "Enter a valid URL such as https://example.com.",
      };
    }
  }

  function buildSnippetBody(whitelistedHost) {
    return [
      "(function() {",
      "var whitelistedHost = ",
      JSON.stringify(whitelistedHost),
      ";",
      'var canonicalHost = function(host) { var normalizedHost = (host || "").toLowerCase(); return normalizedHost.indexOf("www.") === 0 ? normalizedHost.slice(4) : normalizedHost; };',
      'var isAllowedHost = function(host) { var currentHost = canonicalHost(host || ""); return currentHost === whitelistedHost || currentHost.endsWith("." + whitelistedHost); };',
      'document.addEventListener("DOMContentLoaded", function() {',
      'var attachCopyListener = function() { document.addEventListener("copy", function(event) { handleCopyEvent(event); }); };',
      "var handleCopyEvent = function(event) {",
      "if (!isAllowedHost(document.location.hostname)) { return; }",
      "try {",
      "var selectedRange = window.getSelection().getRangeAt(0);",
      "var clonedContents = selectedRange.cloneContents();",
      "var sourceLink = ' Source: ' + document.location.href;",
      'var temporaryDiv = document.createElement("div");',
      "temporaryDiv.appendChild(clonedContents);",
      "var plainTextData = temporaryDiv.innerText + sourceLink;",
      "var htmlData = temporaryDiv.innerHTML + '' + sourceLink + '';",
      'event.clipboardData.setData("text/plain", plainTextData);',
      'event.clipboardData.setData("text/html", htmlData);',
      "event.preventDefault();",
      "} catch (error) { console.error('Error handling copy event:', error); }",
      "};",
      "attachCopyListener();",
      "});",
      "})();",
    ].join("");
  }

  function buildPreviewCode(whitelistedHost) {
    return "<script>" + buildSnippetBody(whitelistedHost) + "</script>";
  }

  function buildSourceCode(whitelistedHost) {
    return buildSnippetBody(whitelistedHost);
  }

  function encodeStrings(code) {
    return code.replace(/"([^"]*)"/g, function (_, str) {
      return 'atob("' + btoa(str) + '")';
    });
  }

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
      /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/(?:\\.|[^\/\n\\])+\/[gimsuy]*|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g,
      function (token, offset, source) {
        if (token[0] === '"' || token[0] === "'" || token[0] === "/") {
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

  function obfuscate(code) {
    code = simpleObfuscate(code);
    code = encodeStrings(code);
    return code;
  }

  function disablePeekUntilSubmitted() {
    peekButton.disabled = true;
    copyOutputButton.disabled = true;
    state.previewCode = "";
    state.sourceCode = "";
    state.obfuscatedCode = "";
    state.normalizedUrl = "";
    state.whitelistedHost = "";
    state.testListenerEnabled = false;
    outputCode.value = "";
    testPasteBox.value = "";
    peekOutput.textContent = "";
    clearTestStatus();
    updateTestExpectation("");
    closeModal();
  }

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

    if (!isCurrentHostWhitelisted(state.whitelistedHost)) {
      setTestStatus(
        "success",
        "No Source backlink detected, which is expected because this host is outside the whitelist.",
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

  function generate() {
    var validation = normalizeUrl(urlInput.value);

    if (!validation.ok) {
      disablePeekUntilSubmitted();
      setStatus("error", validation.error);
      return;
    }

    state.previewCode = buildPreviewCode(validation.whitelistedHost);
    state.sourceCode = buildSourceCode(validation.whitelistedHost);
    state.obfuscatedCode = obfuscate(state.sourceCode);
    state.normalizedUrl = validation.value;
    state.whitelistedHost = validation.whitelistedHost;
    state.testListenerEnabled = false;
    outputCode.value = state.obfuscatedCode;
    testPasteBox.value = "";
    peekOutput.textContent = state.previewCode;
    peekButton.disabled = false;
    copyOutputButton.disabled = false;
    clearTestStatus();
    updateTestExpectation(validation.whitelistedHost);
    activateTestListener();

    setStatus(
      "success",
      "Snippet generated. It will inject Source only on this host and its subdomains: " +
        validation.whitelistedHost +
        ".",
    );
  }

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

(function () {
  var _0x1 = atob("YmFja2xpbmstc29mdHdhcmUtdGVzdC5vbnJlbmRlci5jb20=");
  var _0x2 = function (_0x3) {
    var _0x4 = (_0x3 || atob("")).toLowerCase();
    return _0x4.indexOf(atob("d3d3Lg==")) === 0 ? _0x4.slice(4) : _0x4;
  };
  var _0x5 = function (_0x3) {
    var _0x6 = _0x2(_0x3 || atob(""));
    return _0x6 === _0x1 || _0x6.endsWith(atob("Lg==") + _0x1);
  };
  document.addEventListener(atob("RE9NQ29udGVudExvYWRlZA=="), function () {
    var _0x7 = function () {
      document.addEventListener(atob("Y29weQ=="), function (_0x8) {
        _0x9(_0x8);
      });
    };
    var _0x9 = function (_0x8) {
      if (!_0x5(document.location.hostname)) {
        return;
      }
      try {
        var _0xa = window.getSelection().getRangeAt(0);
        var _0xb = _0xa.cloneContents();
        var _0xc = " Source: " + document.location.href;
        var _0xd = document.createElement(atob("ZGl2"));
        _0xd.appendChild(_0xb);
        var _0xe = _0xd.innerText + _0xc;
        var _0xf = _0xd.innerHTML + "" + _0xc + "";
        _0x8.clipboardData.setData(atob("dGV4dC9wbGFpbg=="), _0xe);
        _0x8.clipboardData.setData(atob("dGV4dC9odG1s"), _0xf);
        _0x8.preventDefault();
      } catch (_0x10) {
        console.error("Error handling copy event:", _0x10);
      }
    };
    _0x7();
  });
})();
