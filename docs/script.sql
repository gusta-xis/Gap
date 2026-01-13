-- Apaga as tabelas se já existirem (ordem reversa por causa das FKs)
DROP TABLE IF EXISTS transacoes;
DROP TABLE IF EXISTS salarios;
DROP TABLE IF EXISTS gastos_variaveis;
DROP TABLE IF EXISTS gastos_fixos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS users;

-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS gap_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE gap_db;

-- 1. TABELA DE USUÁRIOS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    password_reset_token VARCHAR(255) DEFAULT NULL,
    password_reset_expires DATETIME DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- 2. TABELA DE CATEGORIAS
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

-- Carga inicial de categorias
INSERT INTO categorias (nome) VALUES
('Alimentação'), ('Transporte'), ('Moradia'), ('Saúde'), 
('Lazer'), ('Educação'), ('Cartão de crédito'), ('Outros'),
('Renda Extra'), ('Salário');

-- 3. GASTOS FIXOS (Recorrentes)
CREATE TABLE gastos_fixos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    categoria_id INT,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    dia_vencimento INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- 4. GASTOS VARIÁVEIS (Pontuais)
CREATE TABLE gastos_variaveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    categoria_id INT,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_gasto DATE NOT NULL,
    tipo ENUM('entrada','saida') DEFAULT 'saida',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_user_data (user_id, data_gasto)
);

-- 5. SALÁRIOS / RECEITAS
CREATE TABLE salarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_recebimento DATE NOT NULL,
    descricao VARCHAR(100) DEFAULT 'Salário',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. HISTÓRICO DE TRANSAÇÕES (Log Unificado)
CREATE TABLE transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    origem_id INT NOT NULL, -- ID original (da tabela gastos ou salarios)
    origem_tabela ENUM('variavel', 'salario') NOT NULL,
    tipo ENUM('entrada','saida') NOT NULL,
    descricao VARCHAR(255),
    valor DECIMAL(10,2) NOT NULL,
    data_transacao DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_extrato (user_id, data_transacao)
);

-- 7. METAS
CREATE TABLE metas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    valor_alvo DECIMAL(10,2) NOT NULL,
    valor_atual DECIMAL(10,2) DEFAULT 0,
    prazo DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GATILHOS (TRIGGERS) - AUTOMAÇÃO
DELIMITER $$

-- 1. Ao INSERIR um Gasto Variável -> Adiciona no Histórico
CREATE TRIGGER after_gasto_insert AFTER INSERT ON gastos_variaveis
FOR EACH ROW
BEGIN
    INSERT INTO transacoes (user_id, origem_id, origem_tabela, tipo, descricao, valor, data_transacao)
    VALUES (NEW.user_id, NEW.id, 'variavel', NEW.tipo, NEW.nome, NEW.valor, NEW.data_gasto);
END$$

-- 2. Ao DELETAR um Gasto Variável -> Remove do Histórico
CREATE TRIGGER after_gasto_delete AFTER DELETE ON gastos_variaveis
FOR EACH ROW
BEGIN
    DELETE FROM transacoes 
    WHERE origem_id = OLD.id AND origem_tabela = 'variavel';
END$$

-- 3. Ao INSERIR um Salário -> Adiciona no Histórico
CREATE TRIGGER after_salario_insert AFTER INSERT ON salarios
FOR EACH ROW
BEGIN
    INSERT INTO transacoes (user_id, origem_id, origem_tabela, tipo, descricao, valor, data_transacao)
    VALUES (NEW.user_id, NEW.id, 'salario', 'entrada', NEW.descricao, NEW.valor, NEW.data_recebimento);
END$$

-- 4. Ao DELETAR um Salário -> Remove do Histórico
CREATE TRIGGER after_salario_delete AFTER DELETE ON salarios
FOR EACH ROW
BEGIN
    DELETE FROM transacoes 
    WHERE origem_id = OLD.id AND origem_tabela = 'salario';
END$$

DELIMITER ;


--alteracoes--
ALTER TABLE categorias ADD COLUMN slug VARCHAR(50) UNIQUE AFTER nome;
ALTER TABLE categorias ADD COLUMN icon VARCHAR(50) DEFAULT NULL AFTER nome;

ALTER TABLE salarios ADD COLUMN referencia_mes VARCHAR(7) NULL;