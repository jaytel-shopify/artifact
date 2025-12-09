"use client";

import Link from "@/components/ui/TransitionLink";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import LottieLogo from "@/public/lottie/logo.json";
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface LogoRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  goToAndPlay: (frame: number, isFrame?: boolean) => void;
  goToAndStop: (frame: number, isFrame?: boolean) => void;
  playSegments: (
    segments: [number, number] | [number, number][],
    forceFlag?: boolean
  ) => void;
  setSpeed: (speed: number) => void;
  setDirection: (direction: 1 | -1) => void;
  getDuration: (inFrames?: boolean) => number | undefined;
  getLottie: () => LottieRefCurrentProps | null;
}

const Logo = forwardRef<LogoRef>(function Logo(_, ref) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  console.log("lottieRef", lottieRef);

  useImperativeHandle(ref, () => ({
    play: () => lottieRef.current?.play(),
    pause: () => lottieRef.current?.pause(),
    stop: () => lottieRef.current?.stop(),
    goToAndPlay: (frame, isFrame = true) =>
      lottieRef.current?.goToAndPlay(frame, isFrame),
    goToAndStop: (frame, isFrame = true) =>
      lottieRef.current?.goToAndStop(frame, isFrame),
    playSegments: (segments, forceFlag = true) =>
      lottieRef.current?.playSegments(segments, forceFlag),
    setSpeed: (speed) => lottieRef.current?.setSpeed(speed),
    setDirection: (direction) => lottieRef.current?.setDirection(direction),
    getDuration: (inFrames) => lottieRef.current?.getDuration(inFrames),
    getLottie: () => lottieRef.current,
  }));

  return (
    <Link
      href="/"
      aria-label="Home"
      className="-m-2"
      onMouseEnter={() => {
        lottieRef.current?.playSegments([0, 105]);
      }}
      onMouseLeave={() => {
        lottieRef.current?.playSegments([105, 211]);
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={LottieLogo}
        loop={false}
        className="lottie h-14 w-14 fill-text-primary"
      />
    </Link>
  );
});

export default Logo;
