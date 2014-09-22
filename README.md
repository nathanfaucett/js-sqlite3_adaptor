ORM
=======

object relational mapping for node.js

###Usage

create a new Collection

```javascript
var orm = require("orm");

var collection = orm({

    schema: {
        timestamps: true
    },

    adaptors: {
        memory: new orm.MemoryAdaptor()
    }
});

collection.bindModels(
    require("./path/to/user_model"),
    require("./path/to/other_model")
);

module.exports = collection;
```

define a Model

```javascript
var orm = require("orm");

var User = orm.define({
    name: "User",
    
    schema: {
        email: {
            type: "string",
            unique: true
        },
        password: "string"
    }
});

User.validates("email")
    .required()
    .email();

User.validates("password")
    .required()
    .minLength(6);

User.prototype.emailPassword = function() {
  
    return this.email +" "+ this.password;
};

module.exports = User;
```

```javascript
var collection = require("../collection");

collection.models.User.adaptor = "memory";

collection.init(function(err) {
    if (err) {
        console.log(err.message);
        return;
    }
    
    // start application
});
```