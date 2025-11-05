// setup-support-workers.ts
// Run this script with: ts-node setup-support-workers.ts
// Or compile first: tsc setup-support-workers.ts && node setup-support-workers.js

import { Pool, QueryResult } from 'pg';

// Database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "safespace",
  password: "password",
  port: 5432,
});

interface SupportWorker {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  status: string;
  years_of_experience: number;
}

const setupDatabase = async (): Promise<void> => {
  console.log('🚀 Starting database setup for support_workers...\n');

  try {
    // Create the table
    console.log('📋 Creating support_workers table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_workers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20),
        specialization TEXT,
        bio TEXT,
        years_of_experience INTEGER,
        avatar_url TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        availability JSONB,
        hourly_rate DECIMAL(10, 2),
        languages_spoken TEXT[],
        certifications TEXT[],
        education TEXT,
        license_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table created successfully!\n');

    // Create indexes
    console.log('📊 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_support_workers_email ON support_workers(email);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_support_workers_status ON support_workers(status);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_support_workers_specialization 
      ON support_workers USING gin(to_tsvector('english', specialization));
    `);
    console.log('✅ Indexes created successfully!\n');

    // Check if sample data already exists
    const existingData: QueryResult<{ count: string }> = await pool.query(
      'SELECT COUNT(*) FROM support_workers'
    );
    const count: number = parseInt(existingData.rows[0].count);

    if (count > 0) {
      console.log(`ℹ️  Found ${count} existing support worker(s). Skipping sample data insertion.\n`);
    } else {
      // Insert sample data
      console.log('📝 Inserting sample support workers...');
      
      await pool.query(`
        INSERT INTO support_workers (
          first_name, last_name, email, phone_number,
          specialization, bio, years_of_experience,
          avatar_url, status, hourly_rate, languages_spoken
        ) VALUES 
        (
          'Eric',
          'Young',
          'eric.young@safespace.com',
          '+1-555-0101',
          'Anxiety, Depression, Trauma',
          'Experienced support worker specializing in anxiety disorders and trauma recovery. I use evidence-based approaches to help clients develop coping strategies and build resilience.',
          8,
          'https://randomuser.me/api/portraits/men/1.jpg',
          'active',
          85.00,
          ARRAY['English', 'Spanish']
        ),
        (
          'Michael',
          'Chen',
          'michael.chen@safespace.com',
          '+1-555-0102',
          'Anxiety, Depression, Trauma',
          'Passionate about helping individuals navigate mental health challenges. Specialized training in cognitive behavioral therapy and mindfulness techniques.',
          5,
          'https://randomuser.me/api/portraits/men/2.jpg',
          'active',
          75.00,
          ARRAY['English', 'Mandarin']
        ),
        (
          'Sarah',
          'Johnson',
          'sarah.johnson@safespace.com',
          '+1-555-0103',
          'Depression, Stress Management, Family Support',
          'Dedicated to creating a safe, supportive environment for clients dealing with depression and life transitions. Strong focus on building healthy coping mechanisms.',
          10,
          'https://randomuser.me/api/portraits/women/1.jpg',
          'active',
          90.00,
          ARRAY['English', 'French']
        ),
        (
          'David',
          'Martinez',
          'david.martinez@safespace.com',
          '+1-555-0104',
          'PTSD, Trauma, Crisis Intervention',
          'Specialized in trauma-informed care and crisis intervention. Committed to helping clients process traumatic experiences in a compassionate, non-judgmental setting.',
          12,
          'https://randomuser.me/api/portraits/men/3.jpg',
          'active',
          95.00,
          ARRAY['English', 'Spanish']
        );
      `);
      console.log('✅ Sample data inserted successfully!\n');
    }

    // Verify the setup
    console.log('🔍 Verifying setup...');
    const result: QueryResult<SupportWorker> = await pool.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        specialization,
        status,
        years_of_experience
      FROM support_workers
      ORDER BY first_name
    `);

    console.log(`\n✅ Setup complete! Found ${result.rows.length} support worker(s):\n`);
    result.rows.forEach((worker: SupportWorker, index: number) => {
      console.log(`${index + 1}. ${worker.first_name} ${worker.last_name}`);
      console.log(`   Email: ${worker.email}`);
      console.log(`   Specialization: ${worker.specialization}`);
      console.log(`   Experience: ${worker.years_of_experience} years`);
      console.log(`   Status: ${worker.status}\n`);
    });

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('1. Add the endpoints from support-worker-endpoints.ts to your index.ts');
    console.log('2. Restart your server');
    console.log('3. Test with: curl http://localhost:3001/api/support-workers\n');

  } catch (error: any) {
    console.error('❌ Error during setup:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run the setup
setupDatabase();