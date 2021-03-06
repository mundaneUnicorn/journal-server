var Sequelize = require('sequelize');
var sequelize = require('../config/db.js');


// Define the model that corresponds to the entry table in the database.
var User = sequelize.define('user', {
  username: {type: Sequelize.STRING, unique: true },
  password: Sequelize.STRING,
  fullname: Sequelize.STRING,
});

// Define the model that corresponds to the entry table in the database.
var Entry = sequelize.define('entry', {
  text: Sequelize.STRING,
  location: Sequelize.STRING,
  votes: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
    defaultValue: [],
  }
});


var Relationships = sequelize.define('relationships', {
  user1: Sequelize.INTEGER,
  user2: Sequelize.INTEGER
});

var Request = sequelize.define('request', {
  requestReceiver: Sequelize.INTEGER,
  status: Sequelize.STRING
}, {
  validate: {
    requestReceiverMustNotBeFriend: function(next) {
      Relationships.findOne({
        where: { user1: this.userId, user2: this.requestReceiver }
      })
        .then(function(friends) {
          if (friends) {
            next('requestReceiver must NOT be a friend');
          } else {
            next();
          }
        });
    },
    mustNotBeDuplicateRequest: function(next) {
      Request.findOne({ where: {
        userId: this.userId,
        requestReceiver: this.requestReceiver,
        status: this.status
      } })
        .then(function(exists) {
          if (exists) {
            next('Request already exists');
          } else {
            next();
          }
        });
    }
  }
});

var Comment = sequelize.define('comment', {
  message: Sequelize.TEXT('medium')
});

var Privacy = sequelize.define('privacy', {
  entryId: Sequelize.INTEGER,
  userId: Sequelize.INTEGER
});
// puts a UserId column on each Entry instance
// also gives us the `.setUser` method available
// after creating a new instance of Entry

/*
belongsTo means 1:1 relationship on the source model
*/

Entry.belongsTo(User);
Request.belongsTo(User);
Comment.belongsTo(User);
Comment.belongsTo(Entry);

User.hasMany(Entry);
User.hasMany(Request);
User.hasMany(Comment);
Entry.hasMany(Comment);

User.sync();
Relationships.sync();
Entry.sync();
Request.sync();
Comment.sync();
Privacy.sync();

module.exports.User = User;
module.exports.Privacy = Privacy;
module.exports.Entry = Entry;
module.exports.Relationships = Relationships;
module.exports.Request = Request;
module.exports.Comment = Comment;

module.exports.sequelize = sequelize;