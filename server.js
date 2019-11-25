//  OpenShift sample Node application
var express = require('express'),
    app     = express();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
    
app.listen(port, ip);


app.use("/api/hugo", function(req, res){

    res.send("hugo");

});



module.exports = app ;