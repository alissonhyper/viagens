import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// 1. IMPORTAR 'path' do Node.js
import * as path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: './',
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        define: {
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        // 2. ADICIONAR O BLOCO RESOLVE COM ALIAS
        resolve: {
            alias: {
                // Mapeia o '@' para o diretório 'src'
                '@': path.resolve(__dirname, './src'), 
            },
        }
    };
});