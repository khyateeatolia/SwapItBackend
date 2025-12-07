// Sync Engine - executes synchronizations between concepts
import { syncs, SyncRule } from "./syncs.ts";

export class SyncEngine {
    private concepts: Map<string, any>;

    constructor(concepts: Map<string, any>) {
        this.concepts = concepts;
    }

    // Find syncs triggered by a specific action
    private findTriggeredSyncs(concept: string, action: string): SyncRule[] {
        return syncs.filter(sync =>
            sync.trigger.concept === concept && sync.trigger.action === action
        );
    }

    // Execute all syncs triggered by an action
    async executeSyncs(
        conceptName: string,
        actionName: string,
        params: any,
        result: any
    ): Promise<void> {
        const triggeredSyncs = this.findTriggeredSyncs(conceptName, actionName);

        if (triggeredSyncs.length === 0) {
            return; // No syncs to execute
        }

        console.log(`🔄 Executing ${triggeredSyncs.length} sync(s) for ${conceptName}.${actionName}`);

        for (const sync of triggeredSyncs) {
            console.log(`  ↳ Sync: ${sync.name}`);

            // Execute all included actions
            for (const include of sync.includes) {
                try {
                    const concept = this.concepts.get(include.concept);
                    if (!concept) {
                        console.error(`  ✗ Concept ${include.concept} not found`);
                        continue;
                    }

                    // Map parameters from trigger to included action
                    const includedParams = include.mapParams(params, result);

                    // Execute the included action
                    const action = (concept as any)[include.action];
                    if (typeof action !== "function") {
                        console.error(`  ✗ Action ${include.action} not found on ${include.concept}`);
                        continue;
                    }

                    await action.call(concept, includedParams);
                    console.log(`  ✓ Executed ${include.concept}.${include.action}`);

                } catch (error) {
                    console.error(`  ✗ Error executing ${include.concept}.${include.action}:`, error);
                    // Continue with other syncs even if one fails
                }
            }
        }
    }

    // Check if an action should be synced
    shouldSync(concept: string, action: string): boolean {
        return this.findTriggeredSyncs(concept, action).length > 0;
    }
}
