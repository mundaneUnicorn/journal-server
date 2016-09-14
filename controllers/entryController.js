var db = require('../models/Database.js');

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
    if (req.query.userId && (req.query.userId !== req.user.id.toString())) {
      // check if req.query.userId is in friendlist
      db.Relationships.findOne({ 
        where: { user1: req.user.id, user2: req.query.userId }
      })
        .then(function(friends) {
          if (friends) {
            // send entries
            db.Entry.findAll({ 
              where: { userId: req.query.userId },
              order: [['createdAt', 'DESC']]
            })
              .then(function(entries) {
                res.send(entries);
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
    db.Entry.findAll({
      where: {
        id: req.body.entryId,
      }
    })
    .then(function (response) {
      var rating = response[0].dataValues.rating;
      console.log(rating);
      db.Entry.update({
        rating: rating + 1,
      }, {
        where: {
          id: req.body.entryId,
        }
      }).then(function (response) {
        res.send('Okay!');
      });
      
    });
  },

  //Deletes an entry and returns a copy of that entry
  deleteEntry: (req, res, next) => {
    let deletedEntry;
    console.log('request body: ', req.body);
    //find relevant entry
    db.Entry.findOne({
      where: req.body
    })
    .then(entry => {
      console.log('entry found: ', entry.dataValues);
      //store entry temporarily to send
      deletedEntry = entry.dataValues;
      //delete entry
      return db.Entry.destroy({
        where: entry.dataValues
      });
    })
    .then(() => {
      //send back temp entry
      res.send(deletedEntry);
    })
    .catch(error => {
      console.log('Error deleting entry: ', error);
    })
  }
};