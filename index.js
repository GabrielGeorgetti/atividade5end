import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const host = '0.0.0.0';
const porta = 3000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
    secret: 'segredo123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 30 } // 30 minutos
}));

var listaLivros = [];
var listaLeitores = [];
var listaUsuarios = [];

const cabecalho = (titulo) => `
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>${titulo}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container mt-4">
`;

const rodape = () => `
</div>
</body>
</html>
`;

const navLogado = () => `
    <ul class="nav nav-tabs mb-4">
        <li class="nav-item"><a class="nav-link" href="/menu">Menu</a></li>
        <li class="nav-item"><a class="nav-link" href="/livros">Cadastro de Livros</a></li>
        <li class="nav-item"><a class="nav-link" href="/leitores">Cadastro de Leitores</a></li>
        <li class="nav-item"><a class="nav-link" href="/logout">Logout</a></li>
    </ul>
`;

// Rota raiz redireciona para cadastro
app.get('/', (req, res) => {
    res.redirect('/cadastro');
});

// GET Cadastro
app.get('/cadastro', (req, res) => {
    res.write(cabecalho('Cadastro de Usuário'));
    res.write(`
        <div class="row justify-content-center">
            <div class="col-md-4">
                <h2 class="mb-4">Cadastro - Biblioteca</h2>
                <form method="POST" action="/cadastro" class="card p-4">
                    <div class="mb-3">
                        <label class="form-label">Nome Completo</label>
                        <input type="text" name="nome" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Usuário</label>
                        <input type="text" name="usuario" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Senha</label>
                        <input type="password" name="senha" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Confirmar Senha</label>
                        <input type="password" name="confirmarSenha" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Cadastrar</button>
                    <hr>
                    <p class="text-center">Já tem conta? <a href="/login">Faça login aqui</a></p>
                </form>
            </div>
        </div>
    `);
    res.write(rodape());
    res.end();
});

// POST Cadastro
app.post('/cadastro', (req, res) => {
    const { nome, usuario, senha, confirmarSenha } = req.body;
    
    res.write(cabecalho('Cadastro de Usuário'));
    
    let erros = [];
    
    if (!nome) erros.push("Nome completo não informado");
    if (!usuario) erros.push("Usuário não informado");
    if (!senha) erros.push("Senha não informada");
    if (!confirmarSenha) erros.push("Confirmação de senha não informada");
    if (senha && confirmarSenha && senha !== confirmarSenha) erros.push("As senhas não correspondem");
    
    if (usuario && listaUsuarios.some(u => u.usuario === usuario)) {
        erros.push("Este usuário já está cadastrado");
    }
    
    if (erros.length > 0) {
        res.write(`<div class="alert alert-danger"><strong>Erros encontrados:</strong><ul>`);
        erros.forEach(e => res.write(`<li>${e}</li>`));
        res.write(`</ul></div>`);
        res.write(`<a href="/cadastro" class="btn btn-secondary">Tentar novamente</a>`);
    } else {
        listaUsuarios.push({ nome, usuario, senha });
        
        res.write(`
            <div class="alert alert-success">Cadastro realizado com sucesso!</div>
            <p>Bem-vindo, <strong>${nome}</strong>!</p>
            <a href="/login" class="btn btn-primary">Ir para o Login</a>
        `);
    }
    
    res.write(rodape());
    res.end();
});

// GET Login
app.get('/login', (req, res) => {
    res.write(cabecalho('Login'));
    res.write(`
        <div class="row justify-content-center">
            <div class="col-md-4">
                <h2 class="mb-4">Login - Biblioteca</h2>
                <form method="POST" action="/login" class="card p-4">
                    <div class="mb-3">
                        <label class="form-label">Usuário</label>
                        <input type="text" name="usuario" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Senha</label>
                        <input type="password" name="senha" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Entrar</button>
                    <hr>
                    <p class="text-center">Não tem conta? <a href="/cadastro">Cadastre-se aqui</a></p>
                </form>
            </div>
        </div>
    `);
    res.write(rodape());
    res.end();
});
// POST Login
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    const usuarioCadastrado = listaUsuarios.find(u => u.usuario === usuario && u.senha === senha);

    if (usuarioCadastrado) {
        req.session.usuario = usuario;

        const agora = new Date().toLocaleString('pt-BR');
        res.cookie('ultimo_acesso', agora, { maxAge: 1000 * 60 * 60 * 24 * 7 });

        res.write(cabecalho('Login'));
        res.write(`
            <div class="alert alert-success">Login realizado com sucesso! Bem-vindo, ${usuario}.</div>
            <a href="/menu" class="btn btn-primary">Ir para o Menu</a>
        `);
    } else {
        res.write(cabecalho('Login'));
        res.write(`
            <div class="alert alert-danger">Usuário ou senha incorretos!</div>
            <a href="/login" class="btn btn-secondary">Tentar novamente</a>
        `);
    }

    res.write(rodape());
    res.end();
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.write(cabecalho('Logout'));
    res.write(`
        <div class="alert alert-success">Logout efetuado com sucesso!</div>
        <a href="/login" class="btn btn-primary">Fazer Login novamente</a>
    `);
    res.write(rodape());
    res.end();
});

// Menu (protegido)
app.get('/menu', (req, res) => {
    res.write(cabecalho('Menu Principal'));

    if (!req.session.usuario) {
        res.write(`
            <div class="alert alert-warning">Você precisa realizar o login para acessar esta página.</div>
            <a href="/login" class="btn btn-primary">Fazer Login</a>
        `);
        res.write(rodape());
        res.end();
        return;
    }

    res.write(navLogado());

    const ultimoAcesso = req.cookies.ultimo_acesso;

    res.write(`
        <h2>Menu Principal</h2>
        <p>Bem-vindo, <strong>${req.session.usuario}</strong>!</p>
    `);

    if (ultimoAcesso) {
        res.write(`<div class="alert alert-info">Último acesso: ${ultimoAcesso}</div>`);
    }

    res.write(`
        <div class="list-group mt-3" style="max-width: 400px;">
            <a href="/livros" class="list-group-item list-group-item-action">
                📚 Cadastro de Livros
            </a>
            <a href="/leitores" class="list-group-item list-group-item-action">
                👤 Cadastro de Leitores
            </a>
        </div>
    `);

    res.write(rodape());
    res.end();
});

// GET Livros (protegido)
app.get('/livros', (req, res) => {
    res.write(cabecalho('Cadastro de Livros'));

    if (!req.session.usuario) {
        res.write(`
            <div class="alert alert-warning">Você precisa realizar o login para acessar esta página.</div>
            <a href="/login" class="btn btn-primary">Fazer Login</a>
        `);
        res.write(rodape());
        res.end();
        return;
    }

    res.write(navLogado());

    res.write(`
        <h2>Cadastro de Livros</h2>
        <p>Logado como: <strong>${req.session.usuario}</strong></p>
        <form method="POST" action="/livros" class="card p-4 mb-4">
            <div class="mb-3">
                <label class="form-label">Título do Livro</label>
                <input type="text" name="titulo" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">Nome do Autor</label>
                <input type="text" name="autor" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">Código ISBN / Identificação</label>
                <input type="text" name="isbn" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary">Cadastrar</button>
            <a href="/menu" class="btn btn-secondary ms-2">Voltar ao Menu</a>
        </form>
    `);

    if (listaLivros.length > 0) {
        res.write(`<h3>Livros Cadastrados</h3>`);
        res.write(`
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>ISBN / Identificação</th>
                    </tr>
                </thead>
                <tbody>
        `);
        listaLivros.forEach(l => {
            res.write(`
                <tr>
                    <td>${l.titulo}</td>
                    <td>${l.autor}</td>
                    <td>${l.isbn}</td>
                </tr>
            `);
        });
        res.write(`</tbody></table>`);
    }

    res.write(rodape());
    res.end();
});

// POST Livros
app.post('/livros', (req, res) => {
    if (!req.session.usuario) {
        res.redirect('/login');
        return;
    }

    const { titulo, autor, isbn } = req.body;

    let erros = [];
    if (!titulo) erros.push("Título do livro não informado");
    if (!autor)  erros.push("Nome do autor não informado");
    if (!isbn)   erros.push("Código ISBN / identificação não informado");

    res.write(cabecalho('Cadastro de Livros'));
    res.write(navLogado());

    if (erros.length > 0) {
        res.write(`<div class="alert alert-danger"><strong>Erros encontrados:</strong><ul>`);
        erros.forEach(e => res.write(`<li>${e}</li>`));
        res.write(`</ul></div>`);
        res.write(`<a href="/livros" class="btn btn-secondary">Voltar</a>`);
    } else {
        listaLivros.push({ titulo, autor, isbn });

        res.write(`<div class="alert alert-success">Livro cadastrado com sucesso!</div>`);
        res.write(`<h3>Livros Cadastrados</h3>`);
        res.write(`
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>ISBN / Identificação</th>
                    </tr>
                </thead>
                <tbody>
        `);
        listaLivros.forEach(l => {
            res.write(`
                <tr>
                    <td>${l.titulo}</td>
                    <td>${l.autor}</td>
                    <td>${l.isbn}</td>
                </tr>
            `);
        });
        res.write(`</tbody></table>`);
        res.write(`
            <a href="/livros" class="btn btn-primary">Cadastrar outro livro</a>
            <a href="/menu" class="btn btn-secondary ms-2">Voltar ao Menu</a>
        `);
    }

    res.write(rodape());
    res.end();
});

// GET Leitores (protegido)
app.get('/leitores', (req, res) => {
    res.write(cabecalho('Cadastro de Leitores'));

    if (!req.session.usuario) {
        res.write(`
            <div class="alert alert-warning">Você precisa realizar o login para acessar esta página.</div>
            <a href="/login" class="btn btn-primary">Fazer Login</a>
        `);
        res.write(rodape());
        res.end();
        return;
    }

    res.write(navLogado());

    // Monta as opções do select com os livros cadastrados (renderizado no servidor)
    let opcoesLivros = `<option value="">-- Selecione um livro --</option>`;
    listaLivros.forEach(l => {
        opcoesLivros += `<option value="${l.titulo}">${l.titulo} (${l.isbn})</option>`;
    });

    res.write(`
        <h2>Cadastro de Leitores</h2>
        <p>Logado como: <strong>${req.session.usuario}</strong></p>
        <form method="POST" action="/leitores" class="card p-4 mb-4">
            <div class="mb-3">
                <label class="form-label">Nome do Leitor</label>
                <input type="text" name="nome" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">CPF / Identificação</label>
                <input type="text" name="cpf" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">Telefone para Contato</label>
                <input type="text" name="telefone" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">Data de Empréstimo</label>
                <input type="date" name="dataEmprestimo" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">Data de Devolução</label>
                <input type="date" name="dataDevolucao" class="form-control">
            </div>
            <div class="mb-3">
                <label class="form-label">Livro Emprestado</label>
                <select name="livro" class="form-select">
                    ${opcoesLivros}
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Cadastrar</button>
            <a href="/menu" class="btn btn-secondary ms-2">Voltar ao Menu</a>
        </form>
    `);

    if (listaLeitores.length > 0) {
        res.write(`<h3>Leitores Cadastrados</h3>`);
        res.write(`
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Nome</th>
                        <th>CPF / Identificação</th>
                        <th>Telefone</th>
                        <th>Empréstimo</th>
                        <th>Devolução</th>
                        <th>Livro</th>
                    </tr>
                </thead>
                <tbody>
        `);
        listaLeitores.forEach(r => {
            res.write(`
                <tr>
                    <td>${r.nome}</td>
                    <td>${r.cpf}</td>
                    <td>${r.telefone}</td>
                    <td>${r.dataEmprestimo}</td>
                    <td>${r.dataDevolucao}</td>
                    <td>${r.livro}</td>
                </tr>
            `);
        });
        res.write(`</tbody></table>`);
    }

    res.write(rodape());
    res.end();
});

// POST Leitores
app.post('/leitores', (req, res) => {
    if (!req.session.usuario) {
        res.redirect('/login');
        return;
    }

    const { nome, cpf, telefone, dataEmprestimo, dataDevolucao, livro } = req.body;

    let erros = [];
    if (!nome)           erros.push("Nome do leitor não informado");
    if (!cpf)            erros.push("CPF / identificação não informado");
    if (!telefone)       erros.push("Telefone não informado");
    if (!dataEmprestimo) erros.push("Data de empréstimo não informada");
    if (!dataDevolucao)  erros.push("Data de devolução não informada");
    if (!livro)          erros.push("Livro não selecionado");

    res.write(cabecalho('Cadastro de Leitores'));
    res.write(navLogado());

    if (erros.length > 0) {
        res.write(`<div class="alert alert-danger"><strong>Erros encontrados:</strong><ul>`);
        erros.forEach(e => res.write(`<li>${e}</li>`));
        res.write(`</ul></div>`);
        res.write(`<a href="/leitores" class="btn btn-secondary">Voltar</a>`);
    } else {
        listaLeitores.push({ nome, cpf, telefone, dataEmprestimo, dataDevolucao, livro });

        res.write(`<div class="alert alert-success">Leitor cadastrado com sucesso!</div>`);
        res.write(`<h3>Leitores Cadastrados</h3>`);
        res.write(`
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Nome</th>
                        <th>CPF / Identificação</th>
                        <th>Telefone</th>
                        <th>Empréstimo</th>
                        <th>Devolução</th>
                        <th>Livro</th>
                    </tr>
                </thead>
                <tbody>
        `);
        listaLeitores.forEach(r => {
            res.write(`
                <tr>
                    <td>${r.nome}</td>
                    <td>${r.cpf}</td>
                    <td>${r.telefone}</td>
                    <td>${r.dataEmprestimo}</td>
                    <td>${r.dataDevolucao}</td>
                    <td>${r.livro}</td>
                </tr>
            `);
        });
        res.write(`</tbody></table>`);
        res.write(`
            <a href="/leitores" class="btn btn-primary">Cadastrar outro leitor</a>
            <a href="/menu" class="btn btn-secondary ms-2">Voltar ao Menu</a>
        `);
    }

    res.write(rodape());
    res.end();
});

app.listen(porta, host, () => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
});