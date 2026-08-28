async function testNvidia() {
  const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
    headers: { 'Authorization': 'Bearer INVALID' }
  });
  const data = await res.json();
  console.log("Nvidia models count:", data.data ? data.data.length : data);
}
testNvidia();
