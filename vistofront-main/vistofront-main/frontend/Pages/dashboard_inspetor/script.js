// Dashboard do Inspetor - Integração com API (com rotas reais)

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "../login/";
      return;
    }
  
    try {
      // 1. Dados do usuário
      const resUser = await fetch("https://vistotrack.com/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = await resUser.json();
      document.getElementById("inspetor-nome").textContent = user.name;
  
      // 2. Relógio ao vivo
      setInterval(() => {
        const agora = new Date();
        document.getElementById("relogio-digital").textContent = agora.toLocaleTimeString();
      }, 1000);
  
      // 3. Resumo geral de inspeções
      const resInspecoes = await fetch("https://vistotrack.com/api/inspecoes/listar", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lista = await resInspecoes.json();
      const pendentes = lista.filter(i => i.status === "pendente");
      const andamento = lista.filter(i => i.status === "andamento");
      const concluidas = lista.filter(i => i.status === "concluida");
      document.getElementById("pendentes").textContent = pendentes.length;
      document.getElementById("andamento").textContent = andamento.length;
      document.getElementById("concluidas").textContent = concluidas.length;
  
      // 4. Histórico do inspetor
      const resHistorico = await fetch(`https://vistotrack.com/api/inspecoes/historico?user_email=${user.email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historico = await resHistorico.json();
      const historicoBody = document.getElementById("historico-inspecoes");
      historicoBody.innerHTML = "";
      historico.slice(0, 5).forEach(inspecao => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${inspecao.placa}</td>
          <td>${inspecao.modelo || '-'}</td>
          <td>${inspecao.status}</td>
          <td><button onclick="verDetalhes(${inspecao.id})">Ver Detalhes</button></td>
        `;
        historicoBody.appendChild(tr);
      });
  
      // 5. Próximas inspeções de hoje
      const hoje = new Date().toISOString().split("T")[0];
      const hojeList = lista.filter(i => i.data === hoje && i.status === "pendente");
      const ul = document.getElementById("inspecoes-hoje");
      ul.innerHTML = "";
      hojeList.slice(0, 3).forEach(i => {
        const li = document.createElement("li");
        li.textContent = `${i.horario} — ${i.placa}`;
        ul.appendChild(li);
      });
      if (hojeList.length === 0) {
        ul.innerHTML = "<li>Nenhuma inspeção agendada para hoje.</li>";
      }
  
      // 6. Câmeras ativas
      const resCameras = await fetch("https://vistotrack.com/api/cameras/ativas", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cameras = await resCameras.json();
      const cameraContainer = document.getElementById("lista-cameras");
      cameraContainer.innerHTML = "";
      cameras.forEach((cam, i) => {
        const div = document.createElement("div");
        div.innerHTML = `<iframe src="${cam.stream_url}" title="${cam.nome}"></iframe>`;
        cameraContainer.appendChild(div);
      });
  
      // 7. Notificações
      const resNotificacoes = await fetch("https://vistotrack.com/api/notificacoes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notificacoes = await resNotificacoes.json();
      const listaAlertas = document.getElementById("lista-alertas");
      listaAlertas.innerHTML = "";
      notificacoes.forEach(msg => {
        const li = document.createElement("li");
        li.textContent = msg;
        listaAlertas.appendChild(li);
      });
  
    } catch (err) {
      console.error(err);
      //alert("Erro ao carregar dados do dashboard.");
    }
  });
  
  // Ações auxiliares
  function verDetalhes(id) {
    window.location.href = `../inspecao/detalhes?id=${id}`;
  }
  
  function iniciarProximaInspecao() {
    // Requisição para buscar próxima inspeção pendente do dia
    alert("Função iniciar inspeção em desenvolvimento. Em breve será conectada à API de fila.");
  }
  
  // 👉 Referências aos elementos
const modalNovaCamera = document.getElementById("modal-nova-camera-section");
const inputTipoCamera = document.getElementById("camera-type");
const inputPatioNome = document.getElementById("patio-nome");
const btnCancelar = document.getElementById("cancelar-modal-camera");
const btnConfirmar = document.getElementById("confirmar-modal-camera");

let patioIdGlobal = null; // ← usado na chamada das APIs

// 🚪 Abrir o modal
function abrirModalNovaCamera() {
  modalNovaCamera.style.display = "flex";

  const token = localStorage.getItem("access_token");
  fetch("https://vistotrack.com/api/users/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(user => {
      // Buscar pátio vinculado
      fetch("https://vistotrack.com/api/patios/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(patio => {
          inputPatioNome.value = patio.nome;
          patioIdGlobal = patio.id;
        });
    });
}

// ❌ Fechar o modal
function fecharModalNovaCamera() {
  modalNovaCamera.style.display = "none";
}

// ✅ Confirmar criação da nova câmera
async function confirmarNovaCamera() {
  const tipo = inputTipoCamera.value;
  const token = localStorage.getItem("access_token");

  // 1. Chamar micro RTMP
  const resRTMP = await fetch("http://vistotrack.com:9000/rtmp/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patio_id: patioIdGlobal,
      camera_type: tipo
    })
  });

  const dataRTMP = await resRTMP.json();
  const cameraURL = dataRTMP.rtmp_url;

  // 2. Chamar micro AI
  await fetch("http://vistotrack.com:10000/ai/register_patio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + "SEU_TOKEN_AI_FIXO"
    },
    body: JSON.stringify({
      patio_id: patioIdGlobal,
      cameras: [
        {
          tipo: tipo,
          url: cameraURL
        }
      ]
    })
  });

  alert("Câmera adicionada com sucesso: " + cameraURL);
  fecharModalNovaCamera();
}

  
  function abrirModalPerfil() {
    window.location.href = `../landingpage/`;
  }
  
  function abrirModalFinalizar() {
    const id = prompt("Digite o ID da inspeção para finalizar:");
    const notas = prompt("Insira observações sobre a conclusão:");
    const token = localStorage.getItem("access_token");
  
    fetch(`https://vistotrack.com/api/inspecoes/${id}/finalizar`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ concluido_por: "inspetor@email.com", notas })
    })
      .then(res => {
        if (res.ok) {
          alert("Inspeção finalizada com sucesso.");
          location.reload();
        } else {
          alert("Erro ao finalizar inspeção.");
        }
      });
}
  