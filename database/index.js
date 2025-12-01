import { QuickSQLite } from "react-native-quick-sqlite";

const DB_NAME = "StarkMembers.db";


export const openDB = () => {
  try {
    QuickSQLite.open(DB_NAME); 
    console.log("Database opened successfully");
  } catch (e) {
    console.log(" DB open error:", e);
  }
};

export const execute = (query, params = []) => {
  try {
    const result = QuickSQLite.execute(DB_NAME, query, params);
    console.log("Query executed successfully");
    return result;
  } catch (e) {
    console.log("SQL error:", e);
    return { error: e };
  }
};