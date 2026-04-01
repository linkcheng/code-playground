class Animal {
  public _name: string;
  protected a: any;
  private b: string;
  constructor(name: string) {                                                                   
    this._name = name;            // 内部赋值给 _name                                           
  }  
  get name(): string {
   return this._name;
  }
  set name(value: string) {
    console.log('setter: ' + value);
    this._name = value;
  }
  sayhi() {
    return `my name is ${this.name}`;
  }
}

class Cat extends Animal {
  constructor(name: string) {
    super(name)
  }
  sayhi() {
    return "meow " + super.sayhi()
  }
  static iaAnimal(a) {
    return a instanceof Animal;
  }
}

function gen<T extends Animal>(name: T): void {
  console.log(name.name)
}