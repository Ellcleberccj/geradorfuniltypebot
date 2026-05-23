import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { access } from "node:fs/promises";

const router = Router();

const artifactDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

router.get("/download/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;

  if (!slug || !filename) {
    res.status(400).json({ error: "Parâmetros inválidos." });
    return;
  }

  const safeSlug = slug.replace(/[^a-z0-9]/g, "");
  const safeFilename = path.basename(filename);

  if (!safeSlug || !safeFilename) {
    res.status(400).json({ error: "Parâmetros inválidos." });
    return;
  }

  const exportsDir = path.resolve(artifactDir, "exports");
  const filePath = path.join(exportsDir, safeSlug, safeFilename);

  if (!filePath.startsWith(exportsDir)) {
    res.status(403).json({ error: "Acesso negado." });
    return;
  }

  try {
    await access(filePath);
    res.download(filePath, safeFilename);
  } catch {
    res.status(404).json({ error: "Arquivo não encontrado." });
  }
});

export default router;
