import { Button } from "@/components/ui/button"
import { useKanban } from "@/stores/useKanban"

export const Board = () => {
    const { boards, addBoard } = useKanban()
    
    return (
        <div>
            {boards.map((board) => (
                <div key={board.id}>{board.name}</div>
            ))}
            <Button onClick={() => addBoard({ id: `${boards.length + 1}`, name: "New Board" })}>
                Add Board
            </Button>
       </div>
    )
}
