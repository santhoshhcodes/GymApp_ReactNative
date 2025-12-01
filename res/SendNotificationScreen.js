import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Linking,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { getAllMembers } from "../services/memberService";
import { sendExpiryNotification } from "../services/notificationService";

export default function SendNotificationScreen() {
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loadingMember, setLoadingMember] = useState(null);
    const [sentMembers, setSentMembers] = useState(new Set()); // Track sent members

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = () => {
        const result = getAllMembers();
        if (result.success) {
            const membersWithEndDate = result.data.filter((member) => member.end_date);
            setMembers(membersWithEndDate);
            filterMembersByExpiry(membersWithEndDate);
        }
    };

    const filterMembersByExpiry = (membersList) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filtered = membersList.filter((member) => {
            if (!member.end_date) return false;
            
            const endDate = new Date(member.end_date);
            endDate.setHours(0, 0, 0, 0);
            
            const diff = endDate.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 3600 * 24));
            
            return days <= 2;
        });

        setFilteredMembers(filtered);
    };

    const handleSendNotification = async (member) => {
        // Check if already sent to this member
        if (sentMembers.has(member.member_id)) {
            Alert.alert(
                "Already Sent",
                `You have already sent a notification to ${member.name}. Do you want to send another reminder?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Send Again",
                        onPress: () => sendNotification(member)
                    }
                ]
            );
        } else {
            sendNotification(member);
        }
    };

    const sendNotification = async (member) => {
        setLoadingMember(member.member_id);

        try {
            const result = await sendExpiryNotification(
                member.member_id,
                member.name,
                member.plan,
                member.end_date,
                member.mobile
            );

            if (result.success) {
                Alert.alert("Success", `Message opened for ${member.name}`);
                
                // Add to sent members set
                setSentMembers(prev => new Set(prev).add(member.member_id));
                
                // Remove the member from the filtered list after sending notification
                const updatedFilteredMembers = filteredMembers.filter(
                    m => m.member_id !== member.member_id
                );
                setFilteredMembers(updatedFilteredMembers);
                
                // Also update the main members list
                const updatedMembers = members.filter(
                    m => m.member_id !== member.member_id
                );
                setMembers(updatedMembers);
            } else {
                Alert.alert("Failed", result.error);
            }
        } catch (err) {
            Alert.alert("Error", "Something went wrong!");
        } finally {
            setLoadingMember(null);
        }
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return "No date";
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        const diff = end.getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        
        if (days < 0) return "Expired";
        if (days === 0) return "Today";
        if (days === 1) return "1 day";
        if (days === 2) return "2 days";
        return `${days} days`;
    };

    const getStatusStyle = (endDate) => {
        if (!endDate) return styles.statusDefault;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        const diff = end.getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        
        if (days < 0) return styles.statusExpired;
        if (days === 0) return styles.statusToday;
        if (days === 1) return styles.statusOneDay;
        if (days === 2) return styles.statusTwoDays;
        return styles.statusDefault;
    };

    const isMemberSent = (memberId) => {
        return sentMembers.has(memberId);
    };

    return (
        <SafeAreaProvider>
            <LinearGradient colors={["#000000", "#D4A600", "#F7D200"]} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Send Notifications</Text>
                        <Text style={styles.headerSubtitle}>Expiry reminders </Text>
                    </View>

                    <ScrollView style={styles.scrollView}>
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryText}>
                                {filteredMembers.length} members need attention
                            </Text>
                            {sentMembers.size > 0 && (
                                <Text style={styles.sentSummaryText}>
                                    {sentMembers.size} notifications sent
                                </Text>
                            )}
                        </View>

                        {filteredMembers.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Icon name="checkmark-done-circle" size={48} color="#CCCCCC" />
                                <Text style={styles.emptyText}>No members need immediate attention</Text>
                                <Text style={styles.emptySubtext}>
                                    {sentMembers.size > 0 
                                        ? "All expiry notifications have been sent successfully"
                                        : "No members are expiring soon"
                                    }
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.membersList}>
                                {filteredMembers.map((member) => (
                                    <View key={member.member_id} style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.memberName}>{member.name}</Text>
                                            <View style={styles.statusContainer}>
                                                {isMemberSent(member.member_id) && (
                                                    <View style={styles.sentBadge}>
                                                        <Icon name="checkmark" size={10} color="#fff" />
                                                        <Text style={styles.sentBadgeText}>Sent</Text>
                                                    </View>
                                                )}
                                                <Text style={[styles.status, getStatusStyle(member.end_date)]}>
                                                    {getDaysRemaining(member.end_date)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardDetails}>
                                            <Text style={styles.detail}>Plan: {member.plan}</Text>
                                            <Text style={styles.detail}>Expires: {member.end_date}</Text>
                                            <Text style={styles.detail}>Mobile: {member.mobile || "N/A"}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.sendButton,
                                                isMemberSent(member.member_id) && styles.sendButtonSent
                                            ]}
                                            onPress={() => handleSendNotification(member)}
                                            disabled={loadingMember === member.member_id}
                                        >
                                            {loadingMember === member.member_id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Icon 
                                                        name={isMemberSent(member.member_id) ? "refresh" : "notifications"} 
                                                        size={16} 
                                                        color="#fff" 
                                                    />
                                                    <Text style={styles.sendButtonText}>
                                                        {isMemberSent(member.member_id) ? "Send Again" : "Send Reminder"}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingTop: 20 },
    header: { alignItems: "center", padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 5 },
    headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
    scrollView: { flex: 1, paddingHorizontal: 15 },
    summaryContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: "center",
    },
    summaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    sentSummaryText: { color: "#90EE90", fontSize: 12, marginTop: 4, fontWeight: "500" },
    summarySubtext: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 },
    membersList: { gap: 12, paddingBottom: 20 },
    card: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
    cardHeader: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 10 
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    memberName: { fontSize: 18, fontWeight: "bold", color: "#000000", flex: 1 },
    status: { 
        fontSize: 12, 
        fontWeight: "600", 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6,
    },
    sentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#28a745',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    sentBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusExpired: { backgroundColor: "#FFE5E5", color: "#D63031" },
    statusToday: { backgroundColor: "#FFF4E5", color: "#E67E22" },
    statusOneDay: { backgroundColor: "#E8F4FD", color: "#3498DB" },
    statusTwoDays: { backgroundColor: "#E8F4FD", color: "#3498DB" },
    statusDefault: { backgroundColor: "rgba(0,0,0,0.1)", color: "#666666" },
    cardDetails: { marginBottom: 15 },
    detail: { fontSize: 14, color: "#666666", marginBottom: 3 },
    sendButton: { 
        backgroundColor: "#FF6B35", 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 12, 
        borderRadius: 8, 
        gap: 8 
    },
    sendButtonSent: {
        backgroundColor: "#6c757d", // Gray color for sent state
    },
    sendButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    emptyContainer: { 
        alignItems: "center", 
        justifyContent: "center", 
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyText: { 
        fontSize: 18, 
        color: "#CCCCCC", 
        textAlign: "center",
        marginTop: 12,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "rgba(204,204,204,0.7)",
        textAlign: "center",
    },
});