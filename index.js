const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const admin = require("firebase-admin");
const port = process.env.PORT || 8000;

//middleware
app.use(cors());
app.use(express.json());

//connection string in mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dewtyms.mongodb.net/?retryWrites=true&w=majority`;

//connecting database
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    console.log("database connection established");
    const database = client.db("Photography");
    const servicecollection = database.collection("services");
    const ordercollection = database.collection("orders");
    const userCollection = database.collection("users");

    //apis

    app.get("/allservice", async (req, res) => {
      const cursor = servicecollection.find({});
      const allservices = await cursor.toArray();
      res.json(allservices);
    });

    //getting cars with dynamic id
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cars = await servicecollection.findOne(query);
      res.send(cars);
    });
    app.post("/addservice", async (req, res) => {
      const servicedetail = req.body;
      const serviceresult = await servicecollection.insertOne(servicedetail);
      res.json(serviceresult);
    });

    app.post("/buyservice", async (req, res) => {
      // const servicebuy = { ...req.body, pending: true };
      const servicebuy = req.body;
      const order = await ordercollection.insertOne({
        servicebuy,
        pending: true,
      });
      // console.log(carresult);
      res.json(order);
    });
    //getting user all appointments
    app.get("/myorders", async (req, res) => {
      const email = req.query.email;
      // const query = { 'servicebuy.': email };
      // console.log(query);
      const cursor = ordercollection.find({ "servicebuy.useremail": email });
      const orderhistory = await cursor.toArray();
      console.log(email);
      res.json(orderhistory);
    });

    app.get("/allorder", async (req, res) => {
      const cursor = ordercollection.find({});
      const allorders = await cursor.toArray();
      res.json(allorders);
    });

    app.post("/orderservice", async (req, res) => {
      const orderdetails = req.body;
      const orderresult = await ordercollection.insertOne(orderdetails);

      res.json(orderresult);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    //deleting user car item for buyings
    app.delete("/deleteservice/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicecollection.deleteOne(query);
      res.json(result);
    });
    ///getting admins database
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    ///adding already exists users  data to database
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      console.log(result);
      res.json(result);
    });
  } finally {
    //
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to photography world....!");
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
