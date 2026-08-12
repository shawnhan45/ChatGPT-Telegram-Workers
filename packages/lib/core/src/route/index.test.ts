import { disabledTelegramInitResponse } from './telegram-init';

describe('integrated reminder-proxy routing', () => {
    it('does not let the public chatbot init endpoint change Telegram settings', async () => {
        const telegramCall = jest.spyOn(globalThis, 'fetch');

        const response = disabledTelegramInitResponse();

        expect(response.status).toBe(409);
        expect(await response.text()).toContain('managed by <strong>reminder-proxy</strong>');
        expect(telegramCall).not.toHaveBeenCalled();
        telegramCall.mockRestore();
    });
});
