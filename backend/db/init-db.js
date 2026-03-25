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
        membership_tier_id INTEGER,
        membership_expires_at TIMESTAMP WITH TIME ZONE,
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

    const createProductsTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCartItemsTableQuery = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );
    `;

    const createTicketTypesTableQuery = `
      CREATE TABLE IF NOT EXISTS ticket_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createTicketBookingsTableQuery = `
      CREATE TABLE IF NOT EXISTS ticket_bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ticket_type_id INTEGER REFERENCES ticket_types(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        visit_date DATE NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createMembershipTiersTableQuery = `
      CREATE TABLE IF NOT EXISTS membership_tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        benefits TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTableQuery);

    await pool.query(createExhibitionsTableQuery);
    await pool.query(createCollectionsTableQuery);
    await pool.query(createProductsTableQuery);
    await pool.query(createCartItemsTableQuery);
    await pool.query(createTicketTypesTableQuery);
    await pool.query(createTicketBookingsTableQuery);
    await pool.query(createMembershipTiersTableQuery);

    // In case users table already exists from previous runs, alter it to add new columns if they are missing
    try {
      await pool.query('ALTER TABLE users ADD COLUMN membership_tier_id INTEGER REFERENCES membership_tiers(id)');
      console.log('Added membership_tier_id column to users table.');
    } catch (e) {
      // Columns likely already exist, ignore error
      // console.log('membership_tier_id column likely already exists.');
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN membership_expires_at TIMESTAMP WITH TIME ZONE');
      console.log('Added membership_expires_at column to users table.');
    } catch (e) {
      // Columns likely already exist, ignore error
      // console.log('membership_expires_at column likely already exists.');
    }

    // Fix foreign key for users if the table was created before membership_tiers (if column existed but FK did not)
    try {
      await pool.query('ALTER TABLE users ADD CONSTRAINT fk_membership_tier FOREIGN KEY (membership_tier_id) REFERENCES membership_tiers(id) ON DELETE SET NULL');
    } catch (e) {
       // console.log('Foreign key constraint fk_membership_tier likely already exists.');
    }

    console.log('Database tables created or verified.');

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

    // Check if products already exist (Epic 4)
    const checkProducts = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(checkProducts.rows[0].count) === 0) {
      const seedProductsQuery = `
        INSERT INTO products (name, description, price, stock, image_url)
        VALUES
          ('Van Gogh Art Book', 'A comprehensive collection of Vincent van Gogh''s most famous works.', 45.00, 100, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
          ('Monet Water Lilies Poster', 'A high-quality print of Claude Monet''s Water Lilies.', 25.00, 50, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
          ('Museum Logo Mug', 'A classic ceramic mug featuring the Art Museum logo.', 15.00, 200, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')
      `;
      await pool.query(seedProductsQuery);
      console.log('Seeded products data.');
    } else {
      console.log('Products already seeded.');
    }

    // Check if ticket_types already exist (Epic 5)
    const checkTickets = await pool.query('SELECT COUNT(*) FROM ticket_types');
    if (parseInt(checkTickets.rows[0].count) === 0) {
      const seedTicketsQuery = `
        INSERT INTO ticket_types (name, description, price)
        VALUES
          ('Adult', 'Ages 18-64', 25.00),
          ('Senior', 'Ages 65+', 20.00),
          ('Student', 'With valid ID', 15.00),
          ('Child', 'Under 18', 0.00)
      `;
      await pool.query(seedTicketsQuery);
      console.log('Seeded ticket types data.');
    } else {
      console.log('Ticket types already seeded.');
    }

    // Check if membership_tiers already exist (Epic 6)
    const checkMemberships = await pool.query('SELECT COUNT(*) FROM membership_tiers');
    if (parseInt(checkMemberships.rows[0].count) === 0) {
      const seedMembershipsQuery = `
        INSERT INTO membership_tiers (name, description, price, benefits)
        VALUES
          ('Individual', 'Perfect for the solo art lover.', 75.00, ARRAY['Free admission for 1 adult', '10% discount in Museum Shop', 'Invitations to member-only previews']),
          ('Dual', 'Enjoy the museum with a friend or partner.', 125.00, ARRAY['Free admission for 2 adults', '10% discount in Museum Shop', 'Invitations to member-only previews']),
          ('Supporter', 'For our most dedicated patrons.', 250.00, ARRAY['Free admission for 2 adults and 4 guests', '20% discount in Museum Shop', 'Exclusive curator-led tours', 'Reciprocal admission at 100+ museums'])
      `;
      await pool.query(seedMembershipsQuery);
      console.log('Seeded membership tiers data.');
    } else {
      console.log('Membership tiers already seeded.');
    }

    console.log('Database initialization and seeding complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
};

initDb();
