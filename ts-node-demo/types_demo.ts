interface Person {
  name: string;
  age: number;
}

const sem: Person = { name: 'semlinker', age: 30 };
type Sem = typeof sem;// -> Person

const s: Sem = { name: 's', age: 20 };

console.log(`typeof sem ${typeof sem}`);

function toArray(x: number): Array<number> {
  return [x];
}

type Func = typeof toArray;// -> (x: number) => number[]
console.log(`typeof toArray ${typeof toArray}`);


type K1 = keyof Person;// "name" | "age"
type K2 = keyof Person[];// "length" | "toString" | "pop" | "push" | "concat" | "join"
type K3 = keyof { [x: string]: Person };// string | number
console.log(Object.keys(sem))                                              


type Keys = "a" | "b" | "c"

type Obj =  {
  [p in Keys]: any
}// -> { a: any, b: any, c: any }

const obj: Obj = { a: 1, b: 2, c: 3 };
console.log(obj)                                              


type T0 = string[];
type T1 = number[];

type UnpackedArray<T> = T extends (infer U)[] ? U : T
type U0 = UnpackedArray<T1> // number

let a: U0 = 1


interface ILengthwise {
  length: number;
}

function loggingIdentity<T extends ILengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

function merger() {

    type X = {
    a: number;
    b: number;
    };

    type Y = {
    c: number;
    };

    type Z = X & Y;

    const x: X = { a: 1, b: 2 };
    const y: Y = { c: 3 };
    const z: Z = { a: 1, b: 2, c: 3 };
}

function pick() {
    type X = {
        a: number;
        b: number;
        c: number;
        d: number;
    };

    type Y = Pick<X, "b" | "c">;

    const y: Y = { b: 1, c: 3 };

}

function emit() {
    type X = {
        a: number;
        b: number;
        c: number;
    };

    type Y = Omit<X, "b">;

    const y: Y = { a: 1, c: 3 };
}