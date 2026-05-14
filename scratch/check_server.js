const BASE = 'http://localhost:5000';
fetch(`${BASE}/admin/stats`, {
  headers: { 'Authorization': `Bearer ${process.argv[2]}` }
})
.then(res => res.json().then(data => console.log(res.status, data)))
.catch(err => console.error(err));
