// Regenerate Test Data with School-Based Isolation
// Simple version without Gemini -just uses predefined data

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URL = process.env.MONGODB_URL;
const DB_NAME = process.env.DB_NAME || "assignment4a";

if (!MONGODB_URL) {
    console.error(' Error: MONGODB_URL environment variable is required');
    console.error('Please set it in your .env file or export it:');
    console.error('  export MONGODB_URL="your_mongodb_connection_string"');
    process.exit(1);
}

// School configuration - MUST MATCH UserAccount.ts SCHOOLS constant keys!
const SCHOOLS = ['MIT', 'Harvard', 'Boston University', 'Northeastern', 'Wellesley'];

const SCHOOL_DATA = {
    'MIT': [
        { username: 'alexm', displayName: 'Alex Martinez' },
        { username: 'sarah_chen', displayName: 'Sarah Chen' },
        { username: 'raj_patel', displayName: 'Raj Patel' },
        { username: 'emily_wu', displayName: 'Emily Wu' }
    ],
    'Harvard': [
        { username: 'johnsmith', displayName: 'John Smith' },
        { username: 'katie_l', displayName: 'Katie Lee' },
        { username: 'davidj', displayName: 'David Johnson' },
        { username: 'anna_k', displayName: 'Anna Kim' }
    ],
    'Boston University': [
        { username: 'mikebrown', displayName: 'Mike Brown' },
        { username: 'lisa_ng', displayName: 'Lisa Nguyen' },
        { username: 'chris_d', displayName: 'Chris Davis' },
        { username: 'jennifer_r', displayName: 'Jennifer Rodriguez' }
    ],
    'Northeastern': [
        { username: 'tom_wilson', displayName: 'Tom Wilson' },
        { username: 'maria_g', displayName: 'Maria Garcia' },
        { username: 'kevin_l', displayName: 'Kevin Liu' },
        { username: 'rachel_m', displayName: 'Rachel Miller' }
    ],
    'Wellesley': [
        { username: 'sophia_t', displayName: 'Sophia Taylor' },
        { username: 'olivia_a', displayName: 'Olivia Anderson' },
        { username: 'emma_white', displayName: 'Emma White' },
        { username: 'ava_thomas', displayName: 'Ava Thomas' }
    ]
};

const LISTINGS_DATA = [
    { title: 'Vintage Levi Denim Jacket', desc: 'Classic 90s Levi\'s denim jacket, size M', tags: ['Outerwear', 'Vintage'], price: 45, photo: 'https://images.unsplash.com/photo-1551028719-00167b16eac5' },
    { title: 'Nike Air Max Sneakers', desc: 'White Nike Air Max, barely worn, size 9', tags: ['Shoes'], price: 60, photo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' },
    { title: 'Black Leather Jacket', desc: 'Genuine leather moto jacket, fits like S/M', tags: ['Outerwear', 'Designer'], price: 80, photo: 'https://images.unsplash.com/photo-1551028719-00167b16eac5' },
    { title: 'Floral Summer Dress', desc: 'Light floral maxi dress, perfect for spring', tags: ['Dresses'], price: 30, photo: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446' },
    { title: 'Adidas Track Pants', desc: 'Black Adidas track pants with white stripes, M', tags: ['Bottoms'], price: 25, photo: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8' },
    { title: 'Striped Button-Down Shirt', desc: 'Blue and white striped oxford shirt', tags: ['Tops'], price: 20, photo: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c' },
    { title: 'Designer Sunglasses', desc: 'Ray-Ban Wayfarers, lightly scratched', tags: ['Accessories'], price: 50, photo: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083' },
    { title: 'Wool Winter Coat', desc: 'Camel-colored wool coat, size M, very warm', tags: ['Outerwear'], price: 70, photo: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3' }
];

async function main() {
    console.log(' Starting school-based test data regeneration...\n');

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DB_NAME);

    console.log(' Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('pending_verifications').deleteMany({});
    await db.collection('listings').deleteMany({});
    await db.collection('bid_logs').deleteMany({});
    await db.collection('threads').deleteMany({});
    await db.collection('request_logs').deleteMany({});
    console.log(' Database cleared\n');

    const hashedPassword = await bcrypt.hash('Password123', 10);
    let allUsers = [];
    let allListings = [];

    for (const school of SCHOOLS) {
        console.log(`\n🏫 Creating data for ${school}...`);

        const schoolUsers = [];
        for (const userProfile of SCHOOL_DATA[school]) {
            const userId = new ObjectId();
            const user = {
                userId,
                email: `${userProfile.username}@${school.toLowerCase()}.edu`,
                username: userProfile.username,
                displayName: userProfile.displayName,
                school: school,
                hashedPassword,
                verifiedAt: new Date(),
                avatarUrl: null
            };
            await db.collection('users').insertOne(user);
            schoolUsers.push(user);
            console.log(`   ✓ ${userProfile.username} (${school})`);
        }

        // Create listings for this school
        for (let i = 0; i < LISTINGS_DATA.length; i++) {
            const item = LISTINGS_DATA[i];
            const seller = schoolUsers[i % schoolUsers.length];
            const listingId = new ObjectId();

            const listing = {
                listingId,
                sellerId: seller.userId,
                school: school,
                title: item.title,
                description: item.desc,
                photos: [item.photo],
                tags: item.tags,
                minAsk: item.price,
                status: 'Active',
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
                currentHighestBid: null
            };

            await db.collection('listings').insertOne(listing);
            allListings.push({ ...listing, sellerUsername: seller.username, school });
            console.log(`   ✓ "${item.title}" by ${seller.username}`);
        }

        allUsers.push(...schoolUsers);
    }

    // Generate bids (same-school only)
    console.log(`\n Generating bids (same-school only)...`);
    let bidCount = 0;
    for (const school of SCHOOLS) {
        const schoolUsers = allUsers.filter(u => u.school === school);
        const schoolListings = allListings.filter(l => l.school === school);

        for (let i = 0; i < Math.min(schoolListings.length, 3); i++) {
            const listing = schoolListings[i];
            const bidder = schoolUsers.find(u => u.userId.toString() !== listing.sellerId.toString());
            if (!bidder) continue;

            const amount = (listing.minAsk || 20) + Math.floor(Math.random() * 15) + 5;
            await db.collection('bid_logs').insertOne({
                bidId: new ObjectId(),
                listingId: listing.listingId,
                bidder: bidder.userId,
                amount,
                timestamp: new Date(),
                withdrawn: false
            });

            await db.collection('listings').updateOne(
                { listingId: listing.listingId },
                { $set: { currentHighestBid: amount, currentHighBidder: bidder.userId } }
            );

            bidCount++;
            console.log(`   ✓ ${bidder.username} bid $${amount} on "${listing.title}" (${school})`);
        }
    }

    await client.close();

    console.log(`\n Test data generation complete!`);
    console.log(`\n Summary:`);
    console.log(`   Schools: ${SCHOOLS.length}`);
    console.log(`   Users: ${allUsers.length} (${SCHOOL_DATA[SCHOOLS[0]].length} per school)`);
    console.log(`   Listings: ${allListings.length} (${LISTINGS_DATA.length} per school)`);
    console.log(`   Bids: ${bidCount} (same-school only)`);
    console.log(`\n🔐 All users have password: Password123`);
    console.log(`\n🏫 School-based isolation enabled: Users can only see/bid on listings from their school`);
}

main().catch(console.error);
