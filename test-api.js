const http = require('http');

async function main() {
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/backend/profile/xynos33434',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
  });
  req.end();
}
main();
