import AST from "../src/AST"
import { Parser } from "../src/Parser"

export const expectTree = (code: string, ast: AST) =>
    expect(new Parser().parse(code)).toEqual(ast);

export const expectError = (code: string, err?: any) =>
    expect(() => new Parser().parse(code)).toThrowError(err);