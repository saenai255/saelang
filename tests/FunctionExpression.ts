import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('FunctionExpression', () => {
    for (const identifierName of ['abc', 'abc0', '_0', '_', 'a', 'a_', 'Asd', 'sDa', 'SD_2']) {
        test(`name '${identifierName}'`, () => expectTree(`${identifierName};`, {
            type: 'Program',
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'Identifier',
                        name: identifierName
                    }
                }
            ]
        }
        ))
    }
})