# Plano de Implantação e Manutenção - Sistema GAP

## 1. Visão Geral
Este documento descreve as etapas necessárias para implantar as atualizações de segurança e refatoração do Sistema GAP. O sistema foi atualizado para um padrão corporativo com hierarquia de acesso rigorosa (RBAC), headers de segurança (Helmet/CSP) e sanitização de dados.

## 2. Migração de Banco de Dados
O sistema possui migrações automáticas embutidas no `server.js`. Ao iniciar a aplicação, ela verificará e criará/atualizará automaticamente:
- **Tabela Users**: Adição das colunas `role`, `credential`, `reset_code`, e `reset_code_expires`.
- **Tabela Audit Logs**: Criação da tabela `audit_logs`.
- **Super Admin**: Se não existir, um usuário `GAP0001` (Admin Geral) será criado com senha nula (exigindo ativação no primeiro acesso).

**Ação Necessária**:
Nenhuma ação manual de SQL é necessária. Apenas certifique-se de que o usuário do banco de dados definido no `.env` tenha permissão de `ALTER TABLE` e `CREATE TABLE`.

## 3. Configuração de Variáveis de Ambiente (.env)
Certifique-se de que o arquivo `.env` na raiz do projeto contenha as seguintes chaves. Se alguma chave sensível (Senhas, Segredos) estiver hardcoded, mova-a para cá imediatamente.

```env
# Configuração do Banco de Dados
DB_HOST=127.0.0.1
DB_USER=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_NAME=gap_finance
DB_PORT=3306

# Segurança e JWT
JWT_SECRET=troque_isso_por_um_hash_seguro_e_longo
JWT_REFRESH_SECRET=troque_isso_por_outro_hash_seguro

# Configuração do Servidor
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000

# Email (Caso utilize o serviço de email)
EMAIL_USER=seu_email@empresa.com
EMAIL_PASS=sua_senha_de_app
```

## 4. Guia de Testes de Segurança e Hierarquia

### 4.1. Validação de Hardening
1. Inicie o servidor: `npm start`.
2. Verifique os headers de resposta (via DevTools ou Postman).
   - **Esperado**: O header `X-Powered-By` **não** deve existir.
   - **Esperado**: Headers de segurança como `Content-Security-Policy`, `X-Frame-Options` e `X-XSS-Protection` devem estar presentes.

### 4.2. Matriz de Testes de Hierarquia (RBAC)
A "Regra de Ouro" implementada é: *Um usuário só pode criar ou excluir outro se tiver um peso estritamente maior.*

**Pesos:**
- Super Admin (Gerente Geral): 3
- Manager (Gerente): 2
- Admin (Administrador): 1
- User (Usuário Padrão): 0

**Cenários de Teste:**

| Ator (Quem logou) | Ação | Alvo (Role) | Resultado Esperado | Motivo |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Criar | Manager | **Sucesso** | 3 > 2 |
| **Super Admin** | Criar | Super Admin | **Falha (403)** | 3 não é > 3 |
| **Manager** | Criar | Admin | **Sucesso** | 2 > 1 |
| **Manager** | Criar | Manager | **Falha (403)** | 2 não é > 2 |
| **Manager** | Criar | Super Admin | **Falha (403)** | 2 < 3 |
| **Admin** | Criar | User | **Sucesso** | 1 > 0 |
| **Admin** | Criar | Admin | **Falha (403)** | 1 não é > 1 |
| **Admin** | Excluir | User | **Sucesso** | 1 > 0 |
| **Manager** | Excluir | Admin | **Sucesso** | 2 > 1 |

### 4.3. Teste Manual: Gerente criando Gerente Geral
1. Faça login como um usuário com role `manager`.
2. Tente enviar uma requisição POST para `/api/v1/users/admin/create` com o corpo:
   ```json
   { "nome": "Teste Hacking", "email": "teste@hack.com", "role": "super_admin" }
   ```
3. **Resultado**: O servidor deve retornar `403 Forbidden` com a mensagem "Insufficient permission to create a user with this role."

## 5. Manutenção de Código
- **Idioma**: Mantenha todos os novos comentários e documentação em Inglês.
- **Sanitização**: Não utilize `req.body.campo` diretamente em queries SQL ou HTML raw. O middleware de sanitização já protege o básico, mas sempre use Prepared Statements (`?`) nas queries.
