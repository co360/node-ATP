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
`CREATE TABLE j_purchaseorder
  (id          VARCHAR2 (32) NOT NULL PRIMARY KEY,
   date_loaded TIMESTAMP (6) WITH TIME ZONE,
   po_document VARCHAR2 (23767)
   CONSTRAINT ensure_json CHECK (po_document IS JSON))`,
function(err) {
if (err) {
return cb(err, conn);
} else {
console.log("Table created");
return cb(null, conn);
}
});
};
async.waterfall(
[
doconnect,
dodrop,
docreate
],
function (err, conn) {
if (err) { console.error("In waterfall error cb: ==>", err, "<=="); }
if (conn)
dorelease(conn);
});