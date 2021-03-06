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
fn factorial(nr i32) i32 {
  return if nr == 0 {
    take 1;
  } else {
    take nr * factorial(nr - 1);
  }
}

fn main() {
  let my_number = 5;
  std.printf("%d! = %d\n", my_number, my_number.factorial());
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