import { useContext } from "react"
import { ThemeContext } from "./ThemContext"
import { useTheme } from "./useTheme"

export const GrandChind = () => {

    // const { theme } = useContext(ThemeContext)
    // return (
    //     <div>
    //         GrandChind {theme}
    //     </div>
    // )

    // return (
    //     <ThemeContext.Consumer >
    //         {({theme}) => <div> GrandChind {theme}</div>}
    //     </ThemeContext.Consumer>
    // )
    
    const theme = useTheme()
    return (
        <div>
            GrandChind {theme}
        </div>
    )

}