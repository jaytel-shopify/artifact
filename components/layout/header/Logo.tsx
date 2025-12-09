"use client";

import Link from "@/components/ui/TransitionLink";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import LottieLogo from "@/public/lottie/logo.json";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { LottieMethods } from "@/types";

const Logo = forwardRef<LottieMethods>(function Logo(_, ref) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  useImperativeHandle(ref, () => ({
    playSegments: (segments, forceFlag = true) =>
      lottieRef.current?.playSegments(segments, forceFlag),
  }));

  return (
    <Link
      href="/"
      aria-label="Home"
      className="-m-2"
      onMouseEnter={() => {
        if (lottieRef.current?.animationItem?.isPaused) {
          lottieRef.current?.playSegments([0, 100]);
        }
      }}
      onMouseLeave={() => {
        lottieRef.current?.playSegments([100, 211]);
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={LottieLogo}
        loop={false}
        className="lottie-light-dark h-14 w-14 fill-text-primary"
      />
    </Link>
  );
});

export default Logo;
