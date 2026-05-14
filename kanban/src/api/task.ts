const API_BASE = 'http://localhost:9000/api';

export interface Task {
  id: number;
  description: string;
  status: '已完成' | '未完成';
  completionTime: string | null;
}

export async function fetchTasks(status?: string): Promise<Task[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE}/tasks${params}`);
  return res.json();
}

export async function createTask(data: {
  description: string;
  completionTime: string;
}): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTask(
  id: number,
  data: Partial<Pick<Task, 'status' | 'description'>>,
): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTask(id: number): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
  return res.json();
}
