export function transpileLuaX(luaCode: string): string {
    // Regular expression to match opening tags with their content
    const tagRegex = /<([a-zA-Z0-9-]+)((?:\s+(?:[a-zA-Z0-9-]+(?:="[^"]*")?|[a-zA-Z0-9-]+))*)\s*>([\s\S]*?)<\/\1>/g;

    // Regular expression to match self-closing tags (both <tag/> and <tag /> formats)
    const selfClosingTagRegex = /<([a-zA-Z0-9-]+)((?:\s+(?:[a-zA-Z0-9-]+(?:="[^"]*")?|[a-zA-Z0-9-]+))*)\s*\/?>/g;

    // Function to parse attributes
    function parseAttributes(attributes: string): Record<string, string> {
        const attrs: Record<string, string> = {};

        // Handle quoted attributes
        const quotedAttrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
        let quotedMatch;
        while ((quotedMatch = quotedAttrRegex.exec(attributes)) !== null) {
            const [, key, value] = quotedMatch;
            attrs[key] = value;
        }

        // Handle boolean attributes and unquoted attributes
        const unquotedAttrRegex = /([a-zA-Z0-9-]+)(?=\s|$)/g;
        let unquotedMatch;
        while ((unquotedMatch = unquotedAttrRegex.exec(attributes)) !== null) {
            const [, key] = unquotedMatch;
            // Skip if this attribute was already processed as a quoted attribute
            if (!attrs.hasOwnProperty(key)) {
                attrs[key] = "true";
            }
        }

        return attrs;
    }

    // Function to convert attributes to Lua table string
    function attrsToLuaString(attrs: Record<string, string>): string {
        return Object.entries(attrs)
            .map(([key, value]) => `${key} = "${value}"`)
            .join(', ');
    }

    // Function to process text content
    function processTextContent(text: string): string {
        text = text.trim();
        if (!text) return '';
        return `{ type = "text", text = "${text}" }`;
    }

    // Function to process nested content
    function processContent(content: string): string {
        // First process any nested tags
        let processedContent = content.replace(tagRegex, (match, tagName, attributes, innerContent) => {
            const attrs = parseAttributes(attributes);
            const attrsStr = attrsToLuaString(attrs);

            // Process inner content
            const children: string[] = [];

            // Split content by tags and process each part
            const parts = innerContent.split(/(<[^>]+>)/);
            for (const part of parts) {
                if (part.trim()) {
                    if (part.startsWith('<')) {
                        // This is a tag, process it
                        const processedTag = processContent(part);
                        if (processedTag) children.push(processedTag);
                    } else {
                        // This is text content
                        const processedText = processTextContent(part);
                        if (processedText) children.push(processedText);
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

    // Check if the input is wrapped in Lua string delimiters
    const isLuaString = /^["'`]|^\[\[/.test(luaCode.trim());

    if (isLuaString) {
        // If it's a Lua string, return it unchanged
        return luaCode;
    }

    // If not a Lua string, process it
    return processContent(luaCode);
}