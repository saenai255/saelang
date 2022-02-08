import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('BlockStatement', () => {
    test('Simple value using double quotes', () => expectTree(
        `{
            "helloo";
        }`,
        {
            type: 'Program',
            body: [
                {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'StringLiteral',
                            value: 'helloo'
                        }
                    }]
                }
            ]
        }
    ))
})