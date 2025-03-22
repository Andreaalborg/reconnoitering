const { MongoClient } = require('mongodb');
const path = require('path');

// Try to load from environment variables, but use the hardcoded URI as fallback
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Use the environment variable if available, otherwise use the hardcoded string
const uri = process.env.MONGODB_URI || "mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

console.log("Using MongoDB connection string");

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
  {
    title: "Modern Art Festival",
    description: "An annual festival showcasing the best in contemporary art, featuring installations, performances, and exhibitions from emerging artists.",
    coverImage: "https://picsum.photos/id/1039/800/600",
    images: [
      "https://picsum.photos/id/1039/800/600",
      "https://picsum.photos/id/1040/800/600"
    ],
    startDate: new Date("2025-05-20"),
    endDate: new Date("2025-06-15"),
    location: {
      name: "MoMA",
      address: "11 West 53 Street",
      city: "New York",
      country: "USA",
      coordinates: {
        lat: 40.7614,
        lng: -73.9776
      }
    },
    category: ["Festival", "Contemporary"],
    artists: ["Various Artists"],
    tags: ["modern", "contemporary", "mixed-media"],
    ticketPrice: "$30",
    ticketUrl: "https://example.com/tickets",
    websiteUrl: "https://example.com/modernart",
    addedDate: new Date(),
    popularity: 88,
    featured: true
  },
  {
    title: "Photography Biennale",
    description: "A biennial exhibition showcasing the best in contemporary photography from around the world.",
    coverImage: "https://picsum.photos/id/1059/800/600",
    images: [
      "https://picsum.photos/id/1059/800/600",
      "https://picsum.photos/id/1060/800/600"
    ],
    startDate: new Date("2025-06-05"),
    endDate: new Date("2025-09-15"),
    location: {
      name: "Centre Pompidou",
      address: "Place Georges-Pompidou",
      city: "Paris",
      country: "France",
      coordinates: {
        lat: 48.8607,
        lng: 2.3521
      }
    },
    category: ["Photography", "Biennale"],
    artists: ["Various Photographers"],
    tags: ["photography", "contemporary", "international"],
    ticketPrice: "€20",
    ticketUrl: "https://example.com/tickets",
    websiteUrl: "https://example.com/photobiennale",
    addedDate: new Date(),
    popularity: 82,
    featured: false
  }
];

async function seedDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const database = client.db();
    const exhibitions = database.collection("exhibitions");
    
    // Delete existing data
    await exhibitions.deleteMany({});
    console.log("Cleared existing data");
    
    // Insert new data
    const result = await exhibitions.insertMany(sampleExhibitions);
    console.log(`${result.insertedCount} exhibitions inserted`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

seedDatabase();