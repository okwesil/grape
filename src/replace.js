import { writeFileSync } from 'fs'
import { read } from './find.js'
import { isDirectory } from './index.js'
export function replace(regex, replaceValue, pathstring) {
    if (isDirectory(pathstring)) {
        console.log('can not recursively replace')
        process.exitCode = 1
        return
    } 
    let contents = read(pathstring)
    contents = contents.replace(regex, () => replaceValue)
    writeFileSync(pathstring, contents)
}