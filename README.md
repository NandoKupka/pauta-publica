# Pauta Pública

Painel cívico para entender pautas, acompanhar a agenda federal, ver resultados de votações e encontrar decisões noticiadas pelos tribunais. Disponível no [GitHub Pages](https://nandokupka.github.io/pauta-publica/) e como servidor local. Cobre Câmara dos Deputados, Senado Federal, Congresso Nacional, STF, STJ e TSE.

## Páginas de acompanhamento

A aba **Pautas** reúne os projetos e processos identificados nas agendas e votações coletadas. Cada assunto tem uma URL permanente em `/pauta/{identificador}`, acessível também pelos itens da agenda e pelas votações relacionadas. A página organiza quatro perguntas: o que pode mudar, quem decide, o que já aconteceu e quais são os próximos passos.

- Câmara: ementa, situação, autoria, última relatoria e tramitações da API oficial. Pareceres da agenda são reunidos na página da proposta relacionada quando a fonte fornece esse vínculo; o documento continua acessível. Requerimentos mantêm identidade própria. As propostas afetadas por uma votação são vinculadas pelo identificador publicado, sem inferir que o projeto inteiro foi aprovado.
- Senado e Congresso: a identificação da matéria é resolvida para a API atual de processos do Senado, com autoria, colegiado responsável, situação e movimentações. A API antiga é usada apenas para resolver o identificador quando a votação não informa o processo.
- STF: temas, questão submetida ao tribunal, relatoria, partes e marcos datados do resumo da pauta presencial. Esse histórico é parcial, não o andamento processual completo. Votos de ministros e processos das sessões virtuais ainda dependem da consulta oficial.
- STJ e TSE continuam com notícias. O site não cria páginas de processos a partir de títulos de notícias nem inventa vínculos entre matérias homônimas de casas diferentes.

A entrada do site abre **Pautas**, com atalhos por assunto e cartões que mostram a etapa e a próxima sessão encontrada. A busca inclui ementas, indexação oficial e termos cotidianos de temas, como “bets”, “saúde” e “aposentadoria”. O filtro **Na agenda** mostra assuntos ainda presentes na agenda coletada. Trocar instituição preserva a busca e reinicia a paginação. URLs de filtros e páginas podem ser compartilhadas; o retorno à lista preserva a busca. Links antigos com `dia` ou `semana` continuam abrindo a agenda. No servidor local, navegação, histórico e filtros funcionam sem JavaScript; no Pages, os filtros usam JavaScript.

Os textos de orientação usam regras de apresentação e os campos oficiais. Há também resumos específicos em linguagem simples em `explanations.mjs`, identificados na página como elaborados com auxílio de IA. Cada resumo está associado a uma impressão digital do texto oficial usado como base: se esse texto mudar, o resumo deixa de ser exibido até nova revisão. Não há geração de texto por IA em tempo de execução nem custo de API de IA. Ementas, textos integrais e fontes permanecem acessíveis.

A leitura começa por **O que pode mudar**, logo abaixo do título. `reading.mjs` explica tipos de matéria, situações e alguns movimentos sem inferir aprovação ou vigência. O nome da situação e os registros originais permanecem acessíveis. O responsável pela etapa respeita encaminhamentos explícitos, como envio ao Senado, e não trata uma unidade administrativa como órgão de votação. As explicações sobre tramitação seguem a [orientação da Câmara](https://www.camara.leg.br/entenda-o-processo-legislativo/). Os 24 resumos editoriais não cobrem todo o catálogo: nas demais pautas, o site apresenta o texto oficial e orientações sobre a etapa.

## Rodar

Requer Node.js 22 ou posterior. O servidor local não precisa de dependências npm de produção. A geração estática e os testes de publicação usam as dependências de desenvolvimento versionadas no lockfile.

```sh
node server.mjs
```

Abra [http://127.0.0.1:4173](http://127.0.0.1:4173). O servidor só escuta na máquina local. A cópia inicial em `data/snapshot.json` é uma coleta de fontes oficiais. Com acesso à internet, o servidor tenta atualizar os dados quando eles estão desatualizados e depois a cada 30 minutos enquanto estiver aberto.

```sh
node collect.mjs
npm ci
node --test
```

O primeiro comando faz uma coleta imediata e grava `data/live.json`. Se o servidor já estiver rodando, reinicie-o para ler esse arquivo imediatamente. Defina `PAUTA_OFFLINE=1` para servir a cópia local sem consultar a rede. A atualização requer acesso à internet durante toda a execução. O painel mostra, por consulta, a última tentativa, a data dos dados e a cobertura. `GET /api/status` apresenta os mesmos estados, além da quantidade de pautas, movimentos e registros preservados. Após uma hora sem atualização, os dados deixam de aparecer como atuais. A primeira coleta dos detalhes de centenas de pautas pode levar alguns minutos; a cópia anterior continua disponível enquanto isso.

## GitHub Pages

O workflow `.github/workflows/pages.yml` gera uma edição estática a cada envio para `main`, por acionamento manual e, após o repositório estar público, a cada 30 minutos. O agendamento do GitHub pode sofrer atrasos; a interface informa as datas reais de consulta. As páginas individuais são HTML e continuam legíveis sem JavaScript. Na edição do Pages, busca e filtros funcionam no navegador com um índice de dados da mesma publicação.

```sh
npm ci
npm run build:pages
node scripts/check-pages.mjs
node scripts/preview-pages.mjs
```

A prévia estática fica em [http://127.0.0.1:4184/pauta-publica/](http://127.0.0.1:4184/pauta-publica/). `PAGES_BASE_PATH` permite alterar o subdiretório na geração. Os arquivos publicáveis ficam em `dist/`, fora do controle de versão. O empacotamento adapta os caminhos dos recursos e cria um diretório para cada pauta; não depende de redirecionamento de SPA nem de um servidor Node no Pages.

Para ativar no GitHub, a origem de **Settings → Pages** deve ser **GitHub Actions**, com o ambiente `github-pages`. A URL do projeto é `https://nandokupka.github.io/pauta-publica/`. A disponibilidade do Pages para repositórios privados depende do plano do GitHub; o workflow não altera a visibilidade do repositório. Enquanto ele permanecer privado, envios podem verificar e empacotar o projeto, mas a publicação e as coletas agendadas ficam desabilitadas.

O coletor roda no Actions, sem credenciais de serviços externos. A branch `data` preserva a última cópia completa e o histórico entre execuções. O workflow restaura esse estado antes de coletar e o salva com um push normal, sem sobrescrever atualizações concorrentes. Uma falha parcial de fonte mantém a última cópia disponível e seus avisos; falhas de testes ou geração impedem a publicação. O workflow usa apenas o `GITHUB_TOKEN` do próprio repositório e as Actions oficiais. A publicação ocorre somente depois que a verificação dos links e recursos passa.

O teste opcional `node scripts/check-pages-browser.mjs` usa Chrome e `puppeteer-core`. Defina `CHROME_PATH` se o navegador estiver em outro local, e `PAGES_TEST_URL` para testar uma edição já publicada.

## Cobertura

| Instituição | O que o site coleta |
| --- | --- |
| [Câmara dos Deputados](https://dadosabertos.camara.leg.br/swagger/api.html) | Sessões e reuniões deliberativas nas próximas três semanas, todos os itens retornados pela pauta e resultados do Plenário nos últimos 60 dias. Percorre a paginação oficial; resultados de comissões não incluídos. |
| [Senado Federal](https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html) | Agenda deliberativa do Plenário, itens de pauta e votações nominais dos últimos 60 dias, com nome, partido e UF quando disponíveis. |
| [Congresso Nacional](https://www.congressonacional.leg.br/sessoes/agenda-do-congresso-nacional) | Sessões conjuntas publicadas no calendário legislativo e registros nominais conjuntos quando aparecem na API. |
| [STF](https://portal.stf.jus.br/pauta/pesquisarCalendario.asp?aba=processo) | Calendário de julgamentos presenciais e virtuais, todos os processos e relatores retornados pela pauta presencial, até 100 notícias mais recentes do canal oficial `postsnoticias`. Nas sessões virtuais, apenas calendário e quantidade: a lista de processos é consultada no portal oficial. |
| [STJ](https://www.stj.jus.br/sites/portalp/Paginas/RSS.aspx) | Notícias oficiais. |
| [TSE](https://www.tse.jus.br/noticias-em-rss) | Notícias oficiais. |

“Decisões” é uma seleção automática de manchetes dos tribunais que descrevem um resultado. A data dessa aba é a da notícia. A cobertura não é integral: a íntegra, os votos de ministros e as alterações de última hora devem ser conferidos nos registros oficiais. Votações simbólicas ou secretas podem não ter votos individuais publicados. Uma aprovação registrada pode se referir a uma emenda, requerimento ou etapa de tramitação; ela não significa que uma proposta virou lei.

## Qualidade dos dados

- O resultado é apresentado pelo ato descrito na fonte. A Câmara não usa mais um prefixo do ID da votação como se fosse a proposta efetivamente votada. `aprovacao = 0` significa “Não aprovado”; só a descrição explícita permite rotular “Rejeitado”. O horário de registro no sistema não é apresentado como horário da votação.
- “Sim”, “Não” e “Abstenção” são contados separadamente dos outros registros. Ausências, licenças, obstrução e presidência não aumentam o total de votos exibido.
- Resposta vazia, consulta com erro, dados preservados e conteúdo fora da cobertura têm mensagens distintas. Falhas em detalhes deixam a consulta parcial e preservam a última lista disponível com sua data original.
- A coleta tem fila de até oito pedidos simultâneos, timeout e uma nova tentativa para falhas transitórias. Uma paginação interrompida preserva a coleta anterior; não declara a primeira página como cobertura completa.
- Cada registro informa sua fonte e data de consulta. Notícias têm IDs estáveis. As cópias anteriores à versão 2 são marcadas como parciais até nova coleta.
- Cada seção da página da pauta conserva sua própria data. Se a consulta ao histórico falha, os movimentos anteriores continuam visíveis com aviso, mesmo que a ementa tenha sido atualizada. Falhas não são apresentadas como ausência de histórico ou de votos.
- Próximos passos são extraídos da situação oficial e das sessões encontradas. Não há previsão inventada de data ou de aprovação. Propostas que a fonte registra como normas são apresentadas dessa forma.

## Persistência local

`data/live.json` guarda o catálogo, os detalhes, as agendas e votações já vistas, além de mudanças detectadas entre coletas. Uma pauta não é apagada quando sai da janela de 21 dias ou de 60 dias. Alterações de horário, situação, itens, registros individuais e texto de apresentação são registradas separadamente do histórico oficial. Não aparecer na última lista não é rotulado como retirada, rejeição ou cancelamento.

A gravação substitui o arquivo de forma atômica. Um arquivo de bloqueio impede que servidor e coleta manual sobrescrevam o histórico ao mesmo tempo; se já houver coleta ativa, o segundo comando utiliza a cópia disponível. Detalhes ativos têm cache de 30 minutos; os de assuntos fora do conjunto atual podem ser consultados novamente após 24 horas. A cópia inicial em `data/snapshot.json` permite iniciar sem rede. Para conservar o acompanhamento entre máquinas, preserve também `data/live.json` — o armazenamento é local, sem sincronização ou backup remoto.

## Estrutura

`collect.mjs` coordena as fontes e a gravação. `sources.mjs` e `stf.mjs` interpretam formatos oficiais. `pautas.mjs` mantém identidades, vínculos, busca e mudanças; `pauta-sources.mjs` coleta os detalhes e históricos. `data-quality.mjs` concentra os critérios de resultado e qualidade. `view.mjs` e `pauta-view.mjs` renderizam HTML no servidor; `client.js` aprimora a busca de parlamentares.

Os testes cobrem paginação, falhas parciais, preservação de dados e datas, identidades entre instituições, mudanças de agenda, resultados ambíguos, contagem de votos, filtros compartilháveis, cache de temas do STF, lacunas explícitas e segurança dos links e do HTML. O projeto continua sendo uma aplicação local; o catálogo preservado não pretende ser um arquivo histórico integral das instituições.
