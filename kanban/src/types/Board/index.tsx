

interface TaskProps {
    id: string;
    title: string;
}
interface CardProps {
    id: string;
    name: string;
    tasks: TaskProps[];
}

export type {
    TaskProps,
    CardProps
}
