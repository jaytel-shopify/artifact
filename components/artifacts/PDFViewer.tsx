"use client";

export default function PDFViewer({ src }: { src: string }) {
  return (
    <iframe
      src={`${src}#toolbar=0&navpanes=0`}
      className="w-full h-auto"
      allow="fullscreen"
    />
  );
}
