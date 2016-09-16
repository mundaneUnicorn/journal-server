var db = require('../models/Database.js');

module.exports = {

  saveComment: function(req, res, next) {
    var text = req.body.text;
    var comment = req.body.comment;
    var user = req.user.id;
    res.status(200).json({HEY: req.body});
    db.Entry.findOne({
      where: {
        text: text
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
  }
}