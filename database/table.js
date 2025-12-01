// database/table.js
import { openDB, execute } from "./index";

export const initDatabase = () => {
  try {
    console.log("Step 1: Opening database...");
    openDB();

    console.log("Step 2: Creating members table...");
    const membersResult = execute(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER UNIQUE,
        isactive TEXT DEFAULT 'active',   
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        mobile TEXT,
        address TEXT,
        plan TEXT,
        start_date TEXT,
        end_date TEXT,
        amount INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (membersResult && membersResult.rowsAffected !== undefined) {
      console.log("Members table created successfully!");

      console.log("Step 3: Creating payments table...");
      const paymentResult = execute(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          member_id INTEGER,
          name TEXT,
          plan TEXT,
          duration TEXT,
          payment_date TEXT,
          start_date TEXT,
          end_date TEXT,
          status TEXT DEFAULT 'completed',
          amount INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      if (paymentResult && paymentResult.rowsAffected !== undefined) {
        console.log("Payments table created successfully!");
        
        addFcmTokenColumn();
        addNotificationColumn();
        
        return {
          success: true,
          membersTable: true,
          paymentsTable: true
        };
      } else {
        console.log("Payments table creation failed");
        return { success: false, error: "Payments table creation failed" };
      }
    } else {
      console.log("Members table creation failed");
      return { success: false, error: "Members table creation failed" };
    }
  } catch (e) {
    console.log("Database initialization error:", e);
    return { success: false, error: e.message };
  }
};

export const updatePaymentsTable = () => {
  try {
    execute(`ALTER TABLE payments ADD COLUMN duration TEXT`);
    return { success: true };
  } catch (e) {
    return { success: true };
  }
};