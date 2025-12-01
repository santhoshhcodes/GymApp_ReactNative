import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    RefreshControl
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import { getMemberById, updateMember, getAllMembers } from "../services/memberService";
import DatePicker from "react-native-date-picker";
import { Dropdown } from 'react-native-element-dropdown';
import Icon from "react-native-vector-icons/Ionicons";

export default function EditMemberScreen({ route, navigation }) {
    const { memberId } = route.params;

    const [memberID, setMemberID] = useState("");
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [plan, setPlan] = useState("");
    const [amount, setAmount] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);

    const [openStartDate, setOpenStartDate] = useState(false);
    const [openEndDate, setOpenEndDate] = useState(false);

    const memberIDRef = useRef();
    const nameRef = useRef();
    const ageRef = useRef();
    const mobileRef = useRef();
    const addressRef = useRef();

    // Plan options with durations and amounts
    const planOptions = [
        {
            label: "Admission Fee Pending - ₹600",
            value: "Admission Fee Pending",
            duration: 0,
            amount: 600,
            description: "Admission Fee Pending - ₹600"
        },
        {
            label: "1 Month - ₹600",
            value: "1 Month",
            duration: 1,
            amount: 600,
            description: "1 Month Plan - ₹600"
        },
        {
            label: "2 Months - ₹1400",
            value: "2 Months",
            duration: 2,
            amount: 1400,
            description: "2 Months Plan - ₹1400"
        },
        {
            label: "3 Months - ₹1800",
            value: "3 Months",
            duration: 3,
            amount: 1800,
            description: "3 Months Plan - ₹1800"
        },
        {
            label: "3+2 Months - ₹2999",
            value: "3+2 Months",
            duration: 5,
            amount: 2999,
            description: "3+2 Months Offer - ₹2999"
        },
        {
            label: "6+3 Months - ₹3999",
            value: "6+3 Months",
            duration: 9,
            amount: 3999,
            description: "6+3 Months Offer - ₹3999"
        },
        {
            label: "9+3 Months - ₹5499",
            value: "9+3 Months",
            duration: 12,
            amount: 5499,
            description: "9+3 Months Offer - ₹5499"
        },
    ];

    const genderOptions = [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
    ];

    useEffect(() => {
        loadMemberData();
    }, []);

    // Auto-calculate end date when plan or start date changes
    useEffect(() => {
        if (plan && startDate) {
            calculateEndDate();
        }
    }, [plan, startDate]);

    // Refresh data when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadMemberData();
        });

        return unsubscribe;
    }, [navigation]);

    const loadMemberData = () => {
        console.log("Loading member data for ID:", memberId);
        
        // First try to get the specific member
        const result = getMemberById(memberId);
        
        if (result.success && result.member) {
            const member = result.member;
            console.log("Member data loaded:", member);

            setMemberID(member.member_id?.toString() || "");
            setName(member.name || "");
            setAge(member.age?.toString() || "");
            setGender(member.gender || "");
            setMobile(member.mobile || "");
            setAddress(member.address || "");
            setPlan(member.plan || "");
            setAmount(member.amount?.toString() || "");
            setStartDate(member.start_date || "");
            setEndDate(member.end_date || "");
        } else {
            // If specific member not found, try to get from all members
            console.log("Member not found by ID, trying from all members...");
            const allMembersResult = getAllMembers();
            if (allMembersResult.success) {
                const memberFromAll = allMembersResult.data.find(m => m.member_id === memberId);
                if (memberFromAll) {
                    console.log("Member found in all members:", memberFromAll);
                    setMemberID(memberFromAll.member_id?.toString() || "");
                    setName(memberFromAll.name || "");
                    setAge(memberFromAll.age?.toString() || "");
                    setGender(memberFromAll.gender || "");
                    setMobile(memberFromAll.mobile || "");
                    setAddress(memberFromAll.address || "");
                    setPlan(memberFromAll.plan || "");
                    setAmount(memberFromAll.amount?.toString() || "");
                    setStartDate(memberFromAll.start_date || "");
                    setEndDate(memberFromAll.end_date || "");
                } else {
                    Alert.alert("Error", "Member not found");
                    navigation.goBack();
                }
            } else {
                Alert.alert("Error", result.error || "Failed to load member data");
                navigation.goBack();
            }
        }
    };

    const calculateEndDate = () => {
        if (!startDate || !plan) return;

        const selectedPlan = planOptions.find(p => p.value === plan);
        if (!selectedPlan || selectedPlan.duration === 0) {
            setEndDate("");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(start.getMonth() + selectedPlan.duration);
        
        setEndDate(end.toISOString().split("T")[0]);
    };

    const handlePlanChange = (item) => {
        setPlan(item.value);
        setAmount(item.amount.toString());
    };

    const handleStartDateChange = (date) => {
        const dateString = date.toISOString().split("T")[0];
        setStartDate(dateString);
        setOpenStartDate(false);
    };

    const handleUpdate = () => {
        if (!memberID.trim() || !name.trim() || !mobile.trim() || !age.trim() || !gender.trim() || !address.trim() || !plan.trim() || !startDate.trim()) {
            Alert.alert("Error", "Please fill all required fields");
            return;
        }

        if (isNaN(memberID) || parseInt(memberID) <= 0) {
            Alert.alert("Error", "Member ID must be a positive number");
            return;
        }

        if (mobile.length !== 10 || isNaN(mobile)) {
            Alert.alert("Error", "Please enter a valid 10-digit mobile number");
            return;
        }

        // For admission fee pending, end date is not required
        if (plan !== "Admission Fee Pending" && !endDate.trim()) {
            Alert.alert("Error", "Please select a start date to calculate end date");
            return;
        }

        setLoading(true);

        const updatedMemberData = {
            member_id: parseInt(memberID),
            name: name.trim(),
            age: parseInt(age),
            gender: gender.trim(),
            mobile: mobile.trim(),
            address: address.trim(),
            plan: plan.trim(),
            amount: parseInt(amount) || 0,
            start_date: startDate.trim(),
            end_date: endDate.trim(),
            fcm_token: null // Keep existing FCM token or set to null
        };

        console.log("Updating member with data:", updatedMemberData);
        
        const result = updateMember(memberId, updatedMemberData);

        if (result.success) {
            Alert.alert("Success", "Member updated successfully!", [
                {
                    text: "OK",
                    onPress: () => navigation.goBack()
                }
            ]);
        } else {
            Alert.alert("Error", result.error || "Failed to update member");
        }

        setLoading(false);
    };

    const focusNextField = (nextRef) => {
        if (nextRef && nextRef.current) {
            nextRef.current.focus();
        }
    };

    const getPlanDescription = () => {
        const selectedPlan = planOptions.find(p => p.value === plan);
        return selectedPlan ? selectedPlan.description : "";
    };

    const handleRefresh = () => {
        loadMemberData();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar 
                backgroundColor="#000000" 
                barStyle="light-content"
                translucent={false}
            />
            <LinearGradient
                colors={["#000000", "#D4A600", "#F7D200"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradient}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoid}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            refreshControl={
                                <RefreshControl
                                    refreshing={false}
                                    onRefresh={handleRefresh}
                                    colors={["#FF6B35"]}
                                    tintColor="#FF6B35"
                                />
                            }
                        >
                            <View style={styles.header}>
                                <TouchableOpacity 
                                    style={styles.refreshButton}
                                    onPress={handleRefresh}
                                >
                                    <Icon name="refresh" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.title}>Edit Member</Text>
                                <Text style={styles.subtitle}>Update member details</Text>
                            </View>

                            <View style={styles.formContainer}>
                                {/* Member ID */}
                                <TextInput
                                    ref={memberIDRef}
                                    style={styles.input}
                                    placeholder="Member ID *"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    value={memberID}
                                    onChangeText={setMemberID}
                                    returnKeyType="next"
                                    onSubmitEditing={() => focusNextField(nameRef)}
                                    blurOnSubmit={false}
                                />

                                {/* Name */}
                                <TextInput
                                    ref={nameRef}
                                    style={styles.input}
                                    placeholder="Full Name *"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                    returnKeyType="next"
                                    onSubmitEditing={() => focusNextField(ageRef)}
                                    blurOnSubmit={false}
                                />

                                {/* Age */}
                                <TextInput
                                    ref={ageRef}
                                    style={styles.input}
                                    placeholder="Age *"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    value={age}
                                    onChangeText={setAge}
                                    returnKeyType="next"
                                    onSubmitEditing={() => focusNextField(mobileRef)}
                                    blurOnSubmit={false}
                                />

                                {/* Gender Dropdown */}
                                <Dropdown
                                    style={styles.dropdown}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    inputSearchStyle={styles.inputSearchStyle}
                                    data={genderOptions}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Gender *"
                                    value={gender}
                                    onChange={item => setGender(item.value)}
                                    renderLeftIcon={() => (
                                        <Icon name="person-outline" size={20} color="#999" style={styles.dropdownIcon} />
                                    )}
                                />

                                {/* Mobile */}
                                <TextInput
                                    ref={mobileRef}
                                    style={styles.input}
                                    placeholder="Mobile Number *"
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                    value={mobile}
                                    onChangeText={setMobile}
                                    maxLength={10}
                                    returnKeyType="next"
                                    onSubmitEditing={() => focusNextField(addressRef)}
                                    blurOnSubmit={false}
                                />

                                {/* Address */}
                                <TextInput
                                    ref={addressRef}
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Address *"
                                    placeholderTextColor="#999"
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />

                                {/* Plan Dropdown */}
                                <Dropdown
                                    style={styles.dropdown}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    inputSearchStyle={styles.inputSearchStyle}
                                    data={planOptions}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Plan *"
                                    value={plan}
                                    onChange={handlePlanChange}
                                    renderLeftIcon={() => (
                                        <Icon name="calendar-outline" size={20} color="#999" style={styles.dropdownIcon} />
                                    )}
                                />

                                {/* Plan Description */}
                                {plan && (
                                    <View style={styles.planDescription}>
                                        <Text style={styles.planDescriptionText}>
                                            {getPlanDescription()}
                                        </Text>
                                    </View>
                                )}

                                {/* Amount (Auto-filled based on plan) */}
                                <View style={styles.amountContainer}>
                                    <TextInput
                                        style={[styles.input, styles.amountInput]}
                                        placeholder="Amount *"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={setAmount}
                                        editable={true}
                                    />
                                    <Text style={styles.currencySymbol}>₹</Text>
                                </View>

                                {/* Start Date */}
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setOpenStartDate(true)}
                                >
                                    <Icon name="calendar-outline" size={20} color="#999" style={styles.dateIcon} />
                                    <Text style={[styles.dateText, startDate && styles.dateTextFilled]}>
                                        {startDate || "Join Date (YYYY-MM-DD) *"}
                                    </Text>
                                </TouchableOpacity>

                                <DatePicker
                                    modal
                                    open={openStartDate}
                                    date={startDate ? new Date(startDate) : new Date()}
                                    mode="date"
                                    onConfirm={handleStartDateChange}
                                    onCancel={() => setOpenStartDate(false)}
                                />

                                {/* End Date (Auto-calculated) */}
                                <TouchableOpacity
                                    style={[styles.dateInput, (!endDate || plan === "Admission Fee Pending") && styles.dateInputDisabled]}
                                    onPress={() => setOpenEndDate(true)}
                                    disabled={!endDate || plan === "Admission Fee Pending"}
                                >
                                    <Icon name="calendar-outline" size={20} color={endDate ? "#999" : "#ccc"} style={styles.dateIcon} />
                                    <Text style={[styles.dateText, endDate ? styles.dateTextFilled : styles.dateTextDisabled]}>
                                        {plan === "Admission Fee Pending" ? "End Date (Not applicable)" : (endDate || "End Date (Auto-calculated)")}
                                    </Text>
                                </TouchableOpacity>

                                <DatePicker
                                    modal
                                    open={openEndDate}
                                    date={endDate ? new Date(endDate) : new Date()}
                                    mode="date"
                                    onConfirm={(date) => {
                                        setOpenEndDate(false);
                                        setEndDate(date.toISOString().split("T")[0]);
                                    }}
                                    onCancel={() => setOpenEndDate(false)}
                                />

                                {/* Action Buttons */}
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.updateButton, loading && styles.buttonDisabled]}
                                        onPress={handleUpdate}
                                        disabled={loading}
                                    >
                                        <Text style={styles.buttonText}>
                                            {loading ? "Updating..." : "Update Member"}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.bottomSpace} />
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#000000",
    },
    gradient: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    header: {
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 20,
        position: 'relative',
    },
    refreshButton: {
        position: 'absolute',
        right: 20,
        top: 20,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
    formContainer: {
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: "rgba(255,255,255,0.95)",
        fontSize: 16,
        color: "#000",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    amountContainer: {
        position: 'relative',
    },
    amountInput: {
        backgroundColor: "rgba(255,255,255,0.9)",
        borderColor: "#5a64bd",
        paddingLeft: 40,
    },
    currencySymbol: {
        position: 'absolute',
        left: 16,
        top: 16,
        fontSize: 16,
        color: "#000",
        fontWeight: "bold",
    },
    dropdown: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: "rgba(255,255,255,0.95)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    placeholderStyle: {
        fontSize: 16,
        color: "#999",
    },
    selectedTextStyle: {
        fontSize: 16,
        color: "#000",
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
    dropdownIcon: {
        marginRight: 12,
    },
    planDescription: {
        backgroundColor: "rgba(90, 100, 189, 0.1)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#5a64bd",
    },
    planDescriptionText: {
        fontSize: 14,
        color: "#5a64bd",
        fontWeight: "500",
        textAlign: 'center',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: "rgba(255,255,255,0.95)",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: "row",
        alignItems: "center",
    },
    dateInputDisabled: {
        backgroundColor: "rgba(255,255,255,0.7)",
    },
    dateIcon: {
        marginRight: 12,
    },
    dateText: {
        fontSize: 16,
        color: "#999",
        flex: 1,
    },
    dateTextFilled: {
        color: "#000",
    },
    dateTextDisabled: {
        color: "#ccc",
    },
    buttonContainer: {
        marginTop: 10,
    },
    button: {
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    updateButton: {
        backgroundColor: "#5a64bd",
    },
    cancelButton: {
        backgroundColor: "#6c757d",
    },
    buttonDisabled: {
        backgroundColor: "#cccccc",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    bottomSpace: {
        height: 30,
    },
});