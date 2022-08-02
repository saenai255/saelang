import { ExpressionStatement, Identifier, Program, InterfaceDeclarationStatement, TypeFunction, TypePrimitive, TypeIdentifier } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('InterfaceDeclarationStatement', () => {
    test(`with 1 primitive attribute`, () => expectTree(
        `
        type interface Number {
            value i32;
        }
        `,
        Program(
            InterfaceDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [
                    [Identifier('value'), TypePrimitive('i32')]
                ],
                implements: []
            }))))

    test(`with 1 custom attribute`, () => expectTree(
        `
        type interface Number {
            value Int;
        }
        `,
        Program(
            InterfaceDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [
                    [Identifier('value'), TypeIdentifier('Int')]
                ],
                implements: []
            }))))

    test(`with 2 attributes`, () => expectTree(
        `
        type interface Number {
            value Int;
            absolute bool;
        }
        `,
        Program(
            InterfaceDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [
                    [Identifier('value'), TypeIdentifier('Int')],
                    [Identifier('absolute'), TypePrimitive('bool')],
                ],
                implements: []
            }))))

    test(`with 0 attributes`, () => expectTree(
        `
        type interface Number {}
        `,
        Program(
            InterfaceDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [],
                implements: []
            }))))

    test(`with 1 impl`, () => expectTree(
        `
        type interface Number impl Countable {}
        `,
        Program(
            InterfaceDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [],
                implements: [
                    TypeIdentifier('Countable')
                ]
            }))))

    test(`with 2 impl`, () => expectTree(
        `
        type interface Number impl Countable, Serializable {}
        `,
        Program(
            InterfaceDeclarationStatement({
                identifier: TypeIdentifier('Number'),
                attributes: [],
                implements: [
                    TypeIdentifier('Countable'),
                    TypeIdentifier('Serializable'),
                ]
            }))))

    test(`with method attribute`, () => expectTree(
        `
        type interface Number {
            is_positive () bool;
            square() Number;
        }
        `,
        Program(
            InterfaceDeclarationStatement({
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