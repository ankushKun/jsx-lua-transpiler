export function transpileLuaX(luaCode) {
    // Regular expression to match opening tags with their content
    const tagRegex = /<([a-zA-Z0-9-]+)((?:\s+[a-zA-Z0-9-]+(?:="[^"]*")?)*)\s*>([\s\S]*?)<\/\1>/g;
    // Regular expression to match self-closing tags (both <tag/> and <tag /> formats)
    const selfClosingTagRegex = /<([a-zA-Z0-9-]+)((?:\s+[a-zA-Z0-9-]+(?:="[^"]*")?)*)\s*\/?>/g;
    // Function to parse attributes
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
    // Function to convert attributes to Lua table string
    function attrsToLuaString(attrs) {
        return Object.entries(attrs)
            .map(([key, value]) => `${key} = "${value}"`)
            .join(', ');
    }
    // Function to process text content
    function processTextContent(text) {
        text = text.trim();
        if (!text)
            return '';
        return `{ type = "text", text = "${text}" }`;
    }
    // Function to process nested content
    function processContent(content) {
        // First process any nested tags
        let processedContent = content.replace(tagRegex, (match, tagName, attributes, innerContent) => {
            const attrs = parseAttributes(attributes);
            const attrsStr = attrsToLuaString(attrs);
            // Process inner content
            const children = [];
            // Split content by tags and process each part
            const parts = innerContent.split(/(<[^>]+>)/);
            for (const part of parts) {
                if (part.trim()) {
                    if (part.startsWith('<')) {
                        // This is a tag, process it
                        const processedTag = processContent(part);
                        if (processedTag)
                            children.push(processedTag);
                    }
                    else {
                        // This is text content
                        const processedText = processTextContent(part);
                        if (processedText)
                            children.push(processedText);
                    }
                }
            }
            return `{ type = "html", name = "${tagName}", atts = { ${attrsStr} }, children = { ${children.join(', ')} } }`;
        });
        // Then process any self-closing tags
        processedContent = processedContent.replace(selfClosingTagRegex, (match, tagName, attributes) => {
            // Skip if this is an opening tag (not self-closing)
            if (!match.endsWith('/>') && !match.endsWith('>')) {
                return match;
            }
            const attrs = parseAttributes(attributes);
            const attrsStr = attrsToLuaString(attrs);
            return `{ type = "html", name = "${tagName}", atts = { ${attrsStr} }, children = {} }`;
        });
        return processedContent;
    }
    // Split the code into parts, preserving string literals
    const parts = [];
    let currentIndex = 0;
    let inString = false;
    let stringType = '';
    let stringContent = '';
    for (let i = 0; i < luaCode.length; i++) {
        const char = luaCode[i];
        const nextChar = luaCode[i + 1];
        if (!inString) {
            // Check for string start
            if (char === '"' || char === "'" || (char === '[' && nextChar === '[')) {
                inString = true;
                stringType = char === '[' ? '[[' : char;
                stringContent = char === '[' ? '[' : char;
                continue;
            }
            parts.push(char);
        }
        else {
            // Inside string
            stringContent += char;
            // Check for string end
            if ((stringType === '"' || stringType === "'") && char === stringType) {
                inString = false;
                parts.push(stringContent);
                stringContent = '';
            }
            else if (stringType === '[[' && char === ']' && nextChar === ']') {
                inString = false;
                parts.push(stringContent + ']');
                i++; // Skip the next ']'
                stringContent = '';
            }
        }
    }
    // Process only the non-string parts
    const processedParts = parts.map(part => {
        if (part.startsWith('"') || part.startsWith("'") || part.startsWith('[[')) {
            return part; // Return string literals unchanged
        }
        return processContent(part);
    });
    return processedParts.join('');
}
//# sourceMappingURL=index.js.map