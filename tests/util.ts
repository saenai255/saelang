import AST from "../src/AST"
import { Parser } from "../src/Parser"

const skipParentCheck = (ast: any, top = false): any => {
    if (ast instanceof Array) {
        ast.forEach(it => skipParentCheck(it))
        return ast
    }

    if (typeof ast === 'object' && !!ast) {
        if ('type' in ast && !top) {
            ast.parent = expect.anything()
        }

        Object.values(ast).map(it => skipParentCheck(it))
        return ast;
    }

    return ast;
}

export const expectTree = (code: string, ast: AST) =>
    expect(new Parser().parse(code)).toEqual(skipParentCheck(ast, true));

export const expectError = (code: string, err?: any) =>
    expect(() => new Parser().parse(code)).toThrowError(err);