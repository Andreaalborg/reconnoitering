const { MongoClient } = require('mongodb');

// Hardcoded URI for testing
const uri = "mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

console.log("Using hardcoded MongoDB URI for testing");

const sampleExhibitions = [
  {
    title: "Van Gogh: The Immersive Experience",
    description: "Step into the world of Vincent van Gogh in this immersive exhibition featuring 360-degree digital projections of his most famous works.",
    coverImage: "https://picsum.photos/id/1025/800/600",
    images: [
      "https://picsum.photos/id/1025/800/600", 
      "https://picsum.photos/id/1026/800/600"
    ],
    startDate: new Date("2025-04-15"),
    endDate: new Date("2025-08-20"),
    location: {
      name: "National Gallery",
      address: "Trafalgar Square",
      city: "London",
      country: "UK",
      coordinates: {
        lat: 51.5069,
        lng: -0.1276
      }
    },
    category: ["Immersive", "Painting"],
    artists: ["Vincent van Gogh"],
    tags: ["impressionism", "post-impressionism", "dutch"],
    ticketPrice: "£25",
    ticketUrl: "https://example.com/tickets",
    websiteUrl: "https://example.com/vangogh",
    addedDate: new Date(),
    popularity: 95,
    featured: true
  },
  // Add the other sample exhibitions here
];

async function seedDatabase() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    
    const database = client.db();
    const exhibitions = database.collection("exhibitions");
    
    // Delete existing data
    await exhibitions.deleteMany({});
    console.log("Cleared existing data");
    
    // Insert new data
    const result = await exhibitions.insertMany(sampleExhibitions);
    console.log(`${result.insertedCount} exhibitions inserted successfully!`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

seedDatabase();