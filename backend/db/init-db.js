const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
  try {
    console.log('Starting database initialization...');

    // 1. Create Tables
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createExhibitionsTableQuery = `
      CREATE TABLE IF NOT EXISTS exhibitions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCollectionsTableQuery = `
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTableQuery);
    await pool.query(createExhibitionsTableQuery);
    await pool.query(createCollectionsTableQuery);
    console.log('Database tables (users, exhibitions, collections) created or verified.');

    // 2. Seed Dummy Data for Exhibitions (Epic 3)
    console.log('Seeding dummy data...');

    // Check if exhibitions already exist to prevent duplicate seeding
    const checkExhibitions = await pool.query('SELECT COUNT(*) FROM exhibitions');
    if (parseInt(checkExhibitions.rows[0].count) === 0) {
      const seedExhibitionsQuery = `
        INSERT INTO exhibitions (title, description, image_url, start_date, end_date, is_featured)
        VALUES
          ('Impressionist Masterpieces', 'A stunning collection of works from Monet, Renoir, and Degas. Explore the birth of modern art.', 'https://images.unsplash.com/photo-1544413660-299165566b1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', '2023-01-01', '2024-12-31', true),
          ('Modern Art Retrospective', 'Abstract, surreal, and contemporary pieces that challenge the status quo.', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', '2023-05-15', '2024-06-30', false),
          ('Ancient Civilizations', 'Artifacts and sculptures from Egypt, Greece, and Rome.', 'https://images.unsplash.com/photo-1599839619722-39751411ea63?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', '2024-01-01', '2025-01-01', false)
      `;
      await pool.query(seedExhibitionsQuery);
      console.log('Seeded exhibitions data.');
    } else {
      console.log('Exhibitions already seeded.');
    }

    // Check if collections already exist
    const checkCollections = await pool.query('SELECT COUNT(*) FROM collections');
    if (parseInt(checkCollections.rows[0].count) === 0) {
      const seedCollectionsQuery = `
        INSERT INTO collections (title, artist, category, image_url, description)
        VALUES
          ('Water Lilies', 'Claude Monet', 'Painting', 'https://images.unsplash.com/photo-1580136608260-4ebf15facce2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'The famous series of approximately 250 oil paintings.'),
          ('Starry Night', 'Vincent van Gogh', 'Painting', 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'A classic post-impressionist masterpiece.'),
          ('The Thinker', 'Auguste Rodin', 'Sculpture', 'https://images.unsplash.com/photo-1574347573679-45f8fdfab489?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'A bronze sculpture resting on a stone pedestal.')
      `;
      await pool.query(seedCollectionsQuery);
      console.log('Seeded collections data.');
    } else {
      console.log('Collections already seeded.');
    }

    console.log('Database initialization and seeding complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
};

initDb();
