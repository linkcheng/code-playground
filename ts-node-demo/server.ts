import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "tasks.jsonl");

interface Task {
  id: number;
  description: string;
  status: "已完成" | "未完成";
  completionTime: string | null;
}

function readTasks(): Task[] {
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]): void {
  const content = tasks.map((t) => JSON.stringify(t)).join("\n") + "\n";
  fs.writeFileSync(DATA_FILE, content);
}

function appendTask(task: Task): void {
  fs.appendFileSync(DATA_FILE, JSON.stringify(task) + "\n");
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use((req, res, next) => {
  const time = new Date().toLocaleString("zh-CN", { hour12: false });
  const params = Object.keys(req.query).length > 0 ? ` query=${JSON.stringify(req.query)}` : "";
  const body = req.body && Object.keys(req.body).length > 0 ? ` body=${JSON.stringify(req.body)}` : "";
  console.log(`[${time}] ${req.method} ${req.url}${params}${body}`);
  next();
});

// 获取任务列表（支持 status 筛选）
app.get("/api/tasks", (req, res) => {
  const tasks = readTasks();
  const { status } = req.query;
  if (status) {
    return res.json(tasks.filter((t) => t.status === status));
  }
  res.json(tasks);
});

// 新增任务
app.post("/api/tasks", (req, res) => {
  const { description, completionTime } = req.body;
  if (!description || !completionTime) {
    return res.status(400).json({ error: "description 和 completionTime 为必填项" });
  }

  const tasks = readTasks();
  const id = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
  const task: Task = {
    id,
    description,
    status: "未完成",
    completionTime,
  };

  appendTask(task);
  res.status(201).json(task);
});

// 更新任务（标记完成）
app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "任务不存在" });
  }

  if (req.body.status) {
    task.status = req.body.status;
  }
  if (req.body.description) {
    task.description = req.body.description;
  }

  writeTasks(tasks);
  res.json(task);
});

// 删除任务
app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "任务不存在" });
  }

  const [deleted] = tasks.splice(index, 1);
  writeTasks(tasks);
  res.json(deleted);
});

app.listen(9000, () => {
  console.log("Server running at http://localhost:9000");
});
