import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('StringLiteral', () => {
    test('Simple value using double quotes', () => expectTree(
        `"helloo";`,
        {
            type: 'Program',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'StringLiteral',
                        value: "helloo"
                    }
                }
            ]
        }
    ))
    test('Simple value using single quotes', () => expectTree(
        `'helloo';`,
        {
            type: 'Program',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'StringLiteral',
                        value: "helloo"
                    }
                }
            ]
        }
    ))
    test('Missing ;', () => expectError(
        `'heyoo'`,
        SaeSyntaxError
    ))
    test('Multiple values', () => expectTree(
        `
        'hello';
        'world';
        `,
        {
            type: 'Program',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'StringLiteral',
                        value: 'hello'
                    }
                },
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'StringLiteral',
                        value: 'world'
                    }
                }
            ]
        }
    ))
})