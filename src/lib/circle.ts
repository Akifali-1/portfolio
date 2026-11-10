export const SWEEP_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)'

/** Circle anchored at the top centre of the viewport. */
export const circleAt = (radius: number) => `circle(${radius}px at 50% 0px)`

/** Radius that covers the whole viewport from the top centre (distance to the bottom corners). */
export const coverRadius = () => Math.ceil(Math.hypot(window.innerWidth / 2, window.innerHeight)) + 4
