# Podcast & Áudio / Angular

[Read in English](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![Free](https://img.shields.io/badge/price-free-brightgreen)

Hospedagem e publicação de podcast em Angular 19 + Tailwind: página pública do programa com player global que continua tocando ao trocar de rota, capítulos clicáveis e transcrição sincronizada que salta o áudio ao clicar na fala. O estúdio traz editor de episódio com forma de onda desenhada, marcadores de capítulo arrastáveis, notas em blocos e transcrição por falante; audiência com downloads por plataforma e por país e curva de retenção com o ponto de maior queda anotado; convidados, patrocinadores por tipo de inserção e prévia do feed RSS gerada dos episódios publicados. i18n pt-BR/en/es, PWA, dark mode.

## Destaques

- Player global que atravessa as rotas
- Transcrição sincronizada e capítulos clicáveis
- Forma de onda desenhada, sem imagem nem lib
- Retenção, plataformas e prévia do RSS
- i18n pt-BR/en/es, PWA, dark mode

## Telas em destaque

- Episódio: Player, capítulos e transcrição
- Estúdio: Forma de onda e marcadores
- Audiência: Retenção e plataformas
- Distribuição: RSS e patrocinadores

## Stack

- Angular 19
- TypeScript
- Tailwind CSS v4
- Transloco
- ApexCharts
- RxJS

## Requisitos

- Node.js 20 ou mais novo, com npm

## Como rodar

```bash
npm install
npm run dev
```

O servidor de desenvolvimento mostra a URL local para abrir.

Conta de demonstração:

- `host@onda.fm` / `demo123`

## Build de produção

```bash
npm run build
```

Gera o pacote de produção em `dist/`; para conferir localmente, `npm run preview`. Qualquer hospedagem estática serve; para as rotas no cliente, redirecione caminhos desconhecidos para `index.html`.

## Estrutura do projeto

```
src/app/
├── components/  app, layout, pc, ui
├── core/  data, guards, services
├── lib/
├── pages/  app, public
```

## Outras tecnologias

Este template também existe em outras 4 tecnologias, com as mesmas telas e a mesma identidade visual. Todas são gratuitas:

- React 19: https://github.com/danilo62x/podcast-react
- Vue 3: https://github.com/danilo62x/podcast-vue3
- Laravel 11: https://github.com/danilo62x/podcast-laravel
- HTML estático: https://github.com/danilo62x/podcast-html

Mais templates gratuitos (painéis admin, sistemas por segmento e apps Flutter): https://github.com/danilo62x?tab=repositories

## Licença

[MIT](./LICENSE), copyright 2026 Danilo Quinelato.
