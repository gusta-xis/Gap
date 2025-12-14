# Funcionalidade de Gastos Fixos

## ✅ Implementação Completa

A funcionalidade de **Gastos Fixos** foi criada para gerenciar despesas mensais recorrentes que não mudam de mês para mês (como aluguel, condomínio, internet, etc.).

---

## 📋 Características Principais

### 1. **Persistência de Dados**
- Os gastos fixos são armazenados no banco de dados e **permanecem independente do mês ou ano**
- Só são removidos quando editados ou excluídos manualmente pelo usuário
- Cada gasto está vinculado ao usuário (isolamento de dados)

### 2. **Interface Completa**
- **Listagem** de todos os gastos fixos cadastrados
- **Formulário modal** para adicionar novos gastos
- **Edição** de gastos existentes
- **Exclusão** de gastos com confirmação

### 3. **Estatísticas em Tempo Real**
- **Total de Gastos Fixos**: Soma de todos os valores mensais
- **Quantidade de Gastos**: Número de gastos cadastrados
- **Próximo Vencimento**: Mostra o próximo gasto a vencer

---

## 🗂️ Arquivos Criados

### 1. **Frontend**

#### [gastos-fixos-content.html](public/pages/gastos-fixos-content.html)
```
Página HTML com:
- Cards de estatísticas
- Tabela de listagem
- Estados de loading/empty
- Modal de cadastro/edição
```

#### [gastos-fixos.js](public/scripts/gastos-fixos.js)
```javascript
Gerenciamento completo:
- loadGastosFixos() - Carrega dados da API
- renderGastosFixos() - Renderiza tabela
- handleSubmit() - Criar/editar gasto
- deleteGasto() - Excluir gasto
- updateStatistics() - Atualiza cards
```

### 2. **Backend (Já Existente)**

A API já estava implementada:
- ✅ `POST /api/v1/fixo` - Criar gasto
- ✅ `GET /api/v1/fixo` - Listar gastos do usuário
- ✅ `GET /api/v1/fixo/:id` - Buscar gasto específico
- ✅ `PUT /api/v1/fixo/:id` - Atualizar gasto
- ✅ `DELETE /api/v1/fixo/:id` - Excluir gasto

### 3. **Integração SPA**

#### Rota adicionada em [spa-router.js](public/scripts/spa-router.js):
```javascript
'gastos-fixos': {
    title: 'Gastos Fixos - GAP Financeiro',
    contentUrl: '/pages/gastos-fixos-content.html',
    script: '/scripts/gastos-fixos.js'
}
```

#### Link no menu lateral em [app.html](public/app.html):
```html
<a class="nav-link" data-page="gastos-fixos">
    <span class="material-symbols-outlined">event_repeat</span>
    <span>Gastos Fixos</span>
</a>
```

---

## 💾 Estrutura de Dados

### Modelo de Gasto Fixo
```javascript
{
    id: number,              // ID único
    descricao: string,       // Nome do gasto (ex: "Aluguel")
    valor: decimal,          // Valor em reais
    dia_vencimento: number,  // Dia do mês (1-30)
    categoria_id: number,    // ID da categoria (opcional)
    user_id: number,         // ID do usuário proprietário
    categoria: string        // Nome da categoria (join)
}
```

### Campos do Formulário
1. **Descrição** (obrigatório)
   - Ex: Aluguel, Condomínio, Internet, Netflix, etc.

2. **Valor** (obrigatório)
   - Formato: R$ 0,00
   - Máscara automática de moeda

3. **Dia do Vencimento** (obrigatório)
   - Opções: 1, 5, 10, 15, 20, 25, 30
   - Indica quando o gasto vence todo mês

4. **Categoria** (opcional)
   - Categorias pré-definidas
   - Ajuda na organização

---

## 🎨 Interface do Usuário

### Estados da Página

#### 1. **Loading**
```html
<div id="loadingStateFixos">
    <spinner>
    <p>Carregando gastos fixos...</p>
</div>
```

#### 2. **Empty State**
```html
<div id="emptyStateFixos">
    <icon>event_repeat</icon>
    <p>Nenhum gasto fixo cadastrado</p>
    <button>Adicionar Primeiro Gasto</button>
</div>
```

#### 3. **Lista Populada**
```html
<table>
    <thead>
        <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Dia Vencimento</th>
            <th>Valor</th>
            <th>Ações</th>
        </tr>
    </thead>
    <tbody>
        <!-- Linhas dinâmicas -->
    </tbody>
</table>
```

### Cards de Estatísticas

```html
<!-- Total de Gastos Fixos -->
<div class="stats-card">
    <p>Total de Gastos Fixos</p>
    <p id="totalGastosFixos">R$ 0,00</p>
    <p>Mensalmente</p>
</div>

<!-- Quantidade -->
<div class="stats-card">
    <p>Quantidade de Gastos</p>
    <p id="quantidadeGastos">0</p>
    <p>Gastos cadastrados</p>
</div>

<!-- Próximo Vencimento -->
<div class="stats-card">
    <p>Próximo Vencimento</p>
    <p id="proximoVencimento">-</p>
    <p id="proximoVencimentoDescricao">Nenhum cadastrado</p>
</div>
```

---

## 🔐 Segurança

### Autenticação
- ✅ Todas as rotas da API exigem JWT válido
- ✅ Middleware `authMiddleware` protege endpoints
- ✅ Validação de token no client-side

### Isolamento de Dados
- ✅ Cada usuário vê apenas seus próprios gastos
- ✅ Filtro `WHERE user_id = ?` em todas as queries
- ✅ Validação server-side do proprietário

### Validação
```javascript
// Server-side (validatorsMiddleware.js)
validateGastoFixo: {
    descricao: required,
    valor: required, positive,
    dia_vencimento: optional, integer(1-31)
    categoria_id: optional, integer
}

// Client-side
- Campos obrigatórios marcados com *
- Máscara de valor
- Sanitização de HTML
```

---

## 🚀 Como Usar

### 1. **Acessar a Página**
```
1. Fazer login no sistema
2. No menu lateral, clicar em "Gastos Fixos"
3. Ou navegar para: /financeiro/dashboard#gastos-fixos
```

### 2. **Adicionar Gasto Fixo**
```
1. Clicar no botão "+ Adicionar Gasto Fixo"
2. Preencher o formulário:
   - Descrição: "Aluguel"
   - Valor: "1500,00"
   - Dia Vencimento: "5"
   - Categoria: "Moradia" (opcional)
3. Clicar em "Salvar"
```

### 3. **Editar Gasto**
```
1. Na tabela, clicar no ícone de edição (lápis)
2. Modificar os campos desejados
3. Clicar em "Salvar"
```

### 4. **Excluir Gasto**
```
1. Na tabela, clicar no ícone de exclusão (lixeira)
2. Confirmar a exclusão
3. O gasto é removido permanentemente
```

---

## 🔄 Fluxo de Dados

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ Acessa /financeiro/dashboard#gastos-fixos
       ▼
┌──────────────────┐
│  SPA Router      │ Carrega gastos-fixos-content.html
└────────┬─────────┘
         │ Executa gastos-fixos.js
         ▼
┌──────────────────┐
│ initGastosFixos  │ checkAuthentication()
└────────┬─────────┘
         │ loadGastosFixos()
         ▼
┌──────────────────┐
│  GET /api/v1/fixo│ + Authorization: Bearer {token}
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  authMiddleware  │ Valida JWT
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ fixoController   │ findByUserId()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   fixoModel      │ SELECT * FROM gastos_fixos WHERE user_id = ?
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   MySQL DB       │ Retorna gastos do usuário
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ renderGastosFixos│ Popula tabela + estatísticas
└──────────────────┘
```

---

## 📊 Exemplo de Uso Real

### Cenário: Usuário com gastos mensais fixos

```javascript
Gastos Fixos Cadastrados:
┌─────────────────┬────────────┬────────────┬──────────┐
│ Descrição       │ Categoria  │ Vencimento │ Valor    │
├─────────────────┼────────────┼────────────┼──────────┤
│ Aluguel         │ Moradia    │ Dia 5      │ R$1.500,00│
│ Condomínio      │ Moradia    │ Dia 10     │ R$ 350,00│
│ Internet        │ Outros     │ Dia 15     │ R$ 120,00│
│ Netflix         │ Lazer      │ Dia 20     │ R$ 45,90 │
│ Energia         │ Moradia    │ Dia 25     │ R$ 180,00│
└─────────────────┴────────────┴────────────┴──────────┘

Estatísticas:
- Total de Gastos Fixos: R$ 2.195,90
- Quantidade: 5 gastos
- Próximo Vencimento: Dia 5 (Aluguel)
```

### Benefícios
- ✅ Planejamento financeiro mensal
- ✅ Visibilidade de compromissos fixos
- ✅ Cálculo automático do total
- ✅ Não precisa recadastrar todo mês
- ✅ Organização por categoria

---

## 🎯 Melhorias Futuras Sugeridas

### 1. **Geração Automática de Transações**
```javascript
// A cada início de mês, criar transações automáticas
// baseadas nos gastos fixos cadastrados
async function gerarTransacoesDoMes() {
    const gastosFixos = await getGastosFixos();
    gastosFixos.forEach(gasto => {
        createTransacao({
            descricao: gasto.descricao,
            valor: gasto.valor,
            data: new Date().setDate(gasto.dia_vencimento),
            tipo: 'saida',
            categoria_id: gasto.categoria_id,
            origem: 'gasto_fixo',
            gasto_fixo_id: gasto.id
        });
    });
}
```

### 2. **Lembretes de Vencimento**
- Notificação 3 dias antes do vencimento
- Email/SMS para gastos próximos
- Badge visual no dashboard

### 3. **Histórico de Alterações**
- Log de quando o gasto foi alterado
- Valor anterior vs novo valor
- Útil para rastrear aumentos

### 4. **Análise de Tendências**
- Gráfico de evolução dos gastos fixos
- Comparação mês a mês
- Identificar aumentos inesperados

### 5. **Categorização Avançada**
- Subcategorias
- Tags personalizadas
- Cores customizadas

---

## ✅ Checklist de Implementação

- [x] Criar página HTML com layout responsivo
- [x] Implementar JavaScript com CRUD completo
- [x] Integrar com API existente
- [x] Adicionar rota no SPA Router
- [x] Adicionar link no menu de navegação
- [x] Implementar autenticação e validação
- [x] Adicionar estados de loading/empty
- [x] Criar modal de cadastro/edição
- [x] Implementar estatísticas em tempo real
- [x] Adicionar formatação de moeda
- [x] Sanitizar inputs para segurança
- [x] Testar isolamento de dados por usuário

---

## 🎉 Conclusão

A funcionalidade de **Gastos Fixos** está completamente implementada e pronta para uso. Os usuários podem:

1. ✅ Visualizar todos os seus gastos fixos mensais
2. ✅ Adicionar novos gastos com facilidade
3. ✅ Editar gastos existentes
4. ✅ Excluir gastos que não são mais necessários
5. ✅ Ver estatísticas em tempo real
6. ✅ Acompanhar próximos vencimentos

**Os gastos permanecem no sistema indefinidamente** até serem explicitamente removidos pelo usuário, facilitando o planejamento financeiro de longo prazo.
