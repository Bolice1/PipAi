declare const process: {
  env: Record<string, string | undefined>;
};

declare const console: {
  log: (...args: unknown[]) => void;
};

declare module "express" {
  const express: any;
  export default express;
}
