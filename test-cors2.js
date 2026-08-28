async function checkCors(url, method = 'GET') {
  try {
    const res = await fetch(url, { method, headers: { 'Origin': 'http://localhost:3000' } });
    console.log(url, res.headers.get('access-control-allow-origin'));
  } catch (e) {
    console.log(url, 'Error');
  }
}
checkCors('https://api.nvidia.com/v1/models');
