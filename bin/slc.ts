'use strict';

import { exit } from "process";
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
    pub let mut i32 x;
    `
  );

  if (mode === '-e') {
    ast = parser.parse(exp);
  }

  if (mode === '-f') {
    const src = fs.readFileSync(exp, 'utf-8');
    ast = parser.parse(src);
  }

  console.log(JSON.stringify(ast, null, 2));
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