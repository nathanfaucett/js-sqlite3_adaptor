var utils = require("utils"),
    type = require("type"),
    sqlite3 = require("sqlite3");


function SQLite3Adaptor(options) {
    options || (options = {});

    if (options.verbose === true) sqlite3.verbose();

    this.file = type.isString(options.file) ? options.file : "db/sqlite.db";
    this.sql = null;
}

SQLite3Adaptor.prototype.init = function(callback) {

    this.sql = new sqlite3.Database(this.file, callback);
    return this;
};

SQLite3Adaptor.prototype.save = function(tableName, params, callback) {
    var _this = this;

    this.sql.get("INSERT INTO " + tableName + " " + parseAttributes(params) + ";", function(err) {
        if (err) {
            callback(err);
            return;
        }

        _this.findOne(tableName, {
            where: params,
            limit: 1
        }, callback);
    });
    return this;
};

SQLite3Adaptor.prototype.update = function(tableName, params, callback) {
    var _this = this;

    this.sql.get("UPDATE " + tableName + " " + parseAttributes(params) + ";", function(err) {
        if (err) {
            callback(err);
            return;
        }

        _this.findOne(tableName, {
            where: params,
            limit: 1
        }, callback);
    });
    return this;
};

SQLite3Adaptor.prototype.find = function(tableName, query, callback) {
    var where = parseWhere(query.where);

    this.sql.all("SELECT * FROM " + tableName + (!!where ? " WHERE " + where : "") + ";", callback);
    return this;
};

SQLite3Adaptor.prototype.findOne = function(tableName, query, callback) {
    var where = parseWhere(query.where);

    this.sql.get("SELECT * FROM " + tableName + (!!where ? " WHERE " + where : "") + ";", callback);
    return this;
};

SQLite3Adaptor.prototype.destroy = function(tableName, params, callback) {

    this.sql.get("DELETE FROM " + tableName + " WHERE id=" + params.id + ";", callback);
    return this;
};

SQLite3Adaptor.prototype.destroyWhere = function(tableName, query, callback) {
    var where = parseWhere(query.where);

    this.sql.all("DELETE FROM " + tableName + (!!where ? " WHERE " + where : "") + ";", callback);
    return this;
};

SQLite3Adaptor.prototype.createTable = function(tableName, columns, options, callback) {

    this.sql.exec("CREATE TABLE IF NOT EXISTS " + tableName + "(\n" + parseTable(columns) + "\n);", callback);
    return this;
};

SQLite3Adaptor.prototype.renameTable = function(tableName, newTableName, callback) {

    this.sql.exec("ALTER TABLE " + tableName + " RENAME TO " + newTableName + ";", callback);
    return this;
};

SQLite3Adaptor.prototype.removeTable = function(tableName, callback) {

    this.sql.exec("DROP TABLE IF EXISTS " + tableName + ";", callback);
    return this;
};

SQLite3Adaptor.prototype.addColumn = function(tableName, columnName, column, options, callback) {

    this.sql.exec("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + propertyToSQL(column) + ";", callback);
    return this;
};

SQLite3Adaptor.prototype.renameColumn = function(tableName, columnName, newColumnName, callback) {

    callback(new Error("renameColumn(tableName, columnName, newColumnName, callback) SQLite3Adaptor not implemented"));
    return this;
};

SQLite3Adaptor.prototype.removeColumn = function(tableName, columnName, callback) {

    callback(new Error("removeColumn(tableName, columnName, callback) SQLite3Adaptor not implemented"));
    return this;
};

SQLite3Adaptor.prototype.addIndex = function(tableName, columnName, options, callback) {

    callback(new Error("addIndex(tableName, columnName, options, callback) SQLite3Adaptor not implemented"));
    return this;
};

SQLite3Adaptor.prototype.removeIndex = function(tableName, columnName, options, callback) {

    callback(new Error("removeIndex(tableName, columnName, options, callback) SQLite3Adaptor not implemented"));
    return this;
};

SQLite3Adaptor.prototype.removeDatabase = function(callback) {
    var fs = require("fs");

    fs.unlink(this.file, callback);
    return this;
};

var COMPARISON_TYPES = {
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
    eq: "=",
    neq: "!="
};

function parseWhere(obj) {
    var isHash = type.isHash,
        keys = utils.keys(obj),
        i = keys.length,
        str = [],
        name, value, compType;

    while (i--) {
        name = keys[i];
        value = obj[name];

        if (isHash(value)) {
            compType = COMPARISON_TYPES[value.type];
            value = value.value;
        } else {
            compType = "=";
        }

        if (value) str.push(name + compType + dataToValue(value));
    }

    return str.join(" AND ");
}

function parseAttributes(obj) {
    var keys = utils.keys(obj),
        i = keys.length,
        j = 0,
        names = [],
        values = [],
        key, value;

    while (i--) {
        key = keys[i];
        value = obj[key];

        if (value) {
            names[j] = key;
            values[j] = dataToValue(value);
            j++;
        }
    }

    return "(" + names.join(", ") + ") VALUES (" + values.join(", ") + ")";
}

function dataToValue(value) {
    if (value instanceof Date) {
        return value.getTime();
    } else if (typeof(value) === "string") {
        return value[0] === "\"" ? value : "\"" + value + "\"";
    }

    return value;
}

function parseTable(obj) {
    var str = [],
        value;

    for (var key in obj) {
        value = obj[key];
        str.push("\t" + key + " " + propertyToSQL(value));
    }

    return str.join(",\n");
}

function dataType(attribute) {
    var type = (attribute.type || "string").toLowerCase(),
        limit = +attribute.limit,
        ftype;

    if (type === "string" || type === "varchar") {
        return "VARCHAR(" + (limit || 255) + ")";
    } else if (type === "json" || type === "text") {
        return "TEXT";
    } else if (type === "integer" || type === "int") {
        ftype = (limit > 11) ? "BIGINT" : "INT";

        if (!limit && attribute.autoIncrement || attribute.primaryKey) return "INTEGER";
        return ftype + "(" + (limit || 11) + ")";
    } else if (type === "date" || type === "time" || type === "datetime") {
        return "DATETIME";
    } else if (type === "boolean" || type === "bool") {
        return "TINYINT(" + (limit || 1) + ")";
    }

    return "VARCHAR(" + (limit || 255) + ")";
}

function sortProperties(a, b) {
    if (a === "type") {
        return -1;
    }
    if (b === "type") {
        return 1;
    }
    if (a === "autoIncrement") {
        return 1;
    }
    if (b === "autoIncrement") {
        return -1;
    }

    return 0;
}

function propertyToSQL(attribute) {
    var out = [],
        keys = utils.keys(attribute),
        i = 0,
        il = keys.length,
        key;

    keys.sort(sortProperties);

    for (; i < il; i++) {
        key = keys[i];

        if (key === "autoIncrement") {
            out.push("AUTOINCREMENT");
        } else if (key === "unique") {
            out.push("UNIQUE");
        } else if (key === "primaryKey") {
            out.push("PRIMARY KEY");
        } else if (key === "null") {
            if (attribute[key] === false) {
                out.push("NOT NULL");
            }
        } else if (key === "type") {
            out.push(dataType(attribute));
        }
    }

    return out.join(" ");
}


module.exports = SQLite3Adaptor;
