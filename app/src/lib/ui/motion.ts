/** 'auto' when the person asked for less motion, so script-driven scrolling jumps instead of gliding (UX-57). */
export function scrollMotion(): ScrollBehavior {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
