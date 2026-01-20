# Momento Calma 🧸

Uma aplicação web moderna e minimalista projetada para auxiliar no gerenciamento de ansiedade e estresse através da técnica de aterramento (grounding) **5-4-3-2-1**.

## 🚀 O Projeto

O **Momento Calma** é um guia interativo que ajuda o usuário a sair de um estado de ansiedade ou pânico, trazendo-o de volta para o momento presente.

## ✨ Características

-   **Técnica 5-4-3-2-1**: Guia sensorial completo para mindfulness.
-   **Sistema de Feedback Duplo**:
    -   **Sentimentos**: No final do app, com cooldown de 2 horas por IP.
    -   **Sugestões**: Botão flutuante "?" para melhorias (1 envio por IP).
-   **Painel Admin**: Visualização e exportação (CSV) de feedbacks em `/feedbacks/app` e `/feedbacks/sentimento`.
-   **PWA**: Instalável como um aplicativo no seu dispositivo.

## 📦 Como rodar localmente

1.  **Instale as dependências**:
    ```bash
    npm install
    ```
2.  **Configure o ambiente**:
    -   Copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
    -   Defina sua senha em `FEEDBACK_PASSWORD`.
    -   Adicione sua `DATABASE_URL` do Supabase (obrigatório).
3.  **Inicie Tudo**:
    ```bash
    npm run dev:all
    ```

## 🌐 Configuração Supabase (Obrigatório)

Este projeto utiliza **PostgreSQL** via Supabase exclusivamente para armazenamento de feedbacks.

1.  No Supabase, vá em **Project Settings > Database** e copie a **Connection String** (URI).
2.  (Opcional) No Supabase, vá em **SQL Editor** e cole o conteúdo do arquivo `schema.sql` para criar as tabelas.
3.  Adicione a variável `DATABASE_URL` no seu arquivo `.env` ou no painel de controle do seu servidor (Railway/Vercel).

*Nota: Se a conexão com o banco falhar, o app exibirá uma mensagem de erro técnico amigável ao usuário.*

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](file:///d:/Git/momento-calma/LICENSE) para mais detalhes.

---
*Feito com ❤️ para ajudar a encontrar paz em momentos de caos.*
