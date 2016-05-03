/**
 * Created by namratha gowda on 5/2/2016.
 */
var express = require('express');
var app = require('express')();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var passwordHash = require('password-hash');
var session = require('express-session');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret: "namrathalovessomeone_donthitonher"}));
app.use(express.static(__dirname));
var  mongoose = require('mongoose');
var mongooseOptions = {
    server: {
        socketOptions: {
            keepAlive: 3000000,
            connectTimeoutMS: 300000
        }
    },
    replset:    {
        socketOptions:  {
            keepAlive: 3000000,
            conectionTimeoutMS: 300000
        }
    }
};
var mongodbURI = "mongodb://cmpe239:cmpe239@ds013182.mlab.com:13182/cmpe239";
mongoose.connect(mongodbURI, mongooseOptions);
var conn = mongoose.connection;
var mongooseUserSchema = mongoose.Schema({
    username: mongoose.Schema.Types.String,
    password: mongoose.Schema.Types.String,
    email: mongoose.Schema.Types.String
});
var mongooseCompanySchema = mongoose.Schema({
    name: mongoose.Schema.Types.String,
    key: mongoose.Schema.Types.String
});
var companyModel = mongoose.model('companies', mongooseCompanySchema);
var collectionName = "users_table";
var collectionModel = mongoose.model(collectionName, mongooseUserSchema);
app.get("/static", express.static(__dirname));

app.get("/", function(req, res){
    var sess = req.session;
    if(sess.user_id)    {
        res.sendFile("dashboard.html", {root: __dirname})
    }
   res.sendFile(__dirname + "/login.html");
});
app.post("/login", function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    collectionModel.findOne({username:username}, function(err, data)  {
       if(err)  {
           console.log("MongoError");
       }
        else    {

               if(data.username == username) {
                   if(passwordHash.verify(password, data.password))  {
                       //set session
                       var sess = req.session;
                       sess.user_id = data._id;
                       res.redirect("/dashboard");
                   }
                   else {
                       res.sendFile("login.html", {root: __dirname})
                   }
               }
           }
    });
});
app.get("/register", function (req, res) {
    res.sendFile(__dirname + "/register.html");
});
app.post("/register", function(req, res)    {

    var u = new collectionModel({
        username:req.body.username,
        password: passwordHash.generate(req.body.password),
        email: req.body.email
    });
    u.save(function(err)    {
       if(err)  {
           console.log("Error");
       }
        else    {
           res.redirect("/");
       }
    });

});
app.get("/dashboard", function (req, res) {
    var sess = req.session;
    if(sess.user_id)    {
        console.log(sess.user_id);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.sendFile(__dirname + "/dashboard.html");
    }
    else    {
        res.sendFile(__dirname + "/login.html");
    }

});

app.get('/listCompanies', function(req, res)    {
    var sess = req.session;
    if(sess.user_id)    {
        companyModel.find({}, function(err, docs)   {
            if(!err)    {
                res.send(docs);
            }
        })
    }
    else{
        res.status(401).send("Unauthorized");
    }
});

app.get("/logout", function(req, res)   {
   req.session.destroy(function(err)    {
       if(err)  {
           console.log(err);
       }
       else {
           res.redirect("/");
       }
   });
});

http.listen(3001, function()    {
   console.log("Listening on *3001");
});