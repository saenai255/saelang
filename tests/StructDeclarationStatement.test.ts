import { ExpressionStatement, Identifier, Program, StructDeclarationStatement, TypeFunction, TypeIdentifier, TypePrimitive } from "../src/ASTUtils"
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
                identifier: TypeIdentifier('Number'),
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
                identifier: TypeIdentifier('Number'),
                attributes: [
                    [Identifier('value'), TypeIdentifier('Int')]
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
                identifier: TypeIdentifier('Number'),
                attributes: [
                    [Identifier('value'), TypeIdentifier('Int')],
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
                identifier: TypeIdentifier('Number'),
                attributes: [],
                implements: []
            }))))

    test(`with 1 impl`, () => expectTree(
        `
        type struct Number impl Countable {}
        `,
        Program(
            StructDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [],
                implements: [
                    TypeIdentifier('Countable')
                ]
            }))))

    test(`with 2 impl`, () => expectTree(
        `
        type struct Number impl Countable, Serializable {}
        `,
        Program(
            StructDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [],
                implements: [
                    TypeIdentifier('Countable'),
                    TypeIdentifier('Serializable'),
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
                identifier: TypeIdentifier('Number'),
                attributes: [
                    [Identifier('is_positive'), TypeFunction({
                        genericTypes: [],
                        paramTypes: [],
                        returnType: TypePrimitive('bool')
                    })],
                    [Identifier('square'), TypeFunction({
                        genericTypes: [],
                        paramTypes: [],
                        returnType: TypeIdentifier('Number')
                    })],
                ],
                implements: []
            }))))
})