import { execute } from "../database/index";

export const insertMember = (memberData) => {
    try {
        console.log("Inserting member with data:", memberData);
        
        const result = execute(
            `INSERT INTO members 
            (member_id, name, age, gender, mobile, address, plan, start_date, end_date, amount) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                memberData.member_id,
                memberData.name,
                memberData.age,
                memberData.gender,
                memberData.mobile,
                memberData.address,
                memberData.plan,
                memberData.start_date,
                memberData.end_date,
                memberData.amount,
                
            ]
        );

        console.log("Insert result:", result);

        if (result.insertId) {
            console.log('Member inserted successfully with ID:', result.insertId);
            return { success: true, insertId: result.insertId };
        } else if (result.rowsAffected > 0) {
            console.log('Member inserted successfully, rows affected:', result.rowsAffected);
            return { success: true };
        } else {
            console.log('Failed to insert member - no insertId or rowsAffected');
            return { success: false, error: "Insert failed - no data returned" };
        }
    } catch (error) {
        console.log('Error in insertMember:', error);
        return { success: false, error: error.message };
    }
};

// Get all members
export const getAllMembers = () => {
  try {
    const result = execute("SELECT * FROM members ORDER BY id DESC");
    
    if (result.rows) {
      const rows = result.rows._array || [];
      console.log(`Retrieved ${rows.length} members`);
      return { success: true, data: rows };
    } else {
      console.log("No members found");
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Fetching members error:", e);
    return { success: false, error: e.message, data: [] };
  }
}

export const getMemberById = (id) => {
  try {
    console.log("getMemberById called with ID:", id);
    
    const result = execute(`SELECT * FROM members WHERE id = ?`, [id]);

    console.log("SQL result:", result);

    if (result.rows && result.rows._array && result.rows._array.length > 0) {
      console.log("Member found:", result.rows._array[0]);
      return { success: true, member: result.rows._array[0] };
    } else {
      console.log("No member found with ID:", id);
      return { success: false, error: "Member not found" };
    }
  } catch (e) {
    console.log("Get member by ID exception:", e);
    return { success: false, error: e.message };
  }
};

export const getMemberByMemberId = (memberId) => {
  try {
    console.log("getMemberByMemberId called with member ID:", memberId);
    
    const result = execute(`SELECT * FROM members WHERE member_id = ?`, [memberId]);

    console.log("SQL result:", result);

    if (result.rows && result.rows._array && result.rows._array.length > 0) {
      console.log("Member found:", result.rows._array[0]);
      return { success: true, member: result.rows._array[0] };
    } else {
      console.log("No member found with member ID:", memberId);
      return { success: false, error: "Member not found" };
    }
  } catch (e) {
    console.log("Get member by member ID exception:", e);
    return { success: false, error: e.message };
  }
};

export const deleteMemberById = (id) => {
  try {
    const result = execute(`DELETE FROM members WHERE id = ?`, [id]);

    console.log("Delete result:", result);

    if (result.rowsAffected > 0) {
      console.log("Member has been deleted, rows affected:", result.rowsAffected);
      return {
        success: true,
        rowsAffected: result.rowsAffected,
        message: "Member has been deleted"
      };
    } else {
      console.log("No member found to delete");
      return { success: false, error: "Member not found" };
    }

  } catch (e) {
    console.log("Delete error", e);
    return { success: false, error: e.message }
  }
}




export const deleteMemberByMemberId = (memberId) => {
  try {
    const result = execute(`DELETE FROM members WHERE member_id = ?`, [memberId]);

    console.log("Delete result:", result);

    if (result.rowsAffected > 0) {
      console.log("Member has been deleted, rows affected:", result.rowsAffected);
      return {
        success: true,
        rowsAffected: result.rowsAffected,
        message: "Member has been deleted"
      };
    } else {
      console.log("No member found to delete");
      return { success: false, error: "Member not found" };
    }

  } catch (e) {
    console.log("Delete error", e);
    return { success: false, error: e.message }
  }
}

export const deleteAllMembers = () => {
  try {
    const result = execute(`DELETE FROM members`);
    
    console.log("Delete all result:", result);
    
    console.log("All Members Deleted, rows affected:", result.rowsAffected);
    return {
      success: true,
      rowsAffected: result.rowsAffected,
      message: "All Members have been Deleted"
    }
  } catch (e) {
    console.log("Delete all member error", e);
    return {
      success: false,
      error: e.message
    }
  }
}

export const updateMember = (id, memberData) => {
  try {
    const result = execute(
      `UPDATE members
      SET member_id = ?, name = ?, age = ?, gender = ?, mobile = ?, 
          address = ?, plan = ?, start_date = ?, end_date = ?, amount = ?
      WHERE id = ?`,
      [
        memberData.member_id,
        memberData.name,
        memberData.age,
        memberData.gender,
        memberData.mobile,
        memberData.address,
        memberData.plan,
        memberData.start_date,
        memberData.end_date,
        memberData.amount,
        id
      ]
    );
    
    console.log("Update result:", result);
    
    if (result.rowsAffected > 0) {
      console.log("Member Update successful, rows affected:", result.rowsAffected);
      return {
        success: true,
        rowsAffected: result.rowsAffected,
        message: "Member has been Updated"
      };
    } else {
      console.log("No rows affected in update");
      return { success: false, error: "No rows affected" };
    }

  } catch (e) {
    console.log("Update error:", e);
    return {
      success: false,
      error: e.message
    }
  }
}

export const updateMemberByMemberId = (memberId, memberData) => {
  try {
    const result = execute(
      `UPDATE members
      SET name = ?, age = ?, gender = ?, mobile = ?, 
          address = ?, plan = ?, start_date = ?, end_date = ?, amount = ?
      WHERE member_id = ?`,
      [
        memberData.name,
        memberData.age,
        memberData.gender,
        memberData.mobile,
        memberData.address,
        memberData.plan,
        memberData.start_date,
        memberData.end_date,
        memberData.amount,
        memberId
      ]
    );
    
    console.log("Update result:", result);
    
    if (result.rowsAffected > 0) {
      console.log("Member Update successful, rows affected:", result.rowsAffected);
      return {
        success: true,
        rowsAffected: result.rowsAffected,
        message: "Member has been Updated"
      };
    } else {
      console.log("No rows affected in update");
      return { success: false, error: "No rows affected" };
    }

  } catch (e) {
    console.log("Update error:", e);
    return {
      success: false,
      error: e.message
    }
  }
}

// Get members expiring in specific days
export const getMembersExpiringInDays = (days = 2) => {
  try {
    const allMembers = getAllMembers();
    
    if (!allMembers.success) {
      return { success: false, error: 'Failed to fetch members' };
    }

    const members = allMembers.data;
    const today = new Date();
    
    const expiringMembers = members.filter(member => {
      if (!member.end_date) return false;
      
      const endDate = new Date(member.end_date);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysRemaining === days;
    });

    console.log(`Found ${expiringMembers.length} members expiring in ${days} days`);
    
    return { 
      success: true, 
      data: expiringMembers,
      count: expiringMembers.length 
    };
  } catch (error) {
    console.log('Error getting expiring members:', error);
    return { success: false, error: error.message };
  }
};

// Fix the updateMemberEndDate function
export const updateMemberEndDate = (memberId, newEndDate) => {
    try {
        console.log("Updating member end date:", { memberId, newEndDate });
        
        const result = execute(
            `UPDATE members SET end_date = ? WHERE member_id = ?`,
            [newEndDate, memberId]
        );
        
        console.log("Member update result:", result);
        
        if (result.rowsAffected > 0) {
            console.log("Member end date updated successfully");
            return { success: true, rowsAffected: result.rowsAffected };
        } else {
            console.log("No rows affected in member update");
            return { success: false, error: "No rows affected" };
        }
        
    } catch (e) {
        console.log("Exception in updateMemberEndDate:", e);
        return { success: false, error: e.message };
    }
};

export const updateMemberPlan = (memberId, newPlan) => {
    try {
        console.log("Updating member plan:", { memberId, newPlan });
        
        const result = execute(
            `UPDATE members SET plan = ? WHERE member_id = ?`,
            [newPlan, memberId]
        );
        
        console.log("Update member plan result:", result);
        
        if (result.rowsAffected > 0) {
            console.log("Member plan updated successfully");
            return {
                success: true,
                rowsAffected: result.rowsAffected,
                message: "Member plan has been updated"
            };
        } else {
            console.log("No rows affected in member plan update");
            return { success: false, error: "No rows affected" };
        }

    } catch (e) {
        console.log("Update member plan error:", e);
        return {
            success: false,
            error: e.message
        }
    }
};
export const updateMemberStatus = (memberId, status) => {
    try {
        console.log("Updating member status:", { memberId, status });
        
        const result = execute(
            `UPDATE members SET isactive = ? WHERE id = ?`,
            [status, memberId]
        );
        
        console.log("Member status update result:", result);
        
        if (result.rowsAffected > 0) {
            console.log("Member status updated successfully");
            return { success: true, rowsAffected: result.rowsAffected };
        } else {
            console.log("No rows affected in member status update");
            return { success: false, error: "No rows affected" };
        }
        
    } catch (e) {
        console.log("Exception in updateMemberStatus:", e);
        return { success: false, error: e.message };
    }
};


export const getActiveMembers = () => {
  try {
    const result = execute("SELECT * FROM members WHERE isactive = 'active' ORDER BY id DESC");
    
    if (result.rows) {
      const rows = result.rows._array || [];
      console.log(`Retrieved ${rows.length} active members`);
      return { success: true, data: rows };
    } else {
      console.log("No active members found");
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Fetching active members error:", e);
    return { success: false, error: e.message, data: [] };
  }
}

export const getInactiveMembers = () => {
  try {
    const result = execute("SELECT * FROM members WHERE isactive = 'inactive' ORDER BY id DESC");
    
    if (result.rows) {
      const rows = result.rows._array || [];
      console.log(`Retrieved ${rows.length} inactive members`);
      return { success: true, data: rows };
    } else {
      console.log("No inactive members found");
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Fetching inactive members error:", e);
    return { success: false, error: e.message, data: [] };
  }
}

export const searchMembers = (searchTerm) => {
  try {
    const result = execute(
      `SELECT * FROM members 
       WHERE name LIKE ? OR mobile LIKE ? OR member_id = ?
       ORDER BY id DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, searchTerm]
    );
    
    if (result.rows) {
      const rows = result.rows._array || [];
      console.log(`Found ${rows.length} members matching: ${searchTerm}`);
      return { success: true, data: rows };
    } else {
      console.log("No members found matching search term");
      return { success: true, data: [] };
    }
  } catch (e) {
    console.log("Search members error:", e);
    return { success: false, error: e.message, data: [] };
  }
}
