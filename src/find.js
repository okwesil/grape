export {findLines, display, recursiveCheck, read } 
import { existsSync, readFileSync, readdirSync} from 'fs'
import path, { join } from 'path'
import chalk from 'chalk'
/**
 * 
 * @param {RegExp} regex 
 * @param {string} path 
 */

const read = path => readFileSync(path, {encoding: 'utf8'})
function findLines(regex, path, invert = false) {
    let contents = read(path).split('\n')
    contents = contents.map((line, index) => [path, index + 1, line])
    if (invert) return contents.filter(line => line[2].search(regex) == -1)
    if (contents.filter(line => regex.test(line[2])).length == 0) return null
    return contents.filter(line => regex.test(line[2]))
}
function display(regex, arr, lineNumber, recursive, count, countAll) {
    if (arr == null) {
        console.log('no matches found')
        return
    }
    let totalCount = 0
    if (arr.length == 0) {
        console.log('no matches found')
    }
    let output = arr.map(entry => `${recursive ? chalk.magenta('./' + entry[0]) + ':': ''}${lineNumber ? chalk.greenBright(entry[1]) + ':': ''} ${entry[2].replace(regex, match => {
        totalCount++
        return chalk.bold.red(match)
    })}`).join('\n')
    console.log(output)
    if (count) {
        console.log(chalk.whiteBright(arr.length + ' lines matched'))
    }
    if (countAll) {
        console.log(chalk.whiteBright(totalCount + ' individual matches'))
    }

}

function recursiveCheck(regex, pathstring, checked = [], invert = false, start = false) {
    let data = []
    if (start) checked.push(pathstring)
    if (!existsSync(pathstring)) return data
    let contents = readdirSync(pathstring, {withFileTypes: true})
    for (const entry of contents) {
        const fullPath = path.join(pathstring, entry.name)
        if (!checked.includes(fullPath)) {
            checked.push(fullPath)
            if (entry.isDirectory()) {
                data = data.concat(recursiveCheck(regex, fullPath, checked, invert))
            } else {
                let lines = findLines(regex, fullPath, invert)
                if (lines) {
                    data = data.concat(lines)
                }
            }
        }
    }
    return data 
}

