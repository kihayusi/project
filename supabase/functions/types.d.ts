declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  const env: Env;
}

declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}
