// Sync definitions for CampusCloset
import { ObjectId } from "npm:mongodb@^6.0.0";

export type SyncRule = {
    name: string;
    trigger: { concept: string; action: string };
    includes: Array<{ concept: string; action: string; mapParams: (triggerParams: any, triggerResult: any) => any }>;
    description: string;
};

export const syncs: SyncRule[] = [
    // Sync 1: When accepting a bid, mark listing as sold
    {
        name: "AcceptBidAndSell",
        trigger: { concept: "Bidding", action: "acceptBid" },
        includes: [
            {
                concept: "ItemListing",
                action: "setStatus",
                mapParams: (triggerParams: any, triggerResult: any) => ({
                    listingId: triggerParams.listingId,
                    status: "Sold"
                })
            }
        ],
        description: "When a bid is accepted, automatically mark the listing as sold"
    },

    // Sync 2: When marking pickup complete, update listing status
    {
        name: "CompletePickupAndSell",
        trigger: { concept: "MessagingThread", action: "markPickupComplete" },
        includes: [
            {
                concept: "ItemListing",
                action: "setStatus",
                mapParams: (triggerParams: any, triggerResult: any) => ({
                    listingId: triggerResult.listingId,
                    status: "Sold"
                })
            }
        ],
        description: "When pickup is marked complete, ensure listing is marked as sold"
    },

    // Sync 3: When creating a listing, log the request
    {
        name: "LogListingCreation",
        trigger: { concept: "ItemListing", action: "createListing" },
        includes: [
            {
                concept: "Requesting",
                action: "log",
                mapParams: (triggerParams: any, triggerResult: any) => ({
                    concept: "ItemListing",
                    action: "createListing",
                    userId: triggerParams.seller,
                    params: { title: triggerParams.title }
                })
            }
        ],
        description: "Log all listing creation requests"
    },

    // Sync 4: When placing a bid, log the request
    {
        name: "LogBidPlacement",
        trigger: { concept: "Bidding", action: "placeBid" },
        includes: [
            {
                concept: "Requesting",
                action: "log",
                mapParams: (triggerParams: any, triggerResult: any) => ({
                    concept: "Bidding",
                    action: "placeBid",
                    userId: triggerParams.bidder,
                    params: { listingId: triggerParams.listingId, amount: triggerParams.amount }
                })
            }
        ],
        description: "Log all bid placements"
    }
];

// Routes to include (pass through directly without syncs)
export const includedRoutes = [
    "UserAccount.requestVerification",
    "UserAccount.confirmVerification",
    "UserAccount.loginByEmail",
    "UserAccount.requestSSOLogin",
    "UserAccount.confirmSSOLogin",
    "UserAccount.viewProfile",
    "UserAccount.lookupUser",
    "UserAccount.getSchools",
    "Feed.getLatest",
    "Feed.getByTag",
    "Feed.getByPrice",
    "Feed.search",
    "Feed.getByMultipleTags",
    "MessagingThread.getThread",
    "MessagingThread.getThreadsByUser",
    "MessagingThread.getThreadsByListing",
    "MessagingThread.postMessage",
    "MessagingThread.startThread",
    "Bidding.getBids",
    "Bidding.getCurrentHigh",
    "Bidding.getBidsByUser",
    "ItemListing.getListing",
    "ItemListing.getListingsByUser",
    "ItemListing.updateListing"
];

// Routes to exclude (will trigger syncs)
export const excludedRoutes = [
    "Bidding.placeBid",  // Triggers logging
    "ItemListing.createListing",  // Triggers logging
    "MessagingThread.markPickupComplete",  // Triggers listing status update
    "ItemListing.setStatus"  // Could trigger notifications (future)
];
