var db = require('../models/Database.js');
var _ = require('underscore');

module.exports = {
  getPrivacy: function(req, res, next) {
    db.Privacy.create({
      entryId: 42069,
      userId: 69
    })
    .then(function(privacy) {
      res.send(privacy);
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
      entriesToAdd.forEach(function(entry) {
        rowsToInsert.push({
          entryId: req.body.entryId,
          userId: entry
        });
      })
      var addPrivacy = db.Privacy.bulkCreate(rowsToInsert);

      return [removePrivacy, addPrivacy];
    })
    .spread(function(removed, added) {
      console.log('Privacy rows removed: ', removed);
      console.log('Privacy rows inserted: ', added.length);
      res.send('success');
    })
    .catch(function(err) {
      res.status(500).send('Error');
    });
  }
};