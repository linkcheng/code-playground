import { useState } from "react"
import { Child } from "./Child"
import { ThemeContext } from "./ThemContext"

export const Parent = () => {
    const [theme, setTheme] = useState("light");
    const toggleTheme = () => {
        setTheme((e) => e === "light" ? "dark" : "light" )
    }
    return (
        <div>
            <ThemeContext.Provider value={ { theme, toggleTheme: toggleTheme } }>
                <Child />
                <button onClick={toggleTheme} >切换主题</button>
            </ThemeContext.Provider>
        </div>
    )
}