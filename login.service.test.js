import { jest } from '@jest/globals';

const mockFindUserByUsername = jest.fn();
const mockBcryptCompare      = jest.fn();
const mockJwtSign            = jest.fn();

jest.unstable_mockModule('bcrypt', () => ({
    default: { compare: mockBcryptCompare },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: { sign: mockJwtSign },
}));

jest.unstable_mockModule('../src/repository/user.repository.js', () => ({
    userRepository: { findUserByUsername: mockFindUserByUsername },
}));

jest.unstable_mockModule('../src/domain/appError.js', () => ({
    default: class AppError extends Error {
        constructor(message, status) {
            super(message);
            this.status = status;
        }
    },
}));

const { default: loginService } = await import('../src/services/login.service.js');

const usuarioFake = {
    id: 1,
    username: 'joao',
    password: '$2b$10$hashedpassword',
};

const credenciaisValidas = {
    username: 'joao',
    password: 'Senha123',
};

beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'segredo_teste';
});

// TESTE 1 — Retorna token quando credenciais são válidas
test('deve retornar um token JWT quando usuário e senha estão corretos', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('token.jwt.fake');

    const token = await loginService.create(credenciaisValidas);

    expect(token).toBe('token.jwt.fake');
});

// TESTE 2 — Lança erro quando usuário não existe
test('deve lançar erro 401 quando o username não está registrado', async () => {
    mockFindUserByUsername.mockResolvedValue(null);

    await expect(loginService.create(credenciaisValidas))
        .rejects
        .toThrow('Username não registrado');
});

// TESTE 3 — Lança erro quando a senha está incorreta
test('deve lançar erro 403 quando a senha é inválida', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(false);

    await expect(loginService.create(credenciaisValidas))
        .rejects
        .toThrow('Senha inválida');
});

// TESTE 4 — Busca usuário pelo username correto
test('deve buscar o usuário usando o username fornecido', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('token.jwt.fake');

    await loginService.create(credenciaisValidas);

    expect(mockFindUserByUsername).toHaveBeenCalledWith('joao');
});

// TESTE 5 — Compara a senha enviada com o hash do banco
test('deve comparar a senha recebida com o hash armazenado no banco', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('token.jwt.fake');

    await loginService.create(credenciaisValidas);

    expect(mockBcryptCompare).toHaveBeenCalledWith('Senha123', usuarioFake.password);
});

// TESTE 6 — Gera o token com o ID do usuário
test('deve gerar o token JWT com o id do usuário no payload', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('token.jwt.fake');

    await loginService.create(credenciaisValidas);

    expect(mockJwtSign).toHaveBeenCalledWith(
        { id: usuarioFake.id },
        'segredo_teste',
        { expiresIn: '1d' }
    );
});

// TESTE 7 — Token expira em 1 dia
test('deve gerar o token com expiração de 1 dia', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('token.jwt.fake');

    await loginService.create(credenciaisValidas);

    const chamada = mockJwtSign.mock.calls[0];
    expect(chamada[2]).toMatchObject({ expiresIn: '1d' });
});

// TESTE 8 — Não gera token se usuário não existir
test('não deve chamar jwt.sign quando o usuário não existe', async () => {
    mockFindUserByUsername.mockResolvedValue(null);

    await expect(loginService.create(credenciaisValidas)).rejects.toThrow();

    expect(mockJwtSign).not.toHaveBeenCalled();
});

// TESTE 9 — Não gera token se a senha for inválida
test('não deve chamar jwt.sign quando a senha está incorreta', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(false);

    await expect(loginService.create(credenciaisValidas)).rejects.toThrow();

    expect(mockJwtSign).not.toHaveBeenCalled();
});

// TESTE 10 — Erro 401 tem status correto
test('o erro de usuário não encontrado deve ter status 401', async () => {
    mockFindUserByUsername.mockResolvedValue(null);

    let erroCapturado;
    try {
        await loginService.create(credenciaisValidas);
    } catch (e) {
        erroCapturado = e;
    }

    expect(erroCapturado.status).toBe(401);
});

// TESTE 11 — Erro 403 tem status correto
test('o erro de senha inválida deve ter status 403', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(false);

    let erroCapturado;
    try {
        await loginService.create(credenciaisValidas);
    } catch (e) {
        erroCapturado = e;
    }

    expect(erroCapturado.status).toBe(403);
});

// TESTE 12 — Repositório é chamado apenas uma vez
test('deve buscar o usuário no banco apenas uma vez por tentativa de login', async () => {
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('token.jwt.fake');

    await loginService.create(credenciaisValidas);

    expect(mockFindUserByUsername).toHaveBeenCalledTimes(1);
});

// TESTE 13 — Usa o JWT_SECRET do ambiente
test('deve assinar o token com a variável JWT_SECRET do ambiente', async () => {
    process.env.JWT_SECRET = 'meu_segredo_customizado';
    mockFindUserByUsername.mockResolvedValue(usuarioFake);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('token.jwt.fake');

    await loginService.create(credenciaisValidas);

    expect(mockJwtSign).toHaveBeenCalledWith(
        expect.anything(),
        'meu_segredo_customizado',
        expect.anything()
    );
});
