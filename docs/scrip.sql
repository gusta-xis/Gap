-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS gap_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE gap_db;

--------------------------------------------------
-- 1. TABELA DE USUÁRIOS
--------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, -- armazenar hash
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------
-- 2. TABELA DE SALÁRIOS (um por mês por usuário)
--------------------------------------------------
CREATE TABLE salarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    referencia_mes VARCHAR(7) NOT NULL, -- YYYY-MM
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

--------------------------------------------------
-- 3. TABELA DE CATEGORIAS
--------------------------------------------------
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

-- Categorias iniciais
INSERT INTO categorias (nome) VALUES
('Alimentação'),
('Transporte'),
('Moradia'),
('Saúde'),
('Lazer'),
('Educação'),
('Cartão de crédito'),
('Outros');

--------------------------------------------------
-- 4. GASTOS FIXOS
--------------------------------------------------
CREATE TABLE gastos_fixos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    categoria_id INT,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    dia_vencimento INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

--------------------------------------------------
-- 5. GASTOS VARIÁVEIS
--------------------------------------------------
CREATE TABLE gastos_variaveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    categoria_id INT,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_gasto DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

--------------------------------------------------
-- 6. HISTÓRICO DE TRANSAÇÕES
--------------------------------------------------
CREATE TABLE transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tipo ENUM('entrada','saida') NOT NULL,
    descricao VARCHAR(255),
    valor DECIMAL(10,2) NOT NULL,
    data_transacao DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
