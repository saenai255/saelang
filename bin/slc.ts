#!/usr/bin/env node
'use strict';
import 'colors';

import ASTChecker from "../src/ASTChecker";
import { Parser } from "../src/Parser";
import { prelude, toC } from "../src/ASTToCpp";
import AST from "../src/AST";
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import * as fs from 'fs'
import * as cp from 'child_process'
import * as os from 'os'
import { SaeSyntaxError } from "../src/Error";
import ora from 'ora'

const debugSource = `

type struct Number {
    value i32;
}

fn main() {
    // if 3 {
    //     take 5;
    // } else {
    //     take if 5 {
    //         take 5;
    //     } else {
    //         take 6;
    //     };
    // }
    let num = Number {
        value = 5
    };
}
`;
let progress = ora({
    interval: 1
});
function transpile(source: string, file?: string): string {
    progress = progress.start('Transpiling source to C++')
    const parser = new Parser();
    parser._file = file;
    const ast = parser.parse(source);
    const expandedAST = new ASTChecker().check(ast) as AST
    try {
        const c = toC(expandedAST as AST);
        progress = progress.succeed();
        return c;
    } catch (e) {
        progress = progress.fail();
        throw e;
    }
}

function transpileFile(path: string): string {
    const src = fs.readFileSync(path, 'utf-8');
    return transpile(src, path)
}

function compileC(path: string, outpath: string) {
    try {
        progress = progress.start('Compiling C++ sources')
        const compiler = process.env.CXX || 'g++'
        cp.execSync(`${compiler} ${path} -O3 -o ${outpath}`);
        progress = progress.succeed();
    } catch (e) {
        progress = progress.fail();
        throw e;
    }
}

function compileFile(path: string): string {
    const ext = os.platform() === 'win32' ? '.exe' : '';

    const saePath = path;
    const cPath = saePath + '.cpp';
    const exePath = cPath.replace('.sae.cpp', ext)

    const code = transpileFile(path)
    emitCode(cPath, code)
    compileC(cPath, exePath)
    fs.unlinkSync(cPath)

    return exePath

}

function transpileDebug(): string {
    return transpile(debugSource)
}

function emitCode(path: string, code: string) {
    if (!path) {
        console.log('/// prelude hidden'.italic.yellow, code.substring(prelude.length))
        return;
    }

    fs.writeFileSync(path.endsWith('.cpp') ? path : `${path}.cpp`, code)
}

const main = yargs(hideBin(process.argv))
    .demandCommand(1)
    .command('transpile [file]', 'transpile the SAE file to C++', yargs => {
        return yargs
            .positional('file', {
                describe: 'file to transpile',
                type: 'string'
            })
            .demandOption('file')
            .option('output', {
                describe: 'output file',
                type: 'string',
                alias: 'o',
                default: ''
            })
    }, ({ file, output }) => {
        const cCode = transpileFile(file);
        emitCode(output, cCode)
    })
    .command('compile [file]', 'compile the SAE file to native executable using env CXX', yargs => {
        return yargs
            .positional('file', {
                describe: 'file to compile',
                type: 'string'
            })
            .demandOption('file')
            .option('output', {
                describe: 'output file',
                type: 'string',
                alias: 'o',
                default: ''
            })
    }, ({ file, output }) => {
        const exePath = compileFile(file);
        if (output) {
            fs.renameSync(exePath, output);
        }
    })
    .command('run [file]', 'run the SAE file', yargs => {
        return yargs
            .positional('file', {
                describe: 'file to run',
                type: 'string'
            })
            .demandOption('file')
    }, ({ file }) => {
            const exePath = compileFile(file);
            try {
                const buf = cp.execFileSync(exePath)
                console.log(buf.toString('utf-8'))
            } catch (e) {
                throw e;
            } finally {
                fs.unlinkSync(exePath)
            }
    })
    .command('debug', 'debug the inline code', yargs => {
        return yargs.option('output', {
            describe: 'output file',
            type: 'string',
            alias: 'o',
            default: ''
        })
    }, ({ output }) => {
        const cCode = transpileDebug();
        emitCode(output, cCode)
    });

(() => {
    try {
        main.parseSync();
    } catch (e) {
        if (e instanceof SaeSyntaxError) {
            console.error(e.toString())
            process.exit(1);
        } else {
            console.error((e as Error).message)
            console.error((e as Error).stack)
        }
    }
})();