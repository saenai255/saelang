'use strict';

import { exit } from "process";
import CAssembler from "../src/CAssembler";
import { SaeError } from "../src/Error";
import { Parser } from "../src/Parser";


const fs = require('fs');

function main(argv) {
  const [_, __, mode, exp] = argv;

  const parser = new Parser();

  let ast = null;

  // Direct expression:
  ast = parser.parse(
    `
    fn main() {
      let a = if true 1 else 2;
    }
    `
  );

  if (mode === '-e') {
    ast = parser.parse(exp);
  }

  if (mode === '-f') {
    const src = fs.readFileSync(exp, 'utf-8');
    ast = parser.parse(src);
  }

  // console.log(JSON.stringify(ast, null, 2));
  const casm = new CAssembler(ast)
  casm.assembleCAST()
  // console.dir(casm.functions, { depth: 4 })
}

try {
  main(process.argv);
} catch (e) {
  if (e instanceof SaeError) {
    console.error(e.toString());
    exit(1);
  }

  throw e;
}