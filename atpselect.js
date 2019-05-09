var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');
var http = require('http');
var json_list;
// THIS uses Oracle friendly formatting for results
oracledb.outFormat = oracledb.OBJECT;
// THIS limits the number of rows returned
oracledb.maxRows = 50;
oracledb.getConnection({
user: dbConfig.dbuser,
password: dbConfig.dbpassword,
connectString: dbConfig.connectString
},
function(err, connection)
{
if (err) { console.error(err); return; }
connection.execute(
`SELECT channel_desc, TO_CHAR(SUM(amount_sold),'9,999,999,999') SALES$,
RANK() OVER (ORDER BY SUM(amount_sold)) AS default_rank,
RANK() OVER (ORDER BY SUM(amount_sold) DESC NULLS LAST) AS custom_rank
FROM sh.sales, sh.products, sh.customers, sh.times, sh.channels, sh.countries
WHERE sales.prod_id=products.prod_id AND sales.cust_id=customers.cust_id
AND customers.country_id = countries.country_id AND sales.time_id=times.time_id
AND sales.channel_id=channels.channel_id
AND times.calendar_month_desc IN ('2000-09', '2000-10')
AND country_iso_code='US'
GROUP BY channel_desc`,
function(err, result)
{
if (err) { console.error(err); return; }
//console.log(result.rows);
json_list = JSON.stringify(result.rows);
console.log(json_list);
console.log(`Check to see if your database connection worked at http://localhost:3050/`);
});
});

http.createServer(function(request, response) {
response.writeHead(200, {
'Content-Type': 'application/json'
});

response.end(json_list);

}).listen(3050);