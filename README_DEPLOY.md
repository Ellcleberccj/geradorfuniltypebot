# Deploy no Railway

Este pacote foi preparado para Railway sem remover nem alterar chaves/configurações existentes nos arquivos do projeto original.

## Subir

1. Crie um repositório privado no GitHub.
2. Suba todo o conteúdo desta pasta.
3. No Railway: New Project > Deploy from GitHub repo.
4. Depois do deploy: Settings > Networking > Generate Domain.

## Observação sobre chaves

Este pacote já foi preenchido com os tokens fornecidos nos arquivos de configuração e também como fallback no código do backend, para funcionar no Railway sem você precisar cadastrar Variables manualmente.

O app usa estas variáveis quando precisa delas:

- GITHUB_TOKEN
- GITHUB_OWNER
- GITHUB_REPO
- GITHUB_BRANCH
- GITHUB_PAGES_BASE_URL
- IMGBB_API_KEY
- IPWHOIS_KEY

## Arquivos importantes

- artifacts/api-server: backend Express
- artifacts/funil-web: frontend React/Vite
- lib/api-zod e lib/api-client-react: libs internas usadas pelo app
- nixpacks.toml: comandos para instalar, buildar e iniciar no Railway
