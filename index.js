#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, readdirSync, lstatSync } from 'fs'
import path from 'path'
import chalk from 'chalk'
import { program } from 'commander'

const read = path => readFileSync(path, {encoding: 'utf8'})
program 
    .name('grape')
    .command('find <pattern> <filepath>')
    .description('find the given pattern in file')
    .option('-i, --insensitive', 'makes the search, case insensitive (foo == FoO is true) ')
    .option('-r, --recursive', 'recursively checks the directory and subdirectories for the pattern')
    .option('-n, --line-number', 'shows line number with the lines')
    .option('-v, --invert', 'invert the search pattern to show everything that doesn\'t contain the pattern')
    .option('-w, --only-word', 'match any word characters after the original pattern')
    .action((pattern, filepath, options) => {
        console.log(options.onlyWord)
        let regex = RegExp(`${options.onlyWord ? `\\b`: ''}${pattern}${options.onlyWord ? `\\b`: ''}`, `g${options.insensitive ? 'i': ''}`)
        console.log(regex.source)
        if (!options.recursive && isDirectory(filepath)) {
            console.error('must add -r flag to check directories')
            process.exitCode = 1
            return
        }
        if (options.recursive && !isDirectory(filepath)) {
            console.error('to include -r flag, path must lead to a directory')
            process.exitCode = 1
            return
        }
        let output
        if (options.recursive) {
            output = recursiveCheck(regex, filepath)
        } else {
            output = findLines(regex, filepath, options.invert != undefined)
        }
        display(regex, output, options.lineNumber != undefined, options.recursive != undefined)
    })
program
    .command('transfer <pattern> <pathToCheck> <pathToDeposit>')
    .description('take the patterns from one file deposit them in another file')
    .option('-i --insensitive', 'makes the search, case insensitive (foo == FoO is true) ')
    .option('-r --recursive', 'recursively checks the directory for the pattern')
    .option('-n --line-number', 'shows line number of the displayed line')
    .option('-v --invert', 'invert the search pattern to show everything that doesn\'t contain the pattern')
    .option('-w, --only-word', 'match any word characters after the original pattern')
    .action((pattern, pathToCheck, pathToDeposit, options) => {
        let regex = RegExp(`${options.onlyWord ? `\\b`: ''}${pattern}${options.onlyWord ? `\\b`: ''}`, `g${options.insensitive ? 'i': ''}`)
        if (!options.recursive && isDirectory(pathToCheck)) {
            console.error('must add -r flag to check directories')
            process.exitCode = 1
            return
        }
        let output
        if (options.recursive) {
            output = recursiveCheck(regex, pathToCheck, undefined, options.invert != undefined, true)
        } else {
            output = findLines(regex, pathToCheck, options.invert != undefined)
        } 
        transfer(output, pathToDeposit, options.lineNumber != undefined, options.recursive != undefined)
    })
program
    .command('read <filepath>')
    .action(filepath => {
        if (existsSync(filepath)) {
            console.log(readFileSync(filepath, {encoding: 'ascii'}))
        } else {
            console.error('file does not exist or cannot be read')
        }
    })


program.parse()

/**
 * 
 * @param {RegExp} regex 
 * @param {string} path 
 */
function findLines(regex, path, invert = false) {
    let contents = read(path).split('\n')
    if (contents.filter(line => regex.test(line)).length == 0) return null
    contents = contents.map((line, index) => [path, index + 1, line])
    if (invert) {
        return contents.filter(line => !regex.test(line[2]))
    }
    return contents.filter(line => regex.test(line[2]))
}
function display(regex, arr, lineNumber = false, recursive = false) {
    if (arr == null) {
        console.log('no matches found')
        return
    }
    arr.forEach(entry => {
        console.log(`${recursive ? chalk.magenta('./' + entry[0]) + ':': ''}${lineNumber ? chalk.greenBright(entry[1]) + ':': ''} ${entry[2].replace(regex, match => chalk.bold.red(match))}`)
    })

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

function transfer(arr, pathToDeposit, lineNumber = false, recursive = false) {
    if (arr == null) {
        console.log('no matches found')
        return
    }
    let str = arr.map(entry => `${recursive ? './' + entry[0] + ':': ''}${lineNumber ? entry[1] + ':': ''}${entry[2]}`).join('\n')
    
    writeFileSync(pathToDeposit, str)
}



function isDirectory(pathstring) {
    try {
        return lstatSync(pathstring).isDirectory()
    } catch {
        return false
    }
}
/**
 * 
 * @param {string[]} arr 
 * @param  {...string} thingsToFilter 
 */
function clean(arr, ...thingsToFilter) {
    return arr.filter(val => !thingsToFilter.includes(val))
}


