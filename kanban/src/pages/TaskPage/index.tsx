import { useState, useEffect, useCallback } from 'react';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
} from '@/api/task';

const STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '未完成', value: '未完成' },
  { label: '已完成', value: '已完成' },
] as const;

export const TaskPage = () => {
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
        <h1 className="text-2xl font-bold">TASK OA 任务管理系统</h1>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded text-sm ${
              activeTab === tab.value
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
        >
          新增任务
        </button>
      </div>

      {/* 任务列表 */}
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 text-sm font-medium text-gray-600">
              编号
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">
              任务描述
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">
              状态
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">
              完成
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-600">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b">
              <td className="p-3 text-sm">{task.id}</td>
              <td className="p-3 text-sm">{task.description}</td>
              <td className="p-3 text-sm">
                <span
                  className={
                    task.status === '已完成'
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }
                >
                  {task.status}
                </span>
              </td>
              <td className="p-3 text-sm text-gray-500">
                {task.completionTime ?? '-'}
              </td>
              <td className="p-3 text-sm space-x-2">
                <button
                  onClick={() => setDeleteTarget(task.id)}
                  className="text-blue-500 hover:underline"
                >
                  删除
                </button>
                {task.status === '未完成' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="text-blue-500 hover:underline"
                  >
                    完成
                  </button>
                )}
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-gray-400 text-sm">
                暂无任务
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 新增任务弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-lg font-bold mb-4">新增任务</h2>
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
            <div className="mb-6">
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
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                提交信息
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="mb-6">您确定要删除此任务吗？</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
