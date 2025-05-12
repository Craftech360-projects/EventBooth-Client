import apiService from "../services/apiService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { saveAs } from "file-saver";
import CryptoJS from "crypto-js";

// This secret key should be stored in environment variables in production
const JWT_SECRET_KEY = "photobooth_license_secret_key_2025";

// Generate a unique security key
export const generateSecurityKey = () => {
  return (
    "sk_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Improved browser-compatible JWT implementation with proper signature
const createJWT = (payload, secret) => {
  try {
    // Create a base64 encoded header (using base64url encoding)
    const header = {
      alg: "HS256",
      typ: "JWT",
    };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));

    // Create a base64 encoded payload (using base64url encoding)
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    // Create the data to be signed
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    // Create signature using HMAC SHA256
    const signature = CryptoJS.HmacSHA256(dataToSign, secret).toString(
      CryptoJS.enc.Base64
    );
    const encodedSignature = base64UrlSafe(signature);

    // Combine all parts to form the complete JWT
    return `${dataToSign}.${encodedSignature}`;
  } catch (error) {
    console.error("Error creating JWT:", error);
    throw new Error("Failed to create license certificate: " + error.message);
  }
};

// Helper function for base64url encoding (RFC 4648)
const base64UrlEncode = (str) => {
  try {
    // First convert the string to regular base64
    let base64 = btoa(unescape(encodeURIComponent(str)));
    // Then make it URL safe by replacing characters
    return base64UrlSafe(base64);
  } catch (error) {
    console.error("Error in base64UrlEncode:", error);
    throw new Error("Encoding error: " + error.message);
  }
};

// Make base64 string URL safe
const base64UrlSafe = (base64) => {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Generate a license certificate for a service
export const generateLicenseCertificate = async (
  userId,
  requestId,
  serviceId,
  deviceId,
  startDateTime,
  endDateTime
) => {
  try {
    if (!userId || !requestId || !serviceId || !deviceId) {
      throw new Error("Missing required parameters for license generation");
    }

    // Generate a security key
    const securityKey = generateSecurityKey();

    // Enhanced date handling
    let startDate, endDate;

    // Handle Firebase Timestamp objects
    if (startDateTime && typeof startDateTime.toDate === "function") {
      startDate = startDateTime.toDate();
    } else if (startDateTime instanceof Date) {
      startDate = startDateTime;
    } else if (typeof startDateTime === "string") {
      startDate = new Date(startDateTime);
    } else {
      throw new Error("Invalid start date format");
    }

    if (endDateTime && typeof endDateTime.toDate === "function") {
      endDate = endDateTime.toDate();
    } else if (endDateTime instanceof Date) {
      endDate = endDateTime;
    } else if (typeof endDateTime === "string") {
      endDate = new Date(endDateTime);
    } else {
      throw new Error("Invalid end date format");
    }

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("Invalid date objects:", { startDate, endDate });
      throw new Error("Invalid date format for license generation");
    }

    // Create the payload for the JWT
    const payload = {
      userId,
      requestId,
      serviceId,
      deviceId,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      securityKey,
      issuedAt: new Date().toISOString(),
    };

    // Use our improved browser-compatible JWT implementation
    const certificate = createJWT(payload, JWT_SECRET_KEY);

    // Store the license data in Firebase
    await storeLicenseData(
      userId,
      requestId,
      serviceId,
      securityKey,
      payload.startDateTime,
      payload.endDateTime
    );

    return certificate;
  } catch (error) {
    console.error("Error generating license certificate:", error);
    throw error;
  }
};

// Download certificate as a file
export const downloadCertificate = (certificate, serviceName) => {
  try {
    if (!certificate) {
      throw new Error("Certificate is empty or invalid");
    }

    const blob = new Blob([certificate], { type: "text/plain" });

    // Use service name in the filename if available
    const fileName = serviceName
      ? `photobooth_license_${serviceName
          .replace(/\s+/g, "_")
          .toLowerCase()}.lic`
      : `photobooth_license_${Date.now()}.lic`;

    saveAs(blob, fileName);
  } catch (error) {
    console.error("Error downloading certificate:", error);
    throw error;
  }
};

// Store license data in Firebase
const storeLicenseData = async (
  userId,
  serviceId,
  securityKey,
  startDateTime,
  endDateTime
) => {
  try {
    if (!serviceId) {
      throw new Error("Service ID is required to store license data");
    }

    const serviceRef = doc(db, "serviceRequests", serviceId);
    await updateDoc(serviceRef, {
      licenseIssued: true,
      licenseSecurityKey: securityKey,
      licenseStartDateTime: startDateTime,
      licenseEndDateTime: endDateTime,
      licenseIssuedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error storing license data:", error);
    throw new Error("Failed to store license data: " + error.message);
  }
};
