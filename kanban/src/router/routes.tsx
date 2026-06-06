import { HomePage } from "@/pages/HomePage"
import { BoardPage } from "@/pages/BoardPage"
import { TaskPage } from "@/pages/TaskPage"
import { TaskPageNew } from "@/pages/TaskPage/indexNew"
import type { ReactNode } from "react"

type RouteConfig = {
    path: string
    label: string
    element: ReactNode
}

export const routes: RouteConfig[] = [
    { path: "/", label: "首页", element: <HomePage /> },
    { path: "/board", label: "看板", element: <BoardPage /> },
    { path: "/task", label: "任务", element: <TaskPage /> },
    { path: "/taskNew", label: "任务(New)", element: <TaskPageNew /> },
]
