import { motion } from "framer-motion";
import { Code2, FileText, GraduationCap, Trophy } from "lucide-react";

const categories = [
  { icon: Code2, label: "Technical (Coding)", desc: "DSA, algorithms, system design", count: 15, color: "text-primary bg-primary/10" },
  { icon: FileText, label: "Non-Technical", desc: "Aptitude, reasoning, verbal", count: 12, color: "text-accent bg-accent/10" },
  { icon: GraduationCap, label: "Academic", desc: "School & college exams", count: 20, color: "text-info bg-info/10" },
  { icon: Trophy, label: "Competitive", desc: "Contest-style problems", count: 8, color: "text-streak bg-warning/10" },
];

export default function AssessmentsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Online Assessments</h1>
        <p className="text-muted-foreground mt-1">Choose an assessment category</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border/50 bg-card p-6 cursor-pointer hover:border-primary/30 transition-colors"
          >
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${cat.color}`}>
              <cat.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{cat.label}</h3>
            <p className="text-sm text-muted-foreground mt-1">{cat.desc}</p>
            <p className="text-xs text-primary mt-3">{cat.count} assessments available</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
