import { useDraggable } from '@dnd-kit/core';
import { type TaskProps } from '@/types/Board';

const BoardTask = ({ task, cardId }: { task: TaskProps; cardId: string }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { type: 'task', task, cardId },
  });
  const style: React.CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      key={task.id}
      className="w-full text-left p-2 mb-1 bg-white border-gray-100 rounded-lg"
    >
      {task.title}
    </div>
  );
};

export { type TaskProps, BoardTask };
