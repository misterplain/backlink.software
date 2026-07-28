/**
 * obfuscation-r45.js
 *
 * Generator logic for backlink.software with RC4-style (R45) string obfuscation.
 * This file mirrors the existing tool behavior while strengthening string hiding.
 */

(function () {
  var urlInput = document.getElementById("urlInput");
  var generateButton = document.getElementById("generateButton");
  var peekButton = document.getElementById("peekButton");
  var copyOutputButton = document.getElementById("copyOutputButton");
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
  };

  function setStatus(type, message) {
    statusMessage.dataset.state = type;
    statusMessage.textContent = message;
  }

  function clearStatus() {
    statusMessage.removeAttribute("data-state");
    statusMessage.textContent = "";
  }

  function canonicalizeHost(host) {
    return host.toLowerCase().replace(/^www\./i, "");
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    var escapedWhitelistHost = escapeRegex(whitelistedHost);
    var exactHostPattern = "^" + escapedWhitelistHost + "$";
    var subdomainPattern = "^.*\\." + escapedWhitelistHost + "$";

    return [
      "(function() {",
      "var whitelist = [",
      "new RegExp(" + JSON.stringify(exactHostPattern) + ",'i'),",
      "new RegExp(" + JSON.stringify(subdomainPattern) + ",'i'),",
      "/^localhost$/i,",
      "/^127\\.0\\.0\\.1$/i,",
      "/^192\\.168\\.\\d{1,3}\\.\\d{1,3}$/i,",
      "/^10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/i,",
      "/^172\\.(1[6-9]|2\\d|3[01])\\.\\d{1,3}\\.\\d{1,3}$/i,",
      "/^::1$/i",
      "];",
      'var canonicalHost = function(host) { var normalizedHost = (host || "").toLowerCase(); return normalizedHost.indexOf("www.") === 0 ? normalizedHost.slice(4) : normalizedHost; };',
      'var isAllowedHost = function(host) { var currentHost = canonicalHost(host || ""); return whitelist.some(function(pattern) { return pattern.test(currentHost); }); };',
      'document.addEventListener("DOMContentLoaded", function() {',
      'var attachCopyListener = function() { document.addEventListener("copy", function(event) { handleCopyEvent(event); }); };',
      "var handleCopyEvent = function(event) {",
      "if (!isAllowedHost(document.location.hostname)) { return; }",
      "try {",
      "var selection = window.getSelection();",
      "if (!selection || selection.rangeCount === 0 || selection.isCollapsed) { return; }",
      "var selectedRange = selection.getRangeAt(0);",
      "var clonedContents = selectedRange.cloneContents();",
      'var temporaryDiv = document.createElement("div");',
      "temporaryDiv.appendChild(clonedContents);",
      "temporaryDiv.querySelectorAll('script,style').forEach(function(node) { node.remove(); });",
      "var selectedText = selection.toString().replace(/\\u00a0/g, ' ').replace(/\\s*\\n\\s*/g, ' ').replace(/[ \\t]{2,}/g, ' ').trim();",
      "if (!selectedText) { return; }",
      "var plainSourceLine = String.fromCharCode(10,10) + 'Source: ' + document.location.href;",
      "var htmlSourceLine = '<br><br>Source: ' + document.location.href;",
      "var plainTextData = selectedText + plainSourceLine;",
      "var htmlData = temporaryDiv.innerHTML + htmlSourceLine;",
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
      "RegExp",
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

  function getRandomKeyHex() {
    var bytes = new Uint8Array(16);

    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    var parts = [];
    for (var j = 0; j < bytes.length; j += 1) {
      parts.push(bytes[j].toString(16).padStart(2, "0"));
    }

    return parts.join("");
  }

  function utf8Encode(input) {
    if (window.TextEncoder) {
      return new TextEncoder().encode(input);
    }

    var encoded = unescape(encodeURIComponent(input));
    var out = new Uint8Array(encoded.length);

    for (var i = 0; i < encoded.length; i += 1) {
      out[i] = encoded.charCodeAt(i);
    }

    return out;
  }

  function rc4Bytes(inputBytes, keyBytes) {
    var s = new Uint8Array(256);
    var i;

    for (i = 0; i < 256; i += 1) {
      s[i] = i;
    }

    var j = 0;

    for (i = 0; i < 256; i += 1) {
      j = (j + s[i] + keyBytes[i % keyBytes.length]) & 255;
      var tKsa = s[i];
      s[i] = s[j];
      s[j] = tKsa;
    }

    var out = new Uint8Array(inputBytes.length);
    i = 0;
    j = 0;

    for (var n = 0; n < inputBytes.length; n += 1) {
      i = (i + 1) & 255;
      j = (j + s[i]) & 255;
      var tPrga = s[i];
      s[i] = s[j];
      s[j] = tPrga;
      var k = s[(s[i] + s[j]) & 255];
      out[n] = inputBytes[n] ^ k;
    }

    return out;
  }

  function bytesToBase64(bytes) {
    var chunk = [];

    for (var i = 0; i < bytes.length; i += 1) {
      chunk.push(String.fromCharCode(bytes[i]));
    }

    return btoa(chunk.join(""));
  }

  function rc4EncryptToBase64(plainText, key) {
    var plainBytes = utf8Encode(plainText);
    var keyBytes = utf8Encode(key);
    var cipherBytes = rc4Bytes(plainBytes, keyBytes);
    return bytesToBase64(cipherBytes);
  }

  function encodeStringsR45(code, key) {
    return code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, function (_, str) {
      var normalized = str
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t");

      var cipherText = rc4EncryptToBase64(normalized, key);
      return '_r45("' + cipherText + '")';
    });
  }

  function buildR45DecoderSource(key) {
    return [
      "var _r45k=",
      JSON.stringify(key),
      ";",
      "var _r45=function(c){",
      "var b=atob(c);",
      "var d=new Uint8Array(b.length);",
      "for(var i=0;i<b.length;i++){d[i]=b.charCodeAt(i);}",
      "var kb;",
      "if(window.TextEncoder){kb=new TextEncoder().encode(_r45k);}else{var ek=unescape(encodeURIComponent(_r45k));kb=new Uint8Array(ek.length);for(var z=0;z<ek.length;z++){kb[z]=ek.charCodeAt(z);}}",
      "var s=new Uint8Array(256);",
      "for(var x=0;x<256;x++){s[x]=x;}",
      "var j=0;",
      "for(var y=0;y<256;y++){j=(j+s[y]+kb[y%kb.length])&255;var tk=s[y];s[y]=s[j];s[j]=tk;}",
      "var i2=0;var j2=0;",
      "for(var n=0;n<d.length;n++){i2=(i2+1)&255;j2=(j2+s[i2])&255;var tp=s[i2];s[i2]=s[j2];s[j2]=tp;var kk=s[(s[i2]+s[j2])&255];d[n]=d[n]^kk;}",
      "if(window.TextDecoder){return new TextDecoder().decode(d);}var out='';for(var m=0;m<d.length;m++){out+=String.fromCharCode(d[m]);}return decodeURIComponent(escape(out));",
      "};",
    ].join("");
  }

  function obfuscate(code) {
    var key = getRandomKeyHex();
    var identifierObfuscated = simpleObfuscate(code);
    var decoderSource = buildR45DecoderSource(key);
    var stringsObfuscated = encodeStringsR45(identifierObfuscated, key);

    return decoderSource + stringsObfuscated;
  }

  function disablePeekUntilSubmitted() {
    peekButton.disabled = true;
    copyOutputButton.disabled = true;
    state.previewCode = "";
    state.sourceCode = "";
    state.obfuscatedCode = "";
    state.normalizedUrl = "";
    state.whitelistedHost = "";
    outputCode.value = "";
    peekOutput.textContent = "";
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
    outputCode.value = state.obfuscatedCode;
    peekOutput.textContent = state.previewCode;
    peekButton.disabled = false;
    copyOutputButton.disabled = false;

    setStatus(
      "success",
      "R45 snippet generated. It will inject Source only on this host and its subdomains: " +
        validation.whitelistedHost +
        ".",
    );
  }

  generateButton.addEventListener("click", generate);
  copyOutputButton.addEventListener("click", copyObfuscatedOutput);

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
