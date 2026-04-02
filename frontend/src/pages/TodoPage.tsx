import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Priority = "high" | "medium" | "low";
type FilterType = "all" | "completed" | "pending";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
}

const priorityColors: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-streak border-warning/20",
  low: "bg-primary/10 text-primary border-primary/20",
};

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Complete React assessment", completed: false, priority: "high" },
    { id: "2", text: "Review AI interview feedback", completed: true, priority: "medium" },
    { id: "3", text: "Practice coding problems", completed: false, priority: "low" },
  ]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<FilterType>("all");

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: input.trim(), completed: false, priority }]);
    setInput("");
  };

  const toggleTodo = (id: string) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const deleteTodo = (id: string) => setTodos(todos.filter((t) => t.id !== id));

  const filtered = todos.filter((t) =>
    filter === "all" ? true : filter === "completed" ? t.completed : !t.completed
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">To-Do List</h1>
        <p className="text-muted-foreground mt-1">Manage your daily tasks</p>
      </motion.div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          className="bg-card border-border/50"
        />
        <div className="flex gap-1">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={priority === p ? "default" : "outline"}
              onClick={() => setPriority(p)}
              className="text-xs capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
        <Button onClick={addTodo} className="gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "completed", "pending"] as FilterType[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            onClick={() => setFilter(f)}
            className="capitalize text-xs"
          >
            <Filter className="h-3 w-3 mr-1" /> {f}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((todo) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
            >
              <button onClick={() => toggleTodo(todo.id)}>
                {todo.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <span className={`flex-1 text-sm ${todo.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {todo.text}
              </span>
              <Badge variant="outline" className={priorityColors[todo.priority]}>
                {todo.priority}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
