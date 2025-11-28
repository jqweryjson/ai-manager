import { listSubscriptions } from "../../core/telegram-account-postgres.js";
export class MessageProcessor {
    async buildEvent(accountId, userId, peerId, message) {
        if (!message || message.out) {
            return null;
        }
        const subscriptions = await listSubscriptions(accountId, userId);
        const subscription = subscriptions.find(s => s.peer_id === peerId && s.enabled);
        if (!subscription) {
            return null;
        }
        return {
            account_id: accountId,
            user_id: userId,
            peer_id: peerId,
            peer_type: subscription.peer_type,
            access_hash: subscription.access_hash || null,
            workspace_id: subscription.workspace_id,
            role_id: subscription.role_id,
            message: {
                id: message.id?.toString() || "unknown",
                text: message.message ?? message.text ?? null,
                senderId: message.senderId?.toString(),
                date: message.date || Math.floor(Date.now() / 1000),
            },
        };
    }
    extractPeerId(peer) {
        if (!peer)
            return null;
        if (peer.className === "PeerUser" || peer._ === "PeerUser") {
            return peer.userId?.toString() || null;
        }
        if (peer.className === "PeerChat" || peer._ === "PeerChat") {
            return peer.chatId?.toString() || null;
        }
        if (peer.className === "PeerChannel" || peer._ === "PeerChannel") {
            return peer.channelId?.toString() || null;
        }
        if (peer.userId) {
            return peer.userId.toString();
        }
        if (peer.chatId) {
            return peer.chatId.toString();
        }
        if (peer.channelId) {
            return peer.channelId.toString();
        }
        return null;
    }
}
//# sourceMappingURL=messageProcessor.js.map