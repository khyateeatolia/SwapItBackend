// Requesting concept - encapsulates HTTP requests as a concept
import { ObjectId } from "npm:mongodb@^6.0.0";
import { getDb } from "../concept-server.ts";

export class Requesting {
    /**
     * Request action - called for excluded routes
     * This is the action that syncs can be written on
     * @param params.path - The concept/action path (e.g., "Bidding/placeBid")
     * @param params.actionParams - The parameters for the action
     */
    async request(params: { path: string; actionParams: Record<string, unknown> }) {
        const { path, actionParams } = params;

        const db = await getDb();

        // Log that this request was received
        const requestEntry = {
            _id: new ObjectId(),
            requestId: new ObjectId(),
            path,
            params: actionParams,
            timestamp: new Date(),
            type: "excluded_route"
        };

        await db.collection("request_logs").insertOne(requestEntry);

        console.log(`🔄 [Requesting.request] Path: ${path}`, JSON.stringify(actionParams));

        return {
            requestId: requestEntry.requestId.toString(),
            path,
            received: true
        };
    }

    /**
     * Log action - used by syncs to log concept actions
     */
    async log(params: { action: string; concept: string; userId?: string; params: Record<string, unknown> }) {
        const { action, concept, userId, params: actionParams } = params;

        const db = await getDb();

        const logEntry = {
            _id: new ObjectId(),
            requestId: new ObjectId(),
            concept,
            action,
            userId: userId || null,
            params: actionParams,
            timestamp: new Date(),
        };

        await db.collection("request_logs").insertOne(logEntry);

        console.log(` [${concept}.${action}]`, userId ? `User: ${userId}` : "Anonymous", JSON.stringify(actionParams));

        return { requestId: logEntry.requestId.toString() };
    }

    /**
     * Get request logs
     */
    async getRequests(params: { userId?: string; limit?: number }) {
        const { userId, limit = 50 } = params;

        const db = await getDb();
        const query = userId ? { userId } : {};

        const requests = await db.collection("request_logs")
            .find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        return { requests };
    }
}
