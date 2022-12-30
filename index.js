const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
var jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());




//MongoDB connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rlfbbtk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db('traditional-food').collection('users');
        const productsCollection = client.db('traditional-food').collection('products');
        const productLocationsCollection= client.db('traditional-food').collection('product-locations');
        //test
        app.get('/', (req, res) => {
            res.send('Traditional food web server running')
        })
        app.get('/jwt',async(req,res)=>{
            const email = req.query.email;
            console.log(email);
            const query = {email:email};
            const user = await usersCollection.findOne(query);
            if(user){
               const token =jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn:'12h'});
               res.send({accessToken:token})
            }else{
                res.status(403).send({accessToken:''});
            }
            
        })
        //get all users
        app.get('/users',async(req,res)=>{
            const query = {};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        //get single users
        app.get('/users/:email',async(req,res)=>{
            const email = req.params.email;
            const query ={email:email};
            const result = await usersCollection.findOne(query);
            res.send(result);
        })
        //insert user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //get all seller
        app.get('/sellers',async(req,res)=>{
            const query = {seller:true};
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })
        //get all product 
        app.get('/products',async(req,res)=>{
            const query = {};
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })
        //get single product by id
        app.get('/products-single/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        })
        //insert product
        app.post('/products',async(req,res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        //product location
        app.get('/product-locations',async(req,res)=>{
            const query = {};
            const result = await productLocationsCollection.find(query).toArray();
            res.send(result)
        })
        // product location district name
        app.get('/product-locations/:division',async(req,res)=>{
            const divisonName = req.params.division;
            const query = {divison:divisonName};
            const result = await productLocationsCollection.findOne(query);
            res.send(result);
        })

        //find products by district name
        app.get('/products/:district',async(req,res)=>{
            const district = req.params.district;
            const query = {district:district};
            const result = await productsCollection.find(query).toArray();
            res.send(result);

        })
        //find single seller products
        app.get('/products/added-product/:seller',async(req,res)=>{
            const seller = req.params.seller;
            console.log(seller);
            const query = {seller:seller};
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })


    }
    finally {

    }
}
run().catch(console.dir)

app.listen(port, () => {
    console.log(`Traditional food web server running on ${port}`)
})