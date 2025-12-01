import { Linking } from "react-native";
import { getAllMembers, updateMember, getMemberByMemberId } from './memberService';

export const sendExpiryNotification = async (memberId, name, plan, endDate, mobile) => {
  try {
    console.log(`🔔 Sending WhatsApp expiry message to ${name}`);

    if (!mobile) {
      return { success: false, error: "Mobile number missing" };
    }

    // Validate mobile number format
    const cleanMobile = mobile.toString().replace(/\D/g, ''); // Remove non-digits
    if (cleanMobile.length !== 10) {
      return { success: false, error: "Invalid mobile number" };
    }

    const memberResult = getMemberByMemberId(memberId);
    if (!memberResult.success) return { success: false, error: "Member not found" };

    const member = memberResult.member;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const timeDiff = end.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    console.log(`📅 Days calculation: Today: ${today.toDateString()}, End: ${end.toDateString()}, Days: ${daysLeft}`);

    let message = "";
    let urgencyLevel = "";
    
    if (daysLeft === 0) {
      message = `Stark Fitness – Membership Reminder\n\nHello ${name}! 👋\n\nYour *${plan}* membership plan expires *TODAY*! ⚠️\nPlease visit the gym to renew your membership and avoid any interruption in services.\n\nThank you,\nStark Fitness Team 💪`;
      urgencyLevel = "HIGH";
    } 
    else if (daysLeft === 1) {
      message = `Stark Fitness – Membership Reminder\n\nHello ${name}! 👋\n\nYour *${plan}* membership plan expires *tomorrow*! ⏳\nRenew now to continue your fitness journey without any break.\n\nThank you,\nStark Fitness Team 💪`;
      urgencyLevel = "HIGH";
    }
    else if (daysLeft === 2) {
      message = `Stark Fitness – Membership Reminder\n\nHello ${name}! 👋\n\nYour *${plan}* membership plan expires in *2 days*! ⏰\nPlease renew your plan to maintain uninterrupted access to all facilities.\n\nThank you,\nStark Fitness Team 💪`;
      urgencyLevel = "MEDIUM";
    }
    else if (daysLeft === 7) {
      message = `Stark Fitness – Membership Reminder\n\nHello ${name}! 👋\n\nYour *${plan}* membership plan will expire in *7 days*.\nPlan ahead and renew to continue your fitness routine seamlessly.\n\nThank you,\nStark Fitness Team 💪`;
      urgencyLevel = "LOW";
    }
    else if (daysLeft < 0) {
      const daysExpired = Math.abs(daysLeft);
      if (daysExpired === 2) {
        message = `Stark Fitness – Membership Reminder\n\nHello ${name}! 👋\n\nYour membership plan expired *${daysExpired} days ago*. ❌\nYour access to gym facilities has been suspended. Please visit us to renew and restart your fitness journey.\n\nThank you,\nStark Fitness Team 💪`;
      } else {
        message = `Stark Fitness – Membership Reminder\n\nHello ${name}! 👋\n\nYour *${plan}* membership plan has *expired*! ❌\nPlease renew immediately to regain access to all our services.\n\nThank you,\nStark Fitness Team 💪`;
      }
      urgencyLevel = "CRITICAL";
    }
    else if (daysLeft > 0 && daysLeft <= 30) {
      message = `Stark Fitness – Membership Reminder\n\nHello ${name}! 👋\n\nYour *${plan}* membership plan expires in *${daysLeft} days*.\nConsider renewing early to avoid last-minute rush.\n\nThank you,\nStark Fitness Team 💪`;
      urgencyLevel = "INFO";
    }
    else {
      // Don't send notification if more than 30 days left
      return { success: false, error: "No notification needed - membership not expiring soon" };
    }

    const phone = `91${cleanMobile}`;
    const encodedMessage = encodeURIComponent(message);
    const url = `whatsapp://send?text=${encodedMessage}&phone=${phone}`;

    console.log(`📱 Attempting to open WhatsApp for ${name}, Days: ${daysLeft}, Level: ${urgencyLevel}`);

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return { success: false, error: "WhatsApp not installed" };
    }

    await Linking.openURL(url);
    console.log(`✅ WhatsApp message opened for ${name}`);

    // Update DB with notification record
    const updateResult = updateMember(member.id, {
      ...member,
      last_notification_sent: new Date().toISOString().split("T")[0],
      last_notification_type: `expiry_${urgencyLevel.toLowerCase()}`,
      notification_days_remaining: daysLeft
    });

    if (!updateResult.success) {
      console.log("⚠️ Could not update notification record in database");
    }

    return { 
      success: true, 
      message: "WhatsApp message sent successfully",
      data: {
        daysRemaining: daysLeft,
        urgencyLevel: urgencyLevel,
        messageType: daysLeft < 0 ? "expired" : "reminder"
      }
    };

  } catch (error) {
    console.log("💥 WhatsApp error: ", error);
    return { 
      success: false, 
      error: error.message,
      details: "Failed to send WhatsApp message"
    };
  }
};

// Bulk notification function for multiple members
export const sendBulkExpiryNotifications = async () => {
  try {
    const membersResult = getAllMembers();
    if (!membersResult.success) {
      return { success: false, error: "Failed to load members" };
    }

    const members = membersResult.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0
    };

    for (const member of members) {
      if (!member.end_date || !member.mobile) {
        results.skipped++;
        continue;
      }

      const endDate = new Date(member.end_date);
      endDate.setHours(0, 0, 0, 0);
      
      const timeDiff = endDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Only send notifications for members expiring within 7 days or expired within 7 days
      if (daysLeft >= 0 && daysLeft <= 7) {
        const result = await sendExpiryNotification(
          member.member_id,
          member.name,
          member.plan,
          member.end_date,
          member.mobile
        );
        
        notifications.push({
          member: member.name,
          success: result.success,
          daysLeft: daysLeft
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        results.skipped++;
      }
    }

    return {
      success: true,
      data: {
        notifications: notifications,
        summary: results
      }
    };

  } catch (error) {
    console.log("💥 Bulk notification error: ", error);
    return { success: false, error: error.message };
  }
};