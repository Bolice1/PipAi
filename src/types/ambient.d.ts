declare const process: {
  env: Record<string, string | undefined>;
  exit: (code?: number) => never;
};

declare const console: {
  log: (...args: unknown[]) => void;
};

declare const require: any;

declare const Buffer: {
  from: (value: string, encoding?: string) => any;
  concat: (values: any[]) => any;
};

declare function fetch(url: string, init?: any): Promise<any>;

type Buffer = any;

declare module "express" {
  const express: any;
  export default express;
}

declare module "mongoose" {
  const mongoose: any;
  export = mongoose;
}
