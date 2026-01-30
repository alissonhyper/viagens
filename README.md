<div align="center">

Feito por Alisson Silva

# PROGRAMAÇÃO DE VIAGEM
**Sistema interno para abertura, organização e fechamento de programações de viagem**

[🔗 Acessar sistema (Vercel)](https://viagens-jade.vercel.app)

</div>

---

## ✅ Sobre o projeto

O **Programação de Viagem** é um sistema web para organizar a rotina de viagens técnicas:  
- **Bandeja de ordens** (categorizada por região e cidade)  
- **Nova programação** (geração + salvar no histórico)  
- **Histórico colaborativo** (viagens abertas/finalizadas, relatório, edição)  
- **Integração com Firebase/Firestore**  
- **Sinalização de ordens “em viagem”** na bandeja (vinculadas à viagem salva)

---

## 🚀 Tecnologias

- **React + TypeScript**
- **Vite**
- **TailwindCSS**
- **Firebase (Firestore + Auth)**
- **Vercel (Deploy)**

---

## 🧩 Funcionalidades principais

### Bandeja
- Organização por **Região → Cidade**
- Contagem de ordens pendentes por grupo
- Reordenação (drag & drop)
- Importação por mensagem padrão
- **Destaque “em viagem”** para ordens vinculadas a uma programação

### Programação / Histórico
- Gerar programação a partir de cidades/atendimentos
- Salvar/editar viagens no histórico
- Encerramento técnico e relatório

---

## 🛠 Rodar localmente

### Pré-requisitos
- Node.js 18+ recomendado

### Instalar e iniciar
```bash
npm install
npm run dev
