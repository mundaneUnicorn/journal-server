var db = require('../models/Database.js');

module.exports = {

  fetchFriends: function(req, res, next) {
    db.Relationships.findAll({ where: {user1: req.user.id }})
      .then(function(friends) {
        var query = friends.reduce(function(total, friend) {
          total.push(friend.dataValues.user2);
          return total;
        }, []);
        db.User.findAll({
          attributes: ['id', 'username', 'fullname'],
          where: {
            id: {
              $any: query
            }
          }
        })
          .then(function(friendList) {
            res.status(201).json(friendList);
          })
          .catch(function(err) {
            res.status(404).json(err);
          });
      })
      .catch(function(err) {
        res.status(404).json(err);
      });
  },

  acceptFriendReq: function(req, res, next) {
    var rev = {
      user1: req.body.user2,
      user2: req.body.user1
    };

    var query = [req.body, rev];

    db.Relationships.bulkCreate(query)
      .then(function() {
        return db.Relationships.findAll();
      })
      .then(function(relationships) {
        res.status(201).send('Success');
      })
      .catch(function(err) {
        res.status(404).json(err);
      });
  },

  deleteFriend: function (req, res, next) {
    // TODO: Implement me!
    db.Users.findOne({
      where: { username: req.body.friend },
    }).then(function (response) {
      
      db.Relationships.destroy({
        where: { 
          user1: req.user.id,
          user2: response.dataValues.id,
        },
      });

      db.Relationships.destroy({
        where: {
          user2: req.user.id,
          user1: response.dataValues.id,
        },
      });

      res.send('Okey-dokey, Smokey!');
    });
  },
};