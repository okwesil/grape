import { writeFileSync, readdirSync, existsSync } from 'fs'
import { read } from './find.js'
import path from 'path'
import { isDirectory } from './index.js'
import { homedir } from 'os'
const saveFile = path.join(homedir(), '.grape-save.json')
export { replace, recursiveReplace, retrieveSaved, save, saveFile}
function replace(regex, replaceValue, pathstring) {
    if (isDirectory(pathstring)) {
        console.log('can not recursively replace')
        process.exitCode = 1
        return
    } 
    let contents = read(pathstring)
    contents = contents.replace(regex, () => replaceValue)
    save(pathstring)
    writeFileSync(pathstring, contents) 
}
 
function recursiveReplace(regex, replaceValue, pathstring, checked = [], start = true) {
    let data = []
    if (start && !isDirectory(pathstring)) {
        process.exitCode = 1
        return data
    }
    let entries = readdirSync(pathstring, {withFileTypes: true})
    for (const entry of entries) {
        const fullPath = path.join(pathstring, entry.name)
        if (entry.isDirectory()) {
            data = data.concat(recursiveReplace(regex, replaceValue, fullPath, checked, false))
        } else {
            let content = read(fullPath)
            data.push({path: fullPath, data: content.replace(regex, replaceValue)})
        }
    }
    return data
}

function save(relativePath) {
    const fullPath = path.join(process.cwd(), relativePath) 
    const contents = read(fullPath)
    let saved = retrieveSaved()
    saved[fullPath] = contents
    writeFileSync(saveFile, JSON.stringify(saved, null, 2)) 
}

function retrieveSaved() {
    try {
        return JSON.parse(read(saveFile))
    } catch {
        return {}
    }
}
