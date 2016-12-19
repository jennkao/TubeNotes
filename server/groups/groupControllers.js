var db = require('../schemas');
var Sequelize = require('sequelize');

module.exports = {
  postGroup: function(req, res) {
    var groupname = req.body.groupname;
    db.Group.findOrCreate({where: {groupname: groupname}})
    .then(function(group) {
      res.status(201).send(JSON.stringify(group));
    });
  },

  getGroups: function(req, res) {
    db.Group.findAll().then(function(groups) {
      res.status(200).send(JSON.stringify(groups));
    });
  },

  joinGroup: function(req, res) {
    db.User.findOne({where: {username: req.body.username}})
    .then(function(user) {
      if (!user) {
        res.send('User does not exist!');
      } else {
        var userid = user.get('id');
        db.GroupUser.findOrCreate({where: {
          UserId: userid, 
          GroupId: req.body.groupId
        }})
        .then(function(groupUser) {
          res.status(201).send('successfully joined group');
        });
      }
    });
  },

  postGroupVid: function(req, res) {
    db.Video.findOrCreate({where: {
      url: 'youtube.com/embed/' + req.body.video.id,
      title: req.body.video.title,
      image: req.body.video.image
    }})
    .then(function(video) {
      db.Group.findOne({where: {groupname: req.body.groupname}})
      .then(function(group) {
        db.GroupVideo.findOrCreate({where: {
          GroupId: group.get('id'),
          VideoId: video[0].get('id')
        }})
        .then(function(data) {
          console.log(data);
          res.status(201).send(JSON.stringify(data));
        });
      });
    });
  },

  getGroupVids: function(req, res) {
    db.Video.findAll({
      include: [{
        model: db.Group,
        required: true,
        through: {
          where: {
            GroupId: req.query.groupId
          }
        }
      }]
    }).then(function(vids) {
      res.status(200).send(JSON.stringify(vids));
    });
  },

  getUserGroups: function(req, res) {
    db.User.findOne({where: {username: req.query.username}})
    .then(function(user) {
      if (!user) {
        res.send('User does not exist!');
      } else {
        db.Group.findAll({
          include: [{
            model: db.User,
            required: true,
            through: {
              where: {
                UserId: user.get('id'),
              }
            }
          }]
        })
        .then(function(groups) {
          res.status(200).send(JSON.stringify(groups));
        });
      }
    });
  },

  postGroupComments: function(req, res) {
    console.log(req.body);
    db.User.findOne({where: {username: req.body.username}})
    .then(function(user) {
      console.log(user);
      db.Comment.create({
        text: req.body.note,
        timestamp: req.body.startTime,
        UserId: user.get('id'),
        VideoId: req.body.video.videoTableId,
        group: req.body.groupId
      })
      .then(function(comment) {
        db.GroupComment.create({
          GroupId: req.body.groupId,
          CommentId: comment.get('id')
        })
        .then(function() {
          res.status(201).send('successfully posted group comment');
        });
      });
    });
  },

  transferGroupComments: function(req, res) {
    var comments = req.body.comments;
    for (var i = 0; i < comments.length; i++) {
      db.Comment.findOne({where: {
        text: comments[i].text,
        timestamp: comments[i].timestamp
      }})
      .then(function(comment) {
        console.log(comment);
        db.GroupComment.create({
          GroupId: req.body.groupId,
          CommentId: comment.get('id')
        });
      });
    }
  },
  
  getGroupComments: function(req, res) {
    db.Comment.findAll({
      where: {
        VideoId: req.query.videoId
      },
      include: [{
        model: db.Group,
        required: true,
        through: {
          where: {
            GroupId: req.query.groupId
          }
        }
      }, {
        model: db.User
      }]
    }).then(function(comments) {
      res.status(200).send(JSON.stringify(comments));
    });
  },

  searchGroups: function(req, res) {
    db.Group.findAll({where: {groupname: req.query.groupname}})
      .then(function(groups) {
        if (!groups) {
          res.status(404).send('Group not found');
        } else {
          res.status(200).send(JSON.stringify(groups));
        }
      });
  },

  deleteGroupComment: function(req, res) {
    db.Comment.findOne({where: {
      text: req.body.comment.text,
    }})
    .then(function(comment) {
      db.GroupComment.destroy({
        where: {
          CommentId: comment.get('id')
        }
      })
      .then(function(data) {
        res.status(200).send(JSON.stringify(data));
      });
    });
  }
};





