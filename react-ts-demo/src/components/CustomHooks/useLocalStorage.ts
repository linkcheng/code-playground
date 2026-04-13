import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

export const useLocalStorage = <T>(key: string, defaultValue: T):[T, Dispatch<SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        const storeValue = localStorage.getItem(key)
        return storeValue !== null ? JSON.parse(storeValue) : defaultValue
    })

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state))
    }, [key, state])

    return [state, setState]
}