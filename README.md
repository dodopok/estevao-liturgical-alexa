# Estevão — Alexa Skill do Calendário Litúrgico Anglicano

Alexa Skill em português (pt-BR) que consulta a [API Estevão](https://estevao.caminhoanglicano.com.br) para fornecer informações do Calendário Litúrgico da Igreja Episcopal Anglicana do Brasil (IEAB).

## O que a skill faz

| O que você pode dizer | Descrição |
|---|---|
| *"qual é a coleta de hoje"* | Lê a coleta (oração do dia) |
| *"que dia do calendário litúrgico é hoje"* | Diz o tempo litúrgico, cor e celebração |
| *"quando é Pentecostes"* | Informa a data de uma festa litúrgica |
| *"quando é Páscoa"* | Informa a data da Páscoa no ano corrente |
| *"quando cai Quarta-feira de Cinzas"* | Informa datas móveis |

## Estrutura do Projeto

```
estevao-liturgical-alexa/
├── skill.json                        # Manifesto da Alexa Skill
├── .env.example                      # Variáveis de ambiente necessárias
├── interactionModels/
│   └── custom/
│       └── pt-BR.json                # Modelo de interação (português do Brasil)
└── lambda/
    ├── package.json
    ├── api.js                        # Cliente HTTP da API Estevão
    └── index.js                      # Handler Lambda com todos os intents
```

## Pré-requisitos

- [Node.js](https://nodejs.org) 18+
- [ASK CLI](https://developer.amazon.com/en-US/docs/alexa/smapi/quick-start-alexa-skills-kit-command-line-interface.html) (`npm install -g ask-cli`)
- Conta de [Amazon Developer](https://developer.amazon.com)
- Conta AWS (para o Lambda) ou usar o **Alexa-hosted skill**
- Chave de API Estevão (`ESTEVAO_API_KEY`)

## Configuração

### 1. Instalar dependências

```bash
cd lambda
npm install
```

### 2. Configurar a chave da API

No console do AWS Lambda (ou nas variáveis de ambiente do Alexa-hosted skill), adicione:

```
ESTEVAO_API_KEY=sua_chave_aqui
```

### 3. Deploy com ASK CLI

```bash
# Autenticar
ask configure

# Deploy completo (cria o skill, Lambda e modelo de interação)
ask deploy
```

### 4. Testar

```bash
ask dialog --locale pt-BR
```

Ou use o **Alexa Developer Console → Test** e diga:

- `abrir calendário litúrgico`
- `qual é a coleta de hoje`
- `quando é Pentecostes`

## Deploy manual (sem ASK CLI)

1. Faça o zip do conteúdo de `lambda/` (após `npm install`)
2. Faça o upload para o AWS Lambda
3. Configure a variável de ambiente `ESTEVAO_API_KEY`
4. No Alexa Developer Console:
   - Crie uma nova skill Custom em pt-BR
   - Importe o `interactionModels/custom/pt-BR.json`
   - Aponte o endpoint para o ARN do seu Lambda

## Intents implementados

| Intent | Descrição |
|---|---|
| `ColectaDoDia` | Busca e lê a coleta do dia via `/calendar/today` |
| `CalendarioHoje` | Informa tempo litúrgico, cor e celebração via `/calendar/today` |
| `DataLiturgica` | Consulta datas móveis via `/calendar/{year}/key_dates` |
| `AMAZON.HelpIntent` | Explica o que a skill pode fazer |
| `AMAZON.CancelIntent` / `AMAZON.StopIntent` | Encerra a skill |
| `AMAZON.FallbackIntent` | Trata entradas não reconhecidas |

## API utilizada

- **Base URL:** `https://api.caminhoanglicano.com.br/api/v1`
- **Autenticação:** `X-API-Key` no header
- **Livro de Oração:** LOC 2015 (`loc_2015`) — IEAB
- **Documentação:** https://estevao.caminhoanglicano.com.br/docs
