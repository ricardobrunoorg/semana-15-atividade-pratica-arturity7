// Trabalho Prático - Semana 15
// Lógica da página "Meus Favoritos": exibe apenas as receitas favoritadas
// pelo usuário atualmente logado (esta página exige login).

document.addEventListener('DOMContentLoaded', function () {
    // Como REQUIRE_LOGIN não foi definido como false nesta página,
    // o login.js já garantiu que existe um usuarioCorrente válido.
    carregarFavoritosDoUsuario();
});

function carregarFavoritosDoUsuario() {
    let idsFavoritos = getFavoritos(usuarioCorrente.id);
    let container = document.getElementById('listaCards');

    if (idsFavoritos.length === 0) {
        container.innerHTML = '<p>Você ainda não favoritou nenhuma receita. <a href="index.html">Voltar para a Home</a> e clique no coração das receitas que você gosta.</p>';
        return;
    }

    fetch(RECEITAS_API_URL)
        .then(response => response.json())
        .then(data => {
            listaReceitas = data;
            let favoritas = listaReceitas.filter(r => idsFavoritos.includes(r.id));
            renderizarReceitas(favoritas);
        })
        .catch(error => {
            console.error('Erro ao ler receitas via API JSONServer:', error);
            container.innerHTML = '<p class="text-danger">Não foi possível carregar suas receitas favoritas.</p>';
        });
}
