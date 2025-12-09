import React, { useRef, useEffect, useState } from "react";

function ClickToActivateIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_768_4505)">
        <path
          d="M0 8.04557C0 10.9991 1.69365 13.6007 3.96383 14.8499C4.92012 15.3836 5.69018 14.0884 4.69675 13.5116C2.85703 12.4767 1.55426 10.4178 1.55426 8.04557C1.55426 4.5437 4.35045 1.73504 7.85233 1.73504C11.3542 1.73504 14.1705 4.5437 14.1705 8.04557C14.1705 8.55678 14.567 8.84588 14.9756 8.84588C15.3656 8.84588 15.7185 8.55055 15.7185 8.04557C15.7185 3.74016 12.1577 0.187012 7.85233 0.187012C3.55452 0.187012 0 3.74016 0 8.04557Z"
          fill="currentColor"
        />
        <path
          d="M3.20508 8.04416C3.20508 9.72431 4.11954 11.1442 5.18783 11.832C6.04522 12.3986 6.82077 11.2414 6.08372 10.7071C5.22388 10.1306 4.65756 9.15663 4.65756 8.04416C4.65756 6.25848 6.07916 4.83688 7.85236 4.83688C9.62561 4.83688 10.9926 6.25224 11.0597 8.01136C11.0804 8.43796 11.4014 8.72831 11.7925 8.72831C12.1849 8.72831 12.5122 8.42698 12.5122 8.00583C12.5122 5.48918 10.4074 3.3844 7.85236 3.3844C5.30986 3.3844 3.20508 5.48918 3.20508 8.04416Z"
          fill="currentColor"
        />
        <path
          d="M7.62906 13.7368C7.62009 14.0704 8.00568 14.1809 8.22186 13.9654L9.3133 12.8575L10.5277 15.8744C10.5995 16.0463 10.7681 16.1422 10.9515 16.0739L11.7124 15.7764C11.8972 15.7005 11.9313 15.4969 11.8601 15.3428L10.5704 12.3579L12.1294 12.3114C12.4528 12.3106 12.6075 11.9867 12.3774 11.7504L8.25365 7.52678C8.03396 7.30707 7.71199 7.43488 7.70438 7.7465L7.62906 13.7368Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_768_4505">
          <rect width="16" height="16.0959" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

interface CarouselItemWebsiteProps {
  url: string;
  width?: number;
  height?: number;
  isDragging?: boolean;
  fitMode?: boolean;
}

export function CarouselItemWebsite({
  url,
  width = 1920,
  height = 1080,
  isDragging = false,
  fitMode = false,
}: CarouselItemWebsiteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [scale, setScale] = useState(1);
  const [isActivated, setIsActivated] = useState(false);

  // Calculate iframe scale
  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      const { offsetWidth: w, offsetHeight: h } = containerRef.current!;
      const s = fitMode
        ? Math.min(w / width, h / height)
        : Math.max(w / width, h / height) * 1.01;
      setScale(s);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width, height, fitMode]);

  // Click outside to deactivate
  useEffect(() => {
    if (!isActivated) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't deactivate when clicking the expand/collapse button
      if (target.closest('[data-carousel-focus-button="true"]')) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsActivated(false);
      }
    };
    const timer = setTimeout(
      () => document.addEventListener("mousedown", handler),
      100
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [isActivated]);

  // Deactivate when dragging
  useEffect(() => {
    if (isDragging) setIsActivated(false);
  }, [isDragging]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    },
    []
  );

  // Delayed single click - allows double-click to cancel it
  const handleClick = () => {
    if (isDragging) return;
    // Clear any pending click
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    // Delay activation to allow double-click to fire first
    clickTimeoutRef.current = setTimeout(() => setIsActivated(true), 250);
  };

  // Double-click cancels the pending activation (lets collection toggle through)
  const handleDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`carousel-item-content carousel-item-website ${fitMode ? "fit-mode-website" : ""}`}
      style={{
        overflow: "hidden",
        pointerEvents: isDragging ? "none" : "auto",
        display: fitMode ? "flex" : undefined,
        justifyContent: fitMode ? "center" : undefined,
        alignItems: fitMode ? "flex-start" : undefined,
      }}
    >
      <div
        className={`relative ${fitMode ? "h-full" : "w-full h-full"}`}
        style={fitMode ? { aspectRatio: `${width} / ${height}` } : undefined}
      >
        {/* Always render iframe underneath */}
        <div
          style={{
            width: fitMode ? `${width * scale}px` : undefined,
            height: fitMode ? `${height * scale}px` : undefined,
            flexShrink: 0,
          }}
        >
          <iframe
            src={url}
            width={width}
            height={height}
            style={{
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              pointerEvents: isActivated && !isDragging ? "auto" : "none",
            }}
            allow="clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer-when-downgrade"
            title={url}
          />
        </div>

        {/* Click to activate overlay - only visible on hover */}
        {!isActivated && (
          <div
            className="group absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors"
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            <div className="flex items-center gap-2 text-white text-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <ClickToActivateIcon />
              <span>Click to activate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
