import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "primary" | "accent" | "warning";
}

const variantStyles = {
  default: "border-border/50 bg-card",
  primary: "border-primary/20 bg-primary/5 glow-primary",
  accent: "border-accent/20 bg-accent/5 glow-accent",
  warning: "border-warning/20 bg-warning/5",
};

const iconVariants = {
  default: "bg-secondary text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-streak",
};

export function StatCard({ icon: Icon, label, value, subtitle, variant = "default" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-5 ${variantStyles[variant]}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${iconVariants[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
}
