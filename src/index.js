#!/usr/bin/env node
import { existsSync, writeFileSync, lstatSync } from 'fs'
import { findLines, display, recursiveCheck, read } from './find.js'
import { replace, recursiveReplace } from './replace.js'
import PromptSync from 'prompt-sync'
const confirm = PromptSync({autocomplete: complete(['Yes', 'yes', 'no', 'No'])})
import { program } from 'commander'
import chalk from 'chalk'
export { isDirectory }
function complete(commands) {
    return function (str) {
      var i;
      var ret = [];
      for (i=0; i< commands.length; i++) {
        if (commands[i].indexOf(str) == 0)
          ret.push(commands[i]);
      }
      return ret;
    };
  };

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
    .command('replace <pattern> <replaceValue> <filepath>')
    .description('replace every <pattern> match with the <replaceValue> argument')
    .option('-i --insensitive', 'makes the search, case insensitive (foo == FoO is true) ')
    .option('-r --recursive', 'recursively checks the directory for the pattern')
    .option('-v --invert', 'invert the search pattern to show everything that doesn\'t contain the pattern')
    .option('-w, --only-word', 'match any word characters after the original pattern')
    .action((pattern, replaceValue, filepath, options) => {
        if (options.recursive) {
            let replaced = recursiveReplace(
                RegExp(`${options.onlyLine ? '^': ''}${options.onlyWord ? `\\b`: ''}${pattern}${options.onlyWord ? `\\b`: ''}${options.onlyLine ? '$': ''}`, `g${options.insensitive ? 'i': ''}${options.onlyLine ? 'm': ''}`),
                replaceValue,
                filepath
            )
            console.log('The data in the following files will be replaced: ')
            replaced.forEach(file => {
                console.log(chalk.magentaBright(file.path))
            })
            let answer = confirm(`Are you sure? [yN]: `)
            switch(answer) {
                case 'Yes':
                case 'yes':
                case 'YES':
                    break
                default:
                    return
            }
            for (const file of replaced) {
                writeFileSync(file.path, file.data)
            }
        } else {
            replace(
                RegExp(`${options.onlyLine ? '^': ''}${options.onlyWord ? `\\b`: ''}${pattern}${options.onlyWord ? `\\b`: ''}${options.onlyLine ? '$': ''}`, `g${options.insensitive ? 'i': ''}${options.onlyLine ? 'm': ''}`),
                replaceValue,
                filepath
            )
        }
    }) 


program
    .command('read <filepath>')
    .description('reads and prints the full contents of the file at the <filepath> argument, could be used to check recently replaced file')
    .action(filepath => {
        if (!existsSync(filepath)) {
            console.error(`${filepath} does not exist`)
            process.exitCode = 1
            return
        }
        if (isDirectory(filepath)) {
            console.error(`${filepath} is a directory`)
            process.exitCode = 1
            return
        }
        console.log(read(filepath))
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