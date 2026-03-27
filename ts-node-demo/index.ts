export async function sayHi(name: string): Promise<string>  {
    try {
        const text = await helloworld(name);
        console.log(text);
        return new Promise((resolve, reject) => {
            resolve(text);
        });
    } catch (error) {
        console.error(error);
    }
}

export function helloworld(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
        resolve(`hello ${name}!`);
    });
}
