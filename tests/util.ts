import AST from "../src/AST"
import { Parser } from "../src/Parser"

const skipParentCheck = (ast: any, top = false): any => {
    if (ast instanceof Array) {
        ast.forEach(it => skipParentCheck(it))
        return ast
    }

    if (typeof ast === 'object' && !!ast) {
        Object.values(ast).map(it => skipParentCheck(it))

        if ('type' in ast && !top) {
            ast.parent = expect.anything()

            if ('up' in ast) {
                ast.up = expect.anything()
            }
        }

        return ast;
    }

    return ast;
}

export const expectTree = (code: string, ast: AST) =>
    expect(new Parser().parse(code)).toEqual(skipParentCheck(ast, true));

export const expectError = (code: string, err?: any) =>
    expect(() => new Parser().parse(code)).toThrowError(err);