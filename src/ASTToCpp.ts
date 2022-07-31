import AST, { Component, Type, TypedArgument } from "./AST";
import { SaeSyntaxError } from "./Error";
import { componentTokenMap } from "./Parser";

const CPP_KEYWORDS = {
    structDeferredName: '__INTERLUDE_SAE_DEFERRED',
    blockExpr: '__INTERLUDE__SAE_BLOCK_EXPR',
    ifExpr: '__INTERLUDE__SAE_IF',
    takeStmt: '__INTERLUDE__SAE_TAKE',
    deferStmt: '__INTERLUDE_SAE_DEFER'
} as const;

const s2cPrimitivesMap = {
    'i8': 'int8_t',
    'i16': 'int16_t',
    'i32': 'int32_t',
    'i64': 'int64_t',
    'i128': '__int128_t',
    'u8': 'uint8_t',
    'u16': 'uint16_t',
    'u32': 'uint32_t',
    'u64': 'uint64_t',
    'u128': '__uint128_t',
    'str': 'char*',
    'bool': 'bool',
    'f32': '__f32',
    'f64': '__f64',
    'f128': '__f128',
    'c_int': 'int',
    'c_char': 'char',
    'c_float': 'float',
    'c_double': 'double',
    'c_bool': 'bool'
}


const $CType = (typ: Type | TypedArgument, acceptAuto = false): string => {
    if (!typ && acceptAuto) {
        return 'auto';
    }

    switch (typ.type) {
        case 'PrimitiveType':
            return `${s2cPrimitivesMap[typ.value]}`
        case 'TypeEmpty':
            return 'void'
        case 'TypedArgument':
            return `${typ.mutable ? '' : 'const '}${$CType(typ.argType)} ${typ.name}`
        case 'TypePointer':
            return `${$CType(typ.inner)}*`
        case 'Identifier':
            return `${$C(typ)}`
        case 'TypeFunction':
            return `std::function<${$CType(typ.returnType)}(${typ.paramTypes.map(it => $CType(it.argType)).join(', ')})>`
        default:
            if (acceptAuto) {
                return 'auto';
            } else {
                throw new SaeSyntaxError(`Type ${typ} not yet supported.`, componentTokenMap.get(typ as any));
            }
    }
}

const $C = (component: Component): string => {
    switch (component.type) {
        case 'BooleanLiteral':
            return component.value ? '1' : '0'
        case 'StringLiteral':
            return `"${component.value}"`
        case 'NumericLiteral':
            return component.value.toString()
        case 'BinaryExpression':
            return `(${$C(component.left)} ${component.operator} ${$C(component.right)})`;
        case 'AssignmentStatement':
            return `${component.left.name} = ${$C(component.right)};`
        case 'StructDeclarationStatement':
            return `
struct ${component.name} ${component.implements.length > 0 ? (': ' + component.implements.map(it => $CType(it)).join(', ')) : ''} {
    ${component.attributes.map(it => `${$CType(it[1])} ${$C(it[0])};`).join('\n')}
};
            `.trim()
        case 'VariableDeclarationStatement':
            return `${component.mutable ? '' : 'const '}${$CType(component.ttype, true)} ${component.left.name}` + (component.right ? ` = ${$C(component.right)};` : `;`)
        case 'BlockExpression':
            return `
${CPP_KEYWORDS.blockExpr}({
    ${component.body.map(it => $C(it)).join('\n')}
})
`.trim()
        case 'BlockStatement':
            return `
{
${component.body.map(it => $C(it)).join('\n')}
}
`.trim()
        case 'BreakStatement':
            return 'break;'
        case 'ContinueStatement':
            return 'continue;'
        case 'EmptyStatement':
            return ';'
        case 'FunctionCall':
            return `${$C(component.expression)}(${component.params.map(it => $C(it)).join(', ')})`
        case 'ExpressionStatement':
            return `${$C(component.expression)};`
        case 'FunctionExpression':
            return `
${component.name === 'main' ? 'int' : $CType(component.returnType)} ${component.name}(${component.arguments.map(it => $CType(it)).join(', ')}) ${$C(component.body)}
            `.trim()
        case 'Identifier':
            return component.name
        case 'IfStatement':
            return `
if (${$C(component.condition)})
    ${$C(component.then)}
    ${component.else ? `${$C(component.else)}` : ''}
            `.trim()
        case 'IfExpression':
            return `
${CPP_KEYWORDS.ifExpr}(
    ${$C(component.condition)},
    {
        ${component.then.body.map(it => $C(it)).join('\n')}
    },
    {
        ${component.else.body.map(it => $C(it)).join('\n')}
    })
            `.trim()
        case 'IndexExpression':
            return `${$C(component.expression)}[${$C(component.index)}]`
        case 'ReturnStatement':
            return `return ${$C(component.value)};`
        case 'TakeStatement':
            return `${CPP_KEYWORDS.takeStmt} ${$C(component.value)};`
        case 'DeferStatement':
            return `${CPP_KEYWORDS.deferStmt}({${$C(component.stmt)}});`
        case 'MemberExpression':
            return `${$C(component.expression)}.${$C(component.property)}`
        case 'CppNativeCodeStatement':
            return component.code;
    }

    throw new Error();
}

const saeInterlude = `
#ifndef __SAE__INTERLUDE
#define __SAE__INTERLUDE
#include <stdio.h>
#include <functional>

struct ${CPP_KEYWORDS.structDeferredName}
{
    std::function<void()> stmt;

    ${CPP_KEYWORDS.structDeferredName}(std::function<void()> stmt)
    {
        this->stmt = stmt;
    }

    ~${CPP_KEYWORDS.structDeferredName}()
    {
        this->stmt();
    }
};

#define __INTERLUDE__SAE_CONCAT2(a, b) a##b
#define __INTERLUDE__SAE_CONCAT(a, b) __INTERLUDE__SAE_CONCAT2(a, b)

#define ${CPP_KEYWORDS.deferStmt}(block)                                                 \
    ${CPP_KEYWORDS.structDeferredName} __INTERLUDE__SAE_CONCAT(__deferred_, __COUNTER__)([&]() \
                                                                               { block; });

#define ${CPP_KEYWORDS.blockExpr}(block) ([&]() { block; })()
#define ${CPP_KEYWORDS.ifExpr}(cond, thn, els) \
    ((cond) ? ${CPP_KEYWORDS.blockExpr}(thn) : ${CPP_KEYWORDS.blockExpr}(els))

#define ${CPP_KEYWORDS.takeStmt} return
#endif
`.trim()

export const toC = (ast: AST): string => {
    return `
${saeInterlude}

${ast.body.map(it => $C(it)).join('\n')}
`.trim()
}