# 🧸 Momento Calma

O **Momento Calma** é uma aplicação web (PWA) projetada para ajudar no gerenciamento da ansiedade através da técnica de aterramento **5-4-3-2-1**. O objetivo é trazer o usuário de volta ao momento presente, focando nos sentidos.

## ✨ Funcionalidades

- **Guia de Aterramento Interativo**: Um passo a passo que utiliza os 5 sentidos (Visão, Tato, Audição, Olfato e Paladar).
- **Registro de Sentimentos**: Ao final do exercício, o usuário pode registrar como se sente. (Limite de 1 envio a cada 2 horas por IP).
- **Sugestões para o App**: Botão flutuante para coletar feedbacks e melhorias diretamente dos usuários.
- **Painel Administrativo**: Visualização e exportação de feedbacks em formato CSV.
- **PWA (Progressive Web App)**: Pode ser instalado no celular ou desktop para acesso offline fácil.

## 🛠️ Stack Tecnológica

- **Frontend**: React, Vite, Axios, React Router.
- **Backend**: Node.js, Express.
- **Banco de Dados**: PostgreSQL (hospedado no Supabase).
- **Estilização**: CSS Vanilla (focado em uma estética suave e relaxante).

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado.
- Banco de Dados PostgreSQL (recomendado Supabase).

### Configuração
1. Clone o repositório.
2. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`.
3. **Importante (Vercel + Supabase)**: O Vercel pode ter problemas para se conectar diretamente ao Supabase devido ao protocolo IPv6. Para garantir que o banco funcione em produção:
   - No painel do Supabase, vá em **Settings > Database**.
   - Procure por **Connection String** e mude o modo para **Transaction** (Porta 6543).
   - Use essa URL na variável `DATABASE_URL` do Vercel, adicionando `?pgbouncer=true` ao final.

4. Instale as dependências:
   ```bash
   npm install
   ```

### Execução Local
Para rodar o frontend e o backend simultaneamente:
```bash
npm run dev:all
```
Ou separadamente:
- **Frontend**: `npm run dev` (Porta 5173 por padrão)
- **Backend**: `npm run server` (Porta definida no .env)

## 🔐 Acesso Administrativo
Para visualizar os feedbacks coletados:
- **Sentimentos**: `/feedbacks/sentimento`
- **Sugestões**: `/feedbacks/app`
*(É necessário a senha definida em `FEEDBACK_PASSWORD`)*

## 📄 Licença
Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](file:///d:/Git/momento-calma/LICENSE) para mais detalhes.
