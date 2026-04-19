import { create } from 'zustand';
import { type TaskProps, type CardProps } from '@/types/Board';

export const useKanban = create<{
  cards: CardProps[];
  addCard: (card: CardProps) => void;
  addTaskToCard: (cardId: string, task: TaskProps) => void;
  moveTask: (task: TaskProps, fromCardId: string, toCardId: string) => void;
}>((set) => ({
  cards: [],
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  addTaskToCard: (cardId, task) =>
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId ? { ...card, tasks: [...card.tasks, task] } : card,
      ),
    })),
  moveTask: (task, fromCardId, toCardId) =>
    set((state) => {
      if (fromCardId === toCardId) return state;
      return {
        cards: state.cards.map((card) => {
          if (card.id === fromCardId) {
            return {
              ...card,
              tasks: card.tasks.filter((t) => t.id !== task.id),
            };
          }
          if (card.id === toCardId) {
            return { ...card, tasks: [...card.tasks, task] };
          }
          return card;
        }),
      };
    }),
}));
