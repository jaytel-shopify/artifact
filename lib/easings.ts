/**
 * Custom Spring Easing Functions
 * 
 * These are advanced linear() easing functions that provide natural, spring-like animations.
 * All easings are available as CSS variables in globals.css
 */

/**
 * Available spring easings as CSS variables:
 * 
 * --spring-elegant-easing: Sophisticated spring with subtle bounce
 * --spring-elegant-easing-light: Lighter, more subtle spring animation (recommended for UI)
 * --spring-bouyant: More pronounced bounce effect
 */

export const SPRING_EASINGS = {
  elegant: 'var(--spring-elegant-easing)',
  elegantLight: 'var(--spring-elegant-easing-light)',
  bouyant: 'var(--spring-bouyant)',
} as const;

/**
 * Helper function to create CSS transitions with spring easings
 * 
 * @param property - CSS property to animate (e.g., 'transform', 'opacity')
 * @param duration - Duration in milliseconds
 * @param easing - Spring easing type
 * @returns CSS transition string
 * 
 * @example
 * // In component styles:
 * style={{ transition: createSpringTransition('transform', 400, 'elegantLight') }}
 * 
 * // Multiple properties:
 * style={{ transition: `${createSpringTransition('transform', 400, 'elegantLight')}, ${createSpringTransition('opacity', 300, 'elegantLight')}` }}
 */
export function createSpringTransition(
  property: string,
  duration: number,
  easing: keyof typeof SPRING_EASINGS = 'elegantLight'
): string {
  return `${property} ${duration}ms ${SPRING_EASINGS[easing]}`;
}

/**
 * Quick access to common spring transition combinations
 */
export const SPRING_TRANSITIONS = {
  // Sidebar animations
  sidebar: createSpringTransition('transform', 400, 'elegantLight'),
  sidebarContent: createSpringTransition('margin-left', 400, 'elegantLight'),
  
  // Modal/Dialog animations
  modal: createSpringTransition('all', 300, 'elegantLight'),
  
  // Card hover effects
  cardHover: createSpringTransition('all', 200, 'elegantLight'),
  
  // Button interactions
  button: createSpringTransition('all', 150, 'elegantLight'),
} as const;

/**
 * Usage Examples:
 * 
 * // Option 1: Direct CSS variable usage
 * style={{ transition: 'transform 400ms var(--spring-elegant-easing-light)' }}
 * 
 * // Option 2: Helper function
 * style={{ transition: createSpringTransition('transform', 400, 'elegantLight') }}
 * 
 * // Option 3: Predefined combinations
 * style={{ transition: SPRING_TRANSITIONS.sidebar }}
 */
