export async function uploadImageToImgBB(
  fileBuffer: Buffer,
  fileName: string,
  apiKey: string,
): Promise<string> {
  const base64 = fileBuffer.toString("base64");
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

  const params = new URLSearchParams();
  params.append("key", apiKey);
  params.append("image", base64);
  params.append("name", nameWithoutExt);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: params,
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao enviar imagem para ImgBB: HTTP ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    success: boolean;
    data?: { url?: string; display_url?: string };
    error?: { message?: string };
  };

  if (!data.success || !data.data) {
    throw new Error(
      `Erro ao enviar imagem para ImgBB: ${data.error?.message ?? "resposta inválida"}`,
    );
  }

  const url = data.data.url ?? data.data.display_url;
  if (!url) {
    throw new Error("Erro ao enviar imagem para ImgBB: URL não retornada");
  }

  return url;
}
