import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('BinaryExpression', () => {
    for (const operator of ['+', '-', '*', '/']) {

        test(`Simple ${operator} expression`, () => {
            expectTree(
                `42 ${operator} 1;`,
                {
                    type: 'Program',
                    body: [
                        {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'BinaryExpression',
                                left: {
                                    type: "NumericLiteral",
                                    value: 42
                                },
                                right: {
                                    type: 'NumericLiteral',
                                    value: 1
                                },
                                operator: operator as any,
                            }
                        }
                    ]
                }
            )
        })
    }

    for (const operator of ['+', '-', '*', '/']) {
        test(`Complex ${operator} expression`, () => {
            expectTree(
                `42 ${operator} 1 ${operator} 2;`,
                {
                    type: 'Program',
                    body: [
                        {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'BinaryExpression',
                                operator: operator as any,
                                left: {
                                    type: 'BinaryExpression',
                                    operator: operator as any,
                                    left: {
                                        type: "NumericLiteral",
                                        value: 42
                                    },
                                    right: {
                                        type: 'NumericLiteral',
                                        value: 1
                                    }
                                },
                                right: {
                                    type: 'NumericLiteral',
                                    value: 2
                                },
                            }
                        }
                    ]
                }
            )
        })
    }
    for (const operator of ['*', '/']) {
        test(`Complex expression with ${operator}`, () => expectTree(
            `42 + 1 ${operator} 2;`,
            {
                type: 'Program',
                body: [
                    {
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'BinaryExpression',
                            operator: '+',
                            left: {
                                type: "NumericLiteral",
                                value: 42
                            },
                            right: {
                                type: 'BinaryExpression',
                                operator: operator as any,
                                left: {
                                    type: "NumericLiteral",
                                    value: 1
                                },
                                right: {
                                    type: 'NumericLiteral',
                                    value: 2
                                }
                            }
                        }
                    }
                ]
            }
        ))
    }

    for (const operator of ['*', '/']) {

        test(`Complex expression with ${operator} and parantheses`, () => expectTree(
            `(42 + 1) ${operator} 2;`,
            {
                type: 'Program',
                body: [
                    {
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'BinaryExpression',
                            operator: operator as any,
                            left: {
                                type: 'BinaryExpression',
                                operator: '+',
                                left: {
                                    type: "NumericLiteral",
                                    value: 42
                                },
                                right: {
                                    type: 'NumericLiteral',
                                    value: 1
                                }
                            },
                            right: {
                                type: 'NumericLiteral',
                                value: 2
                            },
                        }
                    }
                ]
            }
        ))
    }
})