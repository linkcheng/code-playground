import { useCallback, useMemo, useState } from "react"

export const MyMemo = () => {
    const [count, setCount] = useState(0)
    const doubleInfo = useMemo(() => ({ info: count * 2 }), [count])
    // const handleAdd = () => {
    //     setCount((c) => c + 1)
    //     console.log("============handleAdd=========")
    // }

    const handleClick = useCallback(() => {
        setCount((c) => c + 1)
        console.log("============handleClick=========")
    }, [])

    return (
        <div>
            <p>count: {count}</p>
            <p>double: {doubleInfo.info}</p>
            <button onClick={ handleClick } > 点我操作 </button>
        </div>
    )
}