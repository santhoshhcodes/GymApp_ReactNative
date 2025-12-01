import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  StatusBar
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";
import { initDatabase } from "../database/table";
import { useNavigation } from "@react-navigation/native";
import { insertMember } from "../services/memberService";
import DatePicker from "react-native-date-picker";
import { Dropdown } from 'react-native-element-dropdown';
import Icon from "react-native-vector-icons/Ionicons";
import { insertPayment } from "../services/paymentService";

export default function NewMemberScreen() {
  const navigation = useNavigation();
  const [memberId, setMemberId] = useState("");
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

  const memberIdRef = useRef();
  const nameRef = useRef();
  const ageRef = useRef();
  const mobileRef = useRef();
  const addressRef = useRef();

  // Plan options with durations and amounts based on your image
  const planOptions = [
    {
      label: "Admission Fee Pending - ₹600",
      value: "Admission Fee Pending",
      duration: 1,
      amount: 600,
      description: "Admission Fee Pending"
    },
    {
      label: "1 month- ₹600 + ₹800",
      value: "1 Month",
      duration: 1,
      amount: 1400,
      description: "Admission Fee"
    },
    {
      label: "2 Month - ₹1200 + ₹800",
      value: "2 Month",
      duration: 2,
      amount: 2000,
      description: "2 Month Plan"
    },
    {
      label: "3 Month - ₹1800 + ₹800",
      value: "3 Month",
      duration: 3,
      amount: 2600,
      description: "3 Month Plan"
    },
    {
      label: "3 + 2 Months - ₹2999 + ₹800",
      value: "3 Months + 2 Months",
      duration: 5,
      amount: 2999,
      description: "3 + 2 Months Offer"
    },
    {
      label: "6 + 3 Months - ₹3999 + ₹800",
      value: "6 Months + 3 Months",
      duration: 9,
      amount: 4799,
      description: "6 + 3 Months Offer"
    },
    {
      label: "9 + 3 Months - ₹5499 + ₹800",
      value: "9 Months + 3 Months",
      duration: 12,
      amount: 6299,
      description: "9 + 3 Months Offer"
    },
  ];

  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ];

  useEffect(() => {
    const result = initDatabase();
    if (result.success) {
      console.log('Database ready');
    } else {
      console.log("Error Database setup failed");
    }
  }, []);

  // Auto-calculate end date when plan or start date changes
  useEffect(() => {
    if (plan && startDate) {
      calculateEndDate();
    }
  }, [plan, startDate]);

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


  const handleSubmit = async () => {
    if (!memberId.trim() || !name.trim() || !mobile.trim() || !age.trim() || !gender.trim() || !address.trim() || !plan.trim() || !startDate.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (isNaN(memberId) || parseInt(memberId) <= 0) {
      Alert.alert("Error", "Member ID must be a positive number");
      return;
    }

    if (mobile.length !== 10 || isNaN(mobile)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

  const newMember = {
    member_id: parseInt(memberId),
    name: name.trim(),
    age: parseInt(age),
    gender: gender.trim(),
    mobile: mobile.trim(),
    address: address.trim(),
    plan: plan.trim(),
    amount: parseInt(amount) || 0,
    start_date: startDate.trim(),
    end_date: endDate.trim(),
  };

  try {
    const result = await insertMember(newMember);

    if (result.success) {
      // Also create payment record
      const paymentData = {
        member_id: parseInt(memberId),
        name: name.trim(),
        plan: plan.trim(),
        duration: plan.trim(),
        amount: parseInt(amount) || 0,
        payment_date: startDate.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        status: "completed"
      };

      const paymentResult = insertPayment(paymentData);

    
      Alert.alert("Success", `Member "${name}" saved with Member ID: ${memberId}!`, [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("HomeScreen", { refresh: true });
          }
        }
      ]);
      
    
      clearForm();
    } else {
      Alert.alert("Error", result.error || "Failed to save member");
    }
  } catch (error) {
    Alert.alert("Error", "Failed to save member: " + error.message);
  } finally {
    setLoading(false);
  }
};

  const clearForm = () => {
    setMemberId("");
    setName("");
    setAge("");
    setGender("");
    setMobile("");
    setAddress("");
    setPlan("");
    setAmount("");
    setStartDate("");
    setEndDate("");
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
            >
              <View style={styles.header}>
                <Text style={styles.title}>Add New Member</Text>
                <Text style={styles.subtitle}>Fill in the member details below</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Member ID */}
                <TextInput
                  ref={memberIdRef}
                  style={styles.input}
                  placeholder="Member ID *"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={memberId}
                  onChangeText={setMemberId}
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
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="next"
                  blurOnSubmit={false}
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
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="Amount *"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={true}
                />

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
                  style={[styles.dateInput, !endDate && styles.dateInputDisabled]}
                  onPress={() => setOpenEndDate(true)}
                  disabled={!endDate}
                >
                  <Icon name="calendar-outline" size={20} color={endDate ? "#999" : "#ccc"} style={styles.dateIcon} />
                  <Text style={[styles.dateText, endDate ? styles.dateTextFilled : styles.dateTextDisabled]}>
                    {endDate || "End Date (Auto-calculated)"}
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

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Saving..." : "Save Member"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.clearButton]}
                    onPress={clearForm}
                  >
                    <Text style={styles.buttonText}>Clear Form</Text>
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
    height: 100,
    textAlignVertical: 'top',
  },
  amountInput: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderColor: "#5a64bd",
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
  saveButton: {
    backgroundColor: "#5a64bd",
  },
  clearButton: {
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