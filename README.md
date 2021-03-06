# Nick's ExaPunks Meta-Language and Compiler

As an example:

```text
link 800
#AUTH=[8,0,3,2,7,1,0,4,9,5,1,2,5,2,6]
m=0
loop a{
    m=#TRAK
    link 800
    make
    dowf {
        x = m
        f = x
        t=x=9999
    }
    link -1
}
```

Compiles to:

```text
LINK 800
COPY 8 #AUTH
COPY 0 #AUTH
COPY 3 #AUTH
COPY 2 #AUTH
COPY 7 #AUTH
COPY 1 #AUTH
COPY 0 #AUTH
COPY 4 #AUTH
COPY 9 #AUTH
COPY 5 #AUTH
COPY 1 #AUTH
COPY 2 #AUTH
COPY 5 #AUTH
COPY 2 #AUTH
COPY 6 #AUTH
COPY 0 M
MARK __a
COPY #TRAK M
LINK 800
MAKE
MARK __dowf1
COPY M X
COPY X F
TEST X = 9999
FJMP __dowf1
LINK -1
JUMP __a
MARK __a_EXIT
```

## Key Words

Note:

- Examples are shown in single line for brevity.
- `;` are optional when carriage returns separate statements)
- does not include `@rep` macros
- does not include extensions such as `GX`, `GY` and `wait` yet.

| kwd   | eg                                                     | desc                                                                                                                                                  |
| ----- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| #XXXX | `x=#NERV;`                                             | hardware register                                                                                                                                     |
| f     | `x=f;` or `f=x;`                                       | file register                                                                                                                                         |
| m     | `t=m+1;`                                               | transfer register                                                                                                                                     |
| t     | `t=x/2;`                                               | test register. Only assignments to t can use comparison opperators `t=1<2`.                                                                           |
| x     | `x++;`                                                 | general register                                                                                                                                      |
|       |                                                        |                                                                                                                                                       |
| EOF   | `t=EOF`                                                | test if at end of file. can only be assigned to `t`                                                                                                   |
| MRD   | `t=MRD`                                                | test if transfer register can be read without pausing. can only be assigned to `t`                                                                    |
| HOST  | `x=HOST;`                                              | HOST name can be assigned to any register                                                                                                             |
| HOST  | `x=HOST;`                                              | FID held file id. can be assigned to any register                                                                                                     |
|       |                                                        |                                                                                                                                                       |
| loop  | `loop{x++};` or `loop my_loop0 {...; exit my_loop_0;}` | loop block forever                                                                                                                                    |
| dowf  | `t=0;dowf{link800;t=m}` or `dowf my_label{}`           | loop while t=0  (First pass always runs)                                                                                                              |
| dowt  | `t=5;dowt{f=t;t--;}`                                   | loop while t<>0  (First pass always runs)                                                                                                             |
|       |                                                        |                                                                                                                                                       |
| mark  | `mark my_marker;`                                      | create label                                                                                                                                          |
| XX{}  | `iftt AA{...}` or `loop BB{...}` or `iftf{}else CC{}`  | Any block can have a label added before it. This allows you to use `jump` to get to the start of the block and `exit` to jump to the end of the block |
|       |                                                        |                                                                                                                                                       |
| jump  | `jump my_loop4;`                                       | jump                                                                                                                                                  |
| exit  | `exit my_loop1;`                                       | exit a labeled block (Can also be called outside the block to jump to after the end of the block)                                                     |
| jmpf  | `jmpf my_loop2;`                                       | jump if t=0                                                                                                                                           |
| jmpt  | `jmpt my_loop3;`                                       | jump if t<>0                                                                                                                                          |
| iftf  | `iftf{x=m;}`                                           | if t=0 execute block                                                                                                                                  |
| iftt  | `iftt{x=m;}`                                           | if t<>0 execute block                                                                                                                                 |
| else  | `iftt{x=m;}else{x=t}`                                  | else can be combined with `iftf` or `iftt` blocks                                                                                                     |
|       |                                                        |                                                                                                                                                       |
| halt  | `halt;`                                                | HALT                                                                                                                                                  |
| kill  | `kill;`                                                | KILL                                                                                                                                                  |
| link  | `link 800`                                             | Traverse network                                                                                                                                      |
|       |                                                        |                                                                                                                                                       |
| make  | `make;`                                                | make file                                                                                                                                             |
| grab  | `grab 200;`                                            | GRAB                                                                                                                                                  |
| drop  | `drop;`                                                | drop file                                                                                                                                             |
| delf  | `delf;`                                                | delete value at file cursor                                                                                                                           |
|       |                                                        |                                                                                                                                                       |
| mode  | `mode;`                                                | toggle global local M                                                                                                                                 |
| noop  | `noop;`                                                | No Operation                                                                                                                                          |
| repl  | `repl my_marker;`                                      | Replicate and jump to label                                                                                                                           |
| seek  | `seek -4;`                                             | Seek file cursor                                                                                                                                      |
| skim  | `skim;`                                                | Read and discard one value from the transfer register                                                                                                 |
| wipe  | `wipe;`                                                | Wipe a file                                                                                                                                           |
|       |                                                        |                                                                                                                                                       |
| rand  | `x=rand(0,10)`                                         | Random number between 2 integers, including the first, excluding the last.                                                                            |
|       |                                                        |                                                                                                                                                       |
| //    | `// this is a comment`                                 | Comments must appear on their own line or after a semicolon                                                                                           |
