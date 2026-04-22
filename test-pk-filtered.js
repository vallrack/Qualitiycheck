const admin = require('firebase-admin');

async function test() {
  console.log('--- TEST PEM ULTRA-FILTERED ---');
  
  const rawPk = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDzw7JIsEX6hfLD
JYx5IWpVrvW3H4lFAdkEZNbKZChqN9s9Dy1wyi162/DSW04MvrhBvxt6JmYD6cHw
yYBgBXtybNVoRXKp0v8FNvUJ7j9SZ2w86Gg6K3KtoZrofGllxo53zpwWqiHRxGBI
tAPJNPnlTdPA9+zQfWMIM0fOq0TdCc/R0wDit757nW/TjdFNZ28hDIgbz5tA3CkX
40ZMC1QyhB32aUi9x95Mrk1h4RidDStOcHk8YDG/stRU+S5JSvLcAg5lHuOxdA6y
4DKmb7Kk7o8pvECJpv4AC/PwqM6oUrvWWlb+0kG+CEuewlP3tkzBBrHSXDU3JDLP
qeSVRMs1AgMBAAECgf9rM2T0Z+Zehl8nSHFpKTOE+wHpxrSs5GMhdjdU9TcmKepW
BUFhQ4iSFKeT2xONXKfWQh/orXpaaN128dFtvlDLwZEYihzNvTzpziwfxzw8a79D
X0choySLt3D997i3ntqIqxQkji17/XYFLdAnFw/PCABX8gWeADEif2rU41J64eSl
Z4Q57bpAyfkXmU7sDV5ufkCUEmeRKm8SxBmkDSQC5ZYvUdLHTbw+un+yfMtQnieE
aRUQDuE9LoKUWFeL8j4khY/tzIAxrYdcL8eesGOBc9viyXROl3Pu0l4PAmOqpjSF
G/DmZlEvdqmBedDvA1Ml9RD3jUKk0Ulna2ZwqokCgYEA/9ve5HXSqBFTVFPsG5mc
3xYNeiF4925yzHqgS6V3m7OCz3iHzXjJaJEZ1Kxgqd0TZEhKLAO+tB0sj1ltganQ
016aep6WoisKm1nDoBkeXckPcBwW7EcKHXjUT1q/ql6o3Kui7U5alJcRjjy6SPGp
g7lr59mPk56Gci5uVkyT5tkCgYEA8+YeL9XOpK/75xc/x9h9iXKU5sfEA5O4YG3Q
UpiW3tHqiNuzm0JuaqGzwFC5fQguhnrqw+cFSu8gtJEAxI4lhWwgz5Ovo+LbBDiZ
ILrduTl2ErmPVS79rwQI6gVr0XW6FJjaXhwUpfKYV4HuTGnrmv8BMZrsU9b4fHp8
nfOmJb0CgYEAy/9lhug+ToyJ0RmcjiD7R4+QrUjU5wsj8s7u0YGbjQQijwL93CCr
DXlri/rok2bWGEXfBZryyS7doWne+twHyQ+LwaqCVchVi6mVZSfB42r0qSFsUXUO
ppL5TFABs3gH0PH0VJr9c63DbJIUwSYVTxZe55u6cyuY7J8CkEI8RnkCgYEA30zW
YnFcSkedWAxfJrc86HRxg4FuIuBCNHcV/ikaKFMEadzMad++e/4kNnUx/hlZj2JG
QqnmnJ6m0OrZSxvhmnBO8f2DF4cBgrHW8LJlgcnsImSlqBXnyS7mgmwINLOWdHkl
npHgNJ4oelC+vX2KyhSvnieUPbgspYb47DdofSfkCgYEAyHPmyEg8iizkZoXKupj8
Gfi+hC9lu/nw67yRp7u5R1mlpUwfjr2Mr/yZih/05pkAnjV3be5/78LF9kfN7+EV
4psdlCAeWAsb08Ee2fpmXQh54A326PZK4aFn0ljdJH9Uwj22nGAwdf63uQRabITn
5P80n7+FHwSmggC+tEttz7M=
-----END PRIVATE KEY-----`;

  // 1. Extract body
  const body = rawPk.split('-----')[2].replace(/[^A-Za-z0-9+/=]/g, ''); // EXTREME FILTER
  
  // 2. Reconstruct with headers
  const pk = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "qualitycheck-51ff3",
        clientEmail: "firebase-adminsdk-fbsvc@qualitycheck-51ff3.iam.gserviceaccount.com",
        privateKey: pk
      })
    });
    console.log('SUCCESS');
    process.exit(0);
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exit(1);
  }
}

test();
