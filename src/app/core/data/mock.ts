import type {
  Block,
  Chapter,
  CountryStat,
  Distribution,
  Episode,
  EpisodeStatus,
  Guest,
  Host,
  PlatformStat,
  Season,
  SeriesPoint,
  Sponsor,
  TranscriptLine,
} from './types'

// Conjuntos Unsplash curados (IDs já verificados no monorepo).
const IMG: Record<string, string[]> = {
  work: [
    '1497366216548-37526070297c',
    '1497366811353-6870744d04b2',
    '1542744173-8e7e53415bb0',
    '1568992687947-868a62a9f521',
    '1521737711867-e3b97375f902',
    '1504384308090-c894fdcc538d',
    '1560264280-88b68371db39',
    '1486312338219-ce68d2c6f44d',
    '1521791136064-7986c2920216',
    '1560472354-b33ff0c44a43',
    '1516321318423-f06f85e504b3',
    '1600880292203-757bb62b4baf',
  ],
  city: ['1477959858617-67f85cf4f1df', '1496568816309-51d7c20e3b21', '1480714378408-67cf0d13bc1b'],
  people: [
    '1500648767791-00dcc994a43e',
    '1494790108377-be9c29b29330',
    '1507003211169-0a1dd7228f2d',
    '1438761681033-6461ffad8d80',
    '1633332755192-727a05c4013d',
    '1573496359142-b8d87734a5a2',
  ],
}

function imgHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function imgCategory(seed: string): string {
  const s = seed.toLowerCase()
  if (/apresenta|author|avatar|convidad|guest|host|people|person|profile|team|user/.test(s)) return 'people'
  if (/cidade|city|noite|skyline|urban/.test(s)) return 'city'
  return 'work'
}

function unsplash(id: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=70&auto=format`
}

/** URL determinística por seed — capas de episódio e do programa. */
export function pcImage(seed: string, w = 960, h = 640): string {
  const ids = IMG[imgCategory(seed)]
  return unsplash(ids[imgHash('pc-' + seed) % ids.length], w, h)
}

/** Avatar quadrado (conjunto `people`) — convidados e apresentadores. */
export function pcAvatar(seed: string, size = 160): string {
  const ids = IMG.people
  return unsplash(ids[imgHash('pc-av-' + seed) % ids.length], size, size)
}

/** Hash determinístico exportado — a forma de onda desenhada usa o mesmo. */
export function seedHash(s: string): number {
  return imgHash(s)
}

// As datas são relativas ao dia de hoje para que a contagem regressiva dos
// episódios agendados continue fazendo sentido em qualquer demonstração.
function daysAgo(days: number, hour = 6): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function daysAhead(days: number, hour = 6): string {
  return daysAgo(-days, hour)
}

// ---- Programa -----------------------------------------------------------

export const SHOW = {
  name: 'Onda',
  tagline: 'Conversas sobre trabalho, ofício e tecnologia — toda quinta, de manhã.',
  description:
    'A Onda conversa com quem faz: designers, engenheiras, editores, jornalistas e gente de operação. Uma pergunta por episódio, sem atalho e sem palestra.',
  category: 'Tecnologia',
  subcategory: 'Negócios',
  language: 'pt-BR',
  email: 'ola@onda.fm',
  author: 'Marina Bueno e Téo Vasques',
  siteUrl: 'https://onda.fm',
  feedUrl: 'https://onda.fm/feed.xml',
  coverSeed: 'capa-programa-onda',
  copyright: 'Onda Áudio Ltda.',
  explicit: false,
}

// ---- Apresentadores -----------------------------------------------------

export const HOSTS: Host[] = [
  {
    id: 1,
    name: 'Marina Bueno',
    role: 'Apresentadora e produtora',
    avatar: pcAvatar('host-marina'),
    bio: 'Passou dez anos em redação antes de montar o próprio estúdio. Conduz a conversa e faz a pergunta que ninguém quer fazer.',
  },
  {
    id: 2,
    name: 'Téo Vasques',
    role: 'Co-apresentador',
    avatar: pcAvatar('host-teo'),
    bio: 'Programador de formação, curioso por ofício. Cuida do roteiro, dos números do episódio e das perguntas técnicas.',
  },
]

// ---- Temporadas ---------------------------------------------------------

const SEASON_SEEDS: Omit<Season, 'year'>[] = [
  {
    number: 1,
    title: 'Como se começa',
    description:
      'A primeira temporada é sobre o começo: o primeiro cliente, a primeira contratação, a primeira vez que deu errado em público.',
  },
  {
    number: 2,
    title: 'O ofício',
    description:
      'Oito conversas sobre o trabalho em si — a rotina, a ferramenta e o hábito que sustenta quem faz a mesma coisa há anos.',
  },
  {
    number: 3,
    title: 'Escala',
    description:
      'O que muda quando o time cresce, quando o público cresce e quando o problema deixa de caber na cabeça de uma pessoa só.',
  },
]

// ---- Convidados ---------------------------------------------------------
// `episodeIds` é derivado dos episódios no fim do arquivo — nunca escrito à mão.

const GUEST_SEEDS: Omit<Guest, 'episodeIds'>[] = [
  {
    id: 1,
    slug: 'lia-marcal',
    name: 'Lia Marçal',
    avatar: pcAvatar('convidado-lia'),
    role: 'Designer de produto',
    bio: 'Desenha software há doze anos e há quatro coordena um time distribuído entre Recife e Lisboa. Escreve sobre decisões de interface que ninguém percebe quando dão certo.',
    links: [
      { label: 'Site pessoal', href: 'https://exemplo.com/lia' },
      { label: 'Boletim quinzenal', href: 'https://exemplo.com/lia/boletim' },
    ],
  },
  {
    id: 2,
    slug: 'otavio-bastos',
    name: 'Otávio Bastos',
    avatar: pcAvatar('convidado-otavio'),
    role: 'Engenheiro de dados',
    bio: 'Montou a primeira área de dados de três empresas diferentes. Defende que quase todo painel deveria ser uma tabela e quase toda métrica, uma pergunta.',
    links: [{ label: 'Repositório de exemplos', href: 'https://exemplo.com/otavio' }],
  },
  {
    id: 3,
    slug: 'renata-kubo',
    name: 'Renata Kubo',
    avatar: pcAvatar('convidado-renata'),
    role: 'Fundadora de estúdio',
    bio: 'Sócia de um estúdio de dez pessoas que atende clientes fora do Brasil. Fala de preço, de contrato e do dia em que aprendeu a dizer não.',
    links: [
      { label: 'Estúdio', href: 'https://exemplo.com/kubo' },
      { label: 'Modelo de proposta', href: 'https://exemplo.com/kubo/proposta' },
    ],
  },
  {
    id: 4,
    slug: 'diego-amorim',
    name: 'Diego Amorim',
    avatar: pcAvatar('convidado-diego'),
    role: 'Editor de áudio',
    bio: 'Edita podcast desde antes de a palavra existir por aqui. Explica por que o silêncio é a edição mais difícil e mostra o que corta primeiro.',
    links: [{ label: 'Playlist de referência', href: 'https://exemplo.com/diego' }],
  },
  {
    id: 5,
    slug: 'fernanda-lisboa',
    name: 'Fernanda Lisboa',
    avatar: pcAvatar('convidado-fernanda'),
    role: 'Pesquisadora de usuários',
    bio: 'Faz entrevista de pesquisa há oito anos e treina times para ouvir sem induzir. Traz um roteiro de cinco perguntas que cabe em qualquer conversa.',
    links: [{ label: 'Guia de entrevista', href: 'https://exemplo.com/fernanda' }],
  },
  {
    id: 6,
    slug: 'caio-ribeiro',
    name: 'Caio Ribeiro',
    avatar: pcAvatar('convidado-caio'),
    role: 'Desenvolvedor autônomo',
    bio: 'Trabalha sozinho por escolha, com três clientes fixos e a agenda fechada às sextas. Conta a matemática que faz isso caber no mês.',
    links: [{ label: 'Notas públicas', href: 'https://exemplo.com/caio' }],
  },
  {
    id: 7,
    slug: 'bruna-teixeira',
    name: 'Bruna Teixeira',
    avatar: pcAvatar('convidado-bruna'),
    role: 'Jornalista de tecnologia',
    bio: 'Cobre a indústria de software para um veículo independente. Ensina a checar uma informação antes de ela virar tese no grupo do trabalho.',
    links: [
      { label: 'Coluna semanal', href: 'https://exemplo.com/bruna' },
      { label: 'Arquivo de reportagens', href: 'https://exemplo.com/bruna/arquivo' },
    ],
  },
  {
    id: 8,
    slug: 'marcelo-antunes',
    name: 'Marcelo Antunes',
    avatar: pcAvatar('convidado-marcelo'),
    role: 'Professor de estatística',
    bio: 'Dá aula na universidade pública e presta consultoria para times de produto. Insiste que a maioria dos testes A/B termina cedo demais.',
    links: [{ label: 'Material de aula', href: 'https://exemplo.com/marcelo' }],
  },
  {
    id: 9,
    slug: 'sofia-nakamura',
    name: 'Sofia Nakamura',
    avatar: pcAvatar('convidado-sofia'),
    role: 'Ilustradora',
    bio: 'Ilustra capa de livro e identidade de produto. Fala de repertório, de prazo curto e de como cobrar por uma ideia que veio em dez minutos.',
    links: [{ label: 'Portfólio', href: 'https://exemplo.com/sofia' }],
  },
  {
    id: 10,
    slug: 'paulo-vidal',
    name: 'Paulo Vidal',
    avatar: pcAvatar('convidado-paulo'),
    role: 'Diretor de operações',
    bio: 'Cuida da operação de uma transportadora com trezentas pessoas. Traz o lado sem glamour da escala: turno, planilha e gente cansada.',
    links: [{ label: 'Perfil profissional', href: 'https://exemplo.com/paulo' }],
  },
]

// ---- Patrocinadores -----------------------------------------------------

export const SPONSORS: Sponsor[] = [
  {
    id: 1,
    name: 'Café Moka',
    logoSeed: 'patrocinio-moka',
    slot: 'pre-roll',
    episodeIds: [14, 15, 16, 17, 18],
    impressions: 148920,
    cpm: 42,
  },
  {
    id: 2,
    name: 'Nuvem Cinza',
    logoSeed: 'patrocinio-nuvem',
    slot: 'mid-roll',
    episodeIds: [11, 12, 13, 14, 15, 16, 17, 18],
    impressions: 236480,
    cpm: 68,
  },
  {
    id: 3,
    name: 'Papelaria Traço',
    logoSeed: 'patrocinio-traco',
    slot: 'pos-roll',
    episodeIds: [9, 10, 11, 12],
    impressions: 71340,
    cpm: 24,
  },
  {
    id: 4,
    name: 'Banco Verso',
    logoSeed: 'patrocinio-verso',
    slot: 'mid-roll',
    episodeIds: [16, 17, 18],
    impressions: 94210,
    cpm: 75,
  },
]

// ---- Distribuição -------------------------------------------------------

export const PLATFORM_STATS: PlatformStat[] = [
  { platform: 'Spotify', downloads: 131140, share: 0.451 },
  { platform: 'Apple', downloads: 80850, share: 0.278 },
  { platform: 'YouTube', downloads: 41590, share: 0.143 },
  { platform: 'Google', downloads: 23840, share: 0.082 },
  { platform: 'Site', downloads: 13380, share: 0.046 },
]

export const COUNTRY_STATS: CountryStat[] = [
  { country: 'Brasil', downloads: 227420 },
  { country: 'Portugal', downloads: 25180 },
  { country: 'Estados Unidos', downloads: 13970 },
  { country: 'Angola', downloads: 6980 },
  { country: 'Argentina', downloads: 5460 },
  { country: 'Moçambique', downloads: 3740 },
  { country: 'Alemanha', downloads: 3340 },
  { country: 'Japão', downloads: 1960 },
  { country: 'Canadá', downloads: 1750 },
  { country: 'Espanha', downloads: 1000 },
]

export const DISTRIBUTIONS: Distribution[] = [
  {
    platform: 'Spotify',
    state: 'ativo',
    url: 'https://open.spotify.com/show/onda',
    followers: 18420,
    lastSyncAt: daysAgo(0, 5),
  },
  {
    platform: 'Apple',
    state: 'ativo',
    url: 'https://podcasts.apple.com/br/podcast/onda',
    followers: 11360,
    lastSyncAt: daysAgo(0, 5),
  },
  {
    platform: 'YouTube',
    state: 'ativo',
    url: 'https://youtube.com/@ondafm',
    followers: 7940,
    lastSyncAt: daysAgo(1, 5),
  },
  {
    platform: 'Google',
    state: 'pendente',
    url: 'https://podcasts.google.com/feed/onda',
    followers: 2410,
    lastSyncAt: daysAgo(4, 5),
  },
  {
    platform: 'Site',
    state: 'erro',
    url: 'https://onda.fm/feed.xml',
    followers: 0,
    lastSyncAt: daysAgo(9, 5),
  },
]

// ---- Série de 12 meses --------------------------------------------------

const MONTH_KEYS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Doze meses de downloads, terminando no mês corrente. */
export const MONTHLY_DOWNLOADS: SeriesPoint[] = (() => {
  const base = [9030, 10400, 12210, 11330, 13540, 15600, 14910, 17120, 18740, 20410, 22030, 23680]
  const today = new Date()
  return base.map((value, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1)
    return { label: MONTH_KEYS[d.getMonth()], value }
  })
})()

/** Assinantes do boletim por mês. */
export const MONTHLY_SUBSCRIBERS: SeriesPoint[] = MONTHLY_DOWNLOADS.map((p, i) => ({
  label: p.label,
  value: 1240 + i * 186 + ((i * 37) % 90),
}))

// =========================================================================
// Transcrições
// =========================================================================
// Três episódios têm transcrição escrita à mão (25 linhas cada, cinco trechos
// de cinco falas ancorados nos capítulos). Os demais publicados recebem um
// trecho gerado de forma determinística — uma troca por capítulo.

function lines(
  start: number,
  step: number,
  rows: [speaker: string, text: string][]
): TranscriptLine[] {
  return rows.map((row, i) => ({
    id: i + 1,
    startSec: start + i * step,
    endSec: start + (i + 1) * step - 1,
    speaker: row[0],
    text: row[1],
  }))
}

function joinLines(groups: TranscriptLine[][]): TranscriptLine[] {
  return groups.flat().map((line, i) => ({ ...line, id: i + 1 }))
}

/** Episódio 18 — "Quando o time dobra de tamanho" (1h 00min, capítulos em 0/253/795/1481/2276). */
const TRANSCRIPT_18: TranscriptLine[] = joinLines([
  lines(4, 14, [
    [
      'Marina',
      'Lia, você entrou num time de seis pessoas e em seis meses estava com treze. Quando é que você percebeu que aquilo tinha virado outra coisa?',
    ],
    [
      'Lia',
      'Foi numa reunião de segunda. A gente sempre fez a reunião de segunda em pé, em quinze minutos. Naquele dia levou cinquenta e ninguém tinha falado do trabalho ainda.',
    ],
    ['Marina', 'Cinquenta minutos só de atualização?'],
    [
      'Lia',
      'De atualização e de gente pedindo contexto. Metade da sala não sabia por que a outra metade estava fazendo aquilo.',
    ],
    ['Téo', 'E aí você cortou a reunião?'],
  ]),
  lines(249, 15, [
    [
      'Lia',
      'Cortei, mas não de primeira. Primeiro eu tentei o que todo mundo tenta, que é escrever mais. Documento, ata, resumo por escrito.',
    ],
    ['Marina', 'E não funcionou.'],
    [
      'Lia',
      'Funcionou para quem já sabia. Quem entrou depois lia o documento e entendia o resultado, não entendia a decisão.',
    ],
    ['Téo', 'Faltava o porquê.'],
    [
      'Lia',
      'Faltava o porquê e faltava a alternativa descartada. Hoje eu escrevo as duas coisas: o que a gente escolheu e o que a gente deixou de escolher.',
    ],
  ]),
  lines(791, 15, [
    ['Marina', 'Você falou que contratou rápido demais. Rápido demais em relação a quê?'],
    [
      'Lia',
      'Em relação à minha capacidade de explicar o trabalho. Dá para contratar três pessoas em um mês. Não dá para formar três pessoas em um mês.',
    ],
    ['Téo', 'Quanto tempo leva para alguém ficar produtivo aí dentro?'],
    [
      'Lia',
      'Uns dois meses para entregar sozinho e uns seis para discordar de mim com argumento. O segundo é o que importa.',
    ],
    ['Marina', 'Essa é uma boa métrica de integração, na verdade.'],
  ]),
  lines(1477, 15, [
    ['Marina', 'E o jeito de decidir, mudou?'],
    [
      'Lia',
      'Mudou o dono. Antes era eu. Hoje cada frente decide sozinha até um limite de risco, e acima disso vem para a mesa.',
    ],
    ['Téo', 'Como você define esse limite?'],
    [
      'Lia',
      'Se é reversível em uma semana, decide quem está fazendo. Se não é, a gente conversa. É grosseiro, mas evita noventa por cento da discussão.',
    ],
    ['Marina', 'Grosseiro e útil.'],
  ]),
  lines(2272, 16, [
    ['Marina', 'Se você pudesse desfazer uma decisão desses seis meses, qual seria?'],
    ['Lia', 'Ter juntado dois times que faziam coisas parecidas. Parecia economia e virou fila.'],
    ['Téo', 'Fila de quê?'],
    [
      'Lia',
      'De prioridade. Dois clientes internos disputando as mesmas pessoas e ninguém com autoridade para decidir a ordem.',
    ],
    ['Marina', 'E você separou de novo?'],
  ]),
])

/** Episódio 16 — "Repertório se constrói ou se acha?" (53min, capítulos em 0/223/700/1304/2003). */
const TRANSCRIPT_16: TranscriptLine[] = joinLines([
  lines(4, 15, [
    ['Marina', 'Sofia, você diz que não acredita em bloqueio criativo. Explica isso para a gente.'],
    [
      'Sofia',
      'Eu acredito em repertório insuficiente. Quando eu travo, quase sempre é porque eu não vi nada novo nos últimos meses.',
    ],
    [
      'Caio',
      'Isso vale para código também. Quando eu fico sem ideia de solução, é porque eu só andei lendo o meu próprio código.',
    ],
    ['Marina', 'E como vocês repõem esse estoque?'],
    [
      'Sofia',
      'Eu tenho uma pasta com trezentas imagens que não têm nada a ver com o meu trabalho. Cartaz de cinema húngaro, embalagem de remédio, sinalização de metrô.',
    ],
  ]),
  lines(219, 15, [
    ['Caio', 'A minha versão disso é ler código de biblioteca que eu não uso. Uma hora por semana, sem objetivo.'],
    ['Téo', 'Sem objetivo mesmo? Não é para resolver nada?'],
    [
      'Caio',
      'Não. No momento em que vira pesquisa para resolver um problema, eu paro de ver o que está ali e passo a procurar o que eu já queria achar.',
    ],
    ['Marina', 'Então é leitura, não é busca.'],
    ['Sofia', 'Exatamente. Busca fecha. Leitura abre.'],
  ]),
  lines(696, 15, [
    [
      'Marina',
      'Sofia, tem um trabalho seu que saiu em dez minutos e foi o mais bem pago do ano. Como é que se cobra por isso?',
    ],
    [
      'Sofia',
      'Eu cobro pelo problema resolvido, não pela hora. Se eu cobrasse por hora, eu estaria punindo os meus quinze anos de prática.',
    ],
    ['Caio', 'E o cliente aceita bem?'],
    [
      'Sofia',
      'Aceita quando entende que os dez minutos são a parte visível. O resto é a pasta das trezentas imagens.',
    ],
    ['Téo', 'E quando não aceita?'],
  ]),
  lines(1300, 16, [
    ['Sofia', 'Quando não aceita, eu não pego o trabalho. Aprendi isso tarde, já passado dos trinta.'],
    ['Marina', 'Caio, você passa por isso com orçamento de software?'],
    ['Caio', 'Toda semana. A pergunta é sempre quantas horas, e a resposta honesta é que não importa.'],
    ['Téo', 'Mas o cliente precisa de previsibilidade.'],
    [
      'Caio',
      'Precisa de prazo e de preço, que é diferente de hora. Eu dou os dois fechados e assumo o risco de errar a estimativa.',
    ],
  ]),
  lines(1999, 16, [
    ['Marina', 'Última pergunta para os dois: o que vocês fariam se estivessem começando hoje?'],
    ['Sofia', 'Eu mostraria trabalho não terminado bem mais cedo. Passei anos publicando só o que já estava pronto.'],
    ['Caio', 'Eu teria cobrado mais no começo. Preço baixo atrai justamente o cliente que dá mais trabalho.'],
    ['Marina', 'Essa dói.'],
    ['Sofia', 'Dói porque é verdade para quase todo mundo que está ouvindo.'],
  ]),
])

/** Episódio 11 — "Interface que ninguém percebe" (49min, capítulos em 0/206/647/1205/1852). */
const TRANSCRIPT_11: TranscriptLine[] = joinLines([
  lines(4, 15, [
    [
      'Marina',
      'O título do episódio é uma frase sua: interface boa é a que ninguém percebe. Isso não é uma desculpa para não ousar?',
    ],
    ['Lia', 'É o contrário. Não ser percebida dá muito mais trabalho do que impressionar.'],
    ['Téo', 'Dá um exemplo concreto.'],
    ['Lia', 'Campo de data. Todo mundo acha que é um detalhe. A gente refez o nosso quatro vezes em dois anos.'],
    ['Marina', 'Quatro vezes um campo de data?'],
  ]),
  lines(202, 16, [
    [
      'Lia',
      'Quatro. E na quarta a gente descobriu que metade dos erros vinha de gente digitando o ano com dois dígitos.',
    ],
    ['Téo', 'E aí vocês passaram a aceitar dois dígitos?'],
    [
      'Lia',
      'Passamos, com uma regra de janela. Ninguém nunca elogiou isso. O número de chamados caiu dezoito por cento.',
    ],
    ['Marina', 'Dezoito por cento por causa de um campo.'],
    ['Lia', 'De um campo que aparece em quatro telas por dia para cada pessoa que usa o sistema.'],
  ]),
  lines(643, 16, [
    ['Marina', 'Como você convence um time a gastar tempo nisso em vez de fazer coisa nova?'],
    [
      'Lia',
      'Eu paro de chamar de detalhe e começo a chamar de custo. Cada erro tem um número: chamado aberto, tempo de suporte, retrabalho.',
    ],
    ['Téo', 'Você mede isso antes de mexer?'],
    ['Lia', 'Sempre. Sem o número de antes, qualquer melhora vira opinião.'],
    ['Marina', 'E se o número não melhorar?'],
  ]),
  lines(1201, 16, [
    ['Lia', 'Aí a gente volta atrás. Já voltamos três vezes este ano e ninguém morreu.'],
    ['Téo', 'Voltar atrás é raro. Normalmente o time defende o que fez.'],
    [
      'Lia',
      'Porque a gente confunde a decisão com a pessoa. Se a decisão tem um dono e uma data, dá para revisar sem ofender ninguém.',
    ],
    ['Marina', 'Vocês escrevem isso em algum lugar?'],
    [
      'Lia',
      'Uma linha por decisão, com data e com o que a gente esperava que acontecesse. É a coisa mais barata que a gente faz.',
    ],
  ]),
  lines(1848, 16, [
    ['Marina', 'Tem alguma interface por aí que você admira e que ninguém nota?'],
    ['Lia', 'A do caixa eletrônico do banco onde eu tenho conta. Ele devolve o cartão antes do dinheiro.'],
    ['Téo', 'Para a pessoa não esquecer o cartão.'],
    [
      'Lia',
      'Isso. É uma decisão de ordem, não de tela. Não tem nada bonito ali e resolve um problema de milhões de pessoas.',
    ],
    ['Marina', 'Boa forma de terminar.'],
  ]),
])

/** Trocas genéricas usadas nos trechos gerados — uma por capítulo. */
const EXCHANGES: [q: string, a: string][] = [
  [
    'Vamos começar pelo começo: como você foi parar nessa área?',
    'Por acaso, como quase todo mundo. Eu queria outra coisa e caí aqui por causa de um trabalho temporário que durou seis anos.',
  ],
  [
    'O que você faria diferente se estivesse começando hoje?',
    'Eu perguntaria mais cedo. Passei muito tempo achando que perguntar era admitir que eu não sabia.',
  ],
  [
    'Qual é a parte do seu trabalho que ninguém vê?',
    'A espera. Boa parte do que eu faço é esperar a informação chegar de outra pessoa sem deixar o prazo cair por isso.',
  ],
  [
    'Tem alguma ferramenta de que você não abre mão?',
    'Um caderno de papel e um cronômetro. Tudo o que é digital eu troco a cada dois anos; esses dois estão comigo desde sempre.',
  ],
  [
    'Como você sabe que um trabalho está pronto?',
    'Quando eu tiro uma coisa e ele piora. Enquanto eu consigo tirar sem piorar, ainda não está pronto.',
  ],
  [
    'Você rende mais de manhã ou à noite?',
    'De manhã, e não é gosto: é a única hora em que ninguém me interrompe. A noite é romântica, mas eu produzo menos.',
  ],
  [
    'Qual foi o erro mais caro que você cometeu?',
    'Aceitar um cliente que eu sabia que ia dar errado porque o mês estava fraco. O prejuízo foi maior do que o mês fraco.',
  ],
  [
    'Como você lida com prazo apertado?',
    'Eu negocio escopo, nunca qualidade. Se não dá para negociar escopo, o prazo não é apertado, é irreal.',
  ],
  [
    'O que você diria para quem está começando agora?',
    'Escolha um lugar onde alguém melhor do que você olhe o seu trabalho toda semana. Isso vale mais do que salário nos dois primeiros anos.',
  ],
  [
    'Você acompanha algum número no dia a dia?',
    'Dois. Quanto tempo leva do pedido até a entrega e quantas vezes a coisa volta. O resto é consequência.',
  ],
  [
    'Como é a sua semana normal?',
    'Segunda e terça eu decido, quarta e quinta eu faço, sexta eu arrumo o que ficou. Quando eu inverto essa ordem, a semana some.',
  ],
  [
    'Você delega bem?',
    'Não. Melhorei porque me obriguei a escrever o pedido em vez de explicar de viva voz. Escrever me mostrou o quanto eu pedia mal.',
  ],
  [
    'O que mudou na sua área nos últimos cinco anos?',
    'A parte técnica ficou mais fácil e a parte de decidir ficou mais difícil. Hoje sobra opção e falta critério.',
  ],
  [
    'Qual conselho famoso você acha ruim?',
    'Faça o que você ama. Prefiro: faça o que você aguenta fazer mal por seis meses até ficar bom.',
  ],
  [
    'Como você se mantém em dia sem enlouquecer?',
    'Eu leio pouco e fundo. Uma coisa por mês, até o fim, em vez de trinta resumos de coisas que eu nunca vou usar.',
  ],
  [
    'Tem alguma decisão sua que envelheceu mal?',
    'Ter padronizado tudo cedo demais. Padrão bom nasce do terceiro caso parecido, não do primeiro.',
  ],
  [
    'Você cobra por hora ou por projeto?',
    'Por projeto. Hora premia quem é lento, e eu passei anos ficando mais rápido de propósito.',
  ],
  [
    'Como você recebe crítica ao seu trabalho?',
    'Mal, no primeiro dia. Bem, no terceiro. Aprendi a não responder nada nas primeiras vinte e quatro horas.',
  ],
  [
    'O que faz você recusar um trabalho hoje?',
    'Cliente sem uma pessoa com poder de decidir. Sem isso, o projeto vira assembleia e não termina nunca.',
  ],
  [
    'Como você desliga no fim do dia?',
    'Escrevo as três primeiras coisas de amanhã. Enquanto elas estão na cabeça, elas não deixam eu sair do trabalho.',
  ],
]

// =========================================================================
// Episódios
// =========================================================================

/** Frações fixas da duração onde cada um dos seis capítulos começa. */
const CHAPTER_FRACS = [0, 0.07, 0.22, 0.41, 0.63, 0.84]

function buildChapters(titles: string[], durationSec: number): Chapter[] {
  return titles.map((title, i) => ({
    id: i + 1,
    title,
    startSec: Math.round(durationSec * CHAPTER_FRACS[i]),
  }))
}

/**
 * Vinte pontos decrescentes que terminam exatamente na taxa de conclusão do
 * episódio, com uma queda bem maior num ponto — é ela que a tela de audiência
 * anota como "onde as pessoas param".
 */
function retentionCurve(seed: string, completionRate: number): number[] {
  const h = seedHash(seed)
  const dropAt = 3 + (h % 12)
  const weights: number[] = []
  for (let i = 0; i < 19; i++) {
    const jitter = 0.7 + (seedHash(seed + ':' + i) % 60) / 100
    weights.push(i === dropAt ? jitter * 4.2 : jitter)
  }
  const total = weights.reduce((a, b) => a + b, 0)
  const span = 1 - completionRate
  const points = [1]
  for (let i = 0; i < 19; i++) {
    points.push(Number((points[i] - (span * weights[i]) / total).toFixed(4)))
  }
  return points
}

function generatedTranscript(seed: string, chapters: Chapter[], guestName: string): TranscriptLine[] {
  const h = seedHash(seed)
  const out: TranscriptLine[] = []
  chapters.forEach((chapter, i) => {
    const [question, answer] = EXCHANGES[(h + i * 7) % EXCHANGES.length]
    const start = chapter.startSec
    out.push({
      id: out.length + 1,
      startSec: start,
      endSec: start + 13,
      speaker: i % 2 === 0 ? 'Marina' : 'Téo',
      text: question,
    })
    out.push({
      id: out.length + 1,
      startSec: start + 14,
      endSec: start + 31,
      speaker: guestName,
      text: answer,
    })
  })
  return out
}

interface EpisodeSeed {
  id: number
  season: number
  slug: string
  title: string
  subtitle: string
  cover: string
  /** Duração em segundos — tudo o que aparece como tempo é derivado daqui. */
  dur: number
  status: EpisodeStatus
  /** Dias atrás (publicado/rascunho) ou dias à frente (agendado). */
  at: number
  guests: number[]
  tags: string[]
  explicit?: boolean
  /** Seis títulos de capítulo, na ordem. */
  chapters: string[]
  intro: string
  topics: string[]
  quote: string
  link: { label: string; href: string }
  /** Downloads acumulados — só faz sentido em episódio publicado. */
  downloads: number
  transcript?: TranscriptLine[]
}

const EPISODE_SEEDS: EpisodeSeed[] = [
  // ===== Temporada 1 — Como se começa =====
  {
    id: 1,
    season: 1,
    slug: 'o-primeiro-cliente-que-quase-quebrou-o-estudio',
    title: 'O primeiro cliente que quase quebrou o estúdio',
    subtitle: 'Escopo que cresce sozinho, contrato mal escrito e a coragem de encerrar no meio.',
    cover: 'contrato-mesa',
    dur: 2760,
    status: 'publicado',
    at: 714,
    guests: [3],
    tags: ['começo', 'contrato', 'preço'],
    chapters: [
      'Abertura',
      'Como o contrato chegou',
      'O escopo que cresceu sozinho',
      'A conversa difícil',
      'O que ficou no contrato de hoje',
      'Encerramento',
    ],
    intro:
      'Renata Kubo conta a história do cliente que pagava bem, atrasava tudo e quase levou o estúdio junto. É um episódio sobre escopo, sobre contrato e sobre encerrar um trabalho no meio sem queimar a relação.',
    topics: [
      'Por que o escopo cresce sem ninguém perceber',
      'A cláusula que ela nunca mais tirou do contrato',
      'Como avisar o cliente de que o projeto vai parar',
    ],
    quote: 'Eu não perdi dinheiro com esse cliente. Eu perdi um ano em que poderia ter feito outra coisa.',
    link: { label: 'Modelo de contrato comentado', href: 'https://exemplo.com/onda/contrato' },
    downloads: 9800,
  },
  {
    id: 2,
    season: 1,
    slug: 'desenhar-antes-de-saber-desenhar',
    title: 'Desenhar antes de saber desenhar',
    subtitle: 'Portfólio feito de trabalho que ninguém pediu, cópia honesta e a primeira crítica de verdade.',
    cover: 'prancheta-estudio',
    dur: 2520,
    status: 'publicado',
    at: 700,
    guests: [1],
    tags: ['design', 'começo', 'aprendizado'],
    chapters: [
      'Abertura',
      'O primeiro portfólio',
      'Copiar para aprender',
      'A crítica que mudou tudo',
      'O que ela ensina hoje',
      'Encerramento',
    ],
    intro:
      'Lia Marçal montou o primeiro portfólio com trabalho que ninguém encomendou e conseguiu emprego com ele. A conversa é sobre aprender em público, copiar com honestidade e aguentar a primeira crítica séria.',
    topics: [
      'Como escolher o que entra no portfólio',
      'A diferença entre copiar e estudar',
      'O que fazer quando a crítica é justa',
    ],
    quote: 'Eu copiei tela por tela durante um ano. Foi a coisa mais útil que eu fiz e a que eu mais tive vergonha de contar.',
    link: { label: 'Exercícios de cópia comentados', href: 'https://exemplo.com/onda/copia' },
    downloads: 8600,
  },
  {
    id: 3,
    season: 1,
    slug: 'cinco-perguntas-que-abrem-qualquer-conversa',
    title: 'Cinco perguntas que abrem qualquer conversa',
    subtitle: 'O roteiro curto de entrevista que serve para pesquisa, para vaga e para corredor.',
    cover: 'entrevista-cafe',
    dur: 2940,
    status: 'publicado',
    at: 686,
    guests: [5],
    tags: ['pesquisa', 'entrevista', 'método'],
    chapters: [
      'Abertura',
      'A primeira pergunta',
      'Silêncio como ferramenta',
      'O erro de induzir',
      'Como anotar sem atrapalhar',
      'Encerramento',
    ],
    intro:
      'Fernanda Lisboa faz entrevista de pesquisa há oito anos e trouxe o roteiro curto que usa quando tem trinta minutos e nenhum contexto. Serve para pesquisa, para entrevista de emprego e para conversa de corredor.',
    topics: [
      'As cinco perguntas, na ordem',
      'Por que a segunda pergunta é sempre "me conta mais"',
      'O que fazer quando a pessoa responde o que você quer ouvir',
    ],
    quote: 'A pergunta boa não é a inteligente. É a que a pessoa consegue responder com uma história.',
    link: { label: 'Roteiro das cinco perguntas', href: 'https://exemplo.com/onda/roteiro' },
    downloads: 11200,
  },
  {
    id: 4,
    season: 1,
    slug: 'a-primeira-planilha-que-virou-empresa',
    title: 'A primeira planilha que virou empresa',
    subtitle: 'Três anos de operação numa aba compartilhada e o dia em que ela travou com quarenta pessoas dentro.',
    cover: 'planilha-tela',
    dur: 3120,
    status: 'publicado',
    at: 672,
    guests: [2],
    tags: ['dados', 'ferramenta', 'começo'],
    chapters: [
      'Abertura',
      'A planilha original',
      'Quando virou gargalo',
      'A primeira migração',
      'O que ele manteria em planilha',
      'Encerramento',
    ],
    intro:
      'Otávio Bastos conta como uma planilha compartilhada sustentou a operação inteira de uma empresa por três anos — e o que aconteceu no dia em que ela travou com quarenta pessoas editando ao mesmo tempo.',
    topics: [
      'Quando a planilha ainda é a resposta certa',
      'Os sinais de que passou da hora de sair dela',
      'Como migrar sem parar a operação',
    ],
    quote: 'Planilha não é gambiarra. Gambiarra é planilha que ninguém sabe mais quem mantém.',
    link: { label: 'Checklist de migração', href: 'https://exemplo.com/onda/planilha' },
    downloads: 7900,
  },
  {
    id: 5,
    season: 1,
    slug: 'trabalhar-sozinho-sem-ficar-sozinho',
    title: 'Trabalhar sozinho sem ficar sozinho',
    subtitle: 'A rotina, a rede de colegas e a conta que precisa fechar todo mês.',
    cover: 'cidade-janela',
    dur: 2640,
    status: 'publicado',
    at: 658,
    guests: [6],
    tags: ['autônomo', 'rotina', 'carreira'],
    chapters: [
      'Abertura',
      'A decisão de sair',
      'A rotina que segurou',
      'Rede de colegas',
      'O dinheiro no fim do mês',
      'Encerramento',
    ],
    intro:
      'Caio Ribeiro largou o emprego fixo e nunca mais voltou. Conta a rotina que segurou os primeiros meses, a rede de colegas que substituiu o time e a conta que precisa fechar para isso continuar de pé.',
    topics: [
      'O que ele faz nas duas primeiras horas do dia',
      'Como manter colegas quando não existe corredor',
      'A reserva mínima antes de sair do emprego',
    ],
    quote: 'Trabalhar sozinho é fácil. Difícil é continuar aprendendo sem ninguém do lado.',
    link: { label: 'Planilha da reserva', href: 'https://exemplo.com/onda/reserva' },
    downloads: 10400,
  },
  {
    id: 6,
    season: 1,
    slug: 'o-que-se-corta-primeiro-numa-edicao',
    title: 'O que se corta primeiro numa edição',
    subtitle: 'A regra dos dois minutos, o vício de fala e a pausa que é conteúdo.',
    cover: 'estudio-audio',
    dur: 2400,
    status: 'publicado',
    at: 644,
    guests: [4],
    tags: ['áudio', 'edição', 'ofício'],
    chapters: [
      'Abertura',
      'A primeira passada',
      'Cortar o começo',
      'Respiração e vício de fala',
      'Quando não cortar',
      'Encerramento',
    ],
    intro:
      'Diego Amorim edita podcast há quinze anos e abriu o processo inteiro: o que ele corta na primeira passada, o que só some na terceira e por que quase todo episódio melhora quando perde os dois primeiros minutos.',
    topics: [
      'A regra dos dois minutos',
      'O que fazer com o vício de fala do convidado',
      'Quando a pausa é conteúdo',
    ],
    quote: 'Corta o começo. Sempre. O aquecimento é seu, não de quem está ouvindo.',
    link: { label: 'Antes e depois de uma edição', href: 'https://exemplo.com/onda/edicao' },
    downloads: 12600,
  },
  {
    id: 7,
    season: 1,
    slug: 'como-checar-uma-informacao-em-dez-minutos',
    title: 'Como checar uma informação em dez minutos',
    subtitle: 'Fonte primária, número redondo demais e o print que já circulou no grupo do trabalho.',
    cover: 'redacao-mesa',
    dur: 2820,
    status: 'publicado',
    at: 630,
    guests: [7],
    tags: ['jornalismo', 'método', 'informação'],
    explicit: true,
    chapters: [
      'Abertura',
      'De onde veio o número',
      'Fonte primária',
      'O print que circula',
      'Quando publicar a dúvida',
      'Encerramento',
    ],
    intro:
      'Bruna Teixeira mostra o caminho curto para checar uma informação antes de repassá-la: achar a fonte primária, ler a metodologia e desconfiar do número redondo demais.',
    topics: [
      'Os três lugares onde ela procura primeiro',
      'Por que número redondo é sinal de alerta',
      'Como corrigir em público sem se destruir',
    ],
    quote: 'Se você não achou a fonte em dez minutos, a informação ainda não está pronta para ser repassada.',
    link: { label: 'Roteiro de checagem', href: 'https://exemplo.com/onda/checagem' },
    downloads: 8200,
  },
  {
    id: 8,
    season: 1,
    slug: 'o-teste-que-terminou-cedo-demais',
    title: 'O teste que terminou cedo demais',
    subtitle: 'Por que quase todo teste A/B acaba no dia em que o resultado fica bonito.',
    cover: 'quadro-numeros',
    dur: 3360,
    status: 'publicado',
    at: 616,
    guests: [8],
    tags: ['estatística', 'produto', 'experimento'],
    chapters: [
      'Abertura',
      'O que é parar cedo',
      'Um caso real',
      'Tamanho de amostra',
      'O que fazer sem estatístico',
      'Encerramento',
    ],
    intro:
      'Marcelo Antunes explica, sem fórmula na tela, por que a maioria dos testes A/B termina no dia em que o resultado fica bonito — e quanto isso custa em decisão errada.',
    topics: [
      'Por que espiar o resultado estraga o teste',
      'Como estimar a amostra no guardanapo',
      'O que medir quando não dá para testar',
    ],
    quote: 'Todo teste dá resultado, se você olhar um número suficiente de vezes.',
    link: { label: 'Calculadora de amostra', href: 'https://exemplo.com/onda/amostra' },
    downloads: 13100,
  },

  // ===== Temporada 2 — O ofício =====
  {
    id: 9,
    season: 2,
    slug: 'preco-nao-e-conta-e-conversa',
    title: 'Preço não é conta, é conversa',
    subtitle: 'Faixa em vez de número, âncora e o único desconto que ela ainda dá.',
    cover: 'proposta-mesa',
    dur: 3240,
    status: 'publicado',
    at: 316,
    guests: [3],
    tags: ['preço', 'negociação', 'estúdio'],
    chapters: [
      'Abertura',
      'Como ela chegava ao preço antes',
      'A conversa de descoberta',
      'Faixa em vez de número',
      'Quando dar desconto',
      'Encerramento',
    ],
    intro:
      'Renata Kubo abre a planilha de precificação do estúdio e explica por que parou de mandar número no primeiro e-mail. Episódio prático sobre faixa de preço, âncora e desconto.',
    topics: [
      'As três perguntas antes de falar em dinheiro',
      'Por que ela manda faixa e não valor fechado',
      'O único desconto que ela ainda dá',
    ],
    quote: 'Quando o cliente sabe o preço antes de saber o valor, a conversa já acabou.',
    link: { label: 'Planilha de precificação', href: 'https://exemplo.com/onda/preco' },
    downloads: 16800,
  },
  {
    id: 10,
    season: 2,
    slug: 'a-agenda-fechada-as-sextas',
    title: 'A agenda fechada às sextas',
    subtitle: 'Quatro anos sem reunião no último dia da semana — e as duas exceções.',
    cover: 'calendario-sexta',
    dur: 2700,
    status: 'publicado',
    at: 302,
    guests: [6],
    tags: ['rotina', 'autônomo', 'foco'],
    chapters: [
      'Abertura',
      'Por que sexta',
      'Como avisar o cliente',
      'O que ele faz na sexta',
      'Quando quebra a regra',
      'Encerramento',
    ],
    intro:
      'Caio Ribeiro não marca reunião às sextas há quatro anos. Conta como negociou isso com três clientes fixos, o que faz com o dia livre e as duas vezes em que abriu exceção.',
    topics: [
      'Como propor a regra sem parecer folga',
      'O que cabe num dia sem reunião',
      'O custo real de uma reunião de trinta minutos',
    ],
    quote: 'Meia hora de reunião não custa meia hora. Custa a manhã inteira em volta dela.',
    link: { label: 'Modelo de aviso ao cliente', href: 'https://exemplo.com/onda/sexta' },
    downloads: 15200,
  },
  {
    id: 11,
    season: 2,
    slug: 'interface-que-ninguem-percebe',
    title: 'Interface que ninguém percebe',
    subtitle: 'Quatro versões de um campo de data e dezoito por cento menos chamados.',
    cover: 'tela-formulario',
    dur: 2940,
    status: 'publicado',
    at: 288,
    guests: [1],
    tags: ['design', 'produto', 'detalhe'],
    chapters: [
      'Abertura',
      'O campo de data',
      'Detalhe ou custo',
      'Medir antes de mexer',
      'Voltar atrás',
      'Encerramento',
    ],
    intro:
      'Lia Marçal defende que a melhor interface é a que ninguém comenta. Para provar, conta as quatro versões de um campo de data que derrubaram dezoito por cento dos chamados de suporte.',
    topics: [
      'Como transformar detalhe em número',
      'O registro de uma linha por decisão',
      'Quando desfazer uma mudança',
    ],
    quote: 'Sem o número de antes, qualquer melhora vira opinião.',
    link: { label: 'Registro de decisões de interface', href: 'https://exemplo.com/onda/decisoes' },
    downloads: 21400,
    transcript: TRANSCRIPT_11,
  },
  {
    id: 12,
    season: 2,
    slug: 'ouvir-sem-induzir',
    title: 'Ouvir sem induzir',
    subtitle: 'A pergunta que já traz a resposta, o elogio educado e a vontade de confirmar.',
    cover: 'bloco-anotacoes',
    dur: 3060,
    status: 'publicado',
    at: 274,
    guests: [5],
    tags: ['pesquisa', 'entrevista', 'escuta'],
    chapters: [
      'Abertura',
      'A pergunta viciada',
      'Reformular na hora',
      'O que fazer com elogio',
      'Anotar o que não foi dito',
      'Encerramento',
    ],
    intro:
      'Segunda conversa com Fernanda Lisboa, agora sobre o que estraga uma entrevista: a pergunta que já traz a resposta, o elogio educado e a vontade de confirmar o que a gente já achava.',
    topics: [
      'Três formatos de pergunta que induzem',
      'Como reformular sem constranger',
      'O que anotar além da fala',
    ],
    quote: 'Se a pessoa elogiou o produto três vezes, você não entrevistou, você apresentou.',
    link: { label: 'Lista de perguntas viciadas', href: 'https://exemplo.com/onda/perguntas' },
    downloads: 17600,
  },
  {
    id: 13,
    season: 2,
    slug: 'painel-bonito-decisao-ruim',
    title: 'Painel bonito, decisão ruim',
    subtitle: 'Métrica sem dono, média sem distribuição e gráfico que ninguém transforma em ação.',
    cover: 'painel-graficos',
    dur: 3480,
    status: 'publicado',
    at: 260,
    guests: [2, 8],
    tags: ['dados', 'métrica', 'decisão'],
    chapters: [
      'Abertura',
      'O painel de quarenta gráficos',
      'Métrica que ninguém age',
      'Média engana',
      'Um número por reunião',
      'Encerramento',
    ],
    intro:
      'Otávio Bastos e Marcelo Antunes discutem por que quase todo painel corporativo é decorativo: métrica sem dono, média sem distribuição e gráfico que ninguém consegue transformar em ação.',
    topics: [
      'O teste dos cinco segundos para qualquer gráfico',
      'Por que a média é o pior resumo possível',
      'Como reduzir um painel a um número',
    ],
    quote: 'Se ninguém muda de comportamento por causa do gráfico, ele é enfeite.',
    link: { label: 'Modelo de painel enxuto', href: 'https://exemplo.com/onda/painel' },
    downloads: 19800,
  },
  {
    id: 14,
    season: 2,
    slug: 'o-silencio-e-a-edicao-mais-dificil',
    title: 'O silêncio é a edição mais difícil',
    subtitle: 'Quanto silêncio o ouvinte aguenta, onde a trilha atrapalha e o corte que dói.',
    cover: 'fones-mesa',
    dur: 2880,
    status: 'publicado',
    at: 246,
    guests: [4],
    tags: ['áudio', 'edição', 'ritmo'],
    chapters: [
      'Abertura',
      'Silêncio que funciona',
      'Ritmo e respiração',
      'A trilha atrapalha?',
      'O corte que dói',
      'Encerramento',
    ],
    intro:
      'Diego Amorim volta para falar do que chama de decisão mais difícil da edição: deixar o silêncio ficar. Tem exemplo, tem contraexemplo e tem a hora de cortar mesmo assim.',
    topics: [
      'Quanto silêncio o ouvinte aguenta',
      'Onde a trilha ajuda e onde ela empurra',
      'Como cortar a melhor fala do episódio',
    ],
    quote: 'Um segundo de silêncio bem colocado vale mais do que qualquer trilha.',
    link: { label: 'Trechos comparados', href: 'https://exemplo.com/onda/silencio' },
    downloads: 22600,
  },
  {
    id: 15,
    season: 2,
    slug: 'quem-paga-a-reportagem',
    title: 'Quem paga a reportagem',
    subtitle: 'A conta aberta de um veículo independente: assinatura, patrocínio e a pauta que nunca paga.',
    cover: 'cidade-banca',
    dur: 3300,
    status: 'publicado',
    at: 232,
    guests: [7],
    tags: ['jornalismo', 'financiamento', 'independência'],
    explicit: true,
    chapters: [
      'Abertura',
      'O modelo independente',
      'Assinatura e conflito',
      'Pauta que não rende',
      'Como manter a confiança',
      'Encerramento',
    ],
    intro:
      'Bruna Teixeira abre a conta do veículo independente onde trabalha: quanto entra de assinatura, quanto de patrocínio e quais pautas nunca pagam a própria conta — mas continuam existindo.',
    topics: [
      'Onde ela traça a linha do patrocínio',
      'A pauta cara que nenhum anunciante quer',
      'O que muda quando o leitor paga',
    ],
    quote: 'Financiamento não é detalhe administrativo. É a primeira coisa que o leitor deveria saber.',
    link: { label: 'Relatório de transparência', href: 'https://exemplo.com/onda/transparencia' },
    downloads: 18300,
  },
  {
    id: 16,
    season: 2,
    slug: 'repertorio-se-constroi-ou-se-acha',
    title: 'Repertório se constrói ou se acha?',
    subtitle: 'Pasta de referência, leitura sem objetivo e cobrar por um trabalho que saiu em dez minutos.',
    cover: 'pasta-referencia',
    dur: 3180,
    status: 'publicado',
    at: 218,
    guests: [9, 6],
    tags: ['criação', 'repertório', 'preço'],
    chapters: [
      'Abertura',
      'A pasta das trezentas imagens',
      'Ler sem objetivo',
      'Cobrar por dez minutos',
      'Recusar trabalho',
      'Encerramento',
    ],
    intro:
      'Sofia Nakamura e Caio Ribeiro conversam sobre de onde vem ideia: pasta de referência, leitura sem objetivo e a coragem de cobrar por um trabalho que saiu rápido porque levou quinze anos para ficar rápido.',
    topics: [
      'Como montar uma pasta de referência que sirva',
      'Por que buscar fecha e ler abre',
      'Cobrar por problema resolvido, não por hora',
    ],
    quote: 'Os dez minutos são a parte visível. O resto é a pasta das trezentas imagens.',
    link: { label: 'As pastas de referência das duas', href: 'https://exemplo.com/onda/referencia' },
    downloads: 26400,
    transcript: TRANSCRIPT_16,
  },

  // ===== Temporada 3 — Escala =====
  {
    id: 17,
    season: 3,
    slug: 'turno-planilha-e-gente-cansada',
    title: 'Turno, planilha e gente cansada',
    subtitle: 'O que a escala faz com o combinado — e por que o turno da noite é o último a saber.',
    cover: 'galpao-turno',
    dur: 3540,
    status: 'publicado',
    at: 18,
    guests: [10, 3],
    tags: ['operação', 'escala', 'pessoas'],
    chapters: [
      'Abertura',
      'A escala de turno',
      'O que quebra primeiro',
      'Automatizar o quê',
      'Conversar com o turno da noite',
      'Encerramento',
    ],
    intro:
      'Paulo Vidal cuida da operação de uma transportadora com trezentas pessoas; Renata Kubo, de um estúdio com dez. A conversa é sobre o que a escala faz com o combinado e sobre quem fica sabendo por último.',
    topics: [
      'O sinal de que a escala quebrou',
      'O que automatizar primeiro numa operação',
      'Como levar informação para quem não senta na frente de um computador',
    ],
    quote: 'Toda regra nova chega no turno da noite três semanas depois. Sempre.',
    link: { label: 'Modelo de escala comentado', href: 'https://exemplo.com/onda/escala' },
    downloads: 31200,
  },
  {
    id: 18,
    season: 3,
    slug: 'quando-o-time-dobra-de-tamanho',
    title: 'Quando o time dobra de tamanho',
    subtitle: 'De seis para treze pessoas em seis meses: o que quebrou e o que passou a ser escrito.',
    cover: 'sala-reuniao',
    dur: 3612,
    status: 'publicado',
    at: 4,
    guests: [1],
    tags: ['time', 'gestão', 'escala'],
    chapters: [
      'Abertura',
      'A reunião de cinquenta minutos',
      'Escrever não bastou',
      'Contratar rápido demais',
      'Quem decide o quê',
      'Encerramento',
    ],
    intro:
      'Lia Marçal saiu de seis para treze pessoas em seis meses. Conta o que quebrou primeiro, o que ela tentou consertar escrevendo e o limite de risco que hoje define quem decide o quê.',
    topics: [
      'O sinal de que o time passou do tamanho',
      'Por que documento não resolve sozinho',
      'A regra do reversível em uma semana',
    ],
    quote: 'Dá para contratar três pessoas em um mês. Não dá para formar três pessoas em um mês.',
    link: { label: 'Registro de decisões do time', href: 'https://exemplo.com/onda/time' },
    downloads: 19700,
    transcript: TRANSCRIPT_18,
  },
  {
    id: 19,
    season: 3,
    slug: 'a-operacao-que-nao-pode-parar',
    title: 'A operação que não pode parar',
    subtitle: 'Escala de sobreaviso, o incidente de doze horas e o que mudou depois dele.',
    cover: 'cidade-madrugada',
    dur: 3300,
    status: 'agendado',
    at: 5,
    guests: [10],
    tags: ['operação', 'incidente', 'plantão'],
    chapters: [
      'Abertura',
      'Plantão e sobreaviso',
      'O incidente de dezembro',
      'Quem acorda de madrugada',
      'Depois do incidente',
      'Encerramento',
    ],
    intro:
      'Paulo Vidal volta para falar de plantão: como se monta uma escala de sobreaviso que não destrói ninguém e o que a empresa dele mudou depois de um incidente de doze horas em dezembro.',
    topics: ['O custo real do plantão', 'Como escrever um relato de incidente', 'O que não delegar de madrugada'],
    quote: 'Plantão barato é o mais caro de todos. Você paga em rotatividade.',
    link: { label: 'Modelo de relato de incidente', href: 'https://exemplo.com/onda/incidente' },
    downloads: 0,
  },
  {
    id: 20,
    season: 3,
    slug: 'contratar-a-decima-pessoa',
    title: 'Contratar a décima pessoa',
    subtitle: 'O processo que ela finalmente escreveu, o teste prático remunerado e os trinta primeiros dias.',
    cover: 'entrevista-sala',
    dur: 3120,
    status: 'agendado',
    at: 19,
    guests: [3],
    tags: ['contratação', 'time', 'estúdio'],
    chapters: [
      'Abertura',
      'O que muda no décimo',
      'Processo mínimo',
      'Teste prático',
      'Os primeiros trinta dias',
      'Encerramento',
    ],
    intro:
      'Renata Kubo conta o que mudou no estúdio quando entrou a décima pessoa: o processo que ela finalmente escreveu, o teste prático que ela paga e o roteiro dos trinta primeiros dias.',
    topics: ['Por que o décimo é diferente do nono', 'O teste prático que ela remunera', 'O combinado dos trinta dias'],
    quote: 'Até nove, dá para conhecer todo mundo. No décimo, você precisa confiar no processo.',
    link: { label: 'Roteiro de contratação', href: 'https://exemplo.com/onda/contratacao' },
    downloads: 0,
  },
  {
    id: 21,
    season: 3,
    slug: 'o-manual-que-ninguem-le',
    title: 'O manual que ninguém lê',
    subtitle: 'Documentação interna que envelhece em três meses e o que fazer com ela.',
    cover: 'manual-gaveta',
    dur: 2880,
    status: 'rascunho',
    at: 9,
    guests: [],
    tags: ['documentação', 'processo'],
    chapters: [
      'Abertura',
      'Por que o manual morre',
      'Documento vivo',
      'Quem mantém',
      'Exemplo prático',
      'Encerramento',
    ],
    intro:
      'Rascunho: episódio sobre documentação interna que envelhece em três meses. Falta convidar a segunda voz e marcar a gravação.',
    topics: ['Por que o manual envelhece', 'Documento com dono e com data', 'O que não vale a pena documentar'],
    quote: 'Documento sem dono é aviso de mural: todo mundo lê uma vez e ninguém mais.',
    link: { label: 'Pauta em aberto', href: 'https://exemplo.com/onda/pauta-manual' },
    downloads: 0,
  },
  {
    id: 22,
    season: 3,
    slug: 'ferramenta-nova-problema-velho',
    title: 'Ferramenta nova, problema velho',
    subtitle: 'Trocar de ferramenta para não ter que trocar de processo.',
    cover: 'ferramentas-mesa',
    dur: 3000,
    status: 'rascunho',
    at: 6,
    guests: [2],
    tags: ['ferramenta', 'processo', 'dados'],
    chapters: [
      'Abertura',
      'A promessa da ferramenta',
      'O problema que continua',
      'Custo de migração',
      'Quando trocar vale',
      'Encerramento',
    ],
    intro:
      'Rascunho: conversa com Otávio Bastos sobre trocar de ferramenta para não ter que trocar de processo. Já gravado, falta editar e escrever as notas.',
    topics: [
      'Os três sinais de fuga para a ferramenta nova',
      'Como calcular o custo de migrar',
      'Quando trocar realmente resolve',
    ],
    quote: 'A ferramenta nova costuma resolver o problema que a gente já sabia resolver.',
    link: { label: 'Pauta em aberto', href: 'https://exemplo.com/onda/pauta-ferramenta' },
    downloads: 0,
  },
  {
    id: 23,
    season: 3,
    slug: 'delegar-doi',
    title: 'Delegar dói',
    subtitle: 'A fase de refazer à noite o trabalho que foi delegado de manhã.',
    cover: 'lista-tarefas',
    dur: 2760,
    status: 'rascunho',
    at: 3,
    guests: [1],
    tags: ['gestão', 'time', 'delegação'],
    chapters: [
      'Abertura',
      'O primeiro trabalho delegado',
      'Refazer escondido',
      'Como pedir por escrito',
      'Aceitar diferente',
      'Encerramento',
    ],
    intro:
      'Rascunho: Lia Marçal sobre a fase em que refazia à noite o trabalho que tinha delegado de manhã. Gravado em vídeo, ainda sem corte.',
    topics: [
      'Por que a gente refaz escondido',
      'Pedir por escrito muda o pedido',
      'Aceitar um resultado diferente do imaginado',
    ],
    quote: 'Eu delegava a tarefa e ficava com a decisão. Isso não é delegar, é dar trabalho.',
    link: { label: 'Pauta em aberto', href: 'https://exemplo.com/onda/pauta-delegar' },
    downloads: 0,
  },
  {
    id: 24,
    season: 3,
    slug: 'o-que-fica-quando-o-hype-passa',
    title: 'O que fica quando o hype passa',
    subtitle: 'Três ondas de tecnologia dos últimos dez anos e o que sobrou de cada uma.',
    cover: 'cidade-skyline',
    dur: 3180,
    status: 'rascunho',
    at: 1,
    guests: [7],
    tags: ['tecnologia', 'jornalismo', 'hype'],
    chapters: [
      'Abertura',
      'Três ondas recentes',
      'O que sobrou',
      'Quem paga a conta',
      'Cobrir sem embarcar',
      'Encerramento',
    ],
    intro:
      'Rascunho: Bruna Teixeira revisita três ondas de tecnologia dos últimos dez anos e o que sobrou de cada uma. Pauta fechada, gravação marcada.',
    topics: [
      'O ciclo de uma onda, do anúncio ao silêncio',
      'O que sobrevive de cada ciclo',
      'Como cobrir sem virar torcida',
    ],
    quote: 'O que sobra do hype nunca é o produto. É a infraestrutura que alguém construiu no meio.',
    link: { label: 'Pauta em aberto', href: 'https://exemplo.com/onda/pauta-hype' },
    downloads: 0,
  },
]

function buildBlocks(seed: EpisodeSeed): Block[] {
  const guestLinks = seed.guests
    .flatMap((id) => GUEST_SEEDS.find((g) => g.id === id)?.links ?? [])
    .slice(0, 2)
  return [
    { type: 'paragraph', text: seed.intro },
    { type: 'heading', text: 'No episódio' },
    { type: 'list', items: seed.topics },
    { type: 'quote', text: seed.quote },
    { type: 'heading', text: 'Links citados' },
    { type: 'link', href: seed.link.href, label: seed.link.label },
    ...guestLinks.map<Block>((l) => ({ type: 'link', href: l.href, label: l.label })),
  ]
}

function toEpisode(seed: EpisodeSeed): Episode {
  const chapters = buildChapters(seed.chapters, seed.dur)
  const key = `ep-${seed.id}-${seed.slug}`
  const published = seed.status === 'publicado'
  const scheduled = seed.status === 'agendado'
  const h = seedHash(key)

  const completionRate = published ? Number((0.54 + ((h >> 3) % 27) / 100).toFixed(3)) : 0
  const uniqueListeners = published ? Math.round(seed.downloads * (0.74 + (h % 9) / 100)) : 0
  const guestName = seed.guests.length
    ? (GUEST_SEEDS.find((g) => g.id === seed.guests[0])?.name.split(' ')[0] ?? 'Téo')
    : 'Téo'

  return {
    id: seed.id,
    slug: seed.slug,
    number: seed.id,
    season: seed.season,
    title: seed.title,
    subtitle: seed.subtitle,
    coverSeed: seed.cover,
    durationSec: seed.dur,
    // Em rascunho a data representa a última edição; em agendado, a publicação prevista.
    publishedAt: scheduled ? daysAhead(seed.at) : daysAgo(seed.at),
    scheduledAt: scheduled ? daysAhead(seed.at) : null,
    status: seed.status,
    blocks: buildBlocks(seed),
    chapters,
    transcript: seed.transcript
      ? seed.transcript
      : published
        ? generatedTranscript(key, chapters, guestName)
        : [],
    guestIds: [...seed.guests],
    tags: [...seed.tags],
    explicit: seed.explicit ?? false,
    downloads: seed.downloads,
    uniqueListeners,
    completionRate,
    retention: published ? retentionCurve(key, completionRate) : [],
  }
}

export const EPISODES: Episode[] = EPISODE_SEEDS.map(toEpisode)

/** `episodeIds` de cada convidado sai dos episódios — nunca é escrito à mão. */
export const GUESTS: Guest[] = GUEST_SEEDS.map((g) => ({
  ...g,
  episodeIds: EPISODES.filter((e) => e.guestIds.includes(g.id)).map((e) => e.id),
}))

/** O ano da temporada vem do episódio mais antigo dela. */
export const SEASONS: Season[] = SEASON_SEEDS.map((s) => {
  const eps = EPISODES.filter((e) => e.season === s.number)
  const oldest = eps.reduce<Episode | null>(
    (acc, e) => (!acc || e.publishedAt < acc.publishedAt ? e : acc),
    null
  )
  return { ...s, year: oldest ? new Date(oldest.publishedAt).getFullYear() : new Date().getFullYear() }
})
