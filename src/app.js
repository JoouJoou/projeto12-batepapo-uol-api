import express from "express";
import cors from "cors";
import joi from "joi";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config()

console.log(dayjs(new Date()).format('HH:mm:ss'))
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
        await db.collection("messages").insertOne({from: req.body.name, to: "Todos", text: "entra na sala...", type: "status", time: dayjs(new Date()).format('HH:mm:ss')})
        res.status(201).send("Entrei")
        return
    } catch {
        res.sendStatus(500)
        return
    }
})

app.get("/participants", async (req, res) => {
    try {
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)
    } catch {
        res.sendStatus(500)
        return
    }
})

app.post("/messages", async (req, res) => {
    try {
        const validate = messageSchema.validate(req.body, { abortEarly: true} )
        const checkName = await db.collection("participants").findOne({name: req.headers.user})
        if (validate.error || !checkName) {
            res.sendStatus(422)
            return
        }
        const messageComplete = {from: req.headers.user, to: req.body.to, text: req.body.text, type: req.body.type, time: dayjs(new Date()).format('HH:mm:ss')}
        await db.collection("messages").insertOne(messageComplete)
        res.sendStatus(201)
        return
    } catch {
        res.sendStatus(500)
        return
    }
})

app.get("/messages", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit)
        const messages = await db.collection("messages").find().toArray()
        const user = req.headers.user
        if (limit) {
            const limitedMessages = []
            for (let i = 0; i < limit; i++) {
                const msg = messages.pop()
                if (msg.to === user || msg.to === "Todos" || msg.from === user) {
                    limitedMessages.push(msg)
                }
            }
            res.send(limitedMessages.reverse())
            return
        }
        else {
            const allMessages = []
            for (let i = 0; i < messages.length; i++) {
                const msg = messages.pop()
                if (msg.to === user || msg.to === "Todos" || msg.from === user) {
                    allMessages.push(msg)
                }
            }
            res.send(allMessages)
            return
        }

    } catch {
        res.sendStatus(500)
        return
    }
})

app.post("/status", async (req, res) => {
    try {
        const user = req.headers.user
        const checkName = await db.collection("participants").findOne({name: user})
        if (!checkName) {
            res.sendStatus(404)
            return
        }
        await db.collection("participants").updateOne({
            _id: checkName._id
        }, {$set: {lastStatus: Date.now()}})
        res.sendStatus(200)
        return
    } catch {
        res.sendStatus(500)
        return
    }
})

app.listen(5000, () => {console.log("Listen on 5000")});