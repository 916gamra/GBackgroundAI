const fetch = require('node-fetch');

async function testGoogle() {
  console.log("Testing Google...");
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=INVALID");
  console.log("Google status:", res.status);
}

async function testNvidia() {
  console.log("Testing Nvidia...");
  const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
    headers: { 'Authorization': 'Bearer INVALID' }
  });
  console.log("Nvidia status:", res.status);
}

testGoogle();
testNvidia();
