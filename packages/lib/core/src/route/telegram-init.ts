import { renderHTML } from '#/utils/resp';

export function disabledTelegramInitResponse(footer = ''): Response {
    const html = renderHTML(`
    <h1>Telegram initialization is disabled here</h1>
    <p>The shared Bot webhook and command menu are managed by <strong>reminder-proxy</strong>.</p>
    <p>This endpoint no longer changes Telegram settings.</p>
    ${footer}
  `);
    return new Response(html, { status: 409, headers: { 'Content-Type': 'text/html' } });
}
