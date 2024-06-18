var express = require('express')
var app = express()
const businesses = require("./data/businesses.json")
const reviews = require("./data/reviews.json")
const photos = require("./data/photos.json")

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

var port = 1121

app.get('/',function(req,res,next){
    console.log("Home Page")
    next()
})


//all businesses
app.get('/businesses',function(req,res,next){
    console.log("Grab Business Info")
    var page = parseInt(req.query.page) || 1
    var numPerPage = 4
    var lastPage = Math.ceil(businesses.length/numPerPage)
    page = page < 1 ? 1 : page
    page = page > lastPage ? lastPage : page
    var start = (page - 1) * numPerPage
    var end = start + numPerPage
    var pageBusinesses = businesses.slice(start,end)

    var links = {}

    if(page <lastPage){
        links.nextPage = '/businesses?page=' + (page + 1)
	    links.lastPage = '/businesses?page=' + lastPage
    }
    if(page > 1){
        links.prevPage = 'businesses?page=' + (page-1)
        links.firstPage = 'businesses?page='+ 1
    }

    res.status(200).send({
        pageNumber: page,
        totalPages: lastPage,
        pageSize: numPerPage,
        totalCount: businesses.length,
        businesses:pageBusinesses,
        links:links
    }) 
})

//specific business
app.get('/businesses/:businessID',function(req,res,next){
    console.log("Grab Business Info Specific ID")
    var businessID = parseInt(req.params.businessID)
    if(businesses[businessID]){
        var business = businesses[businessID]
        var businessReviews= []
        var businessPhotos = []
        for (var i = 0; i< reviews.length;i++){
            if(reviews[i].businessid==businessID){
                businessReviews.push(reviews[i])
            }
        }
        var j=0

        for (var j = 0; j< photos.length; j++){
            if(photos[j].businessid==businessID){
                businessPhotos.push(photos[j])
            }
        }
        res.status(200).send({
            businessInfo: business,
            review: businessReviews,
            photos: businessPhotos
        })
    }
})

//create new business

app.post('/businesses',function(req,res,next){
    if (
        req.body &&
        req.body.name &&
        req.body.address &&
        req.body.city &&
        req.body.state &&
        req.body.zip &&
        req.body.phone &&
        req.body.category &&
        req.body.subcategory &&
        req.body.website &&
        req.body.email
    ) {
        // All fields present
        const id = businesses.length;
        res.status(201).send({
            id: id,
            ownerid: id,
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            phone: req.body.phone,
            category: req.body.category,
            subcategory: req.body.subcategory,
            website: req.body.website,
            email: req.body.email
        });
    } else if (
        req.body &&
        req.body.name &&
        req.body.address &&
        req.body.city &&
        req.body.state &&
        req.body.zip &&
        req.body.phone &&
        req.body.category &&
        req.body.subcategory
    ) {
        // All required fields except website and email
        const id = businesses.length;
        res.status(201).send({
            id: id,
            ownerid: id,
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            phone: req.body.phone,
            category: req.body.category,
            subcategory: req.body.subcategory
        });
    } else {
        // Missing required fields
        res.status(400).send({
            err: "Bad Request: Missing Required Info"
        });
    }
})

// remove a business

app.delete('/businesses/:businessID',function(req,res,next){
    var businessID = parseInt(req.params.businessID)
    if(businesses[businessID]){
        businesses[businessID] = null
        res.status(200).send({
            msg: "Deleted"
        })
    }
    else{
        res.status(404).send({
            err:"Entry Not Found"
        })
    }
})

app.put('/businesses/:businessID',function(req,res,next){
    var businessID = parseInt(req.params.businessID)
    if(businesses[businessID]){
        if(req.body &&
            req.body.name &&
            req.body.address &&
            req.body.city &&
            req.body.state &&
            req.body.zip &&
            req.body.phone &&
            req.body.category &&
            req.body.subcategory
        ){
            businesses[businessID] = req.body
            res.status(200).send({
                business: businesses[businessID]
            })
        }
        else{
            res.status(400).send({
                err: "Missing Necessary Info"
            })
        }
    }
    else{
        res.status(404).send({
            err: "Entry Not Found"
        })
    }
})

app.post('/photos/:businessID',function(req,res,next){
    var businessID = parseInt(req.params.businessID)
    if(businesses[businessID]){
        if(req.body && req.body.userid && req.body.caption){
            var id = photos.length
            res.status(200).send({
                id: id,
                businessid: businessID,
                userid:req.body.userid,
                caption: req.body.caption
            })
        }
        else if(req.body && req.body.userid){
            var id = photos.length
            res.status(200).send({
                id: id,
                businessid: businessID,
                userid:req.body.userid,
            })
        }
        else{
            res.status(400).send({
                err: "Some info Missing"
            })
        }
    }
    else{
        res.status(404).send({
            err: "Entry Doesn't Exist"
        })
    }
})

app.put('/photos/:photoID',function(req,res,next){
    var photoID = parseInt(req.params.photoID)
    if(photos[photoID]){
        if(req.body && req.body.caption){
            photos[photoID].caption = req.body.caption
            res.status(200).send({
                photo: photos[photoID]
            })
        }
        else{
            res.status(400).send({
                err: "Missing Required Info"
            })
        }
    }
    else{
        res.status(404).send({
            err:"Entry Not Found"
        })
    }
})

//specific photo
app.delete('/photos/:photoID/:userID',function(req,res,next){
    var photoID = parseInt(req.params.photoID)
    var userID = parseInt(req.params.userID)
    if(photos[photoID]){
        if(photos[photoID].userid==userID){
            photos[photoID] = null
            res.status(200).send({
                msg: "Deleted"
            })
        }
        else{
            res.status(400).send({
                err: "Insufficient Permission"
            })
        }
    }
    else{
        res.status(404).send({
            err:"Entry Not Found"
        })
    }
})

//Make new review
app.post('/reviews/:businessID',function(req,res,next){
    var businessID = parseInt(req.params.businessID)
    if(businesses[businessID]){
        var id = reviews.length
        if(req.body && req.body.userid && req.body.dollars && req.body.stars && req.body.review){
            res.status(200).send({
                id: id,
                userid:req.body.userid,
                businessid: businessID,
                dollars:req.body.dollars,
                stars: req.body.stars,
                review: req.body.review
            })
        }
        else if(req.body && req.body.userid && req.body.dollars && req.body.stars){
            res.status(200).send({
                id: id,
                userid:req.body.userid,
                businessid: businessID,
                dollars:req.body.dollars,
                stars: req.body.stars
            })
        }
        else{
            res.status(400).send({
                err: "Some info Missing"
            })
        }
    }
    else{
        res.status(404).send({
            err: "Entry Doesn't Exist"
        })
    }
})

app.put('/reviews/:reviewID',function(req,res,next){
    var reviewID = parseInt(req.params.reviewID)
    if(reviews[reviewID]){
        if(req.body && req.body.userid && req.body.dollars && req.body.stars){
            reviews[reviewID] = req.body
            res.status(200).send({
                review: reviews[reviewID]
            })
        }
        else{
            res.status(400).send({
                err: "Some info Missing"
            })
        }
    }
    else{
        res.status(404).send({
            err: "Entry Doesn't Exist"
        })
    }
})

//specific review
app.delete('/reviews/:reviewID/:userID',function(req,res,next){
    var reviewID = parseInt(req.params.reviewID)
    var userID = parseInt(req.params.userID)
    if(reviews[reviewID]){
        if(reviews[reviewID].userid==userID){
            reviews[reviewID] = null
            res.status(200).send({
                msg: "Deleted"
            })
        }
        else{
            res.status(400).send({
                err: "Insufficient Permission"
            })
        }
    }
    else{
        res.status(404).send({
            err:"Entry Not Found"
        })
    }
})

app.get('/users/businesses/:userID',function(req,res,next){
    var userBusinesses= []
    var userID = parseInt(req.params.userID)
    for (var i = 0; i< businesses.length;i++){
        if(businesses[i].ownerid==userID){
            userBusinesses.push(businesses[i])
        }
    }
    res.status(200).send({
        businesses:userBusinesses
    })
})

app.get('/users/reviews/:userID',function(req,res,next){
    var userReviews= []
    var userID = parseInt(req.params.userID)
    for (var i = 0; i< reviews.length;i++){
        if(reviews[i].userid==userID){
            userReviews.push(reviews[i])
        }
    }
    res.status(200).send({
        reviews:userReviews
    })
})

app.get('/users/photos/:userID',function(req,res,next){
    var userPhotos= []
    var userID = parseInt(req.params.userID)
    for (var i = 0; i< photos.length;i++){
        if(photos[i].userid==userID){
            userPhotos.push(photos[i])
        }
    }
    res.status(200).send({
        photos:userPhotos
    })
})

app.listen(port, function () {
	console.log("== Server is listening on port", port)
})

