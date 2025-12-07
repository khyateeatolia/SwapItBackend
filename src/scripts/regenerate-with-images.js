// Regenerate test data with AI-generated images
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const MONGODB_URL = process.env.MONGODB_URL;
const DB_NAME = process.env.DB_NAME || 'assignment4a';

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
        { username: 'alexm', displayName: 'Alex Martinez', email: 'alexm@mit.edu' },
        { username: 'sarah_chen', displayName: 'Sarah Chen', email: 'sarah_chen@mit.edu' },
        { username: 'raj_patel', displayName: 'Raj Patel', email: 'raj_patel@mit.edu' },
        { username: 'emily_wu', displayName: 'Emily Wu', email: 'emily_wu@mit.edu' }
    ],
    'Harvard': [
        { username: 'johnsmith', displayName: 'John Smith', email: 'johnsmith@harvard.edu' },
        { username: 'katie_l', displayName: 'Katie Lopez', email: 'katie_l@harvard.edu' },
        { username: 'davidj', displayName: 'David Johnson', email: 'davidj@harvard.edu' },
        { username: 'anna_k', displayName: 'Anna Kim', email: 'anna_k@harvard.edu' }
    ],
    'Boston University': [
        { username: 'mikebrown', displayName: 'Mike Brown', email: 'mikebrown@bu.edu' },
        { username: 'lisa_ng', displayName: 'Lisa Nguyen', email: 'lisa_ng@bu.edu' },
        { username: 'chris_d', displayName: 'Chris Davis', email: 'chris_d@bu.edu' },
        { username: 'jennifer_r', displayName: 'Jennifer Rodriguez', email: 'jennifer_r@bu.edu' }
    ],
    'Northeastern': [
        { username: 'tom_wilson', displayName: 'Tom Wilson', email: 'tom_wilson@northeastern.edu' },
        { username: 'maria_g', displayName: 'Maria Garcia', email: 'maria_g@northeastern.edu' },
        { username: 'kevin_l', displayName: 'Kevin Lee', email: 'kevin_l@northeastern.edu' },
        { username: 'rachel_m', displayName: 'Rachel Miller', email: 'rachel_m@northeastern.edu' }
    ],
    'Wellesley': [
        { username: 'sophia_t', displayName: 'Sophia Taylor', email: 'sophia_t@wellesley.edu' },
        { username: 'olivia_a', displayName: 'Olivia Anderson', email: 'olivia_a@wellesley.edu' },
        { username: 'emma_white', displayName: 'Emma White', email: 'emma_white@wellesley.edu' },
        { username: 'ava_thomas', displayName: 'Ava Thomas', email: 'ava_thomas@wellesley.edu' }
    ]
};

// Listing templates with image placeholders
const LISTING_TEMPLATES = [
    { title: 'Vintage Denim Jacket', description: 'Classic blue denim jacket in excellent condition', tags: ['Outerwear', 'Vintage'], minAsk: 45, image: 'denim_jacket' },
    { title: 'Nike Air Max Sneakers', description: 'White Nike Air Max, size 9, barely worn', tags: ['Shoes', 'Sneakers'], minAsk: 75, image: 'nike_sneakers' },
    { title: 'Black Leather Jacket', description: 'Genuine leather jacket, perfect for fall', tags: ['Outerwear', 'Leather'], minAsk: 95, image: 'leather_jacket' },
    { title: 'Floral Summer Dress', description: 'Light and breezy summer dress with floral pattern', tags: ['Dresses', 'Summer'], minAsk: 30, image: 'floral_dress' },
    { title: 'Adidas Track Pants', description: 'Black Adidas track pants, size M', tags: ['Bottoms', 'Sportswear'], minAsk: 35, image: 'track_pants' },
    { title: 'Striped Button-Down Shirt', description: 'Navy and white striped dress shirt', tags: ['Tops', 'Formal'], minAsk: 25, image: 'striped_shirt' },
    { title: 'Designer Sunglasses', description: 'Ray-Ban Wayfarer sunglasses with case', tags: ['Accessories'], minAsk: 60, image: 'sunglasses' },
    { title: 'Wool Winter Coat', description: 'Warm wool coat for winter, charcoal grey', tags: ['Outerwear', 'Winter'], minAsk: 85, image: 'winter_coat' }
];

async function main() {
    console.log(' Starting school-based test data regeneration with images...\n');

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DB_NAME);

    // Clear existing data
    console.log(' Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('listings').deleteMany({});
    await db.collection('bid_logs').deleteMany({});
    await db.collection('threads').deleteMany({});
    await db.collection('pending_verifications').deleteMany({});
    console.log(' Database cleared\n');

    const userMap = {};
    const listingMap = {};

    // Hash password once
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // Create users and listings for each school
    for (const school of SCHOOLS) {
        console.log(`🏫 Creating data for ${school}...`);
        const users = SCHOOL_DATA[school];
        userMap[school] = [];

        // Create users
        for (const userData of users) {
            const userId = new ObjectId();
            await db.collection('users').insertOne({
                userId,
                email: userData.email,
                username: userData.username,
                displayName: userData.displayName,
                school: school,
                hashedPassword: hashedPassword,
                avatarUrl: null,
                verifiedAt: new Date(),
                createdAt: new Date()
            });
            userMap[school].push({ userId, username: userData.username });
            console.log(`   ✓ ${userData.username} (${school})`);
        }

        // Create listings - use placeholder image URLs for now
        // Images will be stored in frontend/public/images/
        listingMap[school] = [];
        for (let i = 0; i < LISTING_TEMPLATES.length; i++) {
            const template = LISTING_TEMPLATES[i];
            const seller = userMap[school][i % users.length];
            const listingId = new ObjectId();

            // Use placeholder image path - images will be at /images/{school}_{image_name}.jpg
            const photoPath = `/images/${school.toLowerCase().replace(' ', '_')}_${template.image}.jpg`;

            await db.collection('listings').insertOne({
                listingId,
                sellerId: seller.userId,
                school: school,
                title: template.title,
                description: template.description,
                photos: [photoPath],
                tags: template.tags,
                minAsk: template.minAsk,
                status: 'Active',
                createdAt: new Date(),
                updatedAt: new Date(),
                currentHighestBid: null
            });

            listingMap[school].push({ listingId, title: template.title, seller: seller.username });
            console.log(`   ✓ "${template.title}" by ${seller.username}`);
        }
        console.log('');
    }

    // Generate sample bids (same-school only)
    console.log(' Generating bids (same-school only)...');
    let bidCount = 0;
    for (const school of SCHOOLS) {
        const users = userMap[school];
        const listings = listingMap[school];

        // Create 3 bids per school
        for (let i = 0; i < 3 && i < listings.length; i++) {
            const bidder = users[(i + 1) % users.length];
            const listing = listings[i];
            const bidAmount = LISTING_TEMPLATES[i].minAsk + Math.floor(Math.random() * 20) + 5;

            const bidId = new ObjectId();
            await db.collection('bid_logs').insertOne({
                bidId,
                listingId: listing.listingId,
                bidder: bidder.userId,
                amount: bidAmount,
                timestamp: new Date(),
                status: 'Active'
            });

            // Update listing's current highest bid
            await db.collection('listings').updateOne(
                { listingId: listing.listingId },
                { $set: { currentHighestBid: bidAmount } }
            );

            bidCount++;
            console.log(`   ✓ ${bidder.username} bid $${bidAmount} on "${listing.title}"(${school})`);
        }
    }

    await client.close();

    console.log('\n Test data generation complete!\n');
    console.log(' Summary:');
    console.log(`   Schools: ${SCHOOLS.length}`);
    console.log(`   Users: ${SCHOOLS.length * 4} (4 per school)`);
    console.log(`   Listings: ${SCHOOLS.length * LISTING_TEMPLATES.length} (${LISTING_TEMPLATES.length} per school)`);
    console.log(`   Bids: ${bidCount} (same-school only)`);
    console.log('\n🔐 All users have password: Password123');
    console.log('\n Next step: Generate images for listings');
    console.log('   Images will be saved to: frontend/public/images/');
}

main().catch(console.error);
