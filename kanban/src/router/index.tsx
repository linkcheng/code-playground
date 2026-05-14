import { HomePage } from "@/pages/HomePage"
import { BoardPage } from "@/pages/BoardPage"
import { TaskPage } from "@/pages/TaskPage"
import { createBrowserRouter } from "react-router"

const routes = [
    {
        path: "/",
        element: <HomePage />
    }, {
        path: "/board",
        element: <BoardPage />
    }
    , {
        path: "/task",
        element: <TaskPage />
    }
]

export const router = createBrowserRouter(routes)
