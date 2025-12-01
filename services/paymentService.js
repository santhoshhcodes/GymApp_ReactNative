import { execute } from "../database/index";

export const insertPayment = (paymentData) => {
    try {
        console.log("Inserting payment with data:", paymentData);
        
        // First, ensure the payments table has the correct structure
        ensurePaymentsTableStructure();
        
        const result = execute(
            `INSERT INTO payments 
            (member_id, name, plan, duration, amount, payment_date, start_date, end_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                paymentData.member_id,
                paymentData.name,
                paymentData.plan || '',
                paymentData.duration || '',
                paymentData.amount,
                paymentData.payment_date || new Date().toISOString().split('T')[0],
                paymentData.start_date || new Date().toISOString().split('T')[0],
                paymentData.end_date || new Date().toISOString().split('T')[0],
                paymentData.status || 'completed'
            ]
        );

        console.log("Payment insert result:", result);

        if (result && result.insertId) {
            console.log('Payment inserted successfully with ID:', result.insertId);
            return { success: true, insertId: result.insertId };
        } else if (result && result.rowsAffected > 0) {
            console.log('Payment inserted successfully, rows affected:', result.rowsAffected);
            return { success: true };
        } else {
            console.log('Failed to insert payment - no insertId or rowsAffected');
            return { success: false, error: "Payment insert failed" };
        }
    } catch (error) {
        console.log('Error in insertPayment:', error);
        return { success: false, error: error.message };
    }
};

// Helper function to ensure payments table has correct structure
const ensurePaymentsTableStructure = () => {
    try {
        // Create payments table with all required columns
        execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER,
                name TEXT,
                plan TEXT,
                duration TEXT,
                amount INTEGER,
                payment_date TEXT,
                start_date TEXT,
                end_date TEXT,
                status TEXT DEFAULT 'completed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Try to add duration column if it doesn't exist
        try {
            execute(`ALTER TABLE payments ADD COLUMN duration TEXT`);
        } catch (e) {
            // Column already exists, ignore error
            console.log("Duration column already exists");
        }
        
        return { success: true };
    } catch (error) {
        console.log("Error ensuring payments table structure:", error);
        return { success: false, error: error.message };
    }
};
// Add this function to your paymentService.js
export const getPaymentsForCurrentMonth = () => {
    try {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
        
        console.log(`📅 Querying payments between: ${firstDayOfMonth} and ${lastDayOfMonth}`);
        
        const query = `
            SELECT * FROM payments 
            WHERE payment_date BETWEEN ? AND ?
            ORDER BY payment_date DESC
        `;
        
        const result = execute(query, [firstDayOfMonth, lastDayOfMonth]);
        
        console.log(`📊 Found ${result.rows ? result.rows._array.length : 0} payments for current month`);

        if (result.rows) {
            const payments = result.rows._array || [];
            return {
                success: true,
                data: payments
            };
        } else {
            return {
                success: true,
                data: []
            };
        }
    } catch (error) {
        console.error('Error in getPaymentsForCurrentMonth:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};



// Get all payments
export const getAllPayments = () => {
    try {
        const query = `
            SELECT * FROM payments 
            ORDER BY payment_date DESC
        `;
        
        const result = execute(query);
        
        console.log("Payments SQL result:", result);

        if (result.rows) {
            const payments = result.rows._array || [];
            console.log(`Found ${payments.length} payments`);
            return {
                success: true,
                data: payments
            };
        } else {
            console.log("No payments found");
            return {
                success: true,
                data: []
            };
        }
    } catch (error) {
        console.error('Error in getAllPayments:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};

// Get payment by ID
export const getPaymentById = (id) => {
  try {
    console.log("getPaymentById called with ID:", id);
    
    const result = execute(`SELECT * FROM payments WHERE id = ?`, [id]);

    console.log("Payment SQL result:", result);

    if (result.rows && result.rows._array && result.rows._array.length > 0) {
      console.log("Payment found:", result.rows._array[0]);
      return { success: true, payment: result.rows._array[0] };
    } else {
      console.log("No payment found with ID:", id);
      return { success: false, error: "Payment not found" };
    }
  } catch (e) {
    console.log("Get payment by ID exception:", e);
    return { success: false, error: e.message };
  }
};

// Get payments by member ID
export const getPaymentsByMemberId = (memberId) => {
  try {
    console.log("getPaymentsByMemberId called with member ID:", memberId);
    
    const result = execute(`SELECT * FROM payments WHERE member_id = ? ORDER BY id DESC`, [memberId]);

    console.log("Payments by member SQL result:", result);

    if (result.rows && result.rows._array) {
      const payments = result.rows._array;
      console.log(`Found ${payments.length} payments for member ${memberId}`);
      return { success: true, data: payments };
    } else {
      console.log("No payments found for member ID:", memberId);
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Get payments by member ID exception:", e);
    return { success: false, error: e.message, data: [] };
  }
};

// Delete payment by ID - FIXED FUNCTION NAME
export const deletePayment = (id) => {
  try {
    console.log("Deleting payment with ID:", id);
    
    // First get the payment details before deleting
    const paymentResult = getPaymentById(id);
    if (!paymentResult.success) {
      return { success: false, error: "Payment not found" };
    }

    const payment = paymentResult.payment;
    
    // Delete the payment
    const result = execute(`DELETE FROM payments WHERE id = ?`, [id]);

    console.log("Delete payment result:", result);

    if (result.rowsAffected > 0) {
      console.log("Payment has been deleted, rows affected:", result.rowsAffected);
      
      // Return payment details so we can revert member data
      return {
        success: true,
        rowsAffected: result.rowsAffected,
        payment: payment, // Return the deleted payment details
        message: "Payment has been deleted"
      };
    } else {
      console.log("No payment found to delete");
      return { success: false, error: "Payment not found" };
    }

  } catch (e) {
    console.log("Delete payment error", e);
    return { success: false, error: e.message }
  }
}

// Keep the old function for backward compatibility
export const deletePaymentById = (id) => {
  return deletePayment(id);
}

// Delete all payments for a member
export const deletePaymentsByMemberId = (memberId) => {
  try {
    const result = execute(`DELETE FROM payments WHERE member_id = ?`, [memberId]);

    console.log("Delete payments by member result:", result);

    if (result.rowsAffected > 0) {
      console.log("Payments deleted for member, rows affected:", result.rowsAffected);
      return {
        success: true,
        rowsAffected: result.rowsAffected,
        message: "All payments for member have been deleted"
      };
    } else {
      console.log("No payments found for member to delete");
      return { success: false, error: "No payments found for member" };
    }

  } catch (e) {
    console.log("Delete payments by member error", e);
    return { success: false, error: e.message }
  }
}

// Delete all payments
export const deleteAllPayments = () => {
  try {
    const result = execute(`DELETE FROM payments`);
    
    console.log("Delete all payments result:", result);
    
    console.log("All Payments Deleted, rows affected:", result.rowsAffected);
    return {
      success: true,
      rowsAffected: result.rowsAffected,
      message: "All Payments have been Deleted"
    }
  } catch (e) {
    console.log("Delete all payments error", e);
    return {
      success: false,
      error: e.message
    }
  }
}

// Get payments by date range
export const getPaymentsByDateRange = (startDate, endDate) => {
  try {
    console.log("Getting payments between:", startDate, "and", endDate);
    
    const result = execute(
      `SELECT * FROM payments 
       WHERE payment_date BETWEEN ? AND ? 
       ORDER BY payment_date DESC`,
      [startDate, endDate]
    );

    if (result.rows) {
      const payments = result.rows._array || [];
      console.log(`Found ${payments.length} payments in date range`);
      return { success: true, data: payments };
    } else {
      console.log("No payments found in date range");
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Get payments by date range error:", e);
    return { success: false, error: e.message, data: [] };
  }
}

// Get payments by status
export const getPaymentsByStatus = (status) => {
  try {
    const result = execute(
      `SELECT * FROM payments WHERE status = ? ORDER BY id DESC`,
      [status]
    );
    
    if (result.rows) {
      const payments = result.rows._array || [];
      console.log(`Found ${payments.length} payments with status: ${status}`);
      return { success: true, data: payments };
    } else {
      console.log(`No payments found with status: ${status}`);
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Get payments by status error:", e);
    return { success: false, error: e.message, data: [] };
  }
}

// Get total revenue statistics
export const getPaymentStatistics = () => {
  try {
    // Total revenue
    const totalResult = execute(`SELECT SUM(amount) as total_revenue FROM payments WHERE status = 'completed'`);
    const totalRevenue = totalResult.rows && totalResult.rows._array && totalResult.rows._array[0].total_revenue || 0;
    
    // This month revenue
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const monthlyResult = execute(
      `SELECT SUM(amount) as monthly_revenue FROM payments 
       WHERE status = 'completed' AND payment_date BETWEEN ? AND ?`,
      [firstDayOfMonth, lastDayOfMonth]
    );
    const monthlyRevenue = monthlyResult.rows && monthlyResult.rows._array && monthlyResult.rows._array[0].monthly_revenue || 0;
    
    // Total payments count
    const countResult = execute(`SELECT COUNT(*) as total_payments FROM payments WHERE status = 'completed'`);
    const totalPayments = countResult.rows && countResult.rows._array && countResult.rows._array[0].total_payments || 0;
    
    console.log("Payment statistics calculated:", { totalRevenue, monthlyRevenue, totalPayments });
    
    return { 
      success: true, 
      data: {
        totalRevenue,
        monthlyRevenue,
        totalPayments
      }
    };
  } catch (e) {
    console.log("Get payment statistics error:", e);
    return { success: false, error: e.message };
  }
}

// Search payments by member name or ID
export const searchPayments = (searchTerm) => {
  try {
    const result = execute(
      `SELECT * FROM payments 
       WHERE name LIKE ? OR member_id = ?
       ORDER BY id DESC`,
      [`%${searchTerm}%`, searchTerm]
    );
    
    if (result.rows) {
      const payments = result.rows._array || [];
      console.log(`Found ${payments.length} payments matching: ${searchTerm}`);
      return { success: true, data: payments };
    } else {
      console.log("No payments found matching search term");
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Search payments error:", e);
    return { success: false, error: e.message, data: [] };
  }
}