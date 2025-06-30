import { saveAs } from "file-saver";
import CryptoJS from "crypto-js";

const JWT_SECRET_KEY =
  "b7f8e2d1c9a4f6e3b2d7c8a9e1f4b6d2c3a8e7f1b5d9c2a6f3e8b1d4c7a2f9e5";

const createJWT = (payload, secret) => {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = CryptoJS.HmacSHA256(dataToSign, secret).toString(
    CryptoJS.enc.Base64
  );
  const encodedSignature = base64UrlSafe(signature);
  return `${dataToSign}.${encodedSignature}`;
};

const base64UrlEncode = (str) => {
  let base64 = btoa(unescape(encodeURIComponent(str)));
  return base64UrlSafe(base64);
};

const base64UrlSafe = (base64) => {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const generateLicenseCertificate = async (serviceRequest) => {
  const { startDateTime, endDateTime, themes, builds, mode } = serviceRequest;

  const payload = {
    start_date_time: startDateTime.toDate
      ? startDateTime.toDate().toISOString()
      : new Date(startDateTime).toISOString(),
    end_date_time: endDateTime.toDate
      ? endDateTime.toDate().toISOString()
      : new Date(endDateTime).toISOString(),
    themes_selected: themes.join(", "),
    selected_builds: builds.join(", "),
    photobooth_mode: mode,
    issuedAt: new Date().toISOString(),
  };

  return createJWT(payload, JWT_SECRET_KEY);
};

export const downloadCertificate = (certificate) => {
  const blob = new Blob([certificate], { type: "text/plain" });
  const fileName = `photobooth_license_${Date.now()}.lic`;
  saveAs(blob, fileName);
};