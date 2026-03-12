/**
 * Estevão Liturgical Alexa Skill
 *
 * Intents:
 *  - LaunchRequest        → Greets the user and offers options
 *  - ColectaDoDia         → Reads today's collect prayer
 *  - CalendarioHoje       → Tells today's liturgical season, color, and celebration
 *  - DataLiturgica        → Answers "quando é {feast}?" for moveable feasts
 *  - AMAZON.HelpIntent    → Explains what the skill can do
 *  - AMAZON.CancelIntent / AMAZON.StopIntent → Farewell
 *  - AMAZON.FallbackIntent
 */

const Alexa = require('ask-sdk-core');
const api = require('./api');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the current year in Brazil (UTC-3).
 */
function currentBrazilYear() {
    const now = new Date();
    // Offset to UTC-3 (Brazil standard time — ignores DST for simplicity)
    now.setHours(now.getHours() - 3);
    return now.getFullYear();
}

/**
 * Formats a date string from the API (YYYY-MM-DD) to Brazilian Portuguese.
 * Accepts both "YYYY-MM-DD" and "DD/MM/YYYY" formats.
 */
function formatDate(raw) {
    if (!raw) return '';
    let day, month, year;
    if (raw.includes('/')) {
        [day, month, year] = raw.split('/');
    } else {
        [year, month, day] = raw.split('-');
    }
    const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];
    return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} de ${year}`;
}

/**
 * Normalise a slot value to lower-case, no accents, for fuzzy matching.
 */
function normalize(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Maps common aliases the user might say to canonical key-date names returned
 * by the API.  Keys are normalised (no accents, lower-case).
 */
const FEAST_ALIASES = {
    'pascoa': ['pascoa', 'pascal', 'ressurreicao', 'domingo de pascoa'],
    'pentecostes': ['pentecostes', 'domingo de pentecostes'],
    'ascensao': ['ascensao', 'ascensao do senhor'],
    'cinzas': ['cinzas', 'quarta de cinzas', 'quarta-feira de cinzas', 'dia de cinzas'],
    'ramos': ['ramos', 'domingo de ramos', 'domingo das palmas'],
    'advento': ['advento', 'primeiro domingo do advento', 'inicio do advento'],
    'natal': ['natal', 'natividade', 'nascimento do senhor'],
    'epifania': ['epifania', 'tres reis', 'reis magos'],
    'trindade': ['trindade', 'domingo da trindade', 'santissima trindade'],
    'corpus christi': ['corpus christi', 'corpo de cristo', 'corpo e sangue de cristo'],
};

/**
 * Tries to find the best matching key-date name from the API response.
 * @param {string} slotValue  Raw value from the slot
 * @param {Array}  keyDates   Array of key-date objects from the API
 * @returns {{ found: Object|null, canonical: string }}
 */
function findFeast(slotValue, keyDates) {
    const norm = normalize(slotValue);

    // 1. Direct match against API names
    let match = keyDates.find(kd => normalize(kd.name) === norm);
    if (match) return { found: match, canonical: match.name };

    // 2. Partial / alias match
    for (const [canonical, aliases] of Object.entries(FEAST_ALIASES)) {
        if (aliases.some(a => norm.includes(a) || a.includes(norm))) {
            match = keyDates.find(kd => normalize(kd.name).includes(canonical) || canonical.includes(normalize(kd.name)));
            if (match) return { found: match, canonical: match.name };
        }
    }

    // 3. Fuzzy: any API name that includes the normalised slot value
    match = keyDates.find(kd => normalize(kd.name).includes(norm) || norm.includes(normalize(kd.name)));
    return { found: match || null, canonical: match ? match.name : slotValue };
}

// ─── Intent Handlers ────────────────────────────────────────────────────────

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speak =
            'Bem-vindo ao Calendário Litúrgico Anglicano. ' +
            'Você pode me perguntar: qual é a coleta de hoje, ' +
            'que dia do calendário litúrgico é hoje, ' +
            'ou quando é alguma data litúrgica, como Pentecostes ou Páscoa. ' +
            'Como posso ajudar?';
        const reprompt = 'Como posso ajudar? Pergunte, por exemplo: qual é a coleta de hoje?';
        return handlerInput.responseBuilder
            .speak(speak)
            .reprompt(reprompt)
            .getResponse();
    },
};

// ─── ColectaDoDia ────────────────────────────────────────────────────────────

const ColectaDoDiaHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'ColectaDoDia'
        );
    },
    async handle(handlerInput) {
        try {
            const data = await api.getToday();
            const collects = data.collect || [];

            if (!collects.length) {
                return handlerInput.responseBuilder
                    .speak('Não encontrei uma coleta para hoje. Tente novamente mais tarde.')
                    .getResponse();
            }

            // Alexa reads all collects if there are multiple (e.g. feast + season)
            let speech = '';
            if (data.celebration && data.celebration.name) {
                speech += `Coleta de ${data.celebration.name}. `;
            } else {
                speech += 'Coleta do dia. ';
            }

            collects.forEach((c) => {
                if (c.title && c.title !== (data.celebration && data.celebration.name)) {
                    speech += `${c.title}. `;
                }
                speech += `${c.text} `;
            });

            return handlerInput.responseBuilder.speak(speech.trim()).getResponse();
        } catch (err) {
            console.error('ColectaDoDia error:', err.message);
            return handlerInput.responseBuilder
                .speak('Desculpe, não consegui buscar a coleta agora. Tente novamente em alguns instantes.')
                .getResponse();
        }
    },
};

// ─── CalendarioHoje ──────────────────────────────────────────────────────────

const CalendarioHojeHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'CalendarioHoje'
        );
    },
    async handle(handlerInput) {
        try {
            const data = await api.getToday();

            const date = formatDate(data.date);
            const season = data.liturgical_season || 'tempo desconhecido';
            const color = data.liturgical_color || '';
            const year = data.liturgical_year ? `, Ano ${data.liturgical_year}` : '';
            const description = (data.description || []).join(', ');
            const celebration = data.celebration;

            let speech = `Hoje, ${date}, estamos na ${season}${year}`;
            if (description) speech += `, ${description}`;
            speech += '. ';
            if (color) speech += `A cor litúrgica do dia é ${color}. `;
            if (celebration && celebration.name) {
                const type = celebration.description
                    ? ` — ${celebration.description}`
                    : celebration.type
                    ? ` (${celebration.type})`
                    : '';
                speech += `A celebração de hoje é ${celebration.name}${type}.`;
            }

            return handlerInput.responseBuilder.speak(speech.trim()).getResponse();
        } catch (err) {
            console.error('CalendarioHoje error:', err.message);
            return handlerInput.responseBuilder
                .speak('Desculpe, não consegui buscar o calendário agora. Tente novamente em alguns instantes.')
                .getResponse();
        }
    },
};

// ─── DataLiturgica ───────────────────────────────────────────────────────────

const DataLiturgicaHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'DataLiturgica'
        );
    },
    async handle(handlerInput) {
        const slotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'dataLiturgica');

        if (!slotValue) {
            return handlerInput.responseBuilder
                .speak('Por favor, diga o nome da data litúrgica que deseja consultar, como Pentecostes ou Páscoa.')
                .reprompt('Qual data litúrgica você gostaria de saber?')
                .getResponse();
        }

        try {
            const year = currentBrazilYear();
            const keyDates = await api.getKeyDates(year);

            // API may return an object or array — normalise to array
            const datesArray = Array.isArray(keyDates)
                ? keyDates
                : keyDates.key_dates || keyDates.dates || Object.values(keyDates);

            const { found, canonical } = findFeast(slotValue, datesArray);

            if (!found) {
                // Try next year if we're late in the current year
                const nextYear = year + 1;
                const nextKeyDates = await api.getKeyDates(nextYear);
                const nextDatesArray = Array.isArray(nextKeyDates)
                    ? nextKeyDates
                    : nextKeyDates.key_dates || nextKeyDates.dates || Object.values(nextKeyDates);

                const nextResult = findFeast(slotValue, nextDatesArray);
                if (nextResult.found) {
                    const dateStr = formatDate(nextResult.found.date);
                    return handlerInput.responseBuilder
                        .speak(`${nextResult.canonical} em ${nextYear} será no dia ${dateStr}.`)
                        .getResponse();
                }

                return handlerInput.responseBuilder
                    .speak(`Não encontrei a data litúrgica "${slotValue}" no calendário. Tente perguntar de outra forma.`)
                    .getResponse();
            }

            const dateStr = formatDate(found.date);
            const isFuture = new Date(found.date) >= new Date();
            const verb = isFuture ? 'será' : 'foi';
            return handlerInput.responseBuilder
                .speak(`${canonical} ${verb} no dia ${dateStr}.`)
                .getResponse();
        } catch (err) {
            console.error('DataLiturgica error:', err.message);
            return handlerInput.responseBuilder
                .speak('Desculpe, não consegui buscar essa data agora. Tente novamente em alguns instantes.')
                .getResponse();
        }
    },
};

// ─── Built-in Intents ────────────────────────────────────────────────────────

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
        );
    },
    handle(handlerInput) {
        const speak =
            'Com o Calendário Litúrgico Anglicano você pode: ' +
            'pedir a coleta do dia, dizendo "qual é a coleta de hoje"; ' +
            'saber em que tempo litúrgico estamos, dizendo "que dia litúrgico é hoje"; ' +
            'ou perguntar quando cai uma data litúrgica, como "quando é Pentecostes" ou "quando é a Páscoa". ' +
            'O que você gostaria de saber?';
        return handlerInput.responseBuilder
            .speak(speak)
            .reprompt('Como posso ajudar?')
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
        );
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Que Deus abençoe o seu dia. Até logo!')
            .getResponse();
    },
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
        );
    },
    handle(handlerInput) {
        const speak =
            'Não entendi bem o que você disse. ' +
            'Você pode perguntar: qual é a coleta de hoje, que tempo litúrgico é hoje, ou quando é Pentecostes.';
        return handlerInput.responseBuilder
            .speak(speak)
            .reprompt('Como posso ajudar?')
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log('Session ended:', JSON.stringify(handlerInput.requestEnvelope.request, null, 2));
        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error('Unhandled error:', error.message);
        return handlerInput.responseBuilder
            .speak('Ocorreu um erro inesperado. Por favor, tente novamente.')
            .reprompt('Por favor, tente novamente.')
            .getResponse();
    },
};

// ─── Skill Builder ───────────────────────────────────────────────────────────

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ColectaDoDiaHandler,
        CalendarioHojeHandler,
        DataLiturgicaHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('estevao-liturgical/1.0')
    .lambda();
