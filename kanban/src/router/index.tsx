import { routes } from "./routes"
import { Layout } from "@/components/Layout"
import { createBrowserRouter } from "react-router"

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: routes.map(({ path, element }) => ({ path, element })),
    },
])

export { router }
