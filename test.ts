import { transpileLuaX } from "./src"

console.log(transpileLuaX(`<div>ok</div>`))

console.log(transpileLuaX(`<div inline>ok</div>`))

console.log(transpileLuaX(`<div inline class="ok">ok</div>`))

console.log(transpileLuaX(`'<div inline class="ok">ok</div>'`))

console.log(transpileLuaX(`[[<div inline class="ok">ok</div>]]`))

console.log(transpileLuaX(`"<div inline class='ok'>ok</div>"`))
