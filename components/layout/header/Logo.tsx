import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity rounded-lg overflow-hidden"
      aria-label="Home"
    >
      <img
        src="/favicons/icon-256.png"
        alt="Artifact"
        className="w-[35px] h-[35px]"
        style={{ imageRendering: "crisp-edges" }}
      />
    </Link>
  );
}
