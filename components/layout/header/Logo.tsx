"use client";

import Link from "@/components/ui/TransitionLink";
import Lottie from "lottie-react";
import LottieLogo from "@/public/lottie/logo.json";

export default function Logo() {
  return (
    <Link href="/" aria-label="Home" className="-m-2">
      {/* <svg
        viewBox="0 0 37 37"
        fill="none"
        className="fill-text-primary h-8 w-8"
      >
        <path d="M14.6104 1.45215C15.7554 0.650492 17.3339 0.928293 18.1357 2.07324L35.8809 27.416C36.6827 28.5611 36.4039 30.1396 35.2588 30.9414L28.3477 35.7812C27.2025 36.5831 25.6241 36.3043 24.8223 35.1592L7.07715 9.81738C6.27538 8.67234 6.55335 7.0939 7.69824 6.29199L14.6104 1.45215ZM7.875 20.25C12.2241 20.25 15.7498 23.7759 15.75 28.125C15.75 32.4742 12.2242 36 7.875 36C3.52576 36 0 32.4742 0 28.125C0.000197912 23.7759 3.52588 20.25 7.875 20.25Z" />
      </svg> */}
      <Lottie animationData={LottieLogo} loop={false} className="h-14 w-14" />
    </Link>
  );
}
