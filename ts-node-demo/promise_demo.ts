import * as fs from 'fs';
import { promises as fsa } from 'fs';
import { promisify } from 'util';


function fileOperator() {

  fs.writeFile('example.txt', 'Hello, ', 'utf8', (error: any) => {
    if (error) {
      console.error(error);
    } else {
      console.log('write "Hello, " successfully.');
    }
  });

  // 使用Promise风格的函数写入文件内容
  fsa.appendFile('example.txt', ' world!', 'utf8')
    .then(() => {
      console.log('append "world!" successfully.');
    })
    .catch(error => {
      console.error(error);
    });
  
    // 使用Promise风格的函数读取文件内容
  fsa.readFile('example.txt', 'utf8')
    .then(data => {
      console.log(`first read file ${data}`);
    })
    .catch(error => {
      console.error(error);
    });
  
  
  // 使用promisify方法将fs.readFile函数转换为Promise风格的函数
  // const readFileAsync = promisify(fs.readFile);

  // // 使用Promise风格的函数读取文件内容
  // readFileAsync('example.txt', 'utf8')
  //   .then(data => {
  //     console.log(`second read file ${data}`);
  //   })  
  //   .catch(error => {
  //     console.error(error);
  //   });

}

function promiseOperator() {

  // 创建一个Promise对象
  const promise = new Promise((resolve, reject) => {
    // 模拟异步操作
    setTimeout(() => {
      const randomNumber = Math.random();
      if (randomNumber > 0.2) {
        // 异步操作成功，将Promise状态从pending转为fulfilled，并返回结果
        resolve(randomNumber);
      } else {
        // 异步操作失败，将Promise状态从pending转为rejected，并返回错误信息
        reject(new Error('Random number is less than 0.5'));
      }
    }, 1000);
  });

  // 使用then方法指定Promise状态变为fulfilled时的回调函数
  promise.then(result => {
    console.log('Promise fulfilled:', result);
  }).catch(error => {
    console.error('Promise rejected:', error);
  });

}

async function main() {
  console.dir("hi async function");
  try {
    await fn();
  } catch (error) {
    console.error(error);
  }
}

function fn() {
  return new Promise(function (resolve, reject) {
    console.log("hi promise");
    resolve(0);
  })
}


fileOperator();
promiseOperator();
main();