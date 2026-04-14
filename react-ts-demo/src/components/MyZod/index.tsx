import z from "zod"

const ResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    success: z.boolean(),
})

type User = z.infer<typeof ResponseSchema>

export const MyZod = () => {

    try {
        ResponseSchema.parse({
            id1: "1",
            name: "hello",
            success: true,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.log("===========",  error.issues)
        }
    }

    const user: User =  ResponseSchema.parse({
            id: "2",
            name: "zod",
            success: true,
    })

    return (
        <div>
            MyZod Demo: {user.name}
        </div>
    )
}