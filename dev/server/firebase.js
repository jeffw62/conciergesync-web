import admin from "firebase-admin";

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var missing");
  }

  const serviceAccount = JSON.parse(raw);

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });

  console.log(
    "🔥 Firebase initialized for project:",
    serviceAccount.project_id
  );
}

export default admin;
