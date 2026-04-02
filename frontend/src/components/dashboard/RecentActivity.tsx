import { CheckSquare, MessageSquare, FileText, Search } from "lucide-react";

const activities = [
  { icon: CheckSquare, text: "Completed 5 tasks", time: "2h ago", color: "text-primary" },
  { icon: MessageSquare, text: "AI Interview: React Advanced", time: "5h ago", color: "text-accent" },
  { icon: FileText, text: "Assessment: DSA Basics", time: "1d ago", color: "text-info" },
  { icon: Search, text: "Plagiarism check on essay", time: "2d ago", color: "text-streak" },
];

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <a.icon className={`h-4 w-4 ${a.color}`} />
            <div className="flex-1">
              <p className="text-sm text-foreground">{a.text}</p>
              <p className="text-xs text-muted-foreground">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
