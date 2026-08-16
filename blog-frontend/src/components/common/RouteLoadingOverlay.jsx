import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function RouteLoadingOverlay({ active }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="route-loading"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/80 px-6 py-5 shadow-lg"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full border-4 border-border border-t-primary animate-spin" />
              <div className="leading-tight">
                <div className="font-heading italic text-lg text-foreground">
                  Thera Derma
                </div>
                <div className="text-xs text-muted-foreground">
                  Đang tải nội dung…
                </div>
              </div>
            </div>
            <div className="h-1.5 w-56 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full w-24 rounded-full bg-primary/70"
                initial={{ x: -80, opacity: 0.6 }}
                animate={{ x: 240, opacity: 1 }}
                transition={{
                  duration: 0.9,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

