# Família Segura — desenvolvimento fora do Lovable

Base importada do projeto Lovable 4774dc15-8df5-42d1-8eab-90fe297b9592,
commit 300b27344cdfc0ba755a5a83b1cf253fac6b9caf. Nenhuma geração paga do
Lovable é necessária para instalar, testar ou alterar este código.

## Primeira entrega de código

- Catálogo de compras pesquisável e agrupado, com escolha explícita de itens.
- Uma variante por grupo na primeira versão (ex.: tipo de leite), evitando duplicação.
- Quantidades ajustáveis; saldo opcional; compra e uso confirmados manualmente.
- Itens próprios, texto de lista/categoria para copiar no WhatsApp e alternativa manual
  quando o navegador bloquear a área de transferência.
- Cadastro sem validade ou lote obrigatório; inventário anterior preservado separadamente.
- Preferências locais e migração do envelope 1 para 2 com cópia anterior.
- Falha de gravação não é apresentada como alteração salva.

Quantidades alimentares são estimativas editoriais em revisão; não há validação de
completude nutricional. Animais e itens sem base definida exigem quantidade confirmada.
As referências de água e sabão estão identificadas no catálogo; valores editoriais não
são cotas oficiais. Não há links comerciais em alimentos ou medicamentos.

## Executar

Requer Node 24 e npm. Usar `npm ci`, `npm run dev`, `npm run typecheck`,
`npm test` e `npm run build`. O lockfile npm fixa as dependências para reprodução.
O bun.lock original foi preservado como histórico de importação; o fluxo de CI usa npm.

## Limites reais

Esta é a versão web, não uma atualização automática do APK Android existente.
Dados ficam no navegador e não migram automaticamente do domínio Lovable para outro
domínio. Exportar no aplicativo antigo e importar no novo antes de trocar de endereço.
Exportações da versão 2 exigem este código ou versão compatível; o app antigo pode
rejeitá-las. Dados anteriores foram mantidos e não associados silenciosamente ao catálogo,
para evitar combinar produtos ou unidades incorretos.

Ainda não há: autenticação, quatro contas residenciais conectadas, recuperação em nuvem,
chat remoto, fornecedores de mapas autorizados ou pacotes regionais offline.
Registrar essas funções como concluídas somente depois de implementação e testes.
O cache de aplicação deve ser homologado no endereço de produção; prévia e dev não
registram service worker. A presença de código PWA não comprova reabertura sem rede.

## Verificação

Testes incluem seleção, cálculo, alternativas, texto sem dados privados, falta limitada a
zero, pendências, migração e corrupção de dados, uso da interface e falha de salvamento.
Os testes de interface usam JSDOM; não são homologação visual em aparelho Android/iOS.

## Ajustes do cadastro — 13/11/2026

M01 solicita apenas faixa etária; ao editar um registro antigo, deriva a faixa da data
anterior e passa a guardar somente a faixa. Sangue é opcional; uma escolha sem confirmação
é salva como Não sei, com aviso visível. Documento de origem textual é opcional.
Foto reduzida localmente (máximo 640 px e 400 mil caracteres), sinais corporais e notas
são preservados no backup. Vínculo, responsável e contato são editados em M04.
Teste real de navegador cobriu cadastro da segunda pessoa e avanço após selecionar sangue.
Testes automatizados cobrem também confirmação, registro antigo e foto em exportação.
