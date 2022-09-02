import express from "express";
import cors from "cors";
import joi from "joi";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config()

console.log(dayjs().format().split("T")[1].split("-")[0])
console.log(Date.now())

const app = express();
app.use(cors());
app.use(express.json());

const participantSchema = joi.object({
    name: joi.string().empty().required(),
    lastStatus: joi.number().min(1).required()
})

const messageSchema = joi.object({
    from: joi.string().empty().required(),
    to: joi.string().empty().required(),
    text: joi.string.empty().required(),
    type: joi.string().valid("private_message", "message").required(),
    time: joi.string().required()
})

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db("batepapouol")
})


app.listen(5000, () => {console.log("Listen on 5000")});