import { Home } from "@/pages/Home"
import { Board } from "@/pages/Board"
import { createBrowserRouter } from "react-router"

const routes = [
    {
        path: "/",
        element: <Home />
    }, {
        path: "/board",
        element: <Board />
    }
]

export const router = createBrowserRouter(routes)
