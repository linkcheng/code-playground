import { useState } from "react";

export const MyList = () => {
    const [list, setList] = useState<number[]>([]);

    return (
       
        <div style={{ textAlign: 'center' }}>
            { list.map((item) => item %2 ===0 ? <div key={item}>{ item }</div> : null) }
        
            <button onClick={() => { setList([...list, list.length + 1])}} style={{ width: 100 }}>点我</button>
        </div>
    );
}