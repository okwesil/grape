#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, lstatSync } from 'fs'
import { findLines, display, recursiveCheck } from './find.js'
import { program } from 'commander'

program 
    .name('grape')
    .command('find <pattern> <filepath>')
    .description('find the given pattern in file')
    .option('-i, --insensitive', 'makes the search, case insensitive (foo == FoO is true) ')
    .option('-r, --recursive', 'recursively checks the directory and subdirectories for the pattern')
    .option('-n, --line-number', 'shows line number with the lines')
    .option('-v, --invert', 'invert the search pattern to show everything that doesn\'t contain the pattern')
    .option('-w, --only-word', 'matches string only if it is it\'s own word')
    .option('-l, --only-line', 'only matches the string if it is both the start and end of a line') 
    .option('-c, --count', 'print the number of lines matched')
    .option('-C, --count-all', 'print number of individual matches')
    .action((pattern, filepath, options) => {
        let regex = RegExp(`${options.onlyLine ? '^': ''}${options.onlyWord ? `\\b`: ''}${pattern}${options.onlyWord ? `\\b`: ''}${options.onlyLine ? '$': ''}`, `g${options.insensitive ? 'i': ''}${options.onlyLine ? 'm': ''}`)
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
            output = recursiveCheck(regex, filepath, undefined, options.invert != undefined)
        } else {
            output = findLines(regex, filepath, options.invert != undefined)
        }
        display(regex, output, options.lineNumber != undefined, options.recursive != undefined, options.count != undefined, options.countAll != undefined)
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


