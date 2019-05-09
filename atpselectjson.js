var async = require('async');
var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');
var doconnect = function(cb) {
oracledb.getConnection({
user: dbConfig.dbuser,
password: dbConfig.dbpassword,
connectString: dbConfig.connectString
},
cb);
};
var dorelease = function(conn) {
conn.close(function (err) {
if (err)
console.error(err.message);
});
};
var dodrop = function (conn, cb) {
conn.execute(
`BEGIN
EXECUTE IMMEDIATE 'DROP TABLE j_purchaseorder';
EXCEPTION WHEN OTHERS THEN
IF SQLCODE <> -942 THEN
RAISE;
END IF;
END;`,
function(err) {
if (err) {
	return cb(err, conn);
} else {
console.log("Table dropped");
return cb(null, conn);
}
});
};
var docreate = function (conn, cb) {
conn.execute(
"CREATE TABLE j_purchaseorder (po_document VARCHAR2(4000) CONSTRAINT ensure_json CHECK (po_document IS JSON))",
function(err) {
if (err) {
return cb(err, conn);
} else {
console.log("Table created");
return cb(null, conn);
}
});
};
var checkver = function (conn, cb) {
if (conn.oracleServerVersion < 1201000200) {
return cb(new Error('This example only works with Oracle Database 12.1.0.2 or greater'), conn);
} else {
return cb(null, conn);
}
};
var doinsert = function (conn, cb) {
/*var data = {
	"inputs": [{
		"userId": 1,
		"userName": "Chris",
		"location": "Australia"
	}, {
		"userId": 2,
		"userName": "Laban",
		"location": "Kenya"
	}]
};**/
var data = {"userId": 1, "userName": "Chris", "location": "Australia" };
var s = JSON.stringify(data);
conn.execute(
"INSERT INTO j_purchaseorder (po_document) VALUES (:bv)",
[s], // bind the JSON string for inserting into the JSON column.
{ autoCommit: true },
function (err) {
if (err) {
return cb(err, conn);
} else {
console.log("Data inserted successfully.");
return cb(null, conn);
}
});
};
// 1. Selecting JSON stored in a VARCHAR2 column
var dojsonquery = function (conn, cb) {
console.log('1. Selecting JSON stored in a VARCHAR2 column');
conn.execute(
"SELECT po_document FROM j_purchaseorder WHERE JSON_EXISTS (po_document, '$.location')",
function(err, result) {
if (err) {
return cb(err, conn);
} else {
var js = JSON.parse(result.rows[0][0]); // just show first record
console.log('Query results: ', js);
return cb(null, conn);
}
});
};
// 2. Extract a value from a JSON column. This syntax requires Oracle Database 12.2
var dorelationalquerydot = function (conn, cb) {
console.log('2. Using dot-notation to extract a value from a JSON column');
conn.execute(
"SELECT po.po_document.location FROM j_purchaseorder po",
function(err, result) {
if (err) {
return cb(err, conn);
} else {
console.log('Query results: ', result.rows[0][0]); // just show first record
return cb(null, conn);
}
});
};
// 3. Using JSON_VALUE to extract a value from a JSON column
var dorelationalquery = function (conn, cb) {
	console.log('3. Using JSON_VALUE to extract a value from a JSON column');
conn.execute(
"SELECT JSON_VALUE(po_document, '$.location') FROM j_purchaseorder",
function(err, result) {
if (err) {
return cb(err, conn);
} else {
console.log('Query results: ', result.rows[0][0]); // just show first record
return cb(null, conn);
}
});
};
async.waterfall(
[
doconnect,
checkver,
dodrop,
docreate,
doinsert,
dojsonquery,
dorelationalquerydot,
dorelationalquery
],
function (err, conn) {
if (err) { console.error("In waterfall error cb: ==>", err, "<=="); }
if (conn)
dorelease(conn);
});