const http = require('http');

const data = JSON.stringify({
  email: "vallrack67@gmail.com",
  password: "Agnusde9-.",
  name: "Admin Principal"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
