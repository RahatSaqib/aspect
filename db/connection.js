let mysql   = require('mysql')

let pool = mysql.createPool({
  connectionLimit: 100, //important
  host: 'aspect-dev.ckp1z7tdqhiy.us-east-1.rds.amazonaws.com',
  user: 'aspectapi',
  password: '96loETfSyBSF6PLX',
  database: 'aspect',
  debug: false
})

module.exports = function executeQuery(){

pool.getConnection(function(err,connection){
         if (err) {
           if (connection){
           connection.release();
         }
           res.json({"code" : 100, "status" : "Error in connection database"});
           return;
         }

         console.log('connected as id ' + connection.threadId);

         connection.query("select * from user",function(err,rows){
             connection.release();
             if(!err) {
                 res.json(rows);
             }
         });

         connection.on('error', function(err) {
               res.json({"code" : 100, "status" : "Error in connection database"});
               return;
         });
   });
}
