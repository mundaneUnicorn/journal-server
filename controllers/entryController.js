var db = require('../models/Database.js');
var _ =  require('underscore');

module.exports = {

  createEntry: function(req, res, next) {
    var query = req.body;
    query['userId'] = req.user.id;

    db.Entry.create(query)
      .then(function(newEntry) {
        res.send('Success');
      })
      .catch(function(err) {
        res.status(404).json(err);
      });
  },

  getEntries: function(req, res, next) {
    if (req.query.userId && req.query.userId === '*') {
      // check if req.query.userId is in friendlist
      console.log('Querying all users.');
      db.Relationships.findAll({ 
        where: { user1: req.user.id }
      })
      .then(function(friends) {
        var messages = [];
        var queryCounter = 0;
        var queryTarget = friends.length;
        friends.forEach(function (friendObject) {
          db.Entry.findAll({ 
            where: { userId: friendObject.dataValues.user2 },
            order: [['createdAt', 'DESC']]
          }).then(function (retrievedMessages) {
            queryCounter++;
            messages = messages.concat(retrievedMessages);
            
            if (queryCounter >= queryTarget) {
              messages.sort(function (a, b) {
                return b.dataValues.votes.length - a.dataValues.votes.length;
              });
              res.send(messages);
            }
          }).catch(function (error) {
            queryCounter++;
            if (queryCounter >= queryTarget) {
              res.send(messages);
            }
          });
        });
      });
    } else if (req.query.userId && (req.query.userId !== req.user.id.toString())) {
      // check if req.query.userId is in friendlist
      console.log('Querying a specific friend.');
      db.Relationships.findOne({ 
        where: { 
          user1: req.user.id, 
          user2: req.query.userId
        }
      })
      .then(function(friends) {
        if (friends) {
          var allEntries;
          db.Entry.findAll({ 
            where: { userId: req.query.userId },
            order: [['createdAt', 'DESC']]
          })
          .then(function(results) {
            allEntries = _.map(results, function(result) {
              return result.dataValues;
            });
            var entryIds = _.map(allEntries, function(entry) {
              return entry.id;
            });

            return db.Privacy.findAll({
              where: {
                entryId: {
                  $in: entryIds
                }
              }
            });
          })
          .then(function(results) {
            var privacies = _.map(results, function(result) {
              return {
                entryId: result.dataValues.entryId,
                userId: result.dataValues.userId
              }
            });

            var viewableEntries = [];
            allEntries.forEach(function(entry) {
              var addEntry = false;
              var encountered = false;
              for (var i = 0; i < privacies.length; i++) {
                //is private entry
                if (entry.id === privacies[i].entryId) {
                  encountered = true;
                  //matching user
                  if (req.user.id === privacies[i].userId) {
                    addEntry = true;
                  }
                }
              }
              //is public
              if (!encountered) {
                addEntry = true;
              }
              if (addEntry) {
                viewableEntries.push(entry);
              }
            });

            res.send(viewableEntries);
          })
          .catch(function(err) {
            res.status(404).json(err);
          });
        } else {
          res.status(404).json({ error: 'you are not friends'});
        }
      })
      .catch(function(err) {
        res.status(404).json(err);
      });
    } else {
      console.log('Getting your own posts!');
      db.Entry.findAll({ 
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      })
      .then(function(entries) {
        res.send(entries);
      })
      .catch(function(err) {
        res.status(404).json({error: 'Error retrieving entires: ' + err});
      });
    }
  },

  likeEntry: function (req, res, next) {
    // TODO:  Write function that queries database to get a specific entry,
    //        and increments its rating.
    db.Entry.findOne({
      where: {
        id: req.body.entryId,
      }
    })
    .then(function (response) {
      var votesArray = JSON.parse(JSON.stringify(response.dataValues.votes));
      var userIndex = votesArray.indexOf(req.body.user);
      if (userIndex === -1) {
        votesArray.push(req.body.user);
      } else {
        votesArray.splice(userIndex, 1);
      }


      db.Entry.update({
        votes: votesArray,
      }, {
        where: {
          id: req.body.entryId,
        }
      }).then(function (response) {
        res.send(JSON.stringify(votesArray.length));
      });
    });
  },

  //Deletes an entry and sends a copy of that entry
  deleteEntry: function(req, res, next) {
    var deletedEntry;

    //find entry
    db.Entry.findOne({
      where: req.body
    })
    //delete entry
    .then(function(entry) {
      deletedEntry = entry.dataValues;
      return db.Entry.destroy({
        where: entry.dataValues
      });
    })
    //send response
    .then(function() {
      res.send(deletedEntry);
    })
    .catch(function(error) {
      console.log('ENTRY DELETION ERROR: ', error);
      res.status(500).send('Error');
    });
  }
};