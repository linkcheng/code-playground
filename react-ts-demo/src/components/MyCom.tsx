import { useState } from "react";

interface MyButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function MyButton({ label, onClick, disabled = false }: MyButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// TODO(human): 定义 MyComProps 接口
// 思考：MyCom 作为中间层，需要从 App 接收哪些数据？
// 提示：需要展示计数(count)、处理按钮点击、以及在某种条件下禁用按钮
// type MyComProps = { ... }

interface MyComProps {
  label: string;
  render?: (num: number) => React.ReactNode;
}


export default function MyCom(props: MyComProps) {
  const { label, render } = props;
  const [num, setNum] = useState(0);

  const handleClick = () => {
    setNum(num + 1);
  };
  
  return (
    <div>
      <h1>欢迎来到我的应用</h1>
      <p>当前计数：{num}</p>
      <MyButton 
        label={label} 
        onClick={handleClick}  
        disabled={num > 10}
      />
      { render?.(num) }
    </div>
  );
}
