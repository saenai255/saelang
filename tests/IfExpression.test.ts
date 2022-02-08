import { SaeSyntaxError } from "../src/Error"
import { expectError, expectTree } from "./util"

describe('IfExpression', () => {
    test('Only with then', () => expectTree(`
        if 3 {
            take 5;
        }
        `,
        {
            type: 'Program',
            body: [
                {
                    type: 'IfExpression',
                    condition: {
                        type: 'NumericLiteral',
                        value: 3,
                    },
                    then: {
                        type: "BlockStatement",
                        body: [{
                            type: 'TakeStatement',
                            value: {
                                type: 'NumericLiteral',
                                value: 5
                            }
                        }]
                    },
                    else: null
                }
            ]
        }
    ))

    test('With then and else', () => expectTree(`
        if 3 {
            take 5;
        } else {
            take 2;
        }
        `,
        {
            type: 'Program',
            body: [
                {
                    type: 'IfExpression',
                    condition: {
                        type: 'NumericLiteral',
                        value: 3,
                    },
                    then: {
                        type: "BlockStatement",
                        body: [{
                            type: 'TakeStatement',
                            value: {
                                type: 'NumericLiteral',
                                value: 5
                            }
                        }]
                    },
                    else: {
                        type: 'BlockStatement',
                        body: [{
                            type: 'TakeStatement',
                            value: {
                                type: 'NumericLiteral',
                                value: 2
                            }
                        }]
                    }
                }
            ]
        }
    ))

    test('With nested if', () => expectTree(`
        if 3 {
            take 5;
        } else {
            take if 5 {
                take 5;
            } else {
                take 6;
            };
        }
        `,
        {
            type: 'Program',
            body: [
                {
                    type: 'IfExpression',
                    condition: {
                        type: 'NumericLiteral',
                        value: 3,
                    },
                    then: {
                        type: "BlockStatement",
                        body: [{
                            type: 'TakeStatement',
                            value: {
                                type: 'NumericLiteral',
                                value: 5
                            }
                        }]
                    },
                    else: {
                        type: 'BlockStatement',
                        body: [{
                            type: 'TakeStatement',
                            value: {
                                type: 'IfExpression',
                                condition: {
                                    type: 'NumericLiteral',
                                    value: 5
                                },
                                then: {
                                    type: 'BlockStatement',
                                    body: [{
                                        type: 'TakeStatement',
                                        value: {
                                            type: 'NumericLiteral',
                                            value: 5
                                        }
                                    }]
                                },
                                else: {
                                    type: 'BlockStatement',
                                    body: [{
                                        type: 'TakeStatement',
                                        value: {
                                            type: 'NumericLiteral',
                                            value: 6
                                        }
                                    }]
                                }
                            }
                        }]
                    }
                }
            ]
        }
    ))
})