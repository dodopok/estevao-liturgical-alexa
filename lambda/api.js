/**
 * Estevão API client
 * Base URL: https://api.caminhoanglicano.com.br/api/v1
 */

const axios = require('axios');

const BASE_URL = 'https://api.caminhoanglicano.com.br/api/v1';
const PRAYER_BOOK_CODE = 'loc_2015'; // LOC 2015 — Igreja Episcopal Anglicana do Brasil

function buildClient() {
    const apiKey = process.env.ESTEVAO_API_KEY;
    if (!apiKey) {
        throw new Error('ESTEVAO_API_KEY environment variable is not set.');
    }
    return axios.create({
        baseURL: BASE_URL,
        headers: { 'X-API-Key': apiKey },
        timeout: 8000,
    });
}

const defaultPreferences = {
    prayer_book_code: PRAYER_BOOK_CODE,
};

/**
 * Returns today's liturgical data including collect and readings.
 */
async function getToday() {
    const client = buildClient();
    const response = await client.get('/calendar/today', {
        params: { preferences: JSON.stringify(defaultPreferences) },
    });
    return response.data;
}

/**
 * Returns liturgical data for a specific date.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 */
async function getDay(year, month, day) {
    const client = buildClient();
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const response = await client.get(`/calendar/${year}/${mm}/${dd}`, {
        params: { preferences: JSON.stringify(defaultPreferences) },
    });
    return response.data;
}

/**
 * Returns the key liturgical dates (moveable feasts) for a given year.
 * @param {number} year
 */
async function getKeyDates(year) {
    const client = buildClient();
    const response = await client.get(`/calendar/${year}/key_dates`, {
        params: { preferences: JSON.stringify(defaultPreferences) },
    });
    return response.data;
}

/**
 * Returns all liturgical seasons with their start/end dates for a given year.
 * @param {number} year
 */
async function getSeasons(year) {
    const client = buildClient();
    const response = await client.get(`/calendar/${year}/seasons`, {
        params: { preferences: JSON.stringify(defaultPreferences) },
    });
    return response.data;
}

/**
 * Returns the annual overview including all celebrations for a given year.
 * @param {number} year
 */
async function getOverview(year) {
    const client = buildClient();
    const response = await client.get(`/calendar/${year}/overview`, {
        params: { preferences: JSON.stringify(defaultPreferences) },
    });
    return response.data;
}

module.exports = { getToday, getDay, getKeyDates, getSeasons, getOverview };
