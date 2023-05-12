#!/usr/bin/env node
'use strict';

import ASTExpander from "../src/ASTExpander";
import { Parser } from "../src/Parser";
import { toCpp } from "../src/C++Backend";
import AST from "../src/AST";
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import * as fs from 'fs'
import * as cp from 'child_process'
import * as os from 'os'

const debugSource = `
struct Person {
    name str
}

fn main() {
    let p = Person {
        .name = "Paul",
    };
}
`;

function transpile(source: string): string {
    const parser = new Parser();
    const ast = parser.parse(source);
    const expandedAST = new ASTExpander().expand(ast) as AST
    return toCpp(expandedAST as AST);
}

function transpileFile(path: string): string {
    const src = fs.readFileSync(path, 'utf-8');
    return transpile(src)
}

function compileCpp(path: string, outpath: string) {
    const compiler = process.env.CXX || 'g++'
    cp.execSync(`${compiler} ${path} -O3 -o ${outpath}`)
}

function compileFile(path: string): string {
    const ext = os.platform() === 'win32' ? '.exe' : '';

    const saePath = path;
    const cPath = saePath + '.cpp';
    const exePath = cPath.replace('.sae.cpp', ext)

    const code = transpileFile(path)
    emitCode(cPath, code)
    compileCpp(cPath, exePath)
    fs.unlinkSync(cPath)

    return exePath
}

function transpileDebug(): string {
    return transpile(debugSource)
}

function emitCode(path: string, code: string) {
    if (!path) {
        console.log(code)
        return;
    }

    fs.writeFileSync(path.endsWith('.cpp') ? path : `${path}.cpp`, code)
}

yargs(hideBin(process.argv))
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
    .command('build [file]', 'build C++ file', yargs => {
        return yargs.positional('file', {
            describe: 'file to build',
            type: 'string'
        }).demandOption('file')
        .option('output', {
            describe: 'output file',
            type: 'string',
            alias: 'o',
        })
        .demandOption('output')
    }, ({ file, output }) => {
        const cCode = transpileFile(file);
        fs.writeFileSync(output, cCode)
    })
    .command('compile [file]', 'compile the SAE file to native executable', yargs => {
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
        try {
            const exePath = compileFile(file);
            try {
                const buf = cp.execFileSync(exePath)
                console.log(buf.toString('utf-8'))
            } catch (e) {
                console.error((e as any).stdout.toString('utf-8'))
            }
            fs.unlinkSync(exePath)
        } catch (e) {
            console.error((e as Error).message)
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
    })
    .parseSync()