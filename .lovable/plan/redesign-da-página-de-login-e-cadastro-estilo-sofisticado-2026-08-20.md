# Redesign da Página de Login e Cadastro (Estilo Sofisticado)

O objetivo é transformar a página de autenticação atual em uma experiência moderna, profissional e visualmente impactante, alinhada à marca Agilliza. O redesign focará em um layout de duas colunas (Split Screen) com elementos visuais de alta qualidade e micro-interações.

## Mudanças Propostas

### Visual e Layout
- **Layout Split Screen:** 
  - Lado esquerdo: Uma área visual imersiva com degradê da marca (`#0000A0`), ilustrações/patterns sutis e uma mensagem de boas-vindas inspiradora.
  - Lado direito: O formulário de login/cadastro limpo, centralizado e com tipografia refinada.
- **Brand Integration:** Uso proeminente do logo da Agilliza e cores institucionais.
- **Modernização de Componentes:** Campos de entrada com estados de foco suaves, botões com transições elegantes e feedback visual claro.
- **Responsividade:** Em dispositivos móveis, o lado visual será ocultado ou reduzido para focar na funcionalidade.

### Experiência do Usuário (UX)
- **Transições Suaves:** Troca entre Login e Cadastro sem recarregar a página, com animações leves (usando Tailwind Animate).
- **Validação Visual:** Feedback imediato nos campos de e-mail e senha.
- **Hierarquia Clara:** O botão de ação principal terá destaque máximo, enquanto a troca de modo (Login/SignUp) será um link discreto mas visível.

## Detalhes Técnicos
- **Localização:** `src/routes/auth.tsx`
- **Componentes Base:** `Card`, `Button`, `Input`, `Label` do Shadcn UI.
- **Estilização:** Tailwind CSS v4 com foco em `bg-primary`, `text-primary-foreground` e utilitários de animação.
- **Estado:** Manutenção dos estados de `fullName`, `email`, `password`, `loading` e `isSignUp`.

O plano não altera a lógica de backend (Supabase), apenas a apresentação visual.
