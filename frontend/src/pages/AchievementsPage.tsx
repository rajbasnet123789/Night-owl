import { motion } from "framer-motion";
import { Flame, Trophy, Star, Zap, Target, Award, Crown, Medal } from "lucide-react";

const achievements = [
  { icon: Flame, label: "7-Day Streak", desc: "Complete tasks 7 days in a row", earned: true, color: "text-streak" },
  { icon: Trophy, label: "Century", desc: "Complete 100 tasks total", earned: true, color: "text-primary" },
  { icon: Star, label: "Perfect Score", desc: "Score 100% on an assessment", earned: true, color: "text-accent" },
  { icon: Zap, label: "Speed Demon", desc: "Finish assessment in <50% time", earned: false, color: "text-info" },
  { icon: Target, label: "Sharpshooter", desc: "Get 10 interviews perfect", earned: false, color: "text-primary" },
  { icon: Award, label: "Scholar", desc: "Pass 20 academic tests", earned: false, color: "text-accent" },
  { icon: Crown, label: "Champion", desc: "Reach #1 on leaderboard", earned: false, color: "text-streak" },
  { icon: Medal, label: "30-Day Streak", desc: "Complete tasks 30 days in a row", earned: false, color: "text-info" },
];

export default function AchievementsPage() {
  const earned = achievements.filter((a) => a.earned).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground mt-1">{earned}/{achievements.length} badges earned</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border border-border/50 bg-card p-5 text-center ${
              !a.earned ? "opacity-40" : ""
            }`}
          >
            <a.icon className={`h-8 w-8 mx-auto mb-3 ${a.color}`} />
            <p className="text-sm font-semibold text-foreground">{a.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
            {a.earned && (
              <span className="text-xs text-primary mt-2 inline-block">✓ Earned</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
