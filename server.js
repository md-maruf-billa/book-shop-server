import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb';
import app from './app.js';
const uri = process.env.DB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const database = client.db("book-shop-server")
export const user = database.collection("users")
export const book = database.collection("books")
export const order = database.collection("orders")

async function run() {
  try {
    await client.db("admin").command({ ping: 1 });
  } finally {
    console.log("Server is running")
  }
}



app.listen(process.env.PORT, () => {
  run()
  console.log(`Example app listening on port ${process.env.PORT}`)
})


export default client;