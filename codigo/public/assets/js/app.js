// Trabalho Prático - Semana 15
// Lógica da Home-page: carrega as receitas do JSON Server e gerencia os favoritos
// personalizados por usuário (armazenados no localStorage).

const RECEITAS_API_URL = '/receitas';

// -----------------------------------------------------------------------
// FAVORITOS - Funções utilitárias (compartilhadas com favoritos.js)
// Os favoritos são salvos no localStorage com chave `favoritos_<idDoUsuario>`
// e o valor é um array com os ids das receitas favoritadas, ex: [3, 7, 12]
// -----------------------------------------------------------------------

function chaveFavoritos(idUsuario) {
    return `favoritos_${idUsuario}`;
}

function getFavoritos(idUsuario) {
    if (!idUsuario) return [];
    let dados = localStorage.getItem(chaveFavoritos(idUsuario));
    return dados ? JSON.parse(dados) : [];
}

function salvarFavoritos(idUsuario, listaIds) {
    localStorage.setItem(chaveFavoritos(idUsuario), JSON.stringify(listaIds));
}

function isFavorito(idUsuario, idReceita) {
    return getFavoritos(idUsuario).includes(idReceita);
}

// Alterna o status de favorito de uma receita para o usuário logado.
// Retorna o novo status (true = favoritado, false = removido dos favoritos).
function toggleFavorito(idUsuario, idReceita) {
    let favoritos = getFavoritos(idUsuario);
    let index = favoritos.indexOf(idReceita);
    let favoritado;

    if (index >= 0) {
        favoritos.splice(index, 1);
        favoritado = false;
    } else {
        favoritos.push(idReceita);
        favoritado = true;
    }

    salvarFavoritos(idUsuario, favoritos);
    return favoritado;
}

// -----------------------------------------------------------------------
// HOME-PAGE - Carregamento e renderização dos cards de receitas
// -----------------------------------------------------------------------

var listaReceitas = [];

function carregarReceitas() {
    fetch(RECEITAS_API_URL)
        .then(response => response.json())
        .then(data => {
            listaReceitas = data;
            renderizarReceitas(listaReceitas);
        })
        .catch(error => {
            console.error('Erro ao ler receitas via API JSONServer:', error);
            document.getElementById('listaCards').innerHTML =
                '<p class="text-danger">Não foi possível carregar as receitas. Verifique se o JSON Server está em execução.</p>';
        });
}

function criarCardReceita(receita) {
    let idUsuario = isUserLoggedIn() ? usuarioCorrente.id : null;
    let favoritado = isFavorito(idUsuario, receita.id);

    return `
    <div class="col-md-4 col-sm-6 mb-4">
        <div class="card h-100 receita-card ${favoritado ? 'favoritado' : ''}" data-id="${receita.id}">
            <img src="${receita.imagem}" class="card-img-top" alt="${receita.nome}">
            <button class="btn-favoritar" data-id="${receita.id}" title="Favoritar">
                <i class="bi ${favoritado ? 'bi-heart-fill' : 'bi-heart'}"></i>
            </button>
            <div class="card-body d-flex flex-column">
                <span class="badge bg-secondary mb-2 align-self-start">${receita.categoria}</span>
                <h5 class="card-title">${receita.nome}</h5>
                <p class="card-text">${receita.descricao}</p>
                <ul class="list-unstyled small text-muted mb-3">
                    <li><i class="bi bi-clock"></i> ${receita.tempoPreparo}</li>
                    <li><i class="bi bi-bar-chart"></i> Dificuldade: ${receita.dificuldade}</li>
                </ul>
            </div>
        </div>
    </div>`;
}

function renderizarReceitas(receitas) {
    let container = document.getElementById('listaCards');
    if (!container) return;

    if (receitas.length === 0) {
        container.innerHTML = '<p>Nenhuma receita encontrada.</p>';
        return;
    }

    container.innerHTML = receitas.map(criarCardReceita).join('');
    associarEventosFavoritar();
}

// Associa o listener de clique a cada botão de favoritar renderizado
function associarEventosFavoritar() {
    document.querySelectorAll('.btn-favoritar').forEach(botao => {
        botao.addEventListener('click', function (event) {
            event.preventDefault();
            let idReceita = parseInt(this.getAttribute('data-id'));
            onCliqueFavoritar(idReceita, this);
        });
    });
}

// Trata o clique no ícone de favoritar de um card
function onCliqueFavoritar(idReceita, botao) {
    // Bloqueia a funcionalidade se o usuário não estiver logado
    if (!isUserLoggedIn()) {
        let irParaLogin = confirm('Você precisa estar logado para favoritar receitas.\nDeseja ir para a tela de login agora?');
        if (irParaLogin) {
            window.location.href = LOGIN_URL;
        }
        return;
    }

    let favoritado = toggleFavorito(usuarioCorrente.id, idReceita);

    // Na página "Meus Favoritos", ao desfavoritar o card deve sumir da lista imediatamente
    if (!favoritado && document.body.dataset.page === 'favoritos') {
        let colunaCard = botao.closest('.col-md-4, .col-sm-6');
        if (colunaCard) {
            colunaCard.remove();
        }
        let container = document.getElementById('listaCards');
        if (container && container.children.length === 0) {
            container.innerHTML = '<p>Você ainda não favoritou nenhuma receita. <a href="index.html">Voltar para a Home</a> e clique no coração das receitas que você gosta.</p>';
        }
        return;
    }

    // Atualiza visualmente o ícone e o card
    let icone = botao.querySelector('i');
    let card = botao.closest('.receita-card');

    if (favoritado) {
        icone.classList.remove('bi-heart');
        icone.classList.add('bi-heart-fill');
        card.classList.add('favoritado');
    } else {
        icone.classList.remove('bi-heart-fill');
        icone.classList.add('bi-heart');
        card.classList.remove('favoritado');
    }
}

// Filtra os cards exibidos por categoria
function filtrarCategoria(categoria) {
    if (!categoria || categoria === 'todas') {
        renderizarReceitas(listaReceitas);
    } else {
        renderizarReceitas(listaReceitas.filter(r => r.categoria === categoria));
    }
}

// Inicializa a página Home assim que o DOM estiver pronto.
// Obs: esta auto-inicialização só ocorre se existir o filtro de categorias
// na página (presente apenas em index.html). A página favoritos.html usa
// as funções deste arquivo, mas controla seu próprio carregamento em favoritos.js.
document.addEventListener('DOMContentLoaded', function () {
    let filtro = document.getElementById('filtroCategoria');
    if (filtro) {
        carregarReceitas();
        filtro.addEventListener('change', function () {
            filtrarCategoria(this.value);
        });
    }
});
