import { useNavigate } from "react-router-dom";
import { CheckSquare, MessageSquare, FileText, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { icon: CheckSquare, label: "Add Task", path: "/todo", color: "bg-primary/10 text-primary hover:bg-primary/20" },
  { icon: MessageSquare, label: "Start Interview", path: "/interview", color: "bg-accent/10 text-accent hover:bg-accent/20" },
  { icon: FileText, label: "Take Assessment", path: "/assessments", color: "bg-info/10 text-info hover:bg-info/20" },
  { icon: BarChart3, label: "View Progress", path: "/progress", color: "bg-streak/10 text-streak hover:bg-streak/20" },
];

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((a, i) => (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => navigate(a.path)}
          className={`flex flex-col items-center gap-2 rounded-xl p-5 border border-border/50 transition-all cursor-pointer ${a.color}`}
        >
          <a.icon className="h-6 w-6" />
          <span className="text-sm font-medium">{a.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
