const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const router = require("./routes/router");
const bodyParser = require("body-parser");

dotenv.config();

// Connect to MongoDB
mongoose.connect(
    process.env.MONGO_URL,
    {useUnifiedTopology: true, useNewUrlParser: true})
    .then(() => console.log("Connected to DB"))
    .catch((error) => console.log("Error connecting to DB", error));

// Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use("/", router);

app.listen(3000, () => console.log("Server up and runing on port 3000!"));
