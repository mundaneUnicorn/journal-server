var db = require('../models/Database.js');
var _ = require('underscore');

module.exports = {
  getPrivacy: function(req, res, next) {
    db.Privacy.findAll({
      where: {
        entryId: req.query.entryId
      }
    })
    .then(function(results) {
      var privacies = [];
      results.forEach(function(result) {
        privacies.push(result.dataValues);
      });
      var responseObject = {
        privacies: privacies,
        currentUserId: req.user.id
      }
      res.send(responseObject);
    })
    .catch(function(err) {
      res.status(500).send(err);
    });
  },

  setPrivacy: function(req, res, next) {
    //query for all things in entry id
    db.Privacy.findAll({
      where: {
        entryId: req.body.entryId
      }
    })
    .then(function(results) {
      //create an array of existing user ids
      var existingUserIds = [];
      results.forEach(function(privacySetting) {
        existingUserIds.push(privacySetting.dataValues.userId);
      });
      var newUserIds = req.body.userIds;

      //in existing but not new
      var entriesToRemove = _.difference(existingUserIds, newUserIds);
      var removePrivacy = db.Privacy.destroy({
        where: {
          entryId: req.body.entryId,
          userId: entriesToRemove
        }
      });
      
      //in new but not existing
      var entriesToAdd = _.difference(newUserIds, existingUserIds);
      var rowsToInsert = [];
      //set private
      console.log(req.user.id);
      if (req.body.userIds.length === 1 && req.body.userIds[0] < 0) {
        console.log('PRIVATE');
        rowsToInsert.push({
          entryId: req.body.entryId,
          userId: req.user.id
        });
      //not private
      } else {
        console.log('NOT PRIVATE');
        //add user id if not public
        if (req.body.userIds.length > 0) {
          entriesToAdd.unshift(req.user.id);
        }
        
        entriesToAdd.forEach(function(entry) {
          rowsToInsert.push({
            entryId: req.body.entryId,
            userId: entry
          });
        })

      }
      console.log('entries ', entriesToAdd);
      console.log('rows: ', rowsToInsert);
      var addPrivacy = db.Privacy.bulkCreate(rowsToInsert);

      return [removePrivacy, addPrivacy];
    })
    .spread(function(removed, added) {
      res.send('success');
    })
    .catch(function(err) {
      res.status(500).send('Error');
    });
  }
};