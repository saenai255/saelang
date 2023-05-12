import AST, { Component, StructConstructorNamedFieldAssignment, Type, TypedArgument } from "./AST";

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
    'str': 'const char*',
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
        case 'TypeStruct':
            return `${typ.name}`
        default:
            if (acceptAuto) {
                return 'auto';
            } else {
                throw new Error(`Type ${typ} not yet supported.`);
            }
    }
}

const $Cpp = (component: Component, depth = 0): string => {
    switch (component.type) {
        case 'BooleanLiteral':
            return component.value ? '1' : '0'
        case 'StringLiteral':
            return `"${component.value}"`
        case 'NumericLiteral':
            return component.value.toString()
        case 'BinaryExpression':
            return `(${$Cpp(component.left)} ${component.operator} ${$Cpp(component.right)})`;
        case 'AssignmentStatement':
            return `${component.left.name} = ${$Cpp(component.right)};`
        case 'VariableDeclarationStatement':
            return `${component.mutable ? '' : 'const '}${$CType(component.ttype, true)} ${component.left.name}` + (component.right ? ` = ${$Cpp(component.right)};` : `;`)
        case 'BlockExpression':
            return `
${CPP_KEYWORDS.blockExpr}({
    ${component.body.map(it => $Cpp(it)).join('\n')}
})
`.trim()
        case 'BlockStatement':
            return `
{
${component.body.map(it => $Cpp(it)).join('\n')}
}
`.trim()
        case 'BreakStatement':
            return 'break;'
        case 'ContinueStatement':
            return 'continue;'
        case 'EmptyStatement':
            return ';'
        case 'FunctionCall':
            return `${$Cpp(component.expression)}(${component.params.map(it => $Cpp(it)).join(', ')})`
        case 'ExpressionStatement':
            return `${$Cpp(component.expression)};`
        case 'FunctionExpression':
            return `
${component.name === 'main' ? 'int' : $CType(component.returnType)} ${component.name}(${component.arguments.map(it => $CType(it)).join(', ')}) ${$Cpp(component.body)}
            `.trim()
        case 'Identifier':
            return component.name
        case 'IfStatement':
            return `
if (${$Cpp(component.condition)})
    ${$Cpp(component.then)}
    ${component.else ? `${$Cpp(component.else)}` : ''}
            `.trim()
        case 'IfExpression':
            return `
${CPP_KEYWORDS.ifExpr}(
    ${$Cpp(component.condition)},
    {
        ${component.then.body.map(it => $Cpp(it)).join('\n')}
    },
    {
        ${component.else.body.map(it => $Cpp(it)).join('\n')}
    })
            `.trim()
        case 'IndexExpression':
            return `${$Cpp(component.expression)}[${$Cpp(component.index)}]`
        case 'ReturnStatement':
            return `return ${$Cpp(component.value)};`
        case 'TakeStatement':
            return `${CPP_KEYWORDS.takeStmt} ${$Cpp(component.value)};`
        case 'DeferStatement':
            return `${CPP_KEYWORDS.deferStmt}({${$Cpp(component.stmt)}});`
        case 'MemberExpression':
            return `${$Cpp(component.expression)}.${$Cpp(component.property)}`
        case 'NativeCodeExpression':
            return component.value;
        case 'StructDeclarationStatement':
            return `
struct ${component.body.name} {
    ${component.body.fields.map(it => `${$CType(it.argType, false)} ${it.name};`).join('\n')}
};
`.trim()
        case 'StructConstructorExpression':
            return `${component.struct.name || '.'} { ${component.params.map(it => fromStructConstructorNamedFieldAssignment(it)).join(',\n')} }`.trim()
    }

    throw new Error();
}

const fromStructConstructorNamedFieldAssignment = (it: StructConstructorNamedFieldAssignment) => {
    return `.${it.fieldName} = ${$Cpp(it.value)}`;
}

const CPP_ASSERT_FUNC = `
void __INTERLUDE__SAE_ASSERT(bool cond) {
    if (!cond) {
        throw std::runtime_error("Assertion failed");
    }
}
`

const CPP_PRELUDE = `
#ifndef __SAE__INTERLUDE
#define __SAE__INTERLUDE
#include <stdio.h>
#include <functional>
#include <stdexcept>

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

#define ${CPP_KEYWORDS.deferStmt}(block)                                                 \\
    ${CPP_KEYWORDS.structDeferredName} __INTERLUDE__SAE_CONCAT(__deferred_, __COUNTER__)([&]() \\
                                                                               { block; });

#define ${CPP_KEYWORDS.blockExpr}(block) ([&]() { block; })()
#define ${CPP_KEYWORDS.ifExpr}(cond, thn, els) \\
    ((cond) ? ${CPP_KEYWORDS.blockExpr}(thn) : ${CPP_KEYWORDS.blockExpr}(els))

#define ${CPP_KEYWORDS.takeStmt} return

${CPP_ASSERT_FUNC}
#endif
`.trim()

export const toCpp = (ast: AST): string => {
    return `
${CPP_PRELUDE}

${ast.body.map(it => $Cpp(it)).join('\n')}
`.trim()
}