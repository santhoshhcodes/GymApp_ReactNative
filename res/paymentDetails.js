import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    ActivityIndicator,
    TextInput
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { getAllMembers, updateMemberEndDate, updateMemberPlan, getMemberById } from "../services/memberService";
import { insertPayment, deletePayment, getAllPayments, getPaymentsByMemberId } from "../services/paymentService";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Dropdown } from 'react-native-element-dropdown';
import Icon from "react-native-vector-icons/Ionicons";



export default function PaymentDetails() {
    const navigation = useNavigation();
    const [members, setMembers] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [selectedPlans, setSelectedPlans] = useState({});
    const [loading, setLoading] = useState(false);
    const [processingMember, setProcessingMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMode, setSearchMode] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [payments, setPayments] = useState([]);
    const [showDeleteOptions, setShowDeleteOptions] = useState({});

    const scrollRef = useRef(null);

    const loadMembers = () => {
        setDataLoaded(false);
        const result = getAllMembers();
        if (result.success) {
            console.log('Loaded members:', result.data);
            setMembers(result.data);
            setDataLoaded(true);
        } else {
            console.log("Failed to fetch members:", result.error);
            Alert.alert("Error", "Failed to load members");
        }
        setRefreshing(false);
    };

    const loadPayments = () => {
        const result = getAllPayments();
        if (result.success) {
            setPayments(result.data);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const checkExpiringMemberships = () => {
        const result = getAllMembers();
        if (result.success) {
            const members = result.data;
            const today = new Date();

            members.forEach(member => {
                if (member.end_date) {
                    const endDate = new Date(member.end_date);
                    const timeDiff = endDate.getTime() - today.getTime();
                    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    // Show alert if expires in 2 days
                    if (daysRemaining === 2) {
                        Alert.alert(
                            'Membership Expiring Soon!',
                            `${member.name}'s membership expires in 2 days`
                        );
                    }

                    // Show alert if expired today
                    if (daysRemaining === 0) {
                        Alert.alert(
                            'Membership Expired Today!',
                            `${member.name}'s membership expires today`
                        );
                    }
                }
            });
        }
    };

    // Call this function when component loads
    useEffect(() => {
        // Check for expiring memberships when screen loads
        checkExpiringMemberships();

        // Check every time members data changes
    }, [members]);

    const Month = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const Years = ['2023', '2024', '2025', '2026', '2027'];

    // Plan options with correct amounts
    const planOptions = [
        { label: "1 Month - ₹600", value: "1 Month", amount: 600, duration: 1 },
        { label: "2 Months - ₹1200", value: "2 Months", amount: 1200, duration: 2 },
        { label: "3 Months - ₹1800", value: "3 Months", amount: 1800, duration: 3 },
        { label: "3+2 Months - ₹2999", value: "3+2 Months", amount: 2999, duration: 5 },
        { label: "6+3 Months - ₹3999", value: "6+3 Months", amount: 3999, duration: 9 },
        { label: "9+3 Months - ₹5499", value: "9+3 Months", amount: 5499, duration: 12 },
    ];

    // Admission fee option
    const admissionOption = [
        { label: "Admission fee - ₹800", value: "admission", amount: 800, duration: 0 }
    ];

    useEffect(() => {
        const currentDate = new Date();
        const currentMonth = Month[currentDate.getMonth()];
        const currentYear = currentDate.getFullYear().toString();

        setSelectedMonth(currentMonth);
        setSelectedYear(currentYear);
        loadMembers();
        loadPayments();
    }, []);

    useEffect(() => {
        if (selectedMonth && scrollRef.current) {
            const monthIndex = Month.indexOf(selectedMonth);
            setTimeout(() => {
                scrollRef.current?.scrollTo({ x: monthIndex * 90, animated: true });
            }, 100);
        }
    }, [selectedMonth]);

    // Filter members based on search and month/year
    useEffect(() => {
        filterMembers();
    }, [searchQuery, selectedMonth, selectedYear, members]);

    const filterMembers = () => {
        if (searchQuery.trim() !== "") {
            // Search mode - show all members matching search query
            setSearchMode(true);
            const query = searchQuery.toLowerCase().trim();

            let filtered = members.filter(item => {
                const name = item.name ? item.name.toString().toLowerCase() : '';
                const memberId = item.member_id ? item.member_id.toString().toLowerCase() : '';
                const mobile = item.mobile ? item.mobile.toString().toLowerCase() : '';
                const plan = item.plan ? item.plan.toString().toLowerCase() : '';

                return (
                    name.includes(query) ||
                    memberId.includes(query) ||
                    mobile.includes(query) ||
                    plan.includes(query)
                );
            });
            setFilteredData(filtered);
        } else {
            // Normal mode - show members due for payment this month
            setSearchMode(false);
            let filtered = members.filter(item => {
                // Show members with admission fee pending OR membership ending this month
                const isDueForPayment = item.plan === "Admission Fee Pending" ||
                    (item.end_date && isEndingThisMonth(item.end_date));

                return isDueForPayment;
            });

            // Sort by status: Admission Fee Pending first, then by days remaining
            filtered.sort((a, b) => {
                // Admission Fee Pending members first
                if (a.plan === "Admission Fee Pending" && b.plan !== "Admission Fee Pending") return -1;
                if (b.plan === "Admission Fee Pending" && a.plan !== "Admission Fee Pending") return 1;

                // Then sort by days remaining (ascending)
                const aDays = getDaysRemainingNumber(a.end_date);
                const bDays = getDaysRemainingNumber(b.end_date);
                return aDays - bDays;
            });

            setFilteredData(filtered);
        }
    };

    // Helper function to get days remaining as number for sorting
    const getDaysRemainingNumber = (endDate) => {
        if (!endDate) return 9999; // No end date goes last

        try {
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            const timeDiff = end.getTime() - today.getTime();
            const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysRemaining;
        } catch (error) {
            return 9999;
        }
    };

    const isEndingThisMonth = (endDate) => {
        try {
            const end = new Date(endDate);
            const endYear = end.getFullYear().toString();
            const endMonth = Month[end.getMonth()];

            return (endYear === selectedYear && endMonth === selectedMonth);
        } catch (error) {
            return false;
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setSearchQuery("");
        setSearchMode(false);
        loadMembers();
        loadPayments();
    };

    const calculateNewEndDate = (currentEndDate, duration) => {
        try {
            // If no current end date, start from today
            let startDate = currentEndDate ? new Date(currentEndDate) : new Date();

            // If current end date is in the past, start from today
            const today = new Date();
            if (startDate < today) {
                startDate = today;
            }

            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + duration);
            return endDate.toISOString().split('T')[0];
        } catch (error) {
            console.error("Error calculating end date:", error);
            // Fallback: add duration to current date
            const fallbackDate = new Date();
            fallbackDate.setMonth(fallbackDate.getMonth() + duration);
            return fallbackDate.toISOString().split('T')[0];
        }
    };
const handlePaid = async (member) => {
    console.log("Processing payment for member:", member.name);
    console.log("Selected plans state:", selectedPlans);

    // Use member_id consistently
    const selectedPlanValue = selectedPlans[member.member_id];

    if (!selectedPlanValue) {
        Alert.alert("Error", "Please select a payment plan");
        return;
    }

    setProcessingMember(member.member_id);
    setLoading(true);

    try {
        let newEndDate;
        let amount;
        let durationText;
        let newPlan = member.plan;
        let startDate = member.end_date || new Date().toISOString().split('T')[0];

        if (selectedPlanValue === "admission") {
            // Handle admission fee payment
            newEndDate = startDate; // Same as start date for admission
            amount = 800;
            durationText = "Admission fee";
            newPlan = "1 Month"; // Upgrade to 1 Month plan after admission fee payment
        } else {
            // Handle regular payment
            const selectedPlan = planOptions.find(p => p.value === selectedPlanValue);
            if (selectedPlan) {
                newEndDate = calculateNewEndDate(startDate, selectedPlan.duration);
                amount = selectedPlan.amount;
                durationText = selectedPlan.label;
                newPlan = selectedPlan.value; // Update to the selected plan
            } else {
                Alert.alert("Error", "Invalid plan selected");
                return;
            }
        }

        // FIX: Use the selected month/year for payment date instead of current date
        const monthIndex = Month.indexOf(selectedMonth);
        const year = parseInt(selectedYear);
        
        // Create payment date based on selected month/year (using 1st day of month)
        const paymentDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];

        console.log(`📅 Payment date set to: ${paymentDate} (Selected: ${selectedMonth} ${selectedYear})`);

        const paymentData = {
            member_id: member.member_id,
            name: member.name,
            plan: newPlan,
            duration: durationText,
            amount: amount,
            payment_date: paymentDate, // This now uses the selected month/year
            start_date: startDate,
            end_date: newEndDate,
            status: "completed"
        };

        console.log("Payment data:", paymentData);

        const paymentResult = insertPayment(paymentData);
        console.log("Payment result:", paymentResult);

        if (paymentResult.success) {
            console.log("Payment successful");

            // Update member plan
            const updatePlanResult = updateMemberPlan(member.member_id, newPlan);
            console.log("Member plan update result:", updatePlanResult);

            if (updatePlanResult.success) {
                // Update end date for all payments
                const updateResult = updateMemberEndDate(member.member_id, newEndDate);
                console.log("Member end date update result:", updateResult);

                Alert.alert(
                    "Payment Successful!",
                    `Payment received for ${member.name}!\n\n` +
                    `Plan: ${durationText}\n` +
                    `Amount: ₹${amount}\n` +
                    `Payment Month: ${selectedMonth} ${selectedYear}\n` +
                    `New End Date: ${newEndDate}`,
                    [{
                        text: "OK",
                        onPress: () => {
                            // Clear selected plan and refresh data
                            setSelectedPlans(prev => {
                                const newPlans = { ...prev };
                                delete newPlans[member.member_id];
                                return newPlans;
                            });
                            loadMembers();
                            loadPayments();
                        }
                    }]
                );

            } else {
                Alert.alert(
                    "Warning ⚠️",
                    "Payment recorded but failed to update member details. Please check member information."
                );
            }
        } else {
            Alert.alert(
                "Payment Failed ❌",
                `Failed to record payment: ${paymentResult.error}\n\nPlease try again.`
            );
        }
    } catch (error) {
        console.error("Payment processing error:", error);
        Alert.alert(
            "Error ❌",
            "Failed to process payment. Please check your connection and try again."
        );
    } finally {
        setLoading(false);
        setProcessingMember(null);
    }
};
    const handlePlanChange = (memberId, planValue) => {
        console.log(`Plan changed for member ${memberId}: ${planValue}`);
        setSelectedPlans(prev => ({
            ...prev,
            [memberId]: planValue
        }));
    };

    // Get dropdown options based on member's plan
    const getPlanOptions = (member) => {
        if (member.plan === "Admission Fee Pending") {
            return admissionOption;
        } else {
            // Show all plan options for existing members
            return planOptions;
        }
    };

    const handleYearSelect = (year) => {
        setSelectedYear(year);
        setShowYearDropdown(false);
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchMode(false);
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return "No end date";

        try {
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            const timeDiff = end.getTime() - today.getTime();
            const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysRemaining < 0) {
                return `Expired ${Math.abs(daysRemaining)} days ago`;
            } else if (daysRemaining === 0) {
                return "Expires today";
            } else {
                return `${daysRemaining} days remaining`;
            }
        } catch (error) {
            return "Invalid date";
        }
    };

    const getStatusColor = (endDate, plan) => {
        if (plan === "Admission Fee Pending") return "#FF4444";
        if (!endDate) return "#ff8400ff";

        try {
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            const timeDiff = end.getTime() - today.getTime();
            const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysRemaining < 0) return "#FF4444";
            if (daysRemaining <= 7) return "#FFA500";
            return "#4CAF50";
        } catch (error) {
            return "#FFA500";
        }
    };

    const getPaymentType = (member) => {
        if (member.plan === "Admission Fee Pending") {
            return "Admission Fee Pending";
        } else {
            return "Membership Renewal";
        }
    };

    const getAmountForSelectedPlan = (memberId) => {
        const selectedPlan = selectedPlans[memberId];
        if (!selectedPlan) return 0;

        if (selectedPlan === "admission") {
            return 800;
        }

        const plan = planOptions.find(p => p.value === selectedPlan);
        return plan ? plan.amount : 0;
    };

    const getNewEndDateForSelectedPlan = (member, selectedPlanValue) => {
        if (selectedPlanValue === "admission") {
            return member.end_date || new Date().toISOString().split('T')[0];
        }

        const selectedPlan = planOptions.find(p => p.value === selectedPlanValue);
        if (selectedPlan) {
            return calculateNewEndDate(member.end_date, selectedPlan.duration);
        }
        return "N/A";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date";
            return date.toISOString().split('T')[0];
        } catch (error) {
            return "Error";
        }
    };

    // Get ALL payments for a member sorted by date (newest first)
    const getMemberPayments = (memberId) => {
        return payments
            .filter(payment => payment.member_id === memberId)
            .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    };

    // Check if this is the first payment (no delete option for first payment)
    const isFirstPayment = (paymentId) => {
        const payment = payments.find(p => p.id === paymentId);
        if (!payment) return false;

        // const memberPayments = getMemberPayments(payment.member_id);
        
        // // If this is the oldest payment (last in sorted array), it's the first payment
        // if (memberPayments.length > 0) {
        //     const oldestPayment = memberPayments[memberPayments.length - 1];
        //     return oldestPayment.id === paymentId;
        // }
        
        // return false;
    };

    // Toggle delete options for a member
    const toggleDeleteOptions = (memberId) => {
        setShowDeleteOptions(prev => ({
            ...prev,
            [memberId]: !prev[memberId]
        }));
    };

    // Handle payment deletion
    const handleDeletePayment = (payment) => {
        // Check if this is the first payment
        if (isFirstPayment(payment.id)) {
            Alert.alert(
                "Cannot Delete",
                "This is the member's first payment. First payments cannot be deleted as they establish the membership record.",
                [{ text: "OK" }]
            );
            return;
        }

        Alert.alert(
            "Delete Payment",
            `Are you sure you want to delete this payment?\n\n` +
            `Member: ${payment.name}\n` +
            `Amount: ₹${payment.amount}\n` +
            `Plan: ${payment.plan}\n` +
            `Date: ${payment.payment_date}`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => confirmDeletePayment(payment)
                }
            ]
        );
    };

    const confirmDeletePayment = async (payment) => {
        try {
            // Get all payments for this member sorted by date (newest first)
            const paymentsResult = getPaymentsByMemberId(payment.member_id);
            
            if (!paymentsResult.success) {
                Alert.alert("Error", "Failed to get payment history");
                return;
            }

            const memberPayments = paymentsResult.data.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
            
            // Find the current payment index
            const currentPaymentIndex = memberPayments.findIndex(p => p.id === payment.id);

            if (currentPaymentIndex === -1) {
                Alert.alert("Error", "Payment not found");
                return;
            }

            let previousPlan = "Admission Fee Pending";
            let previousEndDate = null;

            if (currentPaymentIndex < memberPayments.length - 1) {
                // There's a previous payment, use its data
                const previousPayment = memberPayments[currentPaymentIndex + 1];
                previousPlan = previousPayment.plan;
                previousEndDate = previousPayment.end_date;
                
                console.log("Reverting to previous payment:", previousPayment);
            } else {
                // This is the last payment (but not first), revert to admission pending
                previousPlan = "Admission Fee Pending";
                previousEndDate = null;
                console.log("Reverting to admission pending state");
            }

            // Delete the payment
            const result = deletePayment(payment.id);

            if (result.success) {
                console.log("Payment deleted successfully, now updating member...");
                
                // Revert member to previous state
                const updatePlanResult = updateMemberPlan(payment.member_id, previousPlan);
                console.log("Plan update result:", updatePlanResult);
                
                const updateEndDateResult = updateMemberEndDate(payment.member_id, previousEndDate);
                console.log("End date update result:", updateEndDateResult);

                if (updatePlanResult.success && updateEndDateResult.success) {
                    Alert.alert(
                        "Success",
                        `Payment deleted successfully!\n\nMember reverted to:\nPlan: ${previousPlan}\nEnd Date: ${previousEndDate || 'Not set'}`
                    );

                    // Refresh data
                    loadMembers();
                    loadPayments();
                    setShowDeleteOptions({});
                } else {
                    Alert.alert(
                        "Warning",
                        "Payment deleted but failed to revert member details. Please check member information."
                    );
                }
            } else {
                Alert.alert("Error", result.error || "Failed to delete payment");
            }
        } catch (error) {
            console.error("Delete payment error:", error);
            Alert.alert("Error", "Failed to delete payment");
        }
    };

    return (
        <SafeAreaProvider>
            <LinearGradient
                colors={['#000000', '#D4A600', '#F7D200']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Calendar Header */}
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity
                            style={styles.yearButton}
                            onPress={() => setShowYearDropdown(!showYearDropdown)}
                        >
                            <Text style={styles.yearText}>{selectedYear}</Text>
                            <Icon name="chevron-down" size={16} color="#fff" />
                        </TouchableOpacity>

                        <Modal
                            visible={showYearDropdown}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setShowYearDropdown(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPressOut={() => setShowYearDropdown(false)}
                            >
                                <View style={styles.dropdownContainer}>
                                    <View style={styles.dropdown}>
                                        {Years.map((yr) => (
                                            <TouchableOpacity
                                                key={yr}
                                                style={[
                                                    styles.dropdownItemContainer,
                                                    yr === selectedYear && styles.dropdownItemSelected
                                                ]}
                                                onPress={() => handleYearSelect(yr)}
                                            >
                                                <Text style={[
                                                    styles.dropdownItem,
                                                    yr === selectedYear && styles.dropdownItemTextSelected
                                                ]}>
                                                    {yr}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            ref={scrollRef}
                            style={styles.monthScrollView}
                        >
                            {Month.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.monthBox,
                                        item === selectedMonth && styles.monthBoxSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedMonth(item);
                                        setSearchQuery(""); // Clear search when changing month
                                        setSearchMode(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.monthText,
                                            item === selectedMonth && styles.monthTextSelected
                                        ]}
                                    >
                                        {item.substring(0, 3)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search All Members..."
                                placeholderTextColor="#999"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                                    <Icon name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => navigation.navigate("SendNotificationScreen")}
                        >
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>🔔</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Summary */}
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryText}>
                            {searchMode
                                ? `Found ${filteredData.length} members matching "${searchQuery}"`
                                : `Showing ${filteredData.length} members needing payment in ${selectedMonth} ${selectedYear}`
                            }
                        </Text>
                    </View>

                    {filteredData.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchMode
                                    ? "No members found matching your search"
                                    : "No payments due this month"
                                }
                            </Text>
                            <Text style={styles.emptySubText}>
                                {searchMode
                                    ? "Try a different search term"
                                    : `No members need payment in ${selectedMonth} ${selectedYear}`
                                }
                            </Text>
                            {searchMode && (
                                <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                                    <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={filteredData}
                            keyExtractor={(item) => item.member_id.toString()}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            renderItem={({ item }) => {
                                const memberPayments = getMemberPayments(item.member_id);
                                // const recentPayment = memberPayments.length > 0 ? memberPayments[0] : null;
                                const showDelete = showDeleteOptions[item.member_id];

                                return (
                                    <View style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.memberId}>ID: {item.member_id}</Text>
                                            <View style={styles.headerActions}>
                                                <View style={styles.paymentTypeContainer}>
                                                    <Text style={[
                                                        styles.paymentType,
                                                        item.plan === "Admission Fee Pending" ? styles.admissionPending : styles.membershipRenewal
                                                    ]}>
                                                        {getPaymentType(item)}
                                                    </Text>
                                                </View>
                                                {/* Show manage button only if member has payments and not just first payment */}
                                                {memberPayments.length > 1 && (
                                                    <TouchableOpacity
                                                        style={styles.manageButton}
                                                        onPress={() => toggleDeleteOptions(item.member_id)}
                                                    >
                                                        <Icon name="time-outline" size={16} color="#666" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.cardContent}>
                                            <View style={styles.nameRow}>
                                                <Text style={styles.name}>{item.name}</Text>
                                                <Text style={[
                                                    styles.status,
                                                    { color: getStatusColor(item.end_date, item.plan) }
                                                ]}>
                                                    {getDaysRemaining(item.end_date)}
                                                </Text>
                                            </View>

                                            <View style={styles.detailsRow}>
                                                <Text style={styles.detail}>{item.mobile || "No mobile"}</Text>
                                            </View>

                                            <View style={styles.datesRow}>
                                                <Text style={styles.date}>Join: {formatDate(item.start_date)}  </Text>
                                                <Text style={styles.date}>End: {formatDate(item.end_date)}  </Text>
                                            </View>

                                            {/* Payment History Section */}
                                            {showDelete && memberPayments.length > 0 && (
                                                <View style={styles.paymentHistorySection}>
                                                    <View style={styles.paymentHistoryHeader}>
                                                        <Text style={styles.paymentHistoryTitle}>
                                                            Payment History ({memberPayments.length})
                                                        </Text>
                                                        {showDelete && memberPayments.length > 1 && (
                                                            <Text style={styles.deleteHint}>
                                                                Tap to delete
                                                            </Text>
                                                        )}
                                                    </View>
                                                    
                                                    {memberPayments.map((payment, index) => {
                                                        const isFirstPay = isFirstPayment(payment.id);
                                                        return (
                                                            <View 
                                                                key={payment.id} 
                                                                style={[
                                                                    styles.paymentItem,
                                                                    index === 0 && styles.currentPaymentItem
                                                                ]}
                                                            >
                                                                <View style={styles.paymentInfoRow}>
                                                                    <View style={styles.paymentDetails}>
                                                                        <Text style={styles.paymentDetail}>
                                                                            ₹{payment.amount} - {payment.plan}
                                                                        </Text>
                                                                        <Text style={styles.paymentDate}>
                                                                            {formatDate(payment.end_date)}
                                                                        </Text>
                                                                    </View>
                                                                    {showDelete && !isFirstPay && (
                                                                        <TouchableOpacity
                                                                            style={styles.deletePaymentButton}
                                                                            onPress={() => handleDeletePayment(payment)}
                                                                        >
                                                                            <Icon name="trash-outline" size={16} color="#FF4444" />
                                                                        </TouchableOpacity>
                                                                    )}
                                                                    {showDelete && isFirstPay && (
                                                                        <View style={styles.firstPaymentIndicator}>
                                                                            <Text style={styles.firstPaymentText}>First</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}

                                            {/* Payment Input Section */}
                                            <View style={styles.paymentSection}>
                                                <Dropdown
                                                    style={styles.dropdownMonth}
                                                    placeholderStyle={styles.placeholderStyle}
                                                    selectedTextStyle={styles.selectedTextStyle}
                                                    data={getPlanOptions(item)}
                                                    labelField="label"
                                                    valueField="value"
                                                    placeholder="Select plan *"
                                                    value={selectedPlans[item.member_id]}
                                                    onChange={selectedItem => {
                                                        handlePlanChange(item.member_id, selectedItem.value);
                                                    }}
                                                />

                                                <TouchableOpacity
                                                    style={[
                                                        styles.payButton,
                                                        (!selectedPlans[item.member_id] || loading) && styles.payButtonDisabled
                                                    ]}
                                                    onPress={() => handlePaid(item)}
                                                    disabled={!selectedPlans[item.member_id] || loading}
                                                >
                                                    {processingMember === item.member_id ? (
                                                        <ActivityIndicator size="small" color="#fff" />
                                                    ) : (
                                                        <Text style={styles.payButtonText}>
                                                            {loading ? "Processing..." : "Pay"}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>

                                            {selectedPlans[item.member_id] && (
                                                <View style={styles.paymentInfo}>
                                                    <Text style={styles.paymentText}>
                                                        Selected: {getPlanOptions(item).find(p => p.value === selectedPlans[item.member_id])?.label || "—"}
                                                    </Text>
                                                    <Text style={styles.paymentText}>
                                                        Amount: ₹{getAmountForSelectedPlan(item.member_id)}
                                                    </Text>
                                                    <Text style={styles.paymentText}>
                                                        New End Date: {getNewEndDateForSelectedPlan(item, selectedPlans[item.member_id])}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            }}
                        />
                    )}
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
        paddingTop: 20,
        paddingHorizontal: 10,
    },
    section: {
        backgroundColor: "rgba(255, 255, 255, 0.99)",
        borderRadius: 12,
        padding: 10,
        width: "15%",
        marginLeft: 10,
    },
    sectionHeader: {
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 15,
    },
    searchContainer: {
        flexDirection: "row",
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 45,
        width: "80%",
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#000",
    },
    clearButton: {
        padding: 4,
    },
    clearSearchButton: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 10,
    },
    clearSearchButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginBottom: 12,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#404040',
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    manageButton: {
        padding: 4,
    },
    cardContent: {
        padding: 10,
        paddingTop: 8,
    },
    nameRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    datesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
        marginTop: 5
    },
    paymentSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: "700",
        color: "#000000ff",
        flex: 1,
    },
    memberId: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1d2e53ff",
        backgroundColor: "rgba(139, 157, 195, 0.6)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    detail: {
        fontSize: 14,
        color: "#575757ff",
    },
    date: {
        fontSize: 10,
        color: "#575757ff",
    },
    status: {
        fontSize: 13,
        fontWeight: "700",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    paymentTypeContainer: {
        marginLeft: 8,
    },
    paymentType: {
        fontSize: 12,
        fontWeight: "600",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    admissionPending: {
        backgroundColor: "rgba(255, 147, 108, 0.65)",
        color: "#ff0000ff",
    },
    membershipRenewal: {
        backgroundColor: "rgba(250, 229, 109, 0.29)",
        color: "#ff8c00ff",
    },
    // Payment History Styles
    paymentHistorySection: {
        marginBottom: 10,
        padding: 12,
        backgroundColor: "rgba(245, 245, 245, 0.8)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    paymentHistoryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    paymentHistoryTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    deleteHint: {
        fontSize: 10,
        color: "#FF4444",
        fontStyle: "italic",
    },
    paymentItem: {
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    currentPaymentItem: {
        backgroundColor: "rgba(175, 91, 76, 0.1)",
        borderRadius: 4,
        paddingHorizontal: 8,
        marginHorizontal: -8,
    },
    paymentInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    paymentDetails: {
        flex: 1,
    },
    paymentDetail: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
    paymentDate: {
        fontSize: 10,
        color: "#888",
        marginTop: 2,
    },
    deletePaymentButton: {
        padding: 6,
        marginLeft: 8,
    },
    firstPaymentIndicator: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: "rgba(255, 193, 7, 0.2)",
        borderRadius: 4,
        marginLeft: 8,
    },
    firstPaymentText: {
        fontSize: 10,
        color: "#FF9800",
        fontWeight: "600",
    },
    dropdownMonth: {
        borderWidth: 1,
        borderColor: "#555",
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#000000ff',
        flex: 1,
    },
    payButton: {
        backgroundColor: "#FF6B35",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonDisabled: {
        backgroundColor: "#666",
    },
    payButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    calendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E1E1E",
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    yearButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 8,
        paddingHorizontal: 15,
        height: 40,
        minWidth: 80,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        marginRight: 12,
        flexDirection: 'row',
        gap: 8,
    },
    yearText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    monthScrollView: {
        flex: 1,
    },
    monthBox: {
        marginRight: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#333333",
        borderRadius: 10,
        minWidth: 70,
        alignItems: "center",
        borderWidth: 1,
        borderColor: '#444',
    },
    monthBoxSelected: {
        backgroundColor: "#FF6B35",
        borderColor: "#FF6B35",
    },
    monthText: {
        color: "#CCCCCC",
        fontSize: 14,
        fontWeight: "600",
    },
    monthTextSelected: {
        color: "white",
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingTop: 100,
        paddingLeft: 10,
    },
    dropdownContainer: {
        width: 100,
    },
    dropdown: {
        backgroundColor: "#2A2A2A",
        borderRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#444',
        overflow: 'hidden',
    },
    dropdownItemContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        alignItems: 'center',
    },
    dropdownItemSelected: {
        backgroundColor: "#FF6B35",
    },
    dropdownItem: {
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "500",
    },
    dropdownItemTextSelected: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    placeholderStyle: {
        fontSize: 14,
        color: "#999",
    },
    selectedTextStyle: {
        fontSize: 14,
        color: "#c0bfbfff",
        fontWeight: "600",
    },
    paymentInfo: {
        marginTop: 12,
        padding: 12,
        backgroundColor: "rgba(255, 87, 26, 0.62)",
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: "#FF6B35",
    },
    paymentText: {
        color: "#FFFFFF",
        fontSize: 14,
        marginBottom: 4,
        fontWeight: "500",
    },
    summaryContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        marginTop: 10,
        alignItems: "center",
    },
    summaryText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "500",
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 18,
        color: "#CCCCCC",
        marginBottom: 8,
        fontWeight: "600",
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: "#999999",
        textAlign: "center",
    },
});