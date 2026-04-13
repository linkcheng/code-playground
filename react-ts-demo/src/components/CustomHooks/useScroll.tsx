import { useEffect, useState } from "react"

const getPosition = () => {
    return {
        x: window.scrollX,
        y: window.scrollY
    }
}

export const useScroll = () => {
    const [position, setPosition] = useState(getPosition())
    useEffect(() => { 
        const handler = () => {
            setPosition(getPosition())
        }
        document.addEventListener("scroll", handler)
        return () => {
            document.removeEventListener("scroll", handler)
        }
    }, [])
    return position
}