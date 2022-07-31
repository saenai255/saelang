import { ExpressionStatement, Identifier, Program, StructDeclarationStatement, TypeFunction, TypePrimitive } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('StructDeclarationStatement', () => {
    test(`with 1 primitive attribute`, () => expectTree(
        `
        type struct Number {
            value i32;
        }
        `,
        Program(
            StructDeclarationStatement({
                name: 'Number',
                attributes: [
                    [Identifier('value'), TypePrimitive('i32')]
                ],
                implements: []
            }))))

    test(`with 1 custom attribute`, () => expectTree(
        `
        type struct Number {
            value Int;
        }
        `,
        Program(
            StructDeclarationStatement({
                name: 'Number',
                attributes: [
                    [Identifier('value'), Identifier('Int')]
                ],
                implements: []
            }))))

    test(`with 2 attributes`, () => expectTree(
        `
        type struct Number {
            value Int;
            absolute bool;
        }
        `,
        Program(
            StructDeclarationStatement({
                name: 'Number',
                attributes: [
                    [Identifier('value'), Identifier('Int')],
                    [Identifier('absolute'), TypePrimitive('bool')],
                ],
                implements: []
            }))))

    test(`with 0 attributes`, () => expectTree(
        `
        type struct Number {}
        `,
        Program(
            StructDeclarationStatement({
                name: 'Number',
                attributes: [],
                implements: []
            }))))

    test(`with 1 impl`, () => expectTree(
        `
        type struct Number impl Countable {}
        `,
        Program(
            StructDeclarationStatement({
                name: 'Number',
                attributes: [],
                implements: [
                    Identifier('Countable')
                ]
            }))))

    test(`with 2 impl`, () => expectTree(
        `
        type struct Number impl Countable, Serializable {}
        `,
        Program(
            StructDeclarationStatement({
                name: 'Number',
                attributes: [],
                implements: [
                    Identifier('Countable'),
                    Identifier('Serializable'),
                ]
            }))))

    test(`with method attribute`, () => expectTree(
        `
        type struct Number {
            is_positive () bool;
            square() Number;
        }
        `,
        Program(
            StructDeclarationStatement({
                name: 'Number',
                attributes: [
                    [Identifier('is_positive'), TypeFunction({
                        genericTypes: [],
                        paramTypes: [],
                        returnType: TypePrimitive('bool')
                    })],
                    [Identifier('square'), TypeFunction({
                        genericTypes: [],
                        paramTypes: [],
                        returnType: Identifier('Number')
                    })],
                ],
                implements: []
            }))))
})