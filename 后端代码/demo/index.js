const express = require("express");
const app = express();
const port = 3000;
app.get("/", (req, res) => {
  res.send("渣渣喵");
});
app.post("/zhazha", function (req, res) {
  res.send("渣渣喵从后端返回了");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
