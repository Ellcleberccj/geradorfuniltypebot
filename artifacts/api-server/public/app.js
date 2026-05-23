(function () {
  const form = document.getElementById("funnel-form");
  const btnSubmit = document.getElementById("btn-submit");
  const btnText = document.getElementById("btn-text");
  const spinner = document.getElementById("spinner");
  const globalError = document.getElementById("global-error");
  const resultCard = document.getElementById("result-card");
  const resultCardInner = document.getElementById("result-card-inner");
  const resultIcon = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();
    globalError.classList.remove("visible");
    resultCard.classList.remove("visible");

    const data = {};
    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      data[input.name] = input.value.trim();
    });

    btnSubmit.disabled = true;
    btnText.textContent = "Gerando funil...";
    spinner.style.display = "block";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        showError(json.error || "Erro desconhecido ao gerar o funil.");
        return;
      }

      showResult(json);
    } catch (err) {
      showError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = "Gerar Funil";
      spinner.style.display = "none";
    }
  });

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach((el) => {
      el.style.display = "none";
      el.textContent = "";
    });
    document.querySelectorAll("input.error").forEach((el) => {
      el.classList.remove("error");
    });
  }

  function showError(msg) {
    globalError.textContent = msg;
    globalError.classList.add("visible");
    globalError.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showResult(data) {
    resultCardInner.className = "card result-success";
    resultIcon.innerHTML = iconCheck();
    resultTitle.textContent = "Funil gerado com sucesso!";

    const body = document.getElementById("result-body");
    body.innerHTML = "";

    if (data.githubStatus === "Erro" && data.githubError) {
      const warn = document.createElement("div");
      warn.className = "result-warning-banner";
      warn.innerHTML = `${iconWarn()} <span><strong>Aviso GitHub:</strong> ${escHtml(data.githubError)}</span>`;
      body.appendChild(warn);
    }

    const linkBox = document.createElement("div");
    linkBox.className = "audio-link-box";
    linkBox.textContent = data.audioEmbedUrl;
    body.appendChild(linkBox);

    const ghStatus = document.createElement("p");
    ghStatus.style.cssText = "font-size:13px;color:var(--text-muted);margin-bottom:16px;";
    ghStatus.textContent =
      data.githubStatus === "Sucesso"
        ? "✅ Arquivo enviado ao GitHub com sucesso"
        : "⚠️ Upload para GitHub falhou — arquivos salvos localmente";
    body.appendChild(ghStatus);

    const actions = document.createElement("div");
    actions.className = "action-buttons";

    const btnCopy = document.createElement("button");
    btnCopy.className = "btn btn-primary-sm";
    btnCopy.innerHTML = `${iconCopy()} Copiar link do áudio`;
    btnCopy.addEventListener("click", function () {
      navigator.clipboard.writeText(data.audioEmbedUrl).then(() => {
        btnCopy.classList.add("btn-copied");
        btnCopy.innerHTML = `${iconCheck()} Link copiado!`;
        setTimeout(() => {
          btnCopy.classList.remove("btn-copied");
          btnCopy.innerHTML = `${iconCopy()} Copiar link do áudio`;
        }, 2000);
      });
    });

    const btnJson = document.createElement("a");
    btnJson.className = "btn btn-outline";
    btnJson.href = data.jsonDownloadUrl;
    btnJson.download = "";
    btnJson.innerHTML = `${iconDownload()} Baixar JSON Typebot`;

    const btnHtml = document.createElement("a");
    btnHtml.className = "btn btn-outline";
    btnHtml.href = data.htmlDownloadUrl;
    btnHtml.download = "";
    btnHtml.innerHTML = `${iconDownload()} Baixar HTML do áudio`;

    actions.appendChild(btnCopy);
    actions.appendChild(btnJson);
    actions.appendChild(btnHtml);
    body.appendChild(actions);

    resultCard.classList.add("visible");
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function escHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function iconCheck() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  }
  function iconWarn() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  }
  function iconCopy() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  }
  function iconDownload() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  }
})();
