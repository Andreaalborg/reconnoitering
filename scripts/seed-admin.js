const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Ta URI fra miljøvariabel eller bruk hardkodet verdi
const uri = process.env.MONGODB_URI || "mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function seedAdmin() {
  try {
    await client.connect();
    console.log("Koblet til MongoDB");
    
    const database = client.db();
    const users = database.collection("users");
    
    // Sjekk om admin-brukeren allerede eksisterer
    const existingAdmin = await users.findOne({ email: "admin@reconnoitering.com" });
    
    if (existingAdmin) {
      console.log("Admin-bruker eksisterer allerede");
      return;
    }
    
    // Opprett admin-bruker med enkelt passord (for demo)
    const result = await users.insertOne({
      email: "admin@reconnoitering.com",
      // I produksjon ville vi hashet dette med bcrypt
      password: "admin123", 
      name: "Admin User",
      role: "admin"
    });
    
    console.log(`Admin-bruker opprettet med ID: ${result.insertedId}`);
  } catch (error) {
    console.error("Feil under opprettelse av admin-bruker:", error);
  } finally {
    await client.close();
    console.log("Databasetilkobling lukket");
  }
}

seedAdmin();