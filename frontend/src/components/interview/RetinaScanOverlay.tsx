import { motion } from "framer-motion";
import { ScanEye, ShieldCheck, ShieldX } from "lucide-react";
import { useState, useEffect } from "react";

export function RetinaScanOverlay({
  videoRef,
  onComplete,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onComplete: (success: boolean) => void;
}) {
  const [phase, setPhase] = useState<"scanning" | "result">("scanning");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = Math.random() > 0.15;
      setSuccess(result);
      setPhase("result");
      setTimeout(() => onComplete(result), 1500);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center gap-6 py-10">
      <h2 className="text-xl font-bold text-foreground">Identity Verification</h2>
      <p className="text-sm text-muted-foreground">Position your eye within the scanner</p>

      <div className="relative h-48 w-48 rounded-full border-4 border-primary/30 flex items-center justify-center overflow-hidden">
        <video ref={videoRef} autoPlay muted className="h-full w-full object-cover rounded-full" />
        {phase === "scanning" && (
          <motion.div
            className="absolute inset-0 border-4 border-primary rounded-full"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      <ScanEye className="h-8 w-8 text-primary" />

      {phase === "scanning" && (
        <p className="text-sm text-muted-foreground animate-pulse">Scanning retina...</p>
      )}
      {phase === "result" && (
        <div className="flex flex-col items-center gap-2">
          {success ? (
            <ShieldCheck className="h-10 w-10 text-primary" />
          ) : (
            <ShieldX className="h-10 w-10 text-destructive" />
          )}
          <p className="text-sm font-medium text-foreground">
            {success ? "Verified — Starting Interview" : "Verification Failed"}
          </p>
        </div>
      )}
    </div>
  );
}
