/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SESSION_INACTIVITY_TIMEOUT_MINUTES?: string;
	readonly VITE_SESSION_MAX_DURATION_HOURS?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}