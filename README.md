# Família Segura

Aplicativo de preparação familiar. Base web recuperada do projeto existente no Lovable e desenvolvida neste repositório, sem depender de créditos de geração.

## Desenvolvimento

Com Node.js 24 e npm:

```sh
git clone https://github.com/rogeriolaurareis-wq/Fam-lia-segura.git
cd Fam-lia-segura
git checkout codex/lista-de-compras
npm ci
npm run dev
```

Verificações: `npm run typecheck`, `npm test` e `npm run build`.

## Primeira evolução

Em Lista de compras, escolha produtos por categoria, informe pessoas e dias, ajuste quantidades e copie o texto para o WhatsApp. Saldo, compra e uso são opcionais e manuais. Não há validade ou lote obrigatório. Quantidades são sugestões ajustáveis em revisão, sem validação de suficiência nutricional.

## Estado do produto

Protótipo web local: não é o APK Android atualizado e não é serviço de resgate. Ainda não há login/recuperação em nuvem, rede residencial conectada, chat remoto ou download regional de mapas. O projeto original no Lovable não é alterado automaticamente por esta branch.

Dados ficam neste navegador. Ao mudar de endereço, use a exportação/importação da versão anterior: dados do domínio Lovable não aparecem automaticamente aqui. Use dados fictícios enquanto proteção e acesso não forem homologados.

Detalhes e limitações: [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md).

