import { motion } from "framer-motion";
import { Flame, Trophy, Star, Zap } from "lucide-react";

const badges = [
  { icon: Flame, label: "7-Day Streak", earned: true, color: "text-streak" },
  { icon: Trophy, label: "100 Tasks Done", earned: true, color: "text-primary" },
  { icon: Star, label: "Top Scorer", earned: false, color: "text-accent" },
  { icon: Zap, label: "Speed Master", earned: false, color: "text-info" },
];

export function StreakBadge() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Badges & Achievements</h3>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border border-border/30 ${
              badge.earned ? "bg-card" : "bg-muted/50 opacity-50"
            }`}
          >
            <badge.icon className={`h-6 w-6 ${badge.color}`} />
            <span className="text-xs text-muted-foreground">{badge.label}</span>
            <span className={`text-xs ${badge.earned ? "text-primary" : "text-muted-foreground"}`}>
              {badge.earned ? "Earned" : "Locked"}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
