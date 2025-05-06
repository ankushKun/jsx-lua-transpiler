# jsx-lua-transpiler

This package transpiles JSX-like syntax into Lua tables. This tool allows you to write HTML-like markup in your Lua code and converts it into a structured Lua table representation.

## Installation

```bash
npm install jsx-lua-transpiler
```

## Usage

```typescript
import { transpileLuaX } from 'jsx-lua-transpiler';

const luaCode = `
local element = <div class="container">
    <h1>Hello World</h1>
    <img src="image.jpg" alt="An image" />
</div>

print(element)
`;

const transpiled = transpileLuaX(luaCode);
```

## Output Format

The transpiler converts JSX-like syntax into Lua tables with the following structure:

```lua
local element = {
    type = "html",
    name = "div",
    atts = {
        class = "container"
    },
    children = {
        {
            type = "html",
            name = "h1",
            atts = {},
            children = {
                { type = "text", text = "Hello World" }
            }
        },
        {
            type = "html",
            name = "img",
            atts = {
                src = "image.jpg",
                alt = "An image"
            },
            children = {}
        }
    }
}

print(element)
```

## License

MIT
