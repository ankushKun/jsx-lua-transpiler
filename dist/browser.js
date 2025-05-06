var aofetch = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    transpileLuaX: () => transpileLuaX
  });
  function transpileLuaX(luaCode) {
    const tagRegex = /<([a-zA-Z0-9-]+)((?:\s+[a-zA-Z0-9-]+(?:="[^"]*")?)*)\s*>([\s\S]*?)<\/\1>/g;
    const selfClosingTagRegex = /<([a-zA-Z0-9-]+)((?:\s+[a-zA-Z0-9-]+(?:="[^"]*")?)*)\s*\/?>/g;
    function parseAttributes(attributes) {
      const attrs = {};
      const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        const [, key, value] = attrMatch;
        attrs[key] = value;
      }
      return attrs;
    }
    function attrsToLuaString(attrs) {
      return Object.entries(attrs).map(([key, value]) => `${key} = "${value}"`).join(", ");
    }
    function processTextContent(text) {
      text = text.trim();
      if (!text)
        return "";
      return `{ type = "text", text = "${text}" }`;
    }
    function processContent(content) {
      let processedContent = content.replace(tagRegex, (match, tagName, attributes, innerContent) => {
        const attrs = parseAttributes(attributes);
        const attrsStr = attrsToLuaString(attrs);
        const children = [];
        const parts2 = innerContent.split(/(<[^>]+>)/);
        for (const part of parts2) {
          if (part.trim()) {
            if (part.startsWith("<")) {
              const processedTag = processContent(part);
              if (processedTag)
                children.push(processedTag);
            } else {
              const processedText = processTextContent(part);
              if (processedText)
                children.push(processedText);
            }
          }
        }
        return `{ type = "html", name = "${tagName}", atts = { ${attrsStr} }, children = { ${children.join(", ")} } }`;
      });
      processedContent = processedContent.replace(selfClosingTagRegex, (match, tagName, attributes) => {
        if (!match.endsWith("/>") && !match.endsWith(">")) {
          return match;
        }
        const attrs = parseAttributes(attributes);
        const attrsStr = attrsToLuaString(attrs);
        return `{ type = "html", name = "${tagName}", atts = { ${attrsStr} }, children = {} }`;
      });
      return processedContent;
    }
    const parts = [];
    let currentIndex = 0;
    let inString = false;
    let stringType = "";
    let stringContent = "";
    for (let i = 0; i < luaCode.length; i++) {
      const char = luaCode[i];
      const nextChar = luaCode[i + 1];
      if (!inString) {
        if (char === '"' || char === "'" || char === "[" && nextChar === "[") {
          inString = true;
          stringType = char === "[" ? "[[" : char;
          stringContent = char === "[" ? "[" : char;
          continue;
        }
        parts.push(char);
      } else {
        stringContent += char;
        if ((stringType === '"' || stringType === "'") && char === stringType) {
          inString = false;
          parts.push(stringContent);
          stringContent = "";
        } else if (stringType === "[[" && char === "]" && nextChar === "]") {
          inString = false;
          parts.push(stringContent + "]");
          i++;
          stringContent = "";
        }
      }
    }
    const processedParts = parts.map((part) => {
      if (part.startsWith('"') || part.startsWith("'") || part.startsWith("[[")) {
        return part;
      }
      return processContent(part);
    });
    return processedParts.join("");
  }
  return __toCommonJS(src_exports);
})();
