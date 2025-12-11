declare module 'connect-pg-simple' {
  import session from 'express-session';
  import { Pool } from 'pg';

  interface PgSessionOptions {
    pool: Pool;
    tableName?: string;
    schemaName?: string;
    createTableIfMissing?: boolean;
    ttl?: number;
    pruneSessionInterval?: number | false;
  }

  function connectPgSimple(session: typeof session): new (options: PgSessionOptions) => session.Store;

  export = connectPgSimple;
}
