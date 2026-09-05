import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    env: {
      // Valores falsos, só para o cliente Supabase conseguir ser
      // instanciado durante os testes (nenhum teste chega a fazer pedidos
      // de rede reais) — evita depender do .env real, que nunca é
      // versionado no repositório.
      VITE_SUPABASE_URL: 'https://teste-local.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'chave-de-teste-nao-e-real',
    },
  },
});
