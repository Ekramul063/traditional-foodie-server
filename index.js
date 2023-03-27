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

function verifyJWT(req,res,next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
       return res.status(401).send('Unauthorize access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
       if(err){
        return res.status(403).send('forbidden access')
       }
       req.decoded = decoded;
       next();
    })
    
}




//MongoDB connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rlfbbtk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db('traditional-food').collection('users');
        const productsCollection = client.db('traditional-food').collection('products');
        const ordersCollection = client.db('traditional-food').collection('orders');
        const districtsCollection = client.db('traditional-food').collection('districts');
        const productLocationsCollection= client.db('traditional-food').collection('product-locations');
        const upazilasCollection= client.db('traditional-food').collection('upazilas');
        const userAddressCollection= client.db('traditional-food').collection('userAddress');
        //test
        app.get('/', (req, res) => {
            res.send('Traditional food web server running')
        })
        app.get('/jwt',async(req,res)=>{
            const email = req.query.email;
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
        //get single user address
        app.get('/users-address/:email',async(req,res)=>{
            const email = req.params.email;
            const query ={user:email};
            const result = await userAddressCollection.findOne(query);
             res.send(result)
        })
        // update  User address
        app.patch('/user-address/:email',async(req,res)=>{
            const fullAddress = req.body;
            const email = req.params.email;
            const filter={user:email};
            const options = { upsert: true };
            const updatedDoc ={
                $set:{
                    division :fullAddress.division,
                    district :fullAddress.district,
                    area :fullAddress.area,
                    phone :fullAddress.phone,
                    fullName :fullAddress.fullName,
                    address :fullAddress.address,
                }
            };
            const result = await userAddressCollection.updateOne(filter,updatedDoc,options);
             res.send(result)
        })
        // add user Address
        app.post('/user-address',async(req,res)=>{
            const address = req.body;
            const result = await userAddressCollection.insertOne(address);
            res.send(result);
        })
        
        //get all seller
        app.get('/sellers',verifyJWT,async(req,res)=>{
            const filter = {seller:true};
            const decodedEmail = req.decoded.email;
            const query ={email:decodedEmail};
            const user = await usersCollection.findOne(query);
            if(user.role !== 'admin'){
                return res.status(403).send('Forbidden Access')
             }
            const result = await usersCollection.find(filter).toArray();
            res.send(result)
        })
        //find single seller products
        app.get('/products/added-product/:seller',async(req,res)=>{
            const seller = req.params.seller;
            const query = {seller:seller};
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })
        //make seller admin
        // app.patch('/sellers:id',verifyJWT,async(req,res)=>{
        //     const id = req.params.id;
        //     const content= req.body;
        //     console.log(content)
        //     const filter = {_id:ObjectId(id)};
        //     const options ={upsert:true};
        //     const docs ={
        //         $set:{
        //            role:content.role
        //         }
        //     };
        //     const result = await usersCollection.updateOne(filter,docs,options);
        //     res.send(result)

        // })

        //delete a seller
        app.delete('/users-delete/:id',async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
         } )

        //get all product 
        app.get('/products',async(req,res)=>{
            const page = req.query.page;
            const size = parseInt(req.query.size);
            console.log(page,size)
            const query = {};
            const products = await productsCollection.find(query).skip(page*size).limit(size).toArray();
            const count= await productsCollection.estimatedDocumentCount();
            res.send({products,count});
        })
        //get single product by id
        app.get('/products-single/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        })
        //get single product by id
        app.patch('/products/:id',async(req,res)=>{
            const id = req.params.id;
            const product =req.body;
            const query = {_id:ObjectId(id)};
            const doc={
                $set:{
                    image:product.image,
                    district:product.district,
                    title:product.title,
                    weight:product.weight,
                    price:product.price,
                    discount:product.discount,
                    newPrice:product.newPrice,
                    brand:product.brand,
                    productHistory:product.productHistory,
                    description:product.description,
                }
            }
            const result = await productsCollection.updateOne(query,doc);
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

        // add address
        app.get('/district-upazila',async(req,res)=>{
            const district = req.query.district;
            const query ={district:district};
            console.log(district);
            const result = await upazilasCollection.findOne(query);
            res.send(result);
        })
        // add address
        app.get('/upazilas',async(req,res)=>{
            console.log('hi')
            const query ={};
            const result = await upazilasCollection.find(query).toArray();
            res.send(result);
        })
        
         //get my sold product
         app.get('/orders/my-product/:email',async(req,res)=>{
            const email = req.params.email;
            const query = {email:email};
            const result = await ordersCollection.find(query).toArray();
            res.send(result);
         })
         //delete single product
         app.delete('/products/delete/:id',async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await productsCollection.deleteOne(filter);
            res.send(result)
        })

        //get all  orders
        app.get('/orders',async(req,res)=>{
            const query = {};
            const result = await ordersCollection.find(query).toArray();
            res.send(result);

        })
        //get my  orders
        app.get('/my-orders',async(req,res)=>{
            const email = req.query.buyer;
            const query={buyer:email};
            const result = await ordersCollection.find(query).toArray();
            res.send(result);

        })

        //delete order
        app.delete('/orders/:id',async(req,res)=>{

            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await ordersCollection.deleteOne(filter);
            res.send(result);
        })
            
        //insert product 
        app.post('/orders',async(req,res)=>{
            const product = req.body;
            const result = await ordersCollection.insertOne(product);
            res.send(result)
             
        })


        //get districts
        app.get('/districts',async(req,res)=>{
            const query ={};
            const result = await districtsCollection.findOne(query);
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