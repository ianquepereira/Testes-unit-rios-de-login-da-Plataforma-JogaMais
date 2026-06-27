# Como Rodar os Testes:

## Pré-requisitos
- Node.js instalado
- Ter o projeto `joga-plus-main` na sua máquina
- Ter o arquivo `login.service.test.js` baixado

---

## Passo a Passo

### 1. Abra o terminal e entre na pasta do backend
No terminal:
cd caminho\para\joga-plus-main\backend

---

### 2. Instale as dependências do projeto
No terminal:
npm install

---

### 3. Instale o Jest
No terminal:
npm install --save-dev jest @jest/globals

---

### 4. Crie a pasta de testes
No terminal:
mkdir tests

---

### 5. Coloque o arquivo de testes dentro da pasta criada
Copie o arquivo `login.service.test.js` para dentro da pasta `tests/` que acabou de criar.

A estrutura deve ficar assim:

joga-plus-main/
└── backend/
    ├── package.json
    ├── tests/
    │   └── login.service.test.js   ← arquivo copiado aqui
    └── src/
        ├── services/
        │   └── login.service.js
        ├── repository/
        │   └── user.repository.js
        └── domain/
            └── appError.js

---

### 6. Atualize o package.json
Abra o arquivo `package.json` dentro da pasta `backend` e:

Substitua a linha do `"test"` dentro de `"scripts"` por:
    json
"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --verbose"

E adicione fora de `"scripts"`:
    json
"jest": { "transform": {} }

O arquivo final deve ficar assim:
    json
{
    "name": "backend",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "nodemon src/server.js",
        "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js --verbose",
        "format": "prettier . --write"
    },
    "jest": {
        "transform": {}
    },
}

---

### 7. Rode os testes
No terminal:
npm test

---

## Resultado esperado

PASS  tests/login.service.test.js
  √ deve retornar um token JWT quando usuário e senha estão corretos
  √ deve lançar erro 401 quando o username não está registrado
  √ deve lançar erro 403 quando a senha é inválida
  √ deve buscar o usuário usando o username fornecido
  √ deve comparar a senha recebida com o hash armazenado no banco
  √ deve gerar o token JWT com o id do usuário no payload
  √ deve gerar o token com expiração de 1 dia
  √ não deve chamar jwt.sign quando o usuário não existe
  √ não deve chamar jwt.sign quando a senha está incorreta
  √ o erro de usuário não encontrado deve ter status 401
  √ o erro de senha inválida deve ter status 403
  √ deve buscar o usuário no banco apenas uma vez por tentativa de login
  √ deve assinar o token com a variável JWT_SECRET do ambiente