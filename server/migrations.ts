import { db } from './db';
import { sql } from 'drizzle-orm';

async function runMigrations() {
  console.log("Running database migrations...");

  try {
    // Check if wallet_balance column exists in users table
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'wallet_balance'
        ) THEN
          ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0;
          RAISE NOTICE 'Added wallet_balance column to users table';
        ELSE
          RAISE NOTICE 'wallet_balance column already exists in users table';
        END IF;
      END $$;
    `);

    // Adding rating columns to food_items
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'food_items' AND column_name = 'average_rating'
        ) THEN
          ALTER TABLE food_items ADD COLUMN average_rating REAL DEFAULT 0;
          RAISE NOTICE 'Added average_rating column to food_items table';
        ELSE
          RAISE NOTICE 'average_rating column already exists in food_items table';
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'food_items' AND column_name = 'rating_count'
        ) THEN
          ALTER TABLE food_items ADD COLUMN rating_count INTEGER DEFAULT 0;
          RAISE NOTICE 'Added rating_count column to food_items table';
        ELSE
          RAISE NOTICE 'rating_count column already exists in food_items table';
        END IF;
      END $$;
    `);

    // Adding new columns to orders table
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'payment_status'
        ) THEN
          ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
          RAISE NOTICE 'Added payment_status column to orders table';
        ELSE
          RAISE NOTICE 'payment_status column already exists in orders table';
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'qr_code'
        ) THEN
          ALTER TABLE orders ADD COLUMN qr_code TEXT;
          RAISE NOTICE 'Added qr_code column to orders table';
        ELSE
          RAISE NOTICE 'qr_code column already exists in orders table';
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'estimated_delivery_time'
        ) THEN
          ALTER TABLE orders ADD COLUMN estimated_delivery_time TIMESTAMP;
          RAISE NOTICE 'Added estimated_delivery_time column to orders table';
        ELSE
          RAISE NOTICE 'estimated_delivery_time column already exists in orders table';
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'delivered_at'
        ) THEN
          ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;
          RAISE NOTICE 'Added delivered_at column to orders table';
        ELSE
          RAISE NOTICE 'delivered_at column already exists in orders table';
        END IF;
      END $$;
    `);

    // Create reviews table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        food_item_id INTEGER NOT NULL,
        order_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create subscription_plans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        duration INTEGER NOT NULL,
        meals_per_day INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // Create user_subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        payment_id TEXT NOT NULL,
        remaining_meals INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Database migrations completed successfully!");
    
    // Add some initial subscription plans if table is empty
    const plans = await db.execute(sql`SELECT * FROM subscription_plans LIMIT 1`);
    
    if (!plans.rows.length) {
      await db.execute(sql`
        INSERT INTO subscription_plans (name, description, price, duration, meals_per_day, is_active)
        VALUES 
          ('Weekly Basic', 'Basic meal plan for one week', 499, 7, 2, TRUE),
          ('Weekly Premium', 'Premium meal plan for one week', 699, 7, 3, TRUE),
          ('Monthly Basic', 'Basic meal plan for one month', 1899, 30, 2, TRUE),
          ('Monthly Premium', 'Premium meal plan for one month', 2699, 30, 3, TRUE);
      `);
      console.log("Added initial subscription plans");
    }
    
  } catch (error) {
    console.error("Error running migrations:", error);
  }
}

export { runMigrations };