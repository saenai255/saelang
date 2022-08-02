import AST, { Component, Type, TypedArgument } from "./AST";
import { SaeSyntaxError } from "./Error";
import { componentTokenMap } from "./Parser";

const CPP_KEYWORDS = {
    structDeferredName: '__defer_struct__',
    blockExpr: '_block_expr',
    ifExpr: '_if',
    takeStmt: '_take',
    deferStmt: '_defer'
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
        case 'TypeIdentifier':
            return `${typ.name}`
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

const tabWidth = 4;
const tab = (depth: number) => new Array(Math.max(depth, 0)).fill(new Array(tabWidth).fill(' ').join('')).join('')

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
        case 'InterfaceDeclarationStatement':
            return `
virtual struct ${$CType(component.identifier)}${component.implements.length > 0 ? (' : ' + component.implements.map(it => $CType(it)).join(', ')) : ''} {
${component.attributes.map(it => `${$CType(it[1])} ${$C(it[0])};`).join('\n')}
};
`.trimStart()
        case 'StructDeclarationStatement':
            return `
struct ${$CType(component.identifier)}${component.implements.length > 0 ? (' : ' + component.implements.map(it => $CType(it)).join(', ')) : ''} {
${component.attributes.map(it => `${$CType(it[1])} ${$C(it[0])};`).join('\n')}
};
`.trimStart()
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
            return `break;`
        case 'ContinueStatement':
            return `continue;`
        case 'EmptyStatement':
            return `;`
        case 'FunctionCall':
            return `${$C(component.expression)}(${component.params.map(it => $C(it)).join(', ')})`
        case 'ExpressionStatement':
            return `${$C(component.expression)};`
        case 'FunctionDeclarationStatement':
            return `
${component.name === 'main' ? 'int' : $CType(component.returnType)} ${component.name}(${component.arguments.map(it => $CType(it)).join(', ')}) ${$C(component.body)}
`.trimStart()
        case 'Identifier':
            return component.name
        case 'IfStatement':
            return `
if ((${$C(component.condition)}) == true) ${$C(component.then)} ${component.else ? `else ${$C(component.else)}` : ''}
            `.trim()
        case 'IfExpression':
            return `
${CPP_KEYWORDS.ifExpr}((${$C(component.condition)}) == true,
${CPP_KEYWORDS.blockExpr}({ ${component.then.body.map(it => $C(it)).join('\n')} }),
${CPP_KEYWORDS.blockExpr}({ ${component.else.body.map(it => $C(it)).join('\n')} }))
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
        case 'TypeIdentifier':
            return component.name
        case 'StructInstantiationExpression':
            return `${$C(component.ttype)} {
${component.attributes.map(([id, val]) => `.${$C(id)} = ${$C(val)}`).join(',\n')}
}`

    }

    throw new Error(`No impl for component type ${component.type}`);
}

export const prelude = `
#ifndef __SAE__PRELUDE
#define __SAE__PRELUDE
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

#define __PRELUDE__SAE_CONCAT2(a, b) a##b
#define __PRELUDE__SAE_CONCAT(a, b) __PRELUDE__SAE_CONCAT2(a, b)

#define ${CPP_KEYWORDS.deferStmt}(block)                                                 \
    ${CPP_KEYWORDS.structDeferredName} __PRELUDE__SAE_CONCAT(__deferred_, __COUNTER__)([&]() \
                                                                               { block; });

#define ${CPP_KEYWORDS.blockExpr}(block) ([&]() { block; })()
#define ${CPP_KEYWORDS.ifExpr}(cond, thn, els) \
    ((cond) ? (thn) : (els))

#define ${CPP_KEYWORDS.takeStmt} return
#endif
`.trim()

const prettyPrint = (code: string): string => {
    const diff = (line: string) => {
        const chars = line.split('');
        const out = chars.filter(it => ['{', '(', '['].includes(it)).length - chars.filter(it => ['}', ')', ']'].includes(it)).length;
        return out < 0
            ? -1
            : out > 0
                ? 1
                : 0;
    }

    const isEndOfIndent = (line: string) => {
        const ln = line.trim();
        if (!ln) {
            return false;
        }

        return ['}', ']', ')'].includes(ln[0]);
    }

    let depth = 0;
    let out = '';
    for (const line of code.split('\n')) {
        out += tab(isEndOfIndent(line) ? depth - 1 : depth) + line + '\n';
        depth += diff(line)
    }

    return out
}

export const toC = (ast: AST): string => {
    return `
${prelude}

${prettyPrint(ast.body.map(it => $C(it)).join('\n'))}
`.trim()
}