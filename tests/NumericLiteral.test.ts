import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('NumericLiteral', () => {
    test('Simple value', () => expectTree(
        `42;`,
        {
            type: 'Program',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'NumericLiteral',
                        value: 42
                    }
                }
            ]
        }
    ))
    test('Missing ;', () => expectError(
        `42`,
        SaeSyntaxError
    ))
    test('Multiple values', () => expectTree(
        `
        42;
        41;
        `,
        {
            type: 'Program',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'NumericLiteral',
                        value: 42
                    }
                },
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'NumericLiteral',
                        value: 41
                    }
                }
            ]
        }
    ))
})