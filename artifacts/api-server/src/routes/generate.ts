import { Router } from "express";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { replacePlaceholders } from "../lib/replace-placeholders.js";
import { uploadToGithub } from "../lib/github.js";
import { uploadImageToImgBB } from "../lib/imgbb.js";

const router = Router();

const artifactDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 32 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  },
});

const IMAGE_FIELD_NAMES = [
  "fotoPerfilFile",
  "imagemApresentacaoFile",
  "fotoAmostra1File",
  "fotoAmostra2File",
  "fotoAmostra3File",
  "fotoAmostra4File",
  "fotoAmostra5File",
  "fotoAmostra6File",
  "fotoAmostra7File",
] as const;

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function isValidUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

async function resolveImageUrl(
  file: Express.Multer.File | undefined,
  manualUrl: string | undefined,
  fieldLabel: string,
): Promise<string> {
  if (file) {
    const imgbbKey = process.env["IMGBB_API_KEY"] ?? "3023baf3779dc86b29072d69dc042047";
    if (!imgbbKey) {
      throw new Error(
        "IMGBB_API_KEY não configurada. Configure a chave no Replit Secrets ou use URLs manuais.",
      );
    }
    return uploadImageToImgBB(file.buffer, file.originalname, imgbbKey);
  }
  if (!manualUrl || !manualUrl.trim()) {
    throw new Error(`Campo obrigatório: ${fieldLabel} (URL ou arquivo)`);
  }
  if (!isValidUrl(manualUrl)) {
    throw new Error(`${fieldLabel} deve começar com http:// ou https://`);
  }
  return manualUrl;
}

router.post(
  "/generate",
  upload.fields(IMAGE_FIELD_NAMES.map((f) => ({ name: f, maxCount: 1 }))),
  async (req, res) => {
    const body = req.body as Record<string, string>;
    const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
    const getFile = (name: string) => files[name]?.[0];

    const textRequired = [
      "slugModelo",
      "nomeModelo",
      "nomeCompletoModelo",
      "idadeModelo",
      "audioUrl",
      "linkEntregaConteudo",
      "metaPixelId",
      "metaAccessToken",
      "contentName",
    ] as const;

    for (const field of textRequired) {
      if (!body[field] || !String(body[field]).trim()) {
        res
          .status(400)
          .json({ success: false, error: `Campo obrigatório: ${field}` });
        return;
      }
    }

    if (!isValidUrl(String(body["audioUrl"]))) {
      res.status(400).json({
        success: false,
        error: "audioUrl deve começar com http:// ou https://",
      });
      return;
    }
    if (!isValidUrl(String(body["linkEntregaConteudo"]))) {
      res.status(400).json({
        success: false,
        error: "linkEntregaConteudo deve começar com http:// ou https://",
      });
      return;
    }

    const slug = normalizeSlug(body["slugModelo"]!);
    if (!slug) {
      res.status(400).json({
        success: false,
        error: "slugModelo inválido após normalização.",
      });
      return;
    }

    try {
      const [
        fotoPerfilUrlFinal,
        imagemApresentacaoUrlFinal,
        fotoAmostra1UrlFinal,
        fotoAmostra2UrlFinal,
        fotoAmostra3UrlFinal,
        fotoAmostra4UrlFinal,
        fotoAmostra5UrlFinal,
        fotoAmostra6UrlFinal,
        fotoAmostra7UrlFinal,
      ] = await Promise.all([
        resolveImageUrl(
          getFile("fotoPerfilFile"),
          body["fotoPerfilUrl"],
          "fotoPerfil",
        ),
        resolveImageUrl(
          getFile("imagemApresentacaoFile"),
          body["imagemApresentacaoUrl"],
          "imagemApresentacao",
        ),
        resolveImageUrl(
          getFile("fotoAmostra1File"),
          body["fotoAmostra1Url"],
          "fotoAmostra1",
        ),
        resolveImageUrl(
          getFile("fotoAmostra2File"),
          body["fotoAmostra2Url"],
          "fotoAmostra2",
        ),
        resolveImageUrl(
          getFile("fotoAmostra3File"),
          body["fotoAmostra3Url"],
          "fotoAmostra3",
        ),
        resolveImageUrl(
          getFile("fotoAmostra4File"),
          body["fotoAmostra4Url"],
          "fotoAmostra4",
        ),
        resolveImageUrl(
          getFile("fotoAmostra5File"),
          body["fotoAmostra5Url"],
          "fotoAmostra5",
        ),
        resolveImageUrl(
          getFile("fotoAmostra6File"),
          body["fotoAmostra6Url"],
          "fotoAmostra6",
        ),
        resolveImageUrl(
          getFile("fotoAmostra7File"),
          body["fotoAmostra7Url"],
          "fotoAmostra7",
        ),
      ]);

      const [audioTemplate, typebotTemplate] = await Promise.all([
        readFile(
          path.join(artifactDir, "templates", "audio-template.html"),
          "utf-8",
        ),
        readFile(
          path.join(artifactDir, "templates", "typebot-template.json"),
          "utf-8",
        ),
      ]);

      const audioHtml = replacePlaceholders(audioTemplate, {
        AUDIO_URL: body["audioUrl"]!,
        FOTO_PERFIL_URL: fotoPerfilUrlFinal,
      });

      const githubFileName = `${slug}audio1.html`;
      const githubPagesBase =
        process.env["GITHUB_PAGES_BASE_URL"] ??
        "https://ellcleberccj.github.io/audiosprontos";
      const audioEmbedUrl = `${githubPagesBase}/${githubFileName}`;

      let githubStatus = "Sucesso";
      let githubError: string | undefined;

      try {
        await uploadToGithub({
          path: githubFileName,
          content: audioHtml,
          slugModelo: slug,
        });
      } catch (err) {
        githubStatus = "Erro";
        githubError = err instanceof Error ? err.message : String(err);
        req.log.warn({ err }, "GitHub upload failed");
      }

      const ipwhoisKey = process.env["IPWHOIS_KEY"] ?? "";

      const typebotJson = replacePlaceholders(typebotTemplate, {
        NOME_MODELO: body["nomeModelo"]!,
        NOME_COMPLETO_MODELO: body["nomeCompletoModelo"]!,
        IDADE_MODELO: body["idadeModelo"]!,
        AUDIO_EMBED_URL: audioEmbedUrl,
        FOTO_PERFIL_URL: fotoPerfilUrlFinal,
        IMAGEM_APRESENTACAO_URL: imagemApresentacaoUrlFinal,
        FOTO_AMOSTRA_1_URL: fotoAmostra1UrlFinal,
        FOTO_AMOSTRA_2_URL: fotoAmostra2UrlFinal,
        FOTO_AMOSTRA_3_URL: fotoAmostra3UrlFinal,
        FOTO_AMOSTRA_4_URL: fotoAmostra4UrlFinal,
        FOTO_AMOSTRA_5_URL: fotoAmostra5UrlFinal,
        FOTO_AMOSTRA_6_URL: fotoAmostra6UrlFinal,
        FOTO_AMOSTRA_7_URL: fotoAmostra7UrlFinal,
        LINK_ENTREGA_CONTEUDO: body["linkEntregaConteudo"]!,
        META_PIXEL_ID: body["metaPixelId"]!,
        META_ACCESS_TOKEN: body["metaAccessToken"]!,
        CONTENT_NAME: body["contentName"]!,
        IPWHOIS_KEY: ipwhoisKey,
      });

      if (typebotJson.includes("https://i.ibb.co/9dhxSqg/perfil-wpp.jpg")) {
        req.log.warn(
          "AVISO: ainda existem ocorrências hardcoded de perfil-wpp.jpg no JSON final",
        );
      }
      if (typebotJson.includes("Julia Matos")) {
        req.log.warn(
          "AVISO: ainda existem ocorrências hardcoded de 'Julia Matos' no JSON final",
        );
      }

      const exportDir = path.join(artifactDir, "exports", slug);
      await mkdir(exportDir, { recursive: true });

      await Promise.all([
        writeFile(path.join(exportDir, "audio.html"), audioHtml, "utf-8"),
        writeFile(
          path.join(exportDir, `typebot-${slug}.json`),
          typebotJson,
          "utf-8",
        ),
      ]);

      res.json({
        success: true,
        slug,
        audioEmbedUrl,
        githubStatus,
        githubError,
        jsonDownloadUrl: `/api/download/${slug}/typebot-${slug}.json`,
        htmlDownloadUrl: `/api/download/${slug}/audio.html`,
        imageLinks: {
          "Foto de perfil": fotoPerfilUrlFinal,
          "Imagem de apresentação": imagemApresentacaoUrlFinal,
          "Foto amostra 1": fotoAmostra1UrlFinal,
          "Foto amostra 2": fotoAmostra2UrlFinal,
          "Foto amostra 3": fotoAmostra3UrlFinal,
          "Foto amostra 4": fotoAmostra4UrlFinal,
          "Foto amostra 5": fotoAmostra5UrlFinal,
          "Foto amostra 6": fotoAmostra6UrlFinal,
          "Foto amostra 7": fotoAmostra7UrlFinal,
        },
      });
    } catch (err) {
      req.log.error({ err }, "Error generating funnel");
      res.status(500).json({
        success: false,
        error:
          err instanceof Error ? err.message : "Erro interno ao gerar funil.",
      });
    }
  },
);

export default router;
