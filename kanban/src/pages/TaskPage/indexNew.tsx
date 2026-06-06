import { useState, useEffect, useCallback } from 'react';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
} from '@/api/task';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '未完成', value: '未完成' },
  { label: '已完成', value: '已完成' },
] as const;

export const TaskPageNew = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState({ description: '', completionTime: '' });

  const loadTasks = useCallback(async () => {
    const data = await fetchTasks(activeTab || undefined);
    setTasks(data);
  }, [activeTab]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async () => {
    if (!form.description.trim() || !form.completionTime) {
      alert('请填写完整信息');
      return;
    }
    await createTask(form);
    setForm({ description: '', completionTime: '' });
    setShowAddModal(false);
    loadTasks();
  };

  const handleComplete = async (id: number) => {
    await updateTask(id, { status: '已完成' });
    loadTasks();
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    await deleteTask(deleteTarget);
    setDeleteTarget(null);
    loadTasks();
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 border-b pb24">
        <h2 className="text-2xl font-bold">TASK OA 任务管理系统</h2>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => setShowAddModal(true)}
        >
          新增任务
        </Button>
      </div>

      {/* 任务列表 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>编号</TableHead>
            <TableHead>任务描述</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>完成时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.id}</TableCell>
              <TableCell>{task.description}</TableCell>
              <TableCell>
                <span
                  className={
                    task.status === '已完成'
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }
                >
                  {task.status}
                </span>
              </TableCell>
              <TableCell className="text-gray-500">
                {task.completionTime ?? '-'}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => setDeleteTarget(task.id)}
                >
                  删除
                </Button>
                {task.status === '未完成' && (
                  <Button
                    variant="link"
                    size="xs"
                    onClick={() => handleComplete(task.id)}
                  >
                    完成
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                暂无任务
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 新增任务弹窗 */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增任务</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              任务描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full border rounded p-2 text-sm h-24 resize-none"
              placeholder="请输入任务描述"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              任务预期完成时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.completionTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, completionTime: e.target.value }))
              }
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleAdd}>提交信息</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除此任务吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
