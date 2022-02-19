import { BlockExpression, BooleanLiteral, BreakStatement, ContinueStatement, Identifier, LoopExpression, LoopOverExpression, Program } from "../src/ASTUtils"
import { expectTree } from "./util"

describe('LoopEpression', () => {
    test('loop with condition', () => expectTree(
        `loop true {}`,
        Program(
            LoopExpression(
                BlockExpression(),
                BooleanLiteral(true)))))

    test('forever loop', () => expectTree(
        `loop {}`,
        Program(
            LoopExpression(
                BlockExpression(),
                BooleanLiteral(true)))))

    test('loop over iterable', () => expectTree(
        `loop over my_items {}`,
        Program(
            LoopOverExpression(
                Identifier('my_items'),
                BlockExpression(),
                Identifier('it')))))

    test('loop over iterable with alias', () => expectTree(
        `loop over my_items as item {}`,
        Program(
            LoopOverExpression(
                Identifier('my_items'),
                BlockExpression(),
                Identifier('item')))))

    test('loop over iterable with alias and break, continue', () => expectTree(
        `loop over my_items as item {
            break;
            continue;
        }`,
        Program(
            LoopOverExpression(
                Identifier('my_items'),
                BlockExpression(
                    BreakStatement(),
                    ContinueStatement()
                ),
                Identifier('item')))))
})