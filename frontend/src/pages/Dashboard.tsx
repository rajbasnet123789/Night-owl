import { Flame, TrendingUp, CheckCircle2, Target } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Good morning, User 👋</h1>
        <p className="text-muted-foreground mt-1">Here's your productivity overview</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Current Streak" value="7 days" subtitle="Keep it up!" variant="warning" />
        <StatCard icon={TrendingUp} label="Tasks Today" value="12" subtitle="+3 from yesterday" variant="primary" />
        <StatCard icon={CheckCircle2} label="Completed" value="89%" subtitle="This week" variant="accent" />
        <StatCard icon={Target} label="Interview Score" value="72%" subtitle="Last session" />
      </div>

      <QuickActions />

      <div className="grid md:grid-cols-2 gap-4">
        <RecentActivity />
        <StreakBadge />
      </div>
    </div>
  );
}
