var db = require('../models/Database.js');

module.exports = {

  saveComment: function(req, res, next) {
    var id = req.body.id;
    var comment = req.body.comment;
    var user = req.user.id;
    res.status(200).json({HEY: req.body});
    db.Entry.findOne({
      where: {
        id: id
      }
    }).then(function(result) {
      db.Comment.create({
        entryId: result.dataValues.id,
        userId: user,
        message: comment
      })
    }).then(function(result) {
      res.status(200).json(result);
    }).catch(function(err) {
      res.status(400).json(err);
    })
  },

  getComments: function(req, res, next) {
    db.sequelize.query(`SELECT comments.message, users.fullname, comments."createdAt" FROM comments INNER JOIN users ON comments."userId" = users."id" WHERE "entryId" = ${req.query.postID}`)
    .then(function(results) {
      res.status(200).send(results[0]);
    }).catch(function(error) {
      res.send(404);
    })
  }

}