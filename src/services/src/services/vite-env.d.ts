// src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // O TypeScript agora sabe que esta chave existe e é uma string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}