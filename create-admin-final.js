const admin = require('firebase-admin');

const projectId = "qualitycheck-51ff3";
const clientEmail = "firebase-adminsdk-fbsvc@qualitycheck-51ff3.iam.gserviceaccount.com";
const privateKey = "-----BEGIN PRIVATE KEY-----\n" + 
"MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDzw7JIsEX6hfLD\n" +
"JYx5IWpVrvW3H4lFAdkEZNbKZChqN9s9Dy1wyi162/DSW04MvrhBvxt6JmYD6cHw\n" +
"yYBgBXtybNVoRXKp0v8FNvUJ7j9SZ2w86Gg6K3KtoZrofGllxo53zpwWqiHRxGBI\n" +
"tAPJNPnlTdPA9+zQfWMIM0fOq0TdCc/R0wDit757nW/TjdFNZ28hDIgbz5tA3CkX\n" +
"40ZMC1QyhB32aUi9x95Mrk1h4RidDStOcHk8YDG/stRU+S5JSvLcAg5lHuOxdA6y\n" +
"4DKmb7Kk7o8pvECJpv4AC/PwqM6oUrvWWlb+0kG+CEuewlP3tkzBBrHSXDU3JDLP\n" +
"qeSVRMs1AgMBAAECgf9rM2T0Z+Zehl8nSHFpKTOE+wHpxrSs5GMhdjdU9TcmKepW\n" +
"BUFhQ4iSFKeT2xONXKfWQh/orXpaaN128dFtvlDLwZEYihzNvTzpziwfxzw8a79D\n" +
"X0choySLt3D997i3ntqIqxQkji17/XYFLdAnFw/PCABX8gWeADEif2rU41J64eSl\n" +
"Z4Q57bpAyfkXmU7sDV5ufkCUEmeRKm8SxBmkDSQC5ZYvUdLHTbw+un+yfMtQnieE\n" +
"aRUQDuE9LoKUWFeL8j4khY/tzIAxrYdcL8eesGOBc9viyXROl3Pu0l4PAmOqpjSF\n" +
"G/DmZlEvdqmBedDvA1Ml9RD3jUKk0Ulna2ZwqokCgYEA/9ve5HXSqBFTVFPsG5mc\n" +
"3xYNeiF4925yzHqgS6V3m7OCz3iHzXjJaJEZ1Kxgqd0TZEhKLAO+tB0sj1ltganQ\n" +
"016aep6WoisKm1nDoBkeXckPcBwW7EcKHXjUT1q/ql6o3Kui7U5alJcRjjy6SPGp\n" +
"g7lr59mPk56Gci5uVkyT5tkCgYEA8+YeL9XOpK/75xc/x9h9iXKU5sfEA5O4YG3Q\n" +
"UpiW3tHqiNuzm0JuaqGzwFC5fQguhnrqw+cFSu8gtJEAxI4lhWwgz5Ovo+LbBDiZ\n" +
"ILrduTl2ErmPVS79rwQI6gVr0XW6FJjaXhwUpfKYV4HuTGnrmv8BMZrsU9b4fHp8\n" +
"nfOmJb0CgYEAy/9lhug+ToyJ0RmcjiD7R4+QrUjU5wsj8s7u0YGbjQQijwL93CCr\n" +
"DXlri/rok2bWGEXfBZryyS7doWne+twHyQ+LwaqCVchVi6mVZSfB42r0qSFsUXUO\n" +
"ppL5TFABs3gH0PH0VJr9c63DbJIUwSYVTxZe55u6cyuY7J8CkEI8RnkCgYEA30zW\n" +
"YnFcSkedWAxfJrc86HRxg4FuIuBCNHcV/ikaKFMEadzMad++e/4kNnUx/hlZj2JG\n" +
"QqnmnJ6m0OrZSxvhmnBO8f2DF4cBgrHW8LJlgcnsImSlqBXnyS7mgmwINLOWdHkl\n" +
"npHgNJ4oelC+vX2KyhSvnieUPbgspYb47DdofSfkCgYEAyHPmyEg8iizkZoXKupj8\n" +
"Gfi+hC9lu/nw67yRp7u5R1mlpUwfjr2Mr/yZih/05pkAnjV3be5/78LF9kfN7+EV\n" +
"4psdlCAeWAsb08Ee2fpmXQh54A326PZK4aFn0ljdJH9Uwj22nGAwdf63uQRabITn\n" +
"5P80n7+FHwSmggC+tEttz7M=\n" +
"-----END PRIVATE KEY-----\n";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

async function run() {
  try {
    const user = await admin.auth().createUser({
      email: 'vallrack67@gmail.com',
      password: 'Agnusde9-.',
      displayName: 'Admin SGC',
    });
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('SUCCESS: Admin user created.');
  } catch (e) {
    console.log('NOTICE:', e.message);
  }
  process.exit(0);
}

run();
