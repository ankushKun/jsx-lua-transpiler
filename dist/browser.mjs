// src/index.ts
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
export {
  transpileLuaX
};
