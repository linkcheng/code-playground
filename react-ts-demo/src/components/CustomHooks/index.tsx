import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { useScroll } from "./useScroll"

export const CustomHooks = () => {
    const [count, setCount] = useLocalStorage("count", 0)
    return (
        <div>
            <h1>自定义 Hook</h1>
            <p>Count: {count}</p>
            <button onClick={() => setCount((c) => c+1)}>+</button>
            <button onClick={() => setCount((c) => c-1)}>-</button>
        </div>
    )
}

export const ScrollTop = () => {
    const { x, y } = useScroll()
    console.log(`scroll x=${x} y=${y}`)

    const goTop = useCallback(() => {
        window.scrollTo(0, 0)
    }, [])

    const style = {
        position: "fixed",
        right: "10px",
        bottom: "10px",
    } as const

    if (y > 100) {
        return (<button onClick={goTop} style={style} >Back to Top</button>)
    }
    return null
}