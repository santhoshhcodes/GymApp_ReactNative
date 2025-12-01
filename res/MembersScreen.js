import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    StatusBar,
    ActivityIndicator,
    TextInput
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { getAllMembers, deleteMemberById, deleteAllMembers } from "../services/memberService";
import Icon from "react-native-vector-icons/Ionicons";

export default function MemberListScreen({ navigation }) {
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const loadMembers = useCallback(() => {
        console.log("Loading members in MemberListScreen...");
        const result = getAllMembers();

        if (result.success) {
            setMembers(result.data);
            setFilteredMembers(result.data);
        } else {
            Alert.alert("Error", "Failed to load members: " + result.error);
        }
        setRefreshing(false);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Optimized search with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim() === "") {
                setFilteredMembers(members);
            } else {
                const query = searchQuery.toLowerCase().trim();
                const filtered = members.filter(member => {
                    const name = member.name ? member.name.toString().toLowerCase() : '';
                    const memberId = member.member_id ? member.member_id.toString().toLowerCase() : '';
                    const mobile = member.mobile ? member.mobile.toString().toLowerCase() : '';
                    const plan = member.plan ? member.plan.toString().toLowerCase() : '';

                    return (
                        name.includes(query) ||
                        memberId.includes(query) ||
                        mobile.includes(query) ||
                        plan.includes(query)
                    );
                });
                setFilteredMembers(filtered);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, members]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setSearchQuery("");
        loadMembers();
    }, [loadMembers]);

    const handleDeleteMember = useCallback((memberId, memberName) => {
        Alert.alert(
            "Delete Member",
            `Are you sure you want to delete ${memberName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => confirmDeleteMember(memberId)
                }
            ]
        );
    }, []);

    const confirmDeleteMember = useCallback((memberId) => {
        const result = deleteMemberById(memberId);

        if (result.success) {
            Alert.alert("Success", "Member deleted successfully");
            loadMembers();
        } else {
            Alert.alert("Error", "Failed to delete member: " + result.error);
        }
    }, [loadMembers]);

    const handleDeleteAllMembers = useCallback(() => {
        if (members.length === 0) {
            Alert.alert("Info", "No members to delete");
            return;
        }

        Alert.alert(
            "Delete All Members",
            `Are you sure you want to delete all ${members.length} members? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: () => confirmDeleteAllMembers()
                }
            ]
        );
    }, [members.length]);

    const confirmDeleteAllMembers = useCallback(() => {
        const result = deleteAllMembers();
        if (result.success) {
            Alert.alert("Success", "All members have been deleted");
            setMembers([]);
            setFilteredMembers([]);
            setSearchQuery("");
        } else {
            Alert.alert("Error", "Failed to delete all members: " + result.error);
        }
    }, []);

    const handleEditMember = useCallback((member) => {
        navigation.navigate("EditMemberScreen", { memberId: member.id });
    }, [navigation]);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    // Memoized member item renderer
    const renderMemberItem = useCallback(({ item }) => (
        <TouchableOpacity>
            <View style={styles.card}>
                <View style={styles.memberview}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.memberId}>ID: {item.member_id || "N/A"}</Text>
                </View>
            
                <View style={styles.userInfo}>
                    <View style={styles.nameDetails}>
                        <Text style={styles.detail}>{item.mobile}</Text>
                        <Text style={styles.detail}>{item.plan || "Not specified"}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => handleEditMember(item)}
                        >
                            <Icon name="create-outline" size={18} color={"#000"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteMember(item.id, item.name)}
                        >
                            <Icon name="trash-outline" size={18} color={"#000"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
         
            <View style={styles.bottomCard}>
                <View style={styles.datesRow}>
                    <Text style={styles.date}>Start: {item.start_date || "N/A"}</Text>
                    <Text style={styles.date}>End: {item.end_date || "N/A"}</Text>
                </View>
            </View>
        </TouchableOpacity>
    ), [handleEditMember, handleDeleteMember]);

    const keyExtractor = useCallback((item) => item.id.toString(), []);

    if (loading) {
        return (
            <SafeAreaProvider>
                <LinearGradient
                    colors={['#000000', '#D4A600', '#F7D200']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.container}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <StatusBar
                            backgroundColor="#000000"
                            barStyle="light-content"
                            translucent={false}
                        />
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#000000" />
                            <Text style={styles.loadingText}>Loading members...</Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <LinearGradient
                colors={['#000000', '#D4A600', '#F7D200']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar
                        backgroundColor="#000000"
                        barStyle="light-content"
                        translucent={false}
                    />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>All Members ({filteredMembers.length})</Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={handleRefresh}
                                disabled={refreshing}
                            >
                                <Icon name="refresh" size={20} color="#fff" />
                            </TouchableOpacity>
                            {members.length > 0 && (
                                <TouchableOpacity
                                    style={styles.deleteAllButton}
                                    onPress={handleDeleteAllMembers}
                                >
                                    <Icon name="trash-outline" size={22} color={"white"} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name, ID, mobile, or plan..."
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
                    </View>

                    {/* Members List */}
                    <FlatList
                        data={filteredMembers}
                        keyExtractor={keyExtractor}
                        renderItem={renderMemberItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {searchQuery ? "No members found matching your search" : "No members found"}
                                </Text>
                                <Text style={styles.emptySubText}>
                                    {searchQuery ? "Try a different search term" : "Add your first member using the + button below"}
                                </Text>
                                {searchQuery && (
                                    <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                                        <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />

                    {/* Floating Action Button */}
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => navigation.navigate("NewMemberScreen")}
                    >
                        <Icon name="person-add-outline" size={20} color={"white"}/>
                    </TouchableOpacity>
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
    datesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    date: {
        fontSize: 12,
        color: "#ffd000",
        fontWeight: "500",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    userInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    memberview: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#000000",
        fontWeight: "600",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: "rgba(20, 16, 16, 0.9)",
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
    },
    refreshButton: {
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "white",
    },
    deleteAllButton: {
        backgroundColor: "rgba(220, 53, 69, 0.8)",
        padding: 8,
        borderRadius: 8,
    },
    // Search Styles
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "rgba(20, 16, 16, 0.7)",
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 45,
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
    listContent: {
        padding: 20,
        paddingBottom: 80,
    },
    card: {
        padding: 10,
        backgroundColor: "#ffffffe8",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#cec6c6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bottomCard: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: "#727272",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    memberId: {
        fontSize: 12,
        fontWeight: "600",
        color: "#5a64bd",
        marginBottom: 4,
        backgroundColor: "rgba(8, 8, 8, 0.3)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#000000",
    },
    detail: {
        fontSize: 12,
        color: "#000000",
        marginBottom: 2,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    editBtn: {
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#000000',
        alignItems: "center",
        justifyContent: "center",
        minWidth: 40,
    },
    deleteBtn: {
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#000000',
        alignItems: "center",
        justifyContent: "center",
        minWidth: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 18,
        color: "#fff",
        marginBottom: 8,
        fontWeight: "600",
        textAlign: "center",
    },
    emptySubText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
    fab: {
        position: "absolute",
        bottom: 30,
        right: 30,
        height: 60,
        width: 60,
        borderRadius: 30,
        backgroundColor: "rgba(215, 177, 6, 0.9)",
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabText: {
        fontSize: 32,
        color: "#fff",
        fontWeight: "bold",
        marginTop: -2,
    },
});