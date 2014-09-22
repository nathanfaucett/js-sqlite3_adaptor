global.collection = require("./collection");


global.User = collection.models.User,
global.Cart = collection.models.Cart;


global.User_test = function() {
    console.time("User.test");
    User.find(function(err, users) {
        console.timeEnd("User.test");
        console.log(users);
    });
};
global.Cart_test = function() {
    console.time("Cart.test");
    Cart.find(function(err, carts) {
        console.timeEnd("Cart.test");
        console.log(carts);
    });
};


var UID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function uid(length) {
    var str = "";
    length || (length = 24);
    while (length--) str += UID_CHARS[(Math.random() * 62) | 0];
    return str;
};


User.on("init", function() {

    this.on("beforeCreate", function(model) {

        model.password = uid();
    });
});


collection.init(function(err) {
    if (err) {
        console.log(err);
        return;
    }

    require("./seed")(function(errs) {
        if (errs) {
            console.log(errs);
            return;
        }

        User_test();
        Cart_test();
    });
});
