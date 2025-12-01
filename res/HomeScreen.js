import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    RefreshControl
} from "react-native";
import { getAllMembers } from "../services/memberService";
import { getAllPayments, getPaymentsForCurrentMonth } from "../services/paymentService";
import Icon from "react-native-vector-icons/Ionicons";

export default function HomeScreen({ route }) {
    const navigation = useNavigation();
    const [members, setMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeMembers: 0,
        totalReceivedAmount: 0,
        pendingAmount: 0,
        monthlyReceivedAmount: 0,
        pendingMembersCount: 0,
        admissionPendingAmount: 0,
        monthlyPendingAmount: 0,
        admissionPendingCount: 0,
        monthlyPendingCount: 0
    });
    const [refreshing, setRefreshing] = useState(false);
    const calculateStatistics = useCallback((paymentsData, membersData, monthlyAmount = null) => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        console.log(`🔍 Calculating stats for: ${currentMonth}/${currentYear}`);
        console.log(`📊 Total payments to process: ${paymentsData ? paymentsData.length : 0}`);

        // Reset all stats first
        let totalReceivedAmount = 0;
        let monthlyReceivedAmount = monthlyAmount !== null ? monthlyAmount : 0; // Use provided monthly amount if available
        let admissionPendingAmount = 0;
        let monthlyPendingAmount = 0;
        let admissionPendingCount = 0;
        let monthlyPendingCount = 0;
        let activeMembers = 0;

        // Calculate total received amount from all payments
        if (paymentsData && paymentsData.length > 0) {
            for (let i = 0; i < paymentsData.length; i++) {
                const payment = paymentsData[i];
                const amount = parseInt(payment.amount) || 0;
                totalReceivedAmount += amount;

                // Only calculate monthly amount if not provided
                if (monthlyAmount === null) {
                    // Calculate monthly received amount - FIXED DATE COMPARISON
                    if (payment.payment_date) {
                        try {
                            // Parse payment date - handle different date formats
                            let paymentDate;

                            // Try parsing as ISO string first
                            paymentDate = new Date(payment.payment_date);

                            // If invalid, try parsing as DD-MM-YYYY or other formats
                            if (isNaN(paymentDate.getTime())) {
                                // Try splitting date string (assuming format like "2024-12-25" or "25-12-2024")
                                const dateParts = payment.payment_date.split('-');
                                if (dateParts.length === 3) {
                                    // If format is YYYY-MM-DD
                                    if (dateParts[0].length === 4) {
                                        paymentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                                    }
                                    // If format is DD-MM-YYYY
                                    else if (dateParts[2].length === 4) {
                                        paymentDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                                    }
                                }
                            }

                            // Check if the payment date is valid
                            if (isNaN(paymentDate.getTime())) {
                                console.log("❌ Invalid payment date:", payment.payment_date);
                                continue;
                            }

                            const paymentMonth = paymentDate.getMonth() + 1;
                            const paymentYear = paymentDate.getFullYear();

                            console.log(`💰 Payment ${i}: ₹${payment.amount} on ${payment.payment_date} -> ${paymentMonth}/${paymentYear}`);

                            // STRICT comparison for current month
                            if (paymentMonth === currentMonth && paymentYear === currentYear) {
                                monthlyReceivedAmount += amount;
                                console.log(`✅ ADDED to monthly: ₹${amount}, Total monthly: ₹${monthlyReceivedAmount}`);
                            } else {
                                console.log(`❌ SKIPPED for monthly: ${paymentMonth}/${paymentYear} != ${currentMonth}/${currentYear}`);
                            }
                        } catch (error) {
                            console.log("❌ Error parsing payment date:", error, "Date:", payment.payment_date);
                        }
                    } else {
                        console.log("⚠️ No payment date for payment:", payment);
                    }
                }
            }
        }

        console.log(`🎯 FINAL - Monthly received: ₹${monthlyReceivedAmount}, Total received: ₹${totalReceivedAmount}`);

        // ... rest of your calculateStatistics function remains the same
        // Calculate active members and pending amounts
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (membersData && membersData.length > 0) {
            for (let i = 0; i < membersData.length; i++) {
                const member = membersData[i];

                // Check if member is active
                if (member.end_date) {
                    try {
                        const endDate = new Date(member.end_date);
                        endDate.setHours(0, 0, 0, 0);
                        if (endDate >= today) {
                            activeMembers++;
                        }
                    } catch (error) {
                        console.log("Error checking active member:", error);
                    }
                }

                // Separate admission pending vs monthly pending
                if (member.plan === "Admission Fee Pending") {
                    admissionPendingAmount += 800;
                    admissionPendingCount++;
                } else if (member.plan && member.plan !== "Admission Fee Pending") {
                    const needsPayment = isMemberDueForPayment(member, currentMonth, currentYear);

                    if (needsPayment) {
                        let hasPaidThisMonth = false;

                        // Check if member has paid for current month
                        if (paymentsData && paymentsData.length > 0) {
                            for (let j = 0; j < paymentsData.length; j++) {
                                const payment = paymentsData[j];
                                if (payment.member_id !== member.member_id) continue;
                                if (!payment.payment_date) continue;

                                try {
                                    const paymentDate = new Date(payment.payment_date);
                                    const paymentMonth = paymentDate.getMonth() + 1;
                                    const paymentYear = paymentDate.getFullYear();

                                    if (paymentMonth === currentMonth && paymentYear === currentYear) {
                                        hasPaidThisMonth = true;
                                        break;
                                    }
                                } catch (error) {
                                    continue;
                                }
                            }
                        }

                        if (!hasPaidThisMonth) {
                            const expectedAmount = calculateExpectedAmount(member.plan);
                            monthlyPendingAmount += expectedAmount;
                            monthlyPendingCount++;
                        }
                    }
                }
            }
        }

        const totalPendingAmount = admissionPendingAmount + monthlyPendingAmount;
        const totalPendingMembersCount = admissionPendingCount + monthlyPendingCount;

        console.log("📈 Final Statistics:", {
            totalMembers: membersData ? membersData.length : 0,
            activeMembers,
            totalReceivedAmount,
            monthlyReceivedAmount,
            totalPendingAmount,
            admissionPendingAmount,
            monthlyPendingAmount,
            admissionPendingCount,
            monthlyPendingCount
        });

        setStats({
            totalMembers: membersData ? membersData.length : 0,
            activeMembers: activeMembers,
            totalReceivedAmount: totalReceivedAmount,
            pendingAmount: totalPendingAmount,
            monthlyReceivedAmount: monthlyReceivedAmount,
            pendingMembersCount: totalPendingMembersCount,
            admissionPendingAmount: admissionPendingAmount,
            monthlyPendingAmount: monthlyPendingAmount,
            admissionPendingCount: admissionPendingCount,
            monthlyPendingCount: monthlyPendingCount
        });
    }, []);
    const isMemberDueForPayment = useCallback((member, currentMonth, currentYear) => {
        if (!member.end_date) {
            return false;
        }

        try {
            const endDate = new Date(member.end_date);
            const endMonth = endDate.getMonth() + 1;
            const endYear = endDate.getFullYear();

            // Member needs payment if their membership ends this month or has already ended
            return (endMonth === currentMonth && endYear === currentYear) || endDate < new Date();
        } catch (error) {
            return false;
        }
    }, []);

    const calculateExpectedAmount = useCallback((plan) => {
        const planAmounts = {
            "1 Month": 600,
            "2 Months": 1200,
            "3 Months": 1800,
            "3+2 Months": 2999,
            "6+3 Months": 3999,
            "9+3 Months": 5499,
        };

        return planAmounts[plan] || 600; // Default to 1 month amount if plan not found
    }, []);
    const loadData = useCallback(async () => {
        setRefreshing(true);

        try {
            console.log("Loading data in HomeScreen...");
            const membersResult = getAllMembers();
            const paymentsResult = getAllPayments();

            if (membersResult.success) {
                setMembers(membersResult.data);
                if (paymentsResult.success) {
                    setPayments(paymentsResult.data);
                    calculateStatistics(paymentsResult.data, membersResult.data);
                } else {
                    calculateStatistics([], membersResult.data);
                }
            } else {
                // Reset stats
                setStats({
                    totalMembers: 0,
                    activeMembers: 0,
                    totalReceivedAmount: 0,
                    pendingAmount: 0,
                    monthlyReceivedAmount: 0,
                    pendingMembersCount: 0,
                    admissionPendingAmount: 0,
                    monthlyPendingAmount: 0,
                    admissionPendingCount: 0,
                    monthlyPendingCount: 0
                });
            }
        } catch (error) {
            console.log("Error loading data:", error);
            // Reset stats on error
            setStats({
                totalMembers: 0,
                activeMembers: 0,
                totalReceivedAmount: 0,
                pendingAmount: 0,
                monthlyReceivedAmount: 0,
                pendingMembersCount: 0,
                admissionPendingAmount: 0,
                monthlyPendingAmount: 0,
                admissionPendingCount: 0,
                monthlyPendingCount: 0
            });
        } finally {
            setTimeout(() => {
                setRefreshing(false);
            }, 500);
        }
    }, [calculateStatistics]);
    // Optimized focus effect
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // Route params effect
    useEffect(() => {
        if (route.params?.refresh) {
            loadData();
            navigation.setParams({ refresh: false });
        }
    }, [route.params?.refresh, loadData, navigation]);

    const onRefresh = useCallback(() => {
        loadData();
    }, [loadData]);

    const handleMembersNavigation = useCallback(() => {
        navigation.navigate("MembersScreen");
    }, [navigation]);

    const handlePaymentNavigation = useCallback(() => {
        navigation.navigate("PaymentDetails");
    }, [navigation]);

    // Memoized formatted values
    const formattedStats = useMemo(() => ({
        monthlyReceived: `₹${stats.monthlyReceivedAmount.toLocaleString('en-IN')}`,
        pending: `₹${stats.pendingAmount.toLocaleString('en-IN')}`,
        total: `₹${stats.totalReceivedAmount.toLocaleString('en-IN')}`,
        admissionPending: `₹${stats.admissionPendingAmount.toLocaleString('en-IN')}`,
        monthlyPending: `₹${stats.monthlyPendingAmount.toLocaleString('en-IN')}`
    }), [
        stats.monthlyReceivedAmount,
        stats.pendingAmount,
        stats.totalReceivedAmount,
        stats.admissionPendingAmount,
        stats.monthlyPendingAmount
    ]);

    const currentMonthName = useMemo(() => {
        return new Date().toLocaleString('default', { month: 'long' });
    }, []);

    return (
        <SafeAreaProvider>
            <LinearGradient
                colors={['#000000', '#D4A600', '#F7D200']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#D4A600']}
                                tintColor="#D4A600"
                            />
                        }
                    >
                        {/* Header Section */}
                        <View style={styles.header}>
                            <Image
                                style={styles.logo}
                                source={require("../assets/Workout/starkfitness.png")}
                            />
                            <Text style={styles.tagline}>Fitness & Strength</Text>

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{stats.totalMembers}</Text>
                                    <Text style={styles.statLabel}>Members</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{stats.activeMembers}</Text>
                                    <Text style={styles.statLabel}>Active</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>
                                        {stats.totalMembers - stats.activeMembers}
                                    </Text>
                                    <Text style={styles.statLabel}>Expired</Text>
                                </View>
                            </View>
                        </View>

                        {/* Main Content */}
                        <View style={styles.mainContent}>
                            {/* Workout Section */}
                            <TouchableOpacity
                                style={styles.section}
                                onPress={() => navigation.navigate("WorkOutScreen")}
                            >
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>💪 Workout</Text>
                                    <View style={styles.detailsButton}>
                                        <Text style={styles.detailsText}>Details →</Text>
                                    </View>
                                </View>
                                <View style={styles.sectionContent}>
                                    <Text style={styles.sectionDescription}>
                                        Manage workout plans, exercises, and training programs
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Members Section */}
                            <TouchableOpacity
                                style={styles.section}
                                onPress={handleMembersNavigation}
                            >
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>👥 Members</Text>
                                    <View style={styles.detailsButton}>
                                        <Text style={styles.detailsText}>Details →</Text>
                                    </View>
                                </View>
                                <View style={styles.sectionContent}>
                                    <Text style={styles.sectionDescription}>
                                        Manage member database, profiles, and membership plans
                                    </Text>
                                    <View style={styles.memberStats}>
                                        <Text style={styles.memberStatText}>
                                            📊 {stats.activeMembers} active • {stats.totalMembers - stats.activeMembers} expired
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Payment Section */}
                            <TouchableOpacity
                                style={styles.section}
                                onPress={handlePaymentNavigation}
                            >
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>💲 Payments</Text>
                                    <View style={styles.detailsButton}>
                                        <Text style={styles.detailsText}>Details →</Text>
                                    </View>
                                </View>
                                <View style={styles.sectionContent}>
                                    <Text style={styles.sectionDescription}>
                                        Manage member fees, pending payments and revenue tracking
                                    </Text>
                                    <View style={styles.paymentStats}>
                                        <Text style={styles.paymentStatText}>
                                            ✅ {formattedStats.monthlyReceived} received this month
                                        </Text>
                                        <Text style={styles.paymentStatText}>
                                            ⏳ {formattedStats.pending} pending from {stats.pendingMembersCount || 0} members
                                        </Text>
                                        <Text style={styles.paymentStatText}>
                                            💰 {formattedStats.total} total received
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Financial Overview */}
                            <View style={styles.financialSection}>
                                <Text style={styles.financialTitle}>💰 Financial Overview - {currentMonthName}</Text>

                                <View style={styles.financialStats}>
                                    <View style={[styles.financialItem, styles.receivedItem]}>
                                        <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                                        <View style={styles.financialTextContainer}>
                                            <Text style={styles.financialLabel}>Received This Month</Text>
                                            <Text style={styles.financialAmount}>
                                                {formattedStats.monthlyReceived}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.financialItem, styles.admissionPendingItem]}>
                                        <Icon name="person-outline" size={24} color="#FF6B6B" />
                                        <View style={styles.financialTextContainer}>
                                            <Text style={styles.financialLabel}>Admission Fee Pending</Text>
                                            <Text style={styles.financialAmount}>
                                                {formattedStats.admissionPending}
                                            </Text>
                                            <Text style={styles.financialSubtext}>
                                                {stats.admissionPendingCount} members
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.financialItem, styles.monthlyPendingItem]}>
                                        <Icon name="calendar-outline" size={24} color="#FFA500" />
                                        <View style={styles.financialTextContainer}>
                                            <Text style={styles.financialLabel}>Monthly Renewal Pending</Text>
                                            <Text style={styles.financialAmount}>
                                                {formattedStats.monthlyPending}
                                            </Text>
                                            <Text style={styles.financialSubtext}>
                                                {stats.monthlyPendingCount} members
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.financialItem, styles.totalPendingItem]}>
                                        <Icon name="time-outline" size={24} color="#FF4444" />
                                        <View style={styles.financialTextContainer}>
                                            <Text style={styles.financialLabel}>Total Pending</Text>
                                            <Text style={styles.financialAmount}>
                                                {formattedStats.pending}
                                            </Text>
                                            <Text style={styles.financialSubtext}>
                                                {stats.pendingMembersCount} total members
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.financialItem, styles.totalItem]}>
                                        <Icon name="cash-outline" size={24} color="#2196F3" />
                                        <View style={styles.financialTextContainer}>
                                            <Text style={styles.financialLabel}>Total Received</Text>
                                            <Text style={styles.financialAmount}>
                                                {formattedStats.total}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.fabAdd}
                            onPress={() => navigation.navigate("NewMemberScreen")}
                        >
                            <Icon name="person-add-outline" size={20} color={"white"} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomSpace} />
                </SafeAreaView>
            </LinearGradient>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    header: {
        alignItems: "center",
        paddingVertical: 16,
    },
    logo: {
        height: 100,
        width: 100,
        borderRadius: 10,
        marginBottom: 12,
    },
    tagline: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "300",
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: '100%',
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 15,
        padding: 12,
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "500",
    },
    financialSection: {
        backgroundColor: "rgba(46, 46, 46, 0.79)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    financialTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
        marginBottom: 12,
        textAlign: "center",
    },
    financialStats: {
        gap: 10,
    },
    financialItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
    },
    receivedItem: {
        borderLeftWidth: 4,
        borderLeftColor: "#4CAF50",
    },
    admissionPendingItem: {
        borderLeftWidth: 4,
        borderLeftColor: "#FF6B6B",
    },
    monthlyPendingItem: {
        borderLeftWidth: 4,
        borderLeftColor: "#FFA500",
    },
    totalPendingItem: {
        borderLeftWidth: 4,
        borderLeftColor: "#FF4444",
    },
    totalItem: {
        borderLeftWidth: 4,
        borderLeftColor: "#2196F3",
    },
    financialTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    financialLabel: {
        fontSize: 14,
        color: "#333",
        fontWeight: "600",
        marginBottom: 2,
    },
    financialAmount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a1a1a",
    },
    financialSubtext: {
        fontSize: 11,
        color: "#666",
        marginTop: 2,
    },
    mainContent: {
        gap: 16,
    },
    section: {
        backgroundColor: "rgba(46, 46, 46, 0.79)",
        borderRadius: 12,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    detailsButton: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    detailsText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    sectionDescription: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
        lineHeight: 20,
    },
    memberStats: {
        marginTop: 8,
    },
    memberStatText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "500",
    },
    paymentStats: {
        marginTop: 8,
    },
    paymentStatText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "500",
        marginBottom: 2,
    },
    quickActions: {
        position: "absolute",
        bottom: 20,
        right: 20,
    },
    fabAdd: {
        borderRadius: 25,
        padding: 16,
        backgroundColor: "rgba(215, 177, 6, 0.9)",
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    bottomSpace: {
        height: 60,
    },
});