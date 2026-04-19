import { HomePage } from "@/pages/HomePage"
import { BoardPage } from "@/pages/BoardPage"
import { createBrowserRouter } from "react-router"

const routes = [
    {
        path: "/",
        element: <HomePage />
    }, {
        path: "/board",
        element: <BoardPage />
    }
]

export const router = createBrowserRouter(routes)
