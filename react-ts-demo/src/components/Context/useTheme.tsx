import { useContext } from "react";
import { ThemeContext } from "./ThemContext"


export const useTheme = () => {
    const { theme } = useContext(ThemeContext)
    return theme
}