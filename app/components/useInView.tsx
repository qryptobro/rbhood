"use client";
import { useRef } from "react";
import { useInView as useFramerInView } from "framer-motion";

export function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useFramerInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}
