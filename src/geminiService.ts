// src/services/geminiService.ts

import * as Generative from '@google/generative-ai';

// Lendo a variável que deve ter sido configurada no Vercel/arquivo .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Inicializa o cliente API somente se a chave for válida
const gemini = API_KEY 
    ? new (Generative as any).GoogleGenAI({ apiKey: API_KEY }) 
    : null;

/**
 * Envia o prompt de viagem para o modelo Gemini e retorna a resposta otimizada.
 * @param prompt O texto da programação de viagem formatado.
 * @returns O texto de roteiro gerado pelo Gemini.
 */
export async function gerarRoteiro(prompt: string): Promise<string> {
    if (!gemini) {
        // Retorna um erro amigável se a chave não estiver configurada no Vercel
        return "ERRO: A Chave de API da Gemini (VITE_GEMINI_API_KEY) não está configurada. Por favor, verifique as variáveis de ambiente no Vercel.";
    }

    try {
        const fullPrompt = `Você é um planejador de logística experiente. Recebe uma programação de viagem técnica e deve transformá-la em um roteiro otimizado, mantendo a formatação profissional em caixas altas (uppercase). O roteiro deve ser claro, profissional e focado em eficiência. A programação é a seguinte:\n\n${prompt}`;
        
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return response.text;
    } catch (error) {
        console.error("Erro ao chamar a API da Gemini:", error);
        return "ERRO: Falha ao comunicar com a API da Gemini. Verifique sua chave ou o console para mais detalhes.";
    }
}