import { useEffect, useState, useRef} from "react";

export const MyHooks = () => {
    const [count, setCount] = useState(() => 0)
    const inputRef = useRef<HTMLInputElement>(null)
    const isMounted = useRef(false)

    const handleAdd = () => {
        setCount((c) => c + 1);
    };

    useEffect(() => {
        console.log("count changed ======", count)
        document.title = `You clicked ${count} times`
        console.log("inputRef=", inputRef.current?.value)
        console.log("isMounted=", isMounted.current)
    }, [count]);

    useEffect(() => {
        console.log("inital  ====== ")

        isMounted.current = true

        return () => {
            console.log("cleanup  ====== ")
        };  
    }, []);

    useEffect(() => {
        console.log("updated ====== ")
    });

    return (
       
        <div>
            <p>You clicked {count} times</p>
            <button onClick={handleAdd}>Click me</button>
            <br />
            <input ref={inputRef} type="text" />
        </div>
    );
}