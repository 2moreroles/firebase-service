import admin from "firebase-admin";

class DateUtils {
  public static formatTimestamp(
    timestamp: admin.firestore.Timestamp | Date
  ): string {
    const date =
      timestamp instanceof admin.firestore.Timestamp
        ? timestamp.toDate() // Convert Firestore Timestamp to Date
        : timestamp; // If it's already a Date, use it directly

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}

export default DateUtils;
