const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const router = require("./routes/router");
const bodyParser = require("body-parser");
const cors = require("cors");

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to DB");
}).catch(error => {
    console.log("Error connecting to DB", error)
});

// Middlewares
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use("/", router);

// Server Configuration and Status
const PORT = process.env.PORT;
app.listen(PORT, () => console.log("Server up and runing on port", PORT));