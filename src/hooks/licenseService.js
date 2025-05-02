import apiService from "../services/apiService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// This secret key should be stored in environment variables in production
const JWT_SECRET_KEY = "photobooth_license_secret_key_2024";

// Generate a unique security key
export const generateSecurityKey = () => {
  return (
    "sk_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Generate a license certificate
export const generateLicenseCertificate = async (
  userId,
  eventId,
  expirationDate
) => {
  try {
    const response = await apiService.licenses.generate(
      eventId,
      expirationDate
    );

    // Store the license data in Firebase
    await storeLicenseData(
      userId,
      eventId,
      response.data.securityKey,
      expirationDate
    );

    return response.data.certificate;
  } catch (error) {
    console.error("Error generating license certificate:", error);
    throw error;
  }
};

// Store license data in Firebase
const storeLicenseData = async (
  userId,
  eventId,
  securityKey,
  expirationDate
) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      licenseIssued: true,
      licenseSecurityKey: securityKey,
      licenseExpirationDate: expirationDate,
      licenseIssuedAt: new Date(),
    });
  } catch (error) {
    console.error("Error storing license data:", error);
  }
};

// Download certificate as a file
export const downloadCertificate = (certificate, eventName) => {
  const element = document.createElement("a");
  const file = new Blob([certificate], { type: "text/plain" });
  element.href = URL.createObjectURL(file);

  // Use event name in the filename if available
  const fileName = eventName
    ? `photobooth_license_${eventName.replace(/\s+/g, "_").toLowerCase()}.lic`
    : `photobooth_license_${Date.now()}.lic`;

  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
