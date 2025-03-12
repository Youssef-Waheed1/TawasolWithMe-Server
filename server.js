const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db.js");

const app = express();
app.use(express.json());
app.use(cors());    // كده انا بعرف ال Server ان لو حد عمل عليك access دخله عادي , the react app كده اصبح عنده Access علي ال Server side

app.use("/api/users", require("./routes/users.js"));
app.use("/api/profiles", require("./routes/profiles.js"));
app.use("/api/posts", require("./routes/posts.js"));

connectDB();

app.use(express.static(__dirname + '/public'))  //عشان ال client" react" يكون عنده access علي ال public folder 


app.get("/", (req, res) => res.send("Server is working correctly"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
})