export class EventSender {
    backendUrl;
    constructor() {
        this.backendUrl = process.env.BACKEND_URL || "http://backend:4001/api";
    }
    async send(event) {
        try {
            const url = `${this.backendUrl}/internal/tg-user/events`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(event),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        catch (error) {
            console.error(`❌ Ошибка отправки события:`, error);
        }
    }
}
//# sourceMappingURL=eventSender.js.map