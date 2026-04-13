document.addEventListener("DOMContentLoaded", () => {

// =========================================
// SUPABASE
// =========================================
const supabase = window.supabase.createClient(
  "https://qzxamhrpehmnjaieirnf.supabase.co",
  "sb_publishable_MszvmkHkOm93jO1ybpcTCA_pcUHsQSx"
);

// =========================================
// ELEMENTOS
// =========================================
const grid = document.getElementById("recipeGrid");

const publishForm = document.getElementById("publishForm");
const publishModal = document.getElementById("publishModal");
const publishButton = document.getElementById("publishButton");
const closePublishModal = document.getElementById("closePublishModal");

const recipeModal = document.getElementById("recipeModal");
const closeModalBtn = document.getElementById("closeModal");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");

// =========================================
// ESTADO
// =========================================
let user = null;
let editandoId = null; 

// =========================================
// LOGIN
// =========================================
loginBtn.addEventListener("click", async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: senhaInput.value
  });

  if (error) {
    alert("Login inválido");
    return;
  }

  user = data.user;
  atualizarUI();
});

// =========================================
// LOGOUT
// =========================================
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  user = null;
  atualizarUI();
});

// =========================================
// UI
// =========================================
function atualizarUI() {
  user
    ? document.body.classList.add("logado")
    : document.body.classList.remove("logado");
}

// =========================================
// SESSÃO
// =========================================
async function verificarSessao() {
  const { data } = await supabase.auth.getUser();
  user = data.user;
  atualizarUI();
}

// =========================================
// MODAIS
// =========================================
publishButton.addEventListener("click", () => {
  if (!user) return alert("Faça login");
  editandoId = null;
  publishForm.reset();
  publishModal.classList.add("show");
});

closePublishModal.addEventListener("click", () => {
  publishModal.classList.remove("show");
});

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    recipeModal.classList.remove("show");
  });
}

// =========================================
// YOUTUBE (VERSÃO ESTÁVEL)
// =========================================
function converterYouTube(url) {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[7].length === 11) ? match[7] : null;

  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

// =========================================
// UPLOAD
// =========================================
async function uploadImagem(file) {
  if (!file) return null;
  const nome = Date.now() + "_" + file.name;
  await supabase.storage.from("receitas").upload(nome, file);
  const { data } = supabase.storage.from("receitas").getPublicUrl(nome);
  return data.publicUrl;
}

// =========================================
// CARREGAR RECEITAS
// =========================================
async function carregarReceitas() {
  const { data } = await supabase.from("receitas").select("*");

  grid.innerHTML = "";

  // 🔥 AGRUPA POR TURMA
  const grupos = {};

  for (let r of data) {
    const turma = r.turma || "Sem turma";

    if (!grupos[turma]) {
      grupos[turma] = [];
    }

    grupos[turma].push(r);
  }

  // 🔥 RENDERIZA POR TURMA
  for (let turma in grupos) {

    // título da turma (só aparece se tiver receitas)
    const titulo = document.createElement("h2");
    titulo.innerText = "Turma " + turma;
    titulo.style.margin = "20px 0 10px";
    titulo.style.gridColumn = "1 / -1"; // 🔥 ESSENCIAL
    grid.appendChild(titulo);

    // container da turma
    const container = document.createElement("div");
    container.classList.add("turma-grid");

    for (let r of grupos[turma]) {

      const card = document.createElement("div");
      card.classList.add("recipe-card");

      card.innerHTML = `
        <img src="${r.imagem}">
        <h3>${r.titulo}</h3>
        <p>${r.descricao}</p>

        <p style="font-size:12px;color:#666;">
          👤 ${r.autor || "Aluno"} — Turma ${r.turma || "-"}
        </p>

        <button class="ver">Ver</button>
        <button class="admin editar">Editar</button>
        <button class="admin excluir">Excluir</button>
        <button class="admin semana">⭐</button>
      `;

      // 🔥 MANTÉM TODAS TUAS FUNÇÕES
      card.querySelector(".ver").onclick = () => abrirModal(r);
      card.querySelector(".editar").onclick = () => abrirEditar(r);

      card.querySelector(".excluir").onclick = async () => {
        await supabase.from("receitas").delete().eq("id", r.id);
        carregarReceitas();
      };

      card.querySelector(".semana").onclick = async () => {
        await supabase.from("receitas").update({ destaque_semana: false });
        await supabase.from("receitas")
          .update({ destaque_semana: true })
          .eq("id", r.id);
        carregarSemana();
      };

      container.appendChild(card);
    }

    grid.appendChild(container);
  }

  atualizarUI();
}

// =========================================
// EDITAR
// =========================================
function abrirEditar(r) {
  editandoId = r.id;
  document.getElementById("newTitle").value = r.titulo;
  document.getElementById("newCategory").value = r.categoria;
  document.getElementById("newTime").value = r.tempo;
  document.getElementById("newLevel").value = r.nivel;
  document.getElementById("newDescription").value = r.descricao;
  document.getElementById("newVideo").value = r.video;
  document.getElementById("newIngredients").value = r.ingredientes || "";
  document.getElementById("newSteps").value = r.modo_preparo || "";
  document.getElementById("newClass").value = r.turma || ""
  publishModal.classList.add("show");
}

// =========================================
// MODAL RECEITA (CORREÇÃO DEFINITIVA)
// =========================================
function abrirModal(r) {
  document.getElementById("modalTitle").innerText = r.titulo;
  document.getElementById("modalDescription").innerText = r.descricao;
  document.getElementById("modalImage").src = r.imagem;
  document.getElementById("modalIngredients").innerHTML =
  (r.ingredientes || "")
    .split("\n")
    .map(i => `<li>${i}</li>`)
    .join("");

document.getElementById("modalSteps").innerHTML =
  (r.modo_preparo || "")
    .split("\n")
    .map((p, i) => `<li>${i + 1}. ${p}</li>`)
    .join("");
  const videoArea = document.querySelector(".modal-video");
  const embed = converterYouTube(r.video);

  if (embed) {
    // Adicionado style forçado e políticas de origem para evitar o erro de carregamento
    videoArea.innerHTML = `
      <div class="video-wrapper" style="position:relative; padding-bottom:56.25%; height:0; background:#000;">
        <iframe
          src="${embed}"
          style="position:absolute; top:0; left:0; width:100%; height:100%;"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen>
        </iframe>
      </div>
    `;
  } else {
    videoArea.innerHTML = "";
  }

  if (r.video) {
    videoArea.innerHTML += `
      <div style="margin-top:10px; text-align:center;">
        <a href="${r.video}" target="_blank" style="color:#ff6600; font-weight:bold; text-decoration:none;">
          ▶ Assistir no YouTube
        </a>
      </div>
    `;
  }

  recipeModal.classList.add("show");
}

// =========================================
// PUBLICAR / EDITAR
// =========================================
publishForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("newImage").files[0];
  let imagem = null;

  // só faz upload se realmente tiver imagem nova
  if (file && file.size > 0) {
    imagem = await uploadImagem(file);
  }

  const dados = {
    titulo: newTitle.value,
    categoria: newCategory.value,
    tempo: newTime.value,
    nivel: newLevel.value,
    descricao: newDescription.value,
    video: newVideo.value,
    ingredientes: newIngredients.value,
    modo_preparo: newSteps.value,
    autor: newAuthor.value,
    turma: newClass.value
  };

  // 🔥 só adiciona imagem se existir (não sobrescreve no update)
  if (imagem !== null) {
    dados.imagem = imagem;
  }

  if (editandoId) {
    await supabase
      .from("receitas")
      .update(dados)
      .eq("id", editandoId);
  } else {
    await supabase
      .from("receitas")
      .insert([dados]);
  }

  editandoId = null;
  publishForm.reset();
  publishModal.classList.remove("show");

  carregarReceitas();
});
// =========================================
// DESTAQUE
// =========================================
async function carregarSemana() {
  const { data } = await supabase
    .from("receitas")
    .select("*")
    .eq("destaque_semana", true)
    .limit(1);

  if (!data || !data.length) return;

  const r = data[0];
  document.querySelector(".hero-bottom h3").innerText = r.titulo;
  document.querySelector(".hero-bottom p").innerText = r.descricao;
  document.querySelector(".hero-image").style.backgroundImage = `url(${r.imagem})`;
}

// =========================================
// INIT
// =========================================
verificarSessao();
carregarReceitas();
carregarSemana();

});