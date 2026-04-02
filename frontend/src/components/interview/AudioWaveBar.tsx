import { motion } from "framer-motion";

export function AudioWaveBar({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-1 bg-primary rounded-full"
      animate={{ height: [8, 24, 8] }}
      transition={{ duration: 0.6, repeat: Infinity, delay }}
    />
  );
}
