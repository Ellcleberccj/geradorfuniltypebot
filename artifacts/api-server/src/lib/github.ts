interface UploadOptions {
  path: string;
  content: string;
  slugModelo: string;
}

interface GitHubFileResponse {
  sha?: string;
}

export async function uploadToGithub(opts: UploadOptions): Promise<void> {
  const token = process.env["GITHUB_TOKEN"] ?? "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";
  const owner = process.env["GITHUB_OWNER"] ?? "Ellcleberccj";
  const repo = process.env["GITHUB_REPO"] ?? "audiosprontos";
  const branch = process.env["GITHUB_BRANCH"] ?? "main";

  if (!token || !owner || !repo) {
    throw new Error(
      "Variáveis de ambiente GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO são obrigatórias.",
    );
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${opts.path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "typebot-funnel-generator",
  };

  let sha: string | undefined;

  const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
  if (getRes.ok) {
    const existing = (await getRes.json()) as GitHubFileResponse;
    sha = existing.sha;
  } else if (getRes.status !== 404) {
    const text = await getRes.text();
    throw new Error(`Erro ao verificar arquivo no GitHub: ${getRes.status} ${text}`);
  }

  const contentBase64 = Buffer.from(opts.content, "utf-8").toString("base64");

  const body: Record<string, string> = {
    message: `Generate audio embed for ${opts.slugModelo}`,
    content: contentBase64,
    branch,
  };
  if (sha) {
    body["sha"] = sha;
  }

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(`Erro ao enviar arquivo para GitHub: ${putRes.status} ${text}`);
  }
}
