const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require("passport");
const bcrypt = require("bcrypt-nodejs");
const multer =require("multer");
const fs = require('fs');

let User = require("../models/users");
let Lecture = require("../models/lectures")
let Result = require("../models/result")
let Video = require("../models/videos")

//Multer settings
const  storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb){
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({
  storage: storage ,
  //limits: {fileSize: 10},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
})

//check file type 
function checkFileType(file, cb){
  //Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // check ext
  const extname = filetypes.test(path.extname
  (file.originalname).toLowerCase());
  //check mime
  const mimetype = filetypes.test(file.mimetype)

  if(mimetype && extname){
    return cb(null, true);
  }else {
    cb('Error: images Only!')
  }
}

//stop multer settings 

//isloggedin private middleware
function isLoggedIn(req, res,next){

  if (req.isAuthenticated() && req.user.type=="admin"){
    return next()
  }
     res.redirect('/loginDashbordAdmin')
}

//isloggedin private middleware
function   studentLoggedIn(req, res,next){

  if ( req.isAuthenticated() && req.user.type=="STUDENT"){
    return next()
  }
     res.redirect('/testlogin')
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//get create Dashboard
router.get('/createDashboardAdmin', function (req, res) {
  res.render('registerAdmins')
})

//get Login Dashboard
router.get('/loginDashbordAdmin', function (req, res) {
  let success = req.flash("success")
  let error = req.flash("error") 

  res.render('loginDashboard', { success, error})
})


//post create account
router.post('/createDashboardAdmin', passport.authenticate('local.CreateAccount', {
  successRedirect: '/dashboard',
  failureRedirect: '/createaccount',
  failureFlash: true
}))

//post login
router.post('/loginDashbordAdmin', passport.authenticate('local.Login', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}))

//logout
router.get('/logout', function (req, res, next) {
  req.logout()
  res.redirect('/')
})

//get dashboard
router.get('/dashboard', isLoggedIn, function(req, res, next){
  let username = req.user.name;
  res.render('backend/dashboard', {username})
})

//get lecture backend
router.get('/dashboard/lectures', isLoggedIn, async function(req, res, next){
  let username = req.user.name;
  let success = req.flash('success'); 
  let result = "";
        try {
            result = await Lecture.find({}).sort({createdDate: -1});
        } catch(err) {
            showError(req, "GET", "/dashboard/lectures", err);
        }

  res.render('backend/lectures', {username, success, result})
})

router.get('/dashboard/lectures/add', function(req, res, next){
  let username = req.user.name;
  
  res.render('backend/addlecture', {username})
})

router.post('/dashboard/lectures/add', isLoggedIn, upload.single('postImage'), async function(req, res, next){
  console.log(req.file)
  let lectureData = {
            title: req.body.title,
            link: req.body.link,
            introduction: req.body.introduction,
            prerequisites: req.body.prerequisites,
            content: req.body.content,
            is_visible: req.body.is_visible
        };
        if (req.file) {
            lectureData.postImage = `/uploads/${req.file.filename}`;
        }

        try {
            await Lecture.create(lectureData);
            req.flash("success", "Lecture has been created successfully!");
        } catch (err) {
            showError(req, "POST", "/dashboard/lectures/add", err);
        }
        res.redirect('/dashboard/lectures');
})


router.route("/dashboard/lectures/edit/:id")
    .all(isLoggedIn)
    .get(async (req, res) => {
        let id = req.params.id, result;
        let username = req.user.name;
        try {
            result = await Lecture.findById(id);
        } catch (err) {
            result = undefined;
            showError(req, "GET", `dashboard/lectures/edit/${id}`, err);
        }
        res.render("backend/editLecture", {username, result, action: req.originalUrl });
    })
    .post(upload.single("postImage"), async (req, res) => {
        let idd = req.params.id;
        // oldImage = await News.findOne({ _id: idd });
        // removeOldImage();

        let lectureData = {
            title: req.body.title,
            link: req.body.link,
            introduction: req.body.introduction,
            prerequisites: req.body.prerequisites,
            content: req.body.content,
            is_visible: req.body.is_visible
        };
        if (req.file) {
            lectureData.postImage = `/uploads/${req.file.filename}`;
        }

        try {
            await Lecture.findOneAndUpdate({ _id: idd },lectureData, { upsert: true });
            req.flash("success", "Lecture updated successfully");
        } catch (err) {
             console.log(err)
        }
        res.redirect("/dashboard/lectures");
    }); 

    //delete Lesson
router.delete("/dashboard/lectures/delete/:id", isLoggedIn, async function (req, res) {
    let idd = req.params.id;
    oldImage = await Lecture.findOne({ _id: idd });
    // removeOldImage();
    try {
        await Lecture.deleteOne({ _id: req.body.id });
        req.flash("success", "Lecture deleted successfully!");
    } catch(err) {
        showError(req, "DELETE", `/dashboard/lectures/delete/${idd}`, err);
    }
    res.redirect("/dashboard/lectures");
});

// //get Test Result
router.get("/dashboard/testresult", isLoggedIn, async function(req, res, next){
  let username = req.user.name;
  let result = "";
  result = await Result.find({});

  res.render("backend/testresult", {result, username})
})

router.post("/dashboard/testresult/post", isLoggedIn, function(req, res, next){
  let resultData = {
            name: req.body.username,
            score: req.body.userscore,
            topic: req.body.topic
        };
       
          Result.create(resultData).then((result)=>{
            console.log(result)
            res.redirect('/')
            });
      
})

//Backend Videos
router.get("/dashboard/videos", isLoggedIn, async function(req, res, next){
  let username = req.user.name;
  let success = req.flash("success");
  let result = "";
  
  result= await Video.find({})

  res.render('backend/videos', {username, success, result})
})

router.get('/dashboard/videos/add', function(req, res, next){
  let username = req.user.name;
  
  res.render('backend/addvideo', {username})
})

router.post('/dashboard/videos/add', isLoggedIn, upload.single('postImage'), async function(req, res, next){
  console.log(req.file)
  let videoData = {
            title: req.body.title,
            link: req.body.link,
            summary: req.body.summary,
            videolink: req.body.videolink,
        };
        if (req.file) {
           videoData.postImage = `/uploads/${req.file.filename}`;
        }

        try {
            await Video.create(videoData);
            req.flash("success", "Video has been created successfully!");
        } catch (err) {
            showError(req, "POST", "/dashboard/video/add", err);
        }
        res.redirect('/dashboard/videos');
})

//edit video
router.route("/dashboard/videos/edit/:id")
    .all(isLoggedIn)
    .get(async (req, res) => {
        let id = req.params.id, result;
        let username = req.user.name;
        try {
            result = await Video.findById(id);
        } catch (err) {
            result = undefined;
            showError(req, "GET", `dashboard/videos/edit/${id}`, err);
        }
        res.render("backend/editvideo", {username, result });
    })
    .post(upload.single("postImage"), async (req, res) => {
        let idd = req.params.id;
        // oldImage = await News.findOne({ _id: idd });
        // removeOldImage();

      let videoData = {
            title: req.body.title,
            link: req.body.link,
            summary: req.body.summary,
            videolink: req.body.videolink,
        };
        if (req.file) {
            videoData.postImage = `/uploads/${req.file.filename}`;
        }

        try {
            await Video.findOneAndUpdate({ _id: idd }, videoData, { upsert: true });
            req.flash("success", "Video updated successfully");
        } catch (err) {
             console.log(err)
        }
        res.redirect("/dashboard/videos");
    }); 

    //delete Lesson
router.delete("/dashboard/videos/delete/:id", isLoggedIn, async function (req, res) {
    let idd = req.params.id;
    oldImage = await Video.findOne({ _id: idd });
    // removeOldImage();
    try {
        await Video.deleteOne({ _id: req.body.id });
        req.flash("success", "Video deleted successfully!");
    } catch(err) {
        showError(req, "DELETE", `/dashboard/videos/delete/${idd}`, err);
    }
    res.redirect("/dashboard/videos");
});


//register students for test 
router.get("/dashboard/enrollstudent", isLoggedIn, async function (req, res, next){
  let username = req.user.name;
  let result = "";

  result = await User.find({type: "STUDENT"})
  res.render('backend/registerstudent', {username, result})
})

router.post('/dashboard/enrollstudent', function(req, res, next){
    let newUser = new User();

    newUser.name = req.body.name;
    newUser.email = req.body.email;
    newUser.password = newUser.generateHash(req.body.password);
    newUser.type = req.body.type;

    newUser.save().then((result) => {
        if (result) {
          console.log(result)
            res.redirect('/dashboard/enrollstudent')
        } else if (!result) {
            res.send('error')
        }
    })
})

router.delete('/deletestudent', isLoggedIn, function (req, res, next) {
    User.deleteOne({ _id: req.body.id }).then((result) => {
        
        res.redirect('/dashboard/enrollstudent')
    })

})

//login for test 
router.get("/testlogin", function(req, res, next){
  let success = req.flash('success');
  let error = req.flash('error');
  
  res.render('testlogin', {success, error})
})

//post login for test 
router.post('/loginstudent', passport.authenticate('local.Login', {
  successRedirect: '/test',
  failureRedirect: '/testlogin',
  failureFlash: true
}))

//frontend lesson
router.get("/lessons", async function(req, res, next){
  let result = ""
 result = await Lecture.find({})
  res.render("lessons", {result})
})

// template route
router.get("/lessons/:id", async function(req, res, next){
        let idd = req.params.id;
        let result = "";

        result = await Lecture.findOne({link: idd});  
        res.render("template", {result})        
})

//frontend lesson
router.get("/videos", async function(req, res, next){
  let result = ""
 result = await Video.find({})
  res.render("videos", {result})
})

// template route
router.get("/videos/:id", async function(req, res, next){
        let idd = req.params.id;
        let result = "";

        result = await Video.findOne({link: idd});  
        res.render("templateone", {result})        
})

//TEST SECTION

router.get('/test', studentLoggedIn, function (req, res) {
  let studentname = req.user.name;
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = [];
  for (var i = 0; i<jsonContent.length; i++) {
    titles[i] = jsonContent[i]["title"];
  }
  res.render('indexx',{titles: titles, studentname});
});

router.get('/dashboardtest', function (req, res) {
  let username = req.user.name;
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = [];
  for (var i = 0; i<jsonContent.length; i++) {
    titles[i] = jsonContent[i]["title"];
  }
  res.render('indexxx',{titles: titles, username});
});


router.get('/,/quiz', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = [];
  for (var i = 0; i<jsonContent.length; i++) {
    titles[i] = jsonContent[i]["title"];
  }
  res.send(JSON.stringify(titles));
});

router.post('/quiz', function(req, res){
  var sentQuiz = req.body;
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  if (jsonContent.length > 0) {
    sentQuiz["id"] = jsonContent[jsonContent.length-1]["id"] + 1;
  }
  jsonContent.push(sentQuiz);

  var jsonString = JSON.stringify(jsonContent);
  fs.writeFile("data/allQuizzes.json", jsonString);

  res.send("updated");
});

router.get('/quiz/:id', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var targetQuiz;;
  for (var i = 0; i < jsonContent.length; i++) {
    if (jsonContent[i]["id"] === parseInt(req.params.id)) {
      targetQuiz = jsonContent[i];
      break;
    }
  }
  res.send(targetQuiz);
});

router.put('/quiz/:id', function (req, res) {
  var sentQuiz = req.body;
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  for (var i = 0; i < jsonContent.length; i++) {
    if (jsonContent[i]["id"] === parseInt(req.params.id)) {
      jsonContent[i] = sentQuiz;
      break;
    }
  }

  var jsonString = JSON.stringify(jsonContent);
  fs.writeFile("data/allQuizzes.json", jsonString);

  res.send("updated");
});

router.delete('/quiz/:id', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  for (var i = 0; i < jsonContent.length; i++) {
    if (jsonContent[i]["id"] === parseInt(req.params.id)) {
      jsonContent.splice(i, 1);
      break;
    }
  }
  var jsonString = JSON.stringify(jsonContent);
  fs.writeFile("data/allQuizzes.json", jsonString);
  res.send("deleted");
});

router.get('/reset', function (req, res) {
  var readIn = fs.readFileSync("data/defaultallquizzes.json", 'utf8');
  // var readInAdded = fs.readFileSync("data/allQuizzes.json", 'utf8');
  // fs.writeFile("data/allQuizzesRevert.json", readInAdded);
  fs.writeFile("data/allQuizzes.json", readIn);
  res.send("default quizzes restored");
});

router.get('/revert', function (req, res) {
  var readIn = fs.readFileSync("data/allQuizzesRevert.json", 'utf8');
  fs.writeFile("data/allQuizzes.json", readIn);
  res.send("reverted");
});

router.get('/users', function (req, res) {
  var readUsers = fs.readFileSync("data/users.json", 'utf8');
  res.send(readUsers);
});

router.post('/users', function(req, res){
  var jsonString = JSON.stringify(req.body);
  fs.writeFile("data/users.json", jsonString);
  res.send(req.body);
});

router.get('/titles', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = "[";
  for (var i = 0; i<jsonContent.length; i++) {
    if (i < jsonContent.length -1)
      titles += "\"" + jsonContent[i]["title"] + "\"" + ", ";
    else
      titles += "\"" + jsonContent[i]["title"] + "\"";
  }
  titles += "]";
  res.send(titles);
});

router.get('/titlesandids', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = [];
  for (var i = 0; i<jsonContent.length; i++) {
    titles[i] = jsonContent[i]["title"];
    titles[jsonContent.length + i] = jsonContent[i]["id"];
  }
  res.send(JSON.stringify(titles));
});

module.exports = router;


