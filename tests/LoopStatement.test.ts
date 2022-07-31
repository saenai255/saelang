import { BlockExpression, BooleanLiteral, BreakStatement, ContinueStatement, Identifier, LoopStatement, LoopOverStatement, Program, BlockStatement } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('LoopStatement', () => {
    test('loop with condition', () => expectTree(
        `loop true {}`,
        Program(
            LoopStatement(
                BlockStatement(),
                BooleanLiteral(true)))))

    test('forever loop', () => expectTree(
        `loop {}`,
        Program(
            LoopStatement(
                BlockStatement(),
                BooleanLiteral(true)))))

    test('loop over iterable', () => expectTree(
        `loop over my_items {}`,
        Program(
            LoopOverStatement(
                Identifier('my_items'),
                BlockStatement(),
                Identifier('it')))))

    test('loop over iterable with alias', () => expectTree(
        `loop over my_items as item {}`,
        Program(
            LoopOverStatement(
                Identifier('my_items'),
                BlockStatement(),
                Identifier('item')))))

    test('loop over iterable with alias and break, continue', () => expectTree(
        `loop over my_items as item {
            break;
            continue;
        }`,
        Program(
            LoopOverStatement(
                Identifier('my_items'),
                BlockStatement(
                    BreakStatement(),
                    ContinueStatement()
                ),
                Identifier('item')))))
})