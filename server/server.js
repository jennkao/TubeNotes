var http = require('http');
var express = require('express');
var morgan = require('morgan');
var app = express();
var jwt = require('jwt-simple');
var userControllers = require('./users/userControllers.js');
var groupControllers = require('./groups/groupControllers.js');
// var cloudinary = require('cloudinary');
var fs = require('fs');
var request = require('request');

// cloudinary.config({
//   cloud_name: 'dhdysf6qc',
//   api_key: '299727653385491',
//   api_secret: 'vshmxkEjzRiylUjrXi20qk67hKA'
// });

var path = require('path');
var bodyParser = require('body-parser');

// Import the three collections from schemas
var db = require('./schemas');
var Sequelize = require('sequelize');

app.use(bodyParser.urlencoded({'extended': 'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(morgan('dev'));

// This is the get request to get all the videos of a certain user, along with their comments
app.get('/videos', function (req, res) {
  // Username is passed in from the get request as req.query.username
  // Initialize a results array to send back to the client
  var results = [];
  // Find a user in the database based on their username
  db.User.findOne({where: {username: req.query.username}}).then(function (user) {
    // Find all the videos that the found user has written notes on
    db.Video.findAll({where: {userId: user.id}}).then(function (videos) {
      // Loop through every found video
      for (let i = 0; i < videos.length; i++) {
        // Find all the comments on that certain video
        db.Comment.findAll({where: {
          videoId: videos[i].get('id'),
          group: null
        }}).then(function (comments) {
          // Create a new video object that will be pushed into the results array
          var videoObject = {
            url: videos[i].url,
            title: videos[i].title,
            comments: comments,
            image: videos[i].image,
            createdAt: videos[i].createdAt,
            lastCommentDate: comments[comments.length - 1].createdAt
          };
          results.push(videoObject);
          // When we get to the end of the videos array, send the results array back to the client
          // (for async reasons)
          if (i === videos.length - 1) {
            res.send(results);
          }
        });
      }
    });
  });
});

// This is the post request for when a user submits a note on a video
app.post('/comment-video', function (req, res) {
  console.log('post');
  // Find a user in the database based on the passed in username
  db.User.findOrCreate({
    where: {
      username: req.body.username
    }
  })
    .then(function(user) {
      // Create a new video to post to the database linked to that user
      db.Video.findOrCreate({where: {
        url: req.body.videoUrl,
        UserId: user[0].get('id'),
        title: req.body.videoTitle,
        image: req.body.image
      }})
      .then(function (video) {
        // Create a new note to post to the database linked to that user and video
        // video[0].updateAttributes();
        db.Comment.create({
          text: req.body.commentText,
          timestamp: req.body.timestamp,
          UserId: user[0].get('id'),
          VideoId: video[0].get('id')
        });
      });
    });
  res.status(201).send('sent');
});

// uploads annotations
app.post('/uploadAnnotation', function(req, res) {
  console.log('hits server uploadAnnotation post');
  console.log('req.body: ', req.body);
  fs.open('test.js', 'w', function(err, fd) {
    if (err) {
      throw err;
    } else {
      fs.writeFile(path.join(__dirname, '/test.js'), JSON.stringify(req.body), function(err, data) {
        if (err) {
          console.log('error');
          throw err;
        }
<<<<<<< fca3cd9a3362e61797b0521f519987bc5b730e2c
        console.log('pathname: ', path.join(__dirname, '/test.js'));
        // cloudinary.v2.uploader.upload(path.join(__dirname, '/test.js'),
        //   { resource_type: "raw" },
        //   function(error, result) {
        //     if (error) {
        //       throw error;
        //     }
        //     console.log('result: ', result);
        //   });
=======
        db.User.findOrCreate({
          where: {
            username: req.body.user
          }
        })
        .then(function(user) {
          db.Video.findOrCreate({ where: {
            url: 'youtube.com/embed/' + req.body.video.id,
            UserId: user[0].get('id'),
            title: req.body.video.title,
            image: req.body.video.image      
          }})
          .then(function(video) {
            cloudinary.v2.uploader.upload(path.join(__dirname, '/test.js'),
            { resource_type: 'raw' },
            function(error, result) {
              if (error) {
                console.log(error);
              }
              console.log(result);
              db.Video.update(
              { annotation: result.url},
              { where: {id: video[0].get('id')}}
              )
              .then(function(data) {
                res.status(201).send(JSON.stringify(data));
              });
            });
          });
        });
>>>>>>> allow users to save annotations
      });
    }
  })
    res.send();
  });

// send delete request to DB to delete a comment by timestamp
app.delete('/deletecomment', function(req, res) {
  db.Comment.destroy({
    where: {
      timestamp: req.body.comment.timestamp
    }
  })
});

// send delete request to DB to delete a video by video id
app.delete('/deletevideo', function(req, res) {
  db.Video.destroy({
    where: {
      id: req.body.video.comments[0].VideoId
    }
  })
})

app.post('/annotations', function(req, res) {
  db.Video.findOne({
    where: {
      id: req.body.video.videoTableId
    }
  })
  .then(function(video) {
    request.get(video.get('annotation'), function(err, response) {
      console.log(response.body);
      res.status(200).send(response.body);
    });
  });
});

// Look into the userControllers folder for the signup and login method
app.post('/users/signup', userControllers.signup);
app.post('/users/login', userControllers.login);

app.post('/groups', groupControllers.postGroup);
app.get('/groups', groupControllers.getGroups);
app.post('/groupUsers', groupControllers.joinGroup);
app.get('/groupUsers', groupControllers.getUserGroups);
app.post('/groupVids', groupControllers.postGroupVid);
app.get('/groupVids', groupControllers.getGroupVids);
app.post('/groupComments', groupControllers.postGroupComments);
app.get('/groupComments', groupControllers.getGroupComments);
app.get('/searchGroups', groupControllers.searchGroups);
app.post('/transferGroupComments', groupControllers.transferGroupComments);
app.delete('/groupComments', groupControllers.deleteGroupComment);

app.get('/searchGroups', groupControllers.searchGroups);

app.use(express.static(path.join(__dirname, '../public')));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});