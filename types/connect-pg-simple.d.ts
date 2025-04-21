declare module "connect-pg-simple" {
  import { Store } from "express-session";
  import { Pool } from "pg";
  import { SessionOptions } from "express-session";
  class PGStore extends Store {
    constructor(options: { pool: Pool } & Partial<SessionOptions>);
  }
  export = PGStore;
}
