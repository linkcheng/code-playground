import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { BoardCard } from '../Board/Card';
import { useKanban } from '@/stores/useKanban';

export const Board = () => {
  const { cards, moveTask } = useKanban();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const { task, cardId: fromCardId } = active.data.current!;
    const toCardId = over.id as string;

    moveTask(task, fromCardId, toCardId);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-row gap-2">
        {cards.map((card) => (
          <BoardCard key={card.id} card={card} />
        ))}
      </div>
    </DndContext>
  );
};
