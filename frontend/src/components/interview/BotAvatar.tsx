import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { AudioWaveBar } from "./AudioWaveBar";

export function BotAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={speaking ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
      >
        <MessageSquare className="h-8 w-8 text-primary" />
      </motion.div>
      {speaking && (
        <div className="flex gap-1 items-end h-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <AudioWaveBar key={i} delay={i * 0.1} />
          ))}
        </div>
      )}
      <span className="text-xs text-muted-foreground">
        {speaking ? "Speaking..." : "Waiting..."}
      </span>
    </div>
  );
}
