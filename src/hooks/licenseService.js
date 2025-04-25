import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// This secret key should be stored in environment variables in production
const JWT_SECRET_KEY = "photobooth_license_secret_key_2024";

// Generate a unique security key
export const generateSecurityKey = () => {
  return 'sk_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Generate a license certificate
export const generateLicenseCertificate = (userId, eventId, expirationDate) => {
  // Create header
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  // Create payload
  const payload = {
    userId: userId,
    eventId: eventId,
    securityKey: generateSecurityKey(),
    exp: Math.floor(expirationDate.getTime() / 1000), // Convert to Unix timestamp
    iat: Math.floor(Date.now() / 1000) // Issued at timestamp
  };
  
  // Base64Url encode the header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  // Create the signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureInput);
  
  // Use crypto.subtle for HMAC SHA-256 signing
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then(key => {
    return crypto.subtle.sign("HMAC", key, data);
  }).then(signature => {
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Combine to form the JWT
    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    
    // Store the license data in Firebase
    storeLicenseData(userId, eventId, payload.securityKey, expirationDate);
    
    return jwt;
  });
};

// Store license data in Firebase
const storeLicenseData = async (userId, eventId, securityKey, expirationDate) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      licenseIssued: true,
      licenseSecurityKey: securityKey,
      licenseExpirationDate: expirationDate,
      licenseIssuedAt: new Date()
    });
  } catch (error) {
    console.error("Error storing license data:", error);
  }
};

// Download certificate as a file
export const downloadCertificate = (certificate, eventName) => {
  const element = document.createElement('a');
  const file = new Blob([certificate], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  
  // Use event name in the filename if available
  const fileName = eventName 
    ? `photobooth_license_${eventName.replace(/\s+/g, '_').toLowerCase()}.lic`
    : `photobooth_license_${Date.now()}.lic`;
    
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};