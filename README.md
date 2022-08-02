# SaeLang (name in the works)

A hopeful attempt at making a better language inspired by C, Rust and Go that compiles to C++.

## Garbage Collection
Garbage collection is manual, done using Go style `defer` statements.
The C++ *smart* pointers can be ported if deemed necessary.

## Syntax

### Variable Declarations
New variables can be declared using the `let` and `let mut` bindings.

`let` is used to create immutable variables, aka constants.
```rs
let num = 3;
```
compiles to:
```cpp
/** C++ output */
const int32_t num = 3;
```

`let mut` is used to create mutable variables.
```rs
let mut num = 3;
```
compiles to:
```cpp
/** C++ output */
int32_t num = 3;
```

#### Grammar
```
<let | let mut> <varName> [$type] = <$expression>; 
```

### Function Declarations

```rs
fn sum(a i32, b i32) i32 {
    return a + b;
}
```
compiles to:
```cpp
/** C++ output */
int32_t sum(const int32_t a, const int32_t b) {
    return a + b;
}
```

#### Grammar
```
[pub] fn <$name>([<$param1Name> <$param1Type>, <$param2Name> <$param2Type>, ...]) [$type] {
    <$statement_list>
}
```

### Struct Declarations

```rs
type struct Number {
    value i32;
}
```
compiles to:
```cpp
/** C++ output */
struct Number {
    int32_t value;
}
```

#### Grammar
```
[pub] fn <$name>([<$param1Name> <$param1Type>, <$param2Name> <$param2Type>, ...]) [$type] {
    <$statement_list>
}
```

### Struct Instantiation

```rs
type struct Number {
    value i32;
}

// Note: function without a return type get translated to `void` but
// the `main` function is an exception as it has to be `int` 
fn main() {
    let num = Number {
        value = 5
    };
}
```
compiles to:
```cpp
/** C++ output */
struct Number {
    int32_t value;
}

int main() {
    const Number num = Number {
        .value = 5
    };
}
```

#### Grammar
```
<$structName> {
    <$structAttribute1>: <expression>,
    <$structAttribute2>: <expression>,
    <$structAttribute3>: <expression>,
    ...
}
```

### Block Statements
Same as all the C-style languages.

### If Statements
Same as all the C-style languages.

### Block Expressions
Block expressions are used to create a new short lived scope that must return a value (using the `take` keyword).
It is typically useful when avoiding scope pollution.

```rs
let num = do {
    let b = 5;
    take b + 1;
};
```
compiles to:
```cpp
/** C++ output */
const int32_t num = ([&](){
    const int32_t b = 5;
    return b + 15;
})();
```

When block expressions consist of a single statement, instead of compiling to a C++ lambda, they compile to that nested expression.
```rs
let num = do {
    take b + 1;
};
```
compiles to:
```cpp
/** C++ output */
const int32_t num = b + 1;
```

#### Grammar
```
do {
    <$statement_list>
    take <$expression>;
}
```

### If Expressions
If expressions compile to the well known tertiary expression `condition ? resultIfTrue : resultIfFalse`.

**Important!** When *if expressions* are not used as values, they are parsed as *if statements*, which don't use the `do` and `take` keywords.

```rs
let num = if true 100 else 10;
```
compiles to:
```cpp
/** C++ output */
const int32_t num = true ? 100 : 10;
```

If expressions can be used in conjunction with the block expressions.
```rs
let num = if true do {
    let doubled = some_number * 2;
    take doubled;
} else do {
    let halved = some_number / 2;
    take halved;
};
```
compiles to:
```cpp
/** C++ output */
const int32_t num = true ? ([&](){
    const int32_t doubled = some_number * 2;
    return doubled;
})() : ([&](){
    const int32_t halved = some_number / 2;
    return halved;
})();
```

#### Grammar
```
if <$bool_expression>
    <$expression_when_condition_true>
else 
    <$expression_when_condition_false>
```

### Defer Statements
Inspired by Go's `defer` statements, these postpone the execution of the given statement until the end of scope.

```rs
fn main() {
    defer printf("Third\n");
    defer printf("Second\n");
    printf("First\n");
}
```
prints:
```
First
Second
Third
```

#### Grammar
```
defer <$statement>
```

### *[In Progress]* Fire Statements
Inspired by Go's `go` statements. It runs the given statement in a separate thread.

```rs
fn main() {
    fire doHeavyWork();
}
```
compiles to:
```cpp
Not Yet Implemented
```

#### Grammar
```
fire <$function_call_expression>;
```

### *[In Progress]* Loop Statements
Basically a `for` and `while` replacement. 

```rs
loop {
    // do work
}

// is the same as

loop true {
    // do work
}
```
compiles to:
```cpp
while(true) {
    // do Work
}
```

#### Loop Grammar
```
loop [$bool_expression] {
    <$statement_list>
}
```

For looping over an array-like structure, you can use `loop over` statement.
Inside the `loop over` block, the current element is available as `it`.
```rs
loop over my_int_array {
    printf("element = %d\n", it);
}
```

In case you need the element to be named something different, it can be aliased.
```rs
loop over my_int_array as num {
    printf("element = %d\n", num);
}
```

#### Loop Over Grammar
```
loop over <$array_like_expression> [as <$iterator = it>] {
    <$statement_list>
}
```

**Index Iteration:** Still in the works

### C++ native/embedded statement
Used to interop between the two languages.

```rs
$C++(
    int sum(int a, int b) {
        return a + b;
    }
) exposing(sum (a i32, b i32) i32);

fn main() {
    let result = sum(2, 3);
}
```
compiles to:
```cpp
int sum(int a, int b) {
    return a + b;
}

int main() {
    const int32_t result = sum(2, 3);
}
```

#### Grammar
```
$C++(
    [$cpp_native_code]
) exposing (<$var1Name> <$var1Type>, <$var2Name> <$var2Type>, ...)
```

## Why yet another language?
Bla bla bla, I find the current available languages not fit for my needs.

## Ready for Production? No.
Nope. Still a very long way to be ready for any production use.

## Contributing
Always welcome. If enough contributors pop up, I'll create a guide.

## Bug Reports
You can create a new GitHub Issue about it.

Here's a short reporting guide: https://softwaretesting.news/write-effective-bug-report/

## LICENSE
Currently MIT but I'm willing to change it if necessary.
My main requirements are that it remains free and open source.