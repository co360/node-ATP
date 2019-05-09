var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');
oracledb.getConnection({
user: dbConfig.dbuser,
password: dbConfig.dbpassword,
connectString: dbConfig.connectString
},
function(err, connection) {
if (err) {
console.error(err.message);
return;
}
connection.execute(
// The statement to execute
`SELECT CUST_ID, CUST_FIRST_NAME, CUST_LAST_NAME
FROM sh.customers
WHERE CUST_ID = :id`,
// The "bind value" 5992 for the bind variable ":id", so this customer# will be returned
[5992],
{ outFormat: oracledb.OBJECT // query result format
},
// The callback function handles the SQL execution results
function(err, result) {
if (err) {
console.error(err.message);
doRelease(connection);
return;
}
console.log(`We are specifically looking for customer ID 5992`);
console.log(result.rows);
doRelease(connection);
});
});
// Note: connections should always be released when not needed
function doRelease(connection) {
connection.close(
function(err) {
if (err) {
console.error(err.message);
}
});
}