var express = require('express'),
    app     = express();
var bodyParser = require('body-parser');



var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
    
var CLServer = require("./cl-server");

var server = new CLServer();

var app = express();
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api/login", server.Login);
app.use("/api/purchaseitem", server.PurchaseItem);
app.use("/api/openchest", server.OpenChest);

app.listen(port, ip);

module.exports = app ;