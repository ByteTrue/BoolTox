interface ImportMetaEnv {
  readonly VITE_ADMIN_API_BASE?: string;
  readonly VITE_CLIENT_API_TOKEN?: string;
  readonly VITE_RELEASE_CHANNEL?: string;
  readonly VITE_CLIENT_IDENTIFIER?: string;
  readonly VITE_INGEST_SHARED_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
