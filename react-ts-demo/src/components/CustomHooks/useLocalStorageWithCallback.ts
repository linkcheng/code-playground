import { useCallback, useState } from "react"

export const useLocalStorageWithCallback = <T>(key: string, defaultValue: T) => {
    const [state, setState] = useState<T>(() => {
        const storeValue = localStorage.getItem(key)
        return storeValue !== null ? JSON.parse(storeValue) : defaultValue
    })

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            setState((prev) => {
                const newValue = value instanceof Function ? value(prev) : value
                localStorage.setItem(key, JSON.stringify(newValue))
                return newValue
            })
        },
        [key]
    )

    return [state, setValue] as const
}
