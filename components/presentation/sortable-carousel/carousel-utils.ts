import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

/**
 * Carousel utility functions for scroll index tracking
 */

/**
 * Get the current visible scroll index
 * Based on scroll position divided by equal item width
 */
export function getCurrentScrollIndex(container: HTMLElement): number {
  const items = container.querySelectorAll(
    ".carousel-item-wrapper:not(.collection-child-hidden)"
  );
  if (items.length === 0) return 0;

  const firstItem = items[0] as HTMLElement;
  const itemWidth = firstItem.offsetWidth;

  if (itemWidth === 0) return 0;

  // Get gap from CSS
  const gap = parseInt(window.getComputedStyle(container).gap || "0");
  const itemSpacing = itemWidth + gap;

  // Calculate index from scroll position
  const index = Math.round(container.scrollLeft / itemSpacing);

  return Math.max(0, Math.min(index, items.length - 1));
}

/**
 * Scroll to the end of the carousel with smooth animation
 */
export function scrollToEnd(container: HTMLElement): void {
  container.classList.add("disable-snap-scroll");

  gsap.to(container, {
    scrollLeft: container.scrollWidth,
    duration: 0.65,
    ease: "power3.out",
    overwrite: "auto",
    onComplete: () => {
      container.classList.remove("disable-snap-scroll");
    },
  });
}

/**
 * Scroll to a specific item index with smooth animation
 * GSAP scrollTo automatically overwrites previous tweens
 */
export function scrollToIndex(
  container: HTMLElement,
  index: number,
  onComplete?: () => void
): void {
  const items = container.querySelectorAll(
    ".carousel-item-wrapper:not(.collection-child-hidden)"
  );
  const targetItem = items[index] as HTMLElement;

  if (!targetItem) {
    onComplete?.();
    return;
  }

  // Account for scroll-padding-left when calculating target position
  const scrollPaddingLeft = parseFloat(
    window.getComputedStyle(container).scrollPaddingLeft || "0"
  );

  const targetScrollLeft = targetItem.offsetLeft - scrollPaddingLeft;
  const scrollDistance = Math.abs(targetScrollLeft - container.scrollLeft);

  // Skip animation if distance is negligible
  if (scrollDistance < 1) {
    onComplete?.();
    return;
  }

  // Disable snap scroll during animation
  container.classList.add("disable-snap-scroll");

  gsap.to(container, {
    scrollLeft: targetScrollLeft,
    duration: 0.65,
    ease: "power3.out",
    overwrite: "auto",
    onComplete: () => {
      container.classList.remove("disable-snap-scroll");
      onComplete?.();
    },
  });
}
