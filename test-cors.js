async function checkCors(url, method = 'GET') {
  try {
    const res = await fetch(url, { method, headers: { 'Origin': 'http://localhost:3000' } });
    console.log(url, res.headers.get('access-control-allow-origin'));
  } catch (e) {
    console.log(url, "Error");
  }
}
checkCors('https://integrate.api.nvidia.com/v1/models');
checkCors('https://api.groq.com/openai/v1/models');
checkCors('https://openrouter.ai/api/v1/models');
checkCors('https://generativelanguage.googleapis.com/v1beta/models?key=INVALID');
