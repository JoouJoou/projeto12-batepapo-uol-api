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
    name: joi.string().required()
})

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("private_message", "message").required(),
})

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db("batepapouol")
})

app.post("/participants", async (req, res) => {
    try {
        const validation = participantSchema.validate(req.body, { abortEarly: true })
        if (validation.error) {
            res.status(422).send("Nomes devem ser strings não vazias")
            return
        }
        const checkName = await db.collection("participants").findOne(req.body)
        if (checkName) {
            res.status(409).send("Usuário já cadastrado")
            return
        }
        await db.collection("participants").insertOne({name: req.body.name, lastStatus: Date.now()})
        res.sendStatus(201)
        return
    } catch {
        res.sendStatus(500)
        return
    }
})

app.listen(5000, () => {console.log("Listen on 5000")});