import { useCallback, useState } from "react"

export const useAsync = <T>(asyncFunction: ()=>Promise<T>) => {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    
    const execute = useCallback(() => {
        setLoading(true)
        setData(null)
        setError(null)

        return asyncFunction()
            .then((response) => {
                setData(response)
                setLoading(false)
            })
            .catch((error) => {
                setError(error)
                setLoading(false)
            })
    }, [asyncFunction])

    return {execute, loading, data, error}  
}