"use client";

import { useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import LottieLoad from "@/public/lottie/load.json";
import { cn } from "@/lib/utils";

interface LoadingLottieProps {
  className?: string;
}

export function LoadingLottie({ className }: LoadingLottieProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={LottieLoad}
      loop={false}
      className={cn("lottie-light-dark h-18 w-18", className)}
      onComplete={() => {
        lottieRef.current?.playSegments([105, 285], true);
      }}
      onLoopComplete={() => {
        lottieRef.current?.playSegments([105, 285], true);
      }}
    />
  );
}
