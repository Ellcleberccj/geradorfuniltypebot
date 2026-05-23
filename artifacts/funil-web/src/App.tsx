import { useState, useRef, useEffect } from "react";

const PRIMARY = "#6c47ff";

interface FormFields {
  nomeModelo: string;
  nomeCompletoModelo: string;
  idadeModelo: string;
  slugModelo: string;
  fotoPerfilUrl: string;
  audioUrl: string;
  imagemApresentacaoUrl: string;
  fotoAmostra1Url: string;
  fotoAmostra2Url: string;
  fotoAmostra3Url: string;
  fotoAmostra4Url: string;
  fotoAmostra5Url: string;
  fotoAmostra6Url: string;
  fotoAmostra7Url: string;
  linkEntregaConteudo: string;
  metaPixelId: string;
  metaAccessToken: string;
  contentName: string;
}

interface GenerateResult {
  success: boolean;
  slug: string;
  audioEmbedUrl: string;
  githubStatus: string;
  githubError?: string;
  jsonDownloadUrl: string;
  htmlDownloadUrl: string;
  imageLinks?: Record<string, string>;
}

const EMPTY: FormFields = {
  nomeModelo: "",
  nomeCompletoModelo: "",
  idadeModelo: "",
  slugModelo: "",
  fotoPerfilUrl: "",
  audioUrl: "",
  imagemApresentacaoUrl: "",
  fotoAmostra1Url: "",
  fotoAmostra2Url: "",
  fotoAmostra3Url: "",
  fotoAmostra4Url: "",
  fotoAmostra5Url: "",
  fotoAmostra6Url: "",
  fotoAmostra7Url: "",
  linkEntregaConteudo: "",
  metaPixelId: "",
  metaAccessToken: "",
  contentName: "",
};

const EMPTY_FILES: Record<string, File | null> = {
  fotoPerfilFile: null,
  imagemApresentacaoFile: null,
  fotoAmostra1File: null,
  fotoAmostra2File: null,
  fotoAmostra3File: null,
  fotoAmostra4File: null,
  fotoAmostra5File: null,
  fotoAmostra6File: null,
  fotoAmostra7File: null,
};

const LOADING_STEPS = [
  "Enviando imagens para ImgBB...",
  "Gerando HTML do áudio...",
  "Enviando HTML para GitHub...",
  "Gerando JSON Typebot...",
];

// ---------- small UI primitives ----------

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e0ea",
        borderRadius: 12,
        marginBottom: 20,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e2e0ea",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#ede9ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: PRIMARY,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#1a1625" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

function Grid({
  cols = 2,
  children,
}: {
  cols?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1.5px solid #e2e0ea",
  borderRadius: 8,
  fontSize: 14,
  color: "#1a1625",
  background: "#fafafa",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6b6880",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  span,
}: {
  label: string;
  name: keyof FormFields;
  value: string;
  onChange: (name: keyof FormFields, val: string) => void;
  placeholder?: string;
  type?: string;
  span?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        gridColumn: span ? "1 / -1" : undefined,
      }}
    >
      <label htmlFor={name} style={labelStyle}>
        {label} *
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => {
          e.target.style.borderColor = PRIMARY;
          e.target.style.boxShadow = `0 0 0 3px rgba(108,71,255,0.12)`;
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e0ea";
          e.target.style.boxShadow = "none";
          e.target.style.background = "#fafafa";
        }}
      />
    </div>
  );
}

function ImageField({
  label,
  urlName,
  fileName,
  urlValue,
  file,
  onUrlChange,
  onFileChange,
  span,
}: {
  label: string;
  urlName: keyof FormFields;
  fileName: string;
  urlValue: string;
  file: File | null;
  onUrlChange: (name: keyof FormFields, val: string) => void;
  onFileChange: (name: string, file: File | null) => void;
  span?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        gridColumn: span ? "1 / -1" : undefined,
      }}
    >
      <label style={labelStyle}>{label} *</label>

      <input
        type="url"
        value={file ? "" : urlValue}
        onChange={(e) => {
          if (!file) onUrlChange(urlName, e.target.value);
        }}
        placeholder={file ? "Arquivo selecionado (tem prioridade)" : "https://..."}
        disabled={!!file}
        style={{
          ...inputStyle,
          background: file ? "#f0fdf4" : "#fafafa",
          color: file ? "#16a34a" : "#1a1625",
          cursor: file ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!file) {
            e.target.style.borderColor = PRIMARY;
            e.target.style.boxShadow = `0 0 0 3px rgba(108,71,255,0.12)`;
            e.target.style.background = "#fff";
          }
        }}
        onBlur={(e) => {
          if (!file) {
            e.target.style.borderColor = "#e2e0ea";
            e.target.style.boxShadow = "none";
            e.target.style.background = "#fafafa";
          }
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onFileChange(fileName, f);
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (file) {
              onFileChange(fileName, null);
              if (fileRef.current) fileRef.current.value = "";
            } else {
              fileRef.current?.click();
            }
          }}
          style={{
            padding: "6px 12px",
            border: `1.5px solid ${file ? "#fca5a5" : "#e2e0ea"}`,
            borderRadius: 6,
            background: file ? "#fee2e2" : "#f5f4f9",
            color: file ? "#dc2626" : "#6b6880",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {file ? "✕ Remover" : "📎 Enviar arquivo"}
        </button>
        {file && (
          <span
            style={{
              fontSize: 12,
              color: "#16a34a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            ✓ {file.name}
          </span>
        )}
        {!file && (
          <span style={{ fontSize: 11, color: "#9ca3af", flex: 1 }}>
            Arquivo tem prioridade sobre URL
          </span>
        )}
      </div>
    </div>
  );
}

// ---------- icons ----------
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconImage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.58 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.64a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.72 16z" />
  </svg>
);
const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
  </svg>
);
const IconBolt = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconBoltSm = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IconWarn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ---------- main component ----------

export default function App() {
  const [form, setForm] = useState<FormFields>(EMPTY);
  const [files, setFiles] = useState<Record<string, File | null>>(EMPTY_FILES);
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      setStepIdx(0);
      return;
    }
    const id = setInterval(
      () => setStepIdx((i) => (i + 1) % LOADING_STEPS.length),
      2200,
    );
    return () => clearInterval(id);
  }, [loading]);

  function handleChange(name: keyof FormFields, val: string) {
    setForm((f) => ({ ...f, [name]: val }));
  }

  function handleFileChange(name: string, file: File | null) {
    setFiles((f) => ({ ...f, [name]: file }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      for (const [k, v] of Object.entries(form)) {
        formData.append(k, v);
      }
      for (const [k, f] of Object.entries(files)) {
        if (f) formData.append(k, f, f.name);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Erro desconhecido ao gerar o funil.");
      } else {
        setResult(json);
        setTimeout(
          () =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          100,
        );
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.audioEmbedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const btnStyle: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    textDecoration: "none",
    border: "1.5px solid",
    fontFamily: "inherit",
    transition: "all 0.15s",
  };

  return (
    <div
      style={{
        background: "#f5f4f9",
        minHeight: "100vh",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: PRIMARY,
              borderRadius: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              boxShadow: "0 4px 16px rgba(108,71,255,0.3)",
              color: "#fff",
            }}
          >
            <IconBolt />
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1625",
              letterSpacing: "-0.5px",
            }}
          >
            Gerador de Funil Typebot
          </h1>
          <p style={{ color: "#6b6880", fontSize: 15, marginTop: 6 }}>
            Preencha os dados da modelo e gere o JSON + áudio automaticamente
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error banner */}
          {error && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                color: "#dc2626",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Dados da Modelo */}
          <Section icon={<IconUser />} title="Dados da Modelo">
            <Grid cols={2}>
              <Field
                label="Nome da modelo"
                name="nomeModelo"
                value={form.nomeModelo}
                onChange={handleChange}
                placeholder="Ex: Bianca"
              />
              <Field
                label="Slug (identificador)"
                name="slugModelo"
                value={form.slugModelo}
                onChange={handleChange}
                placeholder="Ex: bianca"
              />
              <Field
                label="Nome completo"
                name="nomeCompletoModelo"
                value={form.nomeCompletoModelo}
                onChange={handleChange}
                placeholder="Ex: Bianca Santos"
                span
              />
              <Field
                label="Idade"
                name="idadeModelo"
                value={form.idadeModelo}
                onChange={handleChange}
                placeholder="Ex: 22"
              />
            </Grid>
          </Section>

          {/* Mídias */}
          <Section icon={<IconImage />} title="Mídias">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ImageField
                label="Foto de perfil"
                urlName="fotoPerfilUrl"
                fileName="fotoPerfilFile"
                urlValue={form.fotoPerfilUrl}
                file={files["fotoPerfilFile"]!}
                onUrlChange={handleChange}
                onFileChange={handleFileChange}
              />

              <Field
                label="URL do áudio"
                name="audioUrl"
                value={form.audioUrl}
                onChange={handleChange}
                placeholder="https://..."
                type="url"
              />

              <ImageField
                label="Imagem de apresentação"
                urlName="imagemApresentacaoUrl"
                fileName="imagemApresentacaoFile"
                urlValue={form.imagemApresentacaoUrl}
                file={files["imagemApresentacaoFile"]!}
                onUrlChange={handleChange}
                onFileChange={handleFileChange}
              />

              <Grid cols={2}>
                {(
                  [
                    ["Foto amostra 1", "fotoAmostra1Url", "fotoAmostra1File"],
                    ["Foto amostra 2", "fotoAmostra2Url", "fotoAmostra2File"],
                    ["Foto amostra 3", "fotoAmostra3Url", "fotoAmostra3File"],
                    ["Foto amostra 4", "fotoAmostra4Url", "fotoAmostra4File"],
                    ["Foto amostra 5", "fotoAmostra5Url", "fotoAmostra5File"],
                    ["Foto amostra 6", "fotoAmostra6Url", "fotoAmostra6File"],
                    ["Foto amostra 7", "fotoAmostra7Url", "fotoAmostra7File"],
                  ] as [string, keyof FormFields, string][]
                ).map(([label, urlName, fileName]) => (
                  <ImageField
                    key={fileName}
                    label={label}
                    urlName={urlName}
                    fileName={fileName}
                    urlValue={form[urlName]}
                    file={files[fileName]!}
                    onUrlChange={handleChange}
                    onFileChange={handleFileChange}
                  />
                ))}
              </Grid>
            </div>
          </Section>

          {/* Entrega */}
          <Section icon={<IconPhone />} title="Entrega">
            <Field
              label="Link de entrega do conteúdo"
              name="linkEntregaConteudo"
              value={form.linkEntregaConteudo}
              onChange={handleChange}
              placeholder="https://..."
              type="url"
            />
          </Section>

          {/* Meta CAPI */}
          <Section icon={<IconChart />} title="Meta CAPI">
            <Grid cols={2}>
              <Field
                label="Pixel ID"
                name="metaPixelId"
                value={form.metaPixelId}
                onChange={handleChange}
                placeholder="Ex: 123456789"
              />
              <Field
                label="Nome do conteúdo"
                name="contentName"
                value={form.contentName}
                onChange={handleChange}
                placeholder="Ex: Pacote Premium"
              />
              <Field
                label="Access Token"
                name="metaAccessToken"
                value={form.metaAccessToken}
                onChange={handleChange}
                placeholder="EAA..."
                span
              />
            </Grid>
          </Section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: loading ? "rgba(108,71,255,0.65)" : PRIMARY,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 8,
              boxShadow: "0 4px 12px rgba(108,71,255,0.25)",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: "2.5px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {LOADING_STEPS[stepIdx]}
              </>
            ) : (
              <>
                <IconBoltSm />
                Gerar Funil
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div ref={resultRef} style={{ marginTop: 20 }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e0ea",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "#dcfce7",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#16a34a",
                    }}
                  >
                    <IconCheck />
                  </span>
                  <span
                    style={{ fontWeight: 600, fontSize: 15, color: "#16a34a" }}
                  >
                    Funil gerado com sucesso!
                  </span>
                </div>

                <div style={{ padding: 24 }}>
                  {result.githubStatus === "Erro" && result.githubError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        background: "#fef3c7",
                        border: "1px solid #fcd34d",
                        borderRadius: 8,
                        padding: "12px 14px",
                        marginBottom: 16,
                        fontSize: 13,
                        color: "#92400e",
                      }}
                    >
                      <IconWarn />
                      <span>
                        <strong>Aviso GitHub:</strong> {result.githubError}
                      </span>
                    </div>
                  )}

                  {/* Audio URL */}
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6b6880",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 6,
                    }}
                  >
                    Link do áudio (GitHub Pages)
                  </p>
                  <div
                    style={{
                      background: "#ede9ff",
                      border: "1.5px solid #c4b5fd",
                      borderRadius: 8,
                      padding: "12px 16px",
                      wordBreak: "break-all",
                      fontSize: 13,
                      color: PRIMARY,
                      fontWeight: 500,
                      marginBottom: 8,
                    }}
                  >
                    {result.audioEmbedUrl}
                  </div>
                  <p style={{ fontSize: 13, color: "#6b6880", marginBottom: 20 }}>
                    {result.githubStatus === "Sucesso"
                      ? "✅ Arquivo enviado ao GitHub com sucesso"
                      : "⚠️ Upload para GitHub falhou — arquivos salvos localmente"}
                  </p>

                  {/* Image links */}
                  {result.imageLinks &&
                    Object.keys(result.imageLinks).length > 0 && (
                      <details style={{ marginBottom: 20 }}>
                        <summary
                          style={{
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#6b6880",
                            userSelect: "none",
                            marginBottom: 8,
                          }}
                        >
                          🖼 Links finais das imagens usadas
                        </summary>
                        <div
                          style={{
                            background: "#f5f4f9",
                            borderRadius: 8,
                            padding: "12px 14px",
                            marginTop: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {Object.entries(result.imageLinks).map(
                            ([label, url]) => (
                              <div
                                key={label}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  fontSize: 12,
                                  alignItems: "flex-start",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#6b6880",
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    minWidth: 150,
                                  }}
                                >
                                  {label}:
                                </span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: PRIMARY,
                                    wordBreak: "break-all",
                                    textDecoration: "none",
                                  }}
                                >
                                  {url}
                                </a>
                              </div>
                            ),
                          )}
                        </div>
                      </details>
                    )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        ...btnStyle,
                        background: copied ? "#dcfce7" : PRIMARY,
                        borderColor: copied ? "#86efac" : PRIMARY,
                        color: copied ? "#16a34a" : "#fff",
                      }}
                    >
                      <IconCopy />
                      {copied ? "Link copiado!" : "Copiar link do áudio"}
                    </button>
                    <a
                      href={result.jsonDownloadUrl}
                      download
                      style={{
                        ...btnStyle,
                        background: "transparent",
                        borderColor: "#e2e0ea",
                        color: "#1a1625",
                      }}
                    >
                      <IconDownload />
                      Baixar JSON Typebot
                    </a>
                    <a
                      href={result.htmlDownloadUrl}
                      download
                      style={{
                        ...btnStyle,
                        background: "transparent",
                        borderColor: "#e2e0ea",
                        color: "#1a1625",
                      }}
                    >
                      <IconDownload />
                      Baixar HTML do áudio
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          h1 { font-size: 22px !important; }
        }
        details summary::-webkit-details-marker { color: #6b6880; }
      `}</style>
    </div>
  );
}
