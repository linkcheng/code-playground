import { useDroppable } from '@dnd-kit/core';
import { useKanban } from '@/stores/useKanban';
import { type CardProps } from '@/types/Board';

import { Button } from '../ui/button';
import { BoardTask } from './Task';

export const BoardCard = ({ card }: { card: CardProps }) => {
  const { addTaskToCard } = useKanban();
  const { setNodeRef, isOver } = useDroppable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      key={card.id}
      className={`flex flex-col rounded-lg shadow-md ${isOver ? 'bg-green-100' : 'bg-blue-50'}`}
    >
      <div className="w-65">
        <div className="flex flex-col gap-1 p-1">
          <div className="w-fit bg-blue-200 rounded-full px-2 py-1 ">
            {card.name}
          </div>
          <div>
            {card.tasks.map((task) => (
              <BoardTask key={task.id} task={task} cardId={card.id} />
            ))}
          </div>
        </div>
      </div>
      <Button
        variant={'secondary'}
        className="w-fit mx-2 self-center"
        onClick={() =>
          addTaskToCard(card.id, {
            id: `${card.id}-${card.tasks.length + 1}`,
            title: 'New Task',
          })
        }
      >
        +
      </Button>
    </div>
  );
};
