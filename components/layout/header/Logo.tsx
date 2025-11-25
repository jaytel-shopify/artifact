import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <img
        src="/favicons/icon-256.png"
        alt="Artifact"
        className="w-8 h-8"
        style={{ imageRendering: "crisp-edges" }}
      />
      <h1 className="text-lg font-semibold text-foreground">Artifact</h1>
    </Link>
  );
}
