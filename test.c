#include "stdio.h"

#define func(name, ...) (*name)(__VA_ARGS__)
#define interface(name, block) typedef struct block name;
#define implements(interface) interface __##interface
#define impl_method(typ, intrf, func_name) __##typ##__##intrf##__##func_name
#define impl(typ, name, intrf, prop) name.__##intrf.prop = __##typ##__##intrf##__##prop
#define invoke(intrf, prop, ...) __##intrf.prop(__VA_ARGS__)

interface(IWriter, {
    void func(write, char *msg);
});

interface(IReader, {
    char *func(read);
});

typedef struct
{
    implements(IReader);
    implements(IWriter);
} Console;

char *impl_method(Console, IReader, read)()
{
    return "hello";
}

void impl_method(Console, IWriter, write)(char *msg)
{
    printf("%s\n", msg);
}

int main()
{
    Console console;
    impl(Console, console, IReader, read);
    impl(Console, console, IWriter, write);

    char out[50];
    char *input = console.invoke(IReader, read);
    sprintf(out, "%s world!", input);

    console.invoke(IWriter, write, out);
    return 0;
}