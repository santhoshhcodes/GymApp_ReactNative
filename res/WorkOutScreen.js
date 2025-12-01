import React, { useState } from "react";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import LinearGradient from 'react-native-linear-gradient';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";


export default function WorkOutScreen() {

    const [expandedWorkout, setExpandedWorkout] = useState(null);

    const workouts = [
        {
            id: 'leg',
            title: 'Leg',
            imageText: 'Leg',
            image: require("../assets/Workout/leg2.jpg"),
            exercises: [
                "Squats – 4 × 12–15",
                "Lunges – 3 × 12 each leg",
                "Leg Press – 4 × 10–12",
                "Calf Raises – 4 × 15–20",
                "Hamstring Curl – 3 × 12"
            ]
        },

        {
            id: 'chest',
            title: 'Chest',
            imageText: 'Chest',
            image: require("../assets/Workout/chest.jpg"),
            exercises: [
                "Push-Ups – 3 × 12–15",
                "Incline Push-Ups – 3 × 10 × 12",
                "Decline Push-Ups – 3 × 10–12",
                "Chest Fly (Dumbbell) – 3 × 12",
                "Bench Press (Gym) – 4 × 8 - 10"
            ]
        },

        {
            id: 'shoulder',
            title: 'Shoulder',
            imageText: 'Shoulder',
            image: require("../assets/Workout/sholder.jpg"),
            exercises: [
                "Shoulder Press – 3 × 10–12",
                "Lateral Raises – 3 × 12 × 15",
                "Front Raises – 3 × 12",
                "Rear Delt Fly – 3 × 15",
                "Pike Push-Ups – 3 × 10 - 12"
            ]
        },

        {
            id: 'abs',
            title: 'Abs',
            imageText: 'ABS',
            image: require("../assets/Workout/abs.jpg"),
            exercises: [
                "Plank – 3 45-60sec",
                "Crunches – 3 × 20",
                "Leg Raise – 3 × 12",
                "Russian Twist – 3 × 20",
                "Mountain Climbers – 3 × 30sec"
            ]
        },

        {
            id: 'arm',
            title: 'Arm',
            imageText: 'Arm',
            image: require("../assets/Workout/arm.webp"),
            exercises: [
                "Bicep Curl – 3 × 12",
                "Hammer Curl – 3 × 12",
                "Concentration Curl – 3 × 10",
                "Tricep Dips – 3 × 12",
                "Tricep Pushdown – 3 × 12",
                "Overhead Tricep Extens – 3 × 12"
            ]
        },

        {
            id: 'cardio',
            title: 'Cardio',
            imageText: 'Cardio',
            image: require("../assets/Workout/cardio.jpg"),
            exercises: [
                "Running / Jogging – 20 min",
                "Jump Rope – 10 min",
                "Cycling – 30 min",
                "Burpees – 3 × 10",
                "HIIT Routine – 15 min"
            ]
        }
    ];

    const handleWorkoutPress = (workoutId) => {
        if (expandedWorkout === workoutId) {
            setExpandedWorkout(null);
        } else {
            setExpandedWorkout(workoutId);
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
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>Workout Plans</Text>
                        <Text style={styles.headerSubtitle}>Transform Your Body</Text>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ alignItems: "center", paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {workouts.map((workout) => {
                            const isExpanded = expandedWorkout === workout.id;

                            return (
                                <TouchableOpacity
                                    key={workout.id}
                                    style={styles.sectionBox}
                                    onPress={() => handleWorkoutPress(workout.id)}
                                >
                                    {isExpanded ? (
                                        <View style={styles.workoutDetails}>
                                            <View style={styles.imageContainer}>
                                                <Image
                                                    source={workout.image}
                                                    style={styles.halfImage}
                                                />
                                            </View>
                                            <View style={styles.detailsContainer}>
                                                <Text style={styles.exerciseTitle}>{workout.title}</Text>
                                                <View style={styles.exerciseList}>
                                                    {workout.exercises.map((exercise, index) => (
                                                        <View key={index} style={styles.exerciseItem}>
                                                            <Text style={styles.exerciseBullet}>•</Text>
                                                            <Text style={styles.exerciseText}>{exercise}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.imageWithTextContainer}>
                                            <Image
                                                source={workout.image}
                                                style={styles.fullImage}
                                            />
                                            <View style={styles.overlay} />
                                            <Text style={styles.imageText}>{workout.imageText}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
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
        padding: 10,
    },
    headerContainer: {
        alignItems: "center",
        marginBottom: 25,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        textAlign: "center",
        color: "white",
        letterSpacing: 1,
        marginBottom: 5,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: "500",
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.8)",
        letterSpacing: 0.5,
    },
    sectionBox: {
        backgroundColor: "white",
        padding: 0,
        marginBottom: 15,
        borderRadius: 15,
        width: "100%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    imageWithTextContainer: {
        width: "100%",
        position: "relative",
    },
    fullImage: {
        width: "100%",
        height: 180,
        resizeMode: "cover",
        borderRadius: 10,
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        borderRadius: 12,
    },
    imageText: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        textAlign: "center",
        textAlignVertical: "center",
        color: "white",
        fontSize: 32,
        fontWeight: "800",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
        letterSpacing: 1,
    },
    workoutDetails: {
        flexDirection: "row",
        width: "100%",
        height: 180,
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    imageContainer: {
        width: "45%",
    },
    halfImage: {
        width: "100%",
        height: 180,
        resizeMode: "cover",
        borderRadius: 12,
    },
    detailsContainer: {
        width: "52%",
        paddingLeft: 5,
        paddingTop: 5,
    },
    exerciseTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 15,
        textAlign: "left",
        color: "#2c3e50",
        borderBottomWidth: 2,
        borderBottomColor: "#c21b18ff",
        paddingBottom: 5,
    },
    exerciseList: {
        marginBottom: 5,
    },
    exerciseItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    exerciseBullet: {
        fontSize: 16,
        color: "#fd1814a2",
        fontWeight: "bold",
        marginRight: 5,
        lineHeight: 12,
    },
    exerciseText: {
        fontSize: 10,
        lineHeight: 10,
        color: "#34495e",
        fontWeight: "500",
        flex: 1,
        paddingRight: 2,
    },
});