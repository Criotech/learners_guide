const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongodb-session")(session);
const flash = require("express-flash");
const methodOverride = require("method-override");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
require("./config/passport");

var app = express();

//connect mongodb
mongoose.connect('mongodb://localhost:27017/freshscholars', { useNewUrlParser: true, useCreateIndex: true  }).then(console.log("database connected"));


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("mysecrect"));
app.use(methodOverride("_method"));


const oneDay = 86400000; // in milliseconds
app.use(express.static(path.join(__dirname, "public"), {
    maxage: oneDay
}));

app.use(session({
    secret: "mysecrect",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({uri: 'mongodb://localhost:27017/freshscholars', collection: "app_sessions"})
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// app.use((req, res, next)=> {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//     );
//     if (req.method === 'OPTIONS'){
//         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, PUT, DELETE');
//         return res.status(200).json({});
//     }
// })

app.use("/", indexRouter);
app.use("/users", usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("frontend/error");
});

module.exports = app;
