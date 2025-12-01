import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider } from "react-native-paper";
import { View, Text, ActivityIndicator } from "react-native";
import { initDatabase } from "./database/table";
import { requestUserPermission, setupMessageHandlers } from './res/firebaseNotification';
import { updateMemberToken, getAllMembers } from './services/memberService'

const Stack = createNativeStackNavigator();

import HomeScreen from "./res/HomeScreen";
import NewMemberScreen from "./res/NewMemberScreen";
import WorkOutScreen from "./res/WorkOutScreen"
import MembersScreen from "./res/MembersScreen"
import EditMemberScreen from './res/EditMemberScreen';
import PaymentDetails from './res/paymentDetails';
import SendNotificationScreen from './res/SendNotificationScreen';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log("🚀 Initializing Gym App...");

      // 1. Initialize database first
      const dbResult = initDatabase();
      if (dbResult.success) {
        console.log("✅ Database ready");
        setDbInitialized(true);
      } else {
        console.log("❌ Database issue:", dbResult.error);
        setDbError(dbResult.error);
        setDbInitialized(true);
        return;
      }

    } catch (error) {
      console.log("💥 App init error:", error);
      setDbInitialized(true);
    }
  };

  if (!dbInitialized) {
    return (
      <PaperProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A600" />
          <Text style={styles.loadingText}>🦈Stark Starting...</Text>
          {dbError && (
            <Text style={styles.errorText}>
              Warning: {dbError}
            </Text>
          )}
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HomeScreen"
          screenOptions={{
            headerStyle: { backgroundColor: '#141010ff' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ title: 'STARK FITNESS' }}
          />
          <Stack.Screen
            name="WorkOutScreen"
            component={WorkOutScreen}
            options={{ title: 'Workout Plans' }}
          />
          <Stack.Screen
            name="NewMemberScreen"
            component={NewMemberScreen}
            options={{ title: 'Add New Member' }}
          />
          <Stack.Screen
            name="MembersScreen"
            component={MembersScreen}
            options={{ title: 'All Members' }}
          />
          <Stack.Screen
            name="EditMemberScreen"
            component={EditMemberScreen}
            options={{ title: 'Edit Member' }}
          />
          <Stack.Screen
            name="PaymentDetails"
            component={PaymentDetails}
            options={{ title: 'Payment Details' }}
          />
          <Stack.Screen
            name="SendNotificationScreen"
            component={SendNotificationScreen}
            options={{ title: 'Send Notifications' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
};