import { create } from "zustand";

interface Board {
    id: string;
    name: string;
}

export const useKanban = create<{
    boards: Board[];
    addBoard: (board: Board) => void;
}>((set) => ({
    boards: [],
    addBoard: (board) => set((state) => ({ boards: [...state.boards, board] })),
}))