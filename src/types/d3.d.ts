// Type declarations for d3 packages
// These will be replaced by @types packages after pnpm install

declare module "d3-scale" {
  export function scaleSequential<T>(interpolator: (t: number) => T): {
    domain(domain: [number, number]): this;
    (value: number): T;
  };
}

declare module "d3-scale-chromatic" {
  export function interpolateViridis(t: number): string;
}
