// Server with Sync Engine integration
import { MongoClient, ObjectId } from "npm:mongodb@^6.0.0";
import { SyncEngine } from "./sync-engine.ts";
import { includedRoutes, excludedRoutes } from "./syncs.ts";

const MONGODB_URL = Deno.env.get("MONGODB_URL") || "";
const DB_NAME = Deno.env.get("DB_NAME") || "assignment4a";

let client: MongoClient | null = null;

export async function getDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URL);
    await client.connect();
  }
  return client.db(DB_NAME);
}

export type ConceptAction = {
  concept: string;
  action: string;
  params: Record<string, unknown>;
};

export type ConceptResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Concept registry
const concepts: Map<string, unknown> = new Map();

export function registerConcept(name: string, concept: unknown) {
  concepts.set(name, concept);
}

// Initialize sync engine
let syncEngine: SyncEngine | null = null;

function getSyncEngine(): SyncEngine {
  if (!syncEngine) {
    syncEngine = new SyncEngine(concepts);
  }
  return syncEngine;
}

async function handleRequest(req: Request): Promise<Response> {
  // CORS headers
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers }
    );
  }

  try {
    const body: ConceptAction = await req.json();
    const { concept: conceptName, action, params } = body;

    const concept = concepts.get(conceptName);
    if (!concept) {
      return new Response(
        JSON.stringify({ success: false, error: `Concept ${conceptName} not found` }),
        { status: 404, headers }
      );
    }

    // Check if action exists
    if (typeof (concept as Record<string, unknown>)[action] !== "function") {
      return new Response(
        JSON.stringify({ success: false, error: `Action ${action} not found` }),
        { status: 404, headers }
      );
    }

    const routeKey = `${conceptName}.${action}`;
    const isIncluded = includedRoutes.includes(routeKey);
    const isExcluded = excludedRoutes.includes(routeKey);

    // Log route status
    if (!isIncluded && !isExcluded) {
      console.warn(`  Unverified route: ${routeKey}`);
    }

    // For excluded routes, call Requesting.request first (assignment spec requirement)
    if (isExcluded) {
      const requesting = concepts.get("Requesting");
      if (requesting && typeof (requesting as Record<string, unknown>)["request"] === "function") {
        const requestPath = `${conceptName}/${action}`;
        await (requesting as Record<string, unknown>)["request"]({
          path: requestPath,
          actionParams: params
        });
      }
    }

    // Execute the action
    const result = await (concept as Record<string, unknown>)[action](params);

    // Execute syncs if this action triggers any
    const engine = getSyncEngine();
    if (engine.shouldSync(conceptName, action)) {
      await engine.executeSyncs(conceptName, action, params, result);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(" API Error:", errorMessage);
    console.error("Stack:", error instanceof Error ? error.stack : "");
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers }
    );
  }
}

async function main() {
  console.log(" Starting CampusCloset Sync-Enabled Server...\n");

  // Import and register all concepts
  const { UserAccount } = await import("./concepts/UserAccount.ts");
  const { ItemListing } = await import("./concepts/ItemListing.ts");
  const { Bidding } = await import("./concepts/Bidding.ts");
  const { MessagingThread } = await import("./concepts/MessagingThread.ts");
  const { Feed } = await import("./concepts/Feed.ts");
  const { Requesting } = await import("./concepts/Requesting.ts");

  registerConcept("UserAccount", new UserAccount());
  registerConcept("ItemListing", new ItemListing());
  registerConcept("Bidding", new Bidding());
  registerConcept("MessagingThread", new MessagingThread());
  registerConcept("Feed", new Feed());
  registerConcept("Requesting", new Requesting());

  console.log(" Registered 6 concepts");
  console.log(" Sync engine initialized");

  // Print route configuration
  console.log("\n Route Configuration:");
  console.log(`   Included (direct): ${includedRoutes.length} routes`);
  console.log(`   Excluded (synced): ${excludedRoutes.length} routes`);

  // List excluded routes
  console.log("\n🔄 Routes with Syncs:");
  excludedRoutes.forEach(route => console.log(`   - ${route}`));

  const port = 8000;
  console.log(`\n🌐 Server running at http://localhost:${port}/api`);
  console.log(" Request logging enabled\n");

  Deno.serve({ port }, handleRequest);
}

if (import.meta.main) {
  main().catch(console.error);
}
