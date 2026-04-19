import { Board } from "@/components/Board"
import { Button } from "@/components/ui/button"
import { useKanban } from "@/stores/useKanban"

export const BoardPage = () => {
    const { cards, addCard } = useKanban()
    
    const handleAddCard = () => {
        addCard({
            id: `${cards.length + 1}`,
            name: "New Card",
            tasks: []
        })
    }
    return (
        <div>
            <Board />
            <Button onClick={handleAddCard}>
                Add Card
            </Button>
       </div>
    )
}
