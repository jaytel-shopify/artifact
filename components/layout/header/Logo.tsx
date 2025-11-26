import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      aria-label="Home"
    >
      <img
        src="/favicons/icon-256.png"
        alt="Artifact"
        className="w-8 h-8"
        style={{ imageRendering: "crisp-edges" }}
      />
    </Link>
  );
}
