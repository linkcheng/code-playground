
function MyButton() {
  return (
    <button>我是一个按钮</button>
  );
}


export default function MyCom() {
  return (
    <div>
      <h1>欢迎来到我的应用</h1>
      <MyButton />
    </div>
  );
}