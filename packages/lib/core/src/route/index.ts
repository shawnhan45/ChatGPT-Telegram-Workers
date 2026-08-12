import type { RouterRequest } from '#/utils/router';
import type * as Telegram from 'telegram-bot-api-types';
import { ENV } from '#/config';
import { handleUpdate } from '#/telegram';
import { commandsDocument } from '#/telegram/command';
import { errorToString, makeResponse200, renderHTML } from '#/utils/resp';
import { Router } from '#/utils/router';
import { disabledTelegramInitResponse } from './telegram-init';

const helpLink = 'https://github.com/TBXark/ChatGPT-Telegram-Workers/blob/master/doc/en/DEPLOY.md';
const issueLink = 'https://github.com/TBXark/ChatGPT-Telegram-Workers/issues';
const footer = `
<br/>
<p>For more information, please visit <a href="${helpLink}">${helpLink}</a></p>
<p>If you have any questions, please visit <a href="${issueLink}">${issueLink}</a></p>
`;

async function bindWebHookAction(): Promise<Response> {
    return disabledTelegramInitResponse(footer);
}

async function telegramWebhook(request: RouterRequest): Promise<Response> {
    try {
        const { token } = request.params as any;
        const body = await request.json() as Telegram.Update;
        return makeResponse200(await handleUpdate(token, body));
    } catch (e) {
        console.error(e);
        return new Response(errorToString(e), { status: 200 });
    }
}

/**
 *用API_GUARD处理Telegram回调
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function telegramSafeHook(request: RouterRequest): Promise<Response> {
    try {
        if (ENV.API_GUARD === undefined || ENV.API_GUARD === null) {
            return telegramWebhook(request);
        }
        console.log('API_GUARD is enabled');
        const url = new URL(request.url);
        url.pathname = url.pathname.replace('/safehook', '/webhook');
        const newRequest = new Request(url, request);
        return makeResponse200(await ENV.API_GUARD.fetch(newRequest));
    } catch (e) {
        console.error(e);
        return new Response(errorToString(e), { status: 200 });
    }
}

async function defaultIndexAction(): Promise<Response> {
    const HTML = renderHTML(`
    <h1>ChatGPT-Telegram-Workers</h1>
    <br/>
    <p>Deployed Successfully!</p>
    <p> Version (ts:${ENV.BUILD_TIMESTAMP},sha:${ENV.BUILD_VERSION})</p>
    <br/>
    <p>Telegram webhook and command-menu initialization are managed by <strong>reminder-proxy</strong>.</p>
    <br/>
    <p>After binding the webhook, you can use the following commands to control the bot:</p>
    ${
        commandsDocument().map(item => `<p><strong>${item.command}</strong> - ${item.description}</p>`).join('')
    }
    <br/>
    <p>You can get bot information by visiting the following URL:</p>
    <p><strong>/telegram/:token/bot</strong> - Get bot information</p>
    ${footer}
  `);
    return new Response(HTML, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

export function createRouter(): Router {
    const router = new Router();
    router.get('/', defaultIndexAction);
    router.get('/init', bindWebHookAction);
    router.post('/telegram/:token/webhook', telegramWebhook);
    router.post('/telegram/:token/safehook', telegramSafeHook);
    router.all('*', () => new Response('Not Found', { status: 404 }));
    return router;
}
