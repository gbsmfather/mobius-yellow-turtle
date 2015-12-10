/**
 * Copyright (c) 2015, OCEAN
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @file Main code of Mobius Yellow. Role of flow router
 * @copyright KETI Korea 2015, OCEAN
 * @author Il Yeup Ahn [iyahn@keti.re.kr]
 */

var fs = require('fs');
var http = require('http');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var util = require('util');
var xml2js = require('xml2js');
var url = require('url');
var xmlbuilder = require('xmlbuilder');
var js2xmlparser = require("js2xmlparser");
var ip = require('ip');
const crypto = require('crypto');

global.mysql_error_count = 0;

global.defaultnmtype = 'short';
global.defaultbodytype = 'json';

global.usecbtype = 'in';
global.usecbname = 'mobius2';
global.usecbhost = '127.0.0.1';
global.usecbport = '8080';
global.usecbcseid = '0.2.481.1.1.1.1';

global.usecsebase = 'mobius';
global.usecseid = '0.2.481.1.1.1.1';
global.usecseport = '7579';
global.usedbhost = '';
global.usedbpass = '';
global.usemqttproxy = 'localhost';
global.usemqttproxyport = '9726';

global.NOPRINT = 'true';

var IC = require('./mobius/IC');
var RC = require('./mobius/RC');
var CO = require('./mobius/CO');
var CI = require('./mobius/CI');
var AE = require('./mobius/AE');
var SS = require('./mobius/SS');
var SD = require('./mobius/SD');

var MN = require('./mobius/MN');

var DB = require('./mobius/db_action');

var cluster = require('cluster');
var os = require('os');

var cpuCount = os.cpus().length;
console.log('CPU Count:', cpuCount);

// ������ �����մϴ�.
var app = express();



global.M2M_SP_ID = '//mobius-yt.keti.re.kr';

global.randomValueBase64 = function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
};

//
//var cur_d = new Date();
//var msec = '';
//if((parseInt(cur_d.getMilliseconds(), 10)<10)) {
//    msec = ('00'+cur_d.getMilliseconds());
//}
//else if((parseInt(cur_d.getMilliseconds(), 10)<100)) {
//    msec = ('0'+cur_d.getMilliseconds());
//}
//else {
//    msec = cur_d.getMilliseconds();
//}
//var resourcename = 'sd-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
////console.log(cur_d.toISOString());
////console.log(resourcename);
//
//var same_count = 0;
//for(var k = 0; k < 1000000; k++) {
//    var resourcename2 = 'sd-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
//    if(resourcename == resourcename2) {
//        same_count++;
//    }
//}
//
//console.log(same_count);
//console.log(resourcename);

// create a write stream (in append mode)
//var accessLogStream = fs.createWriteStream(__dirname + '/access.log',{flags: 'a'});
// setup the logger
//app.use( morgan('combined', {stream: accessLogStream}));

var pool = null;

if(cluster.isMaster) {
    for(var i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on('death', function(worker) {
        console.log('worker' + worker.pid + ' died --> start again');
        cluster.fork();
    });
}
else {
    // This is an async file read
    fs.readFile('conf.json', 'utf-8', function (err, data) {
        if (err) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log("FATAL An error occurred trying to read in the file: " + err);
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log("error : set to default for configuration")
        }
        else {
            var conf = JSON.parse(data)['m2m:conf'];

            usecbtype = conf['cbtype'];
            defaultnmtype = conf['nmtype'];
            defaultbodytype = conf['bodytype'];


            usecseid = conf['in-cse']['cseid'];
            usecsebase = conf['in-cse']['csebase'];
            usecseport = conf['in-cse']['cseport'];
            usedbhost = conf['in-cse']['dbhost'];
            usedbpass = conf['in-cse']['dbpass'];
            usemqttproxy = conf['in-cse']['mqttproxy'];
            usemqttproxyport = conf['in-cse']['mqttproxyport'];

            usecbhost = conf['mn-cse']['cbhost'];
            usecbport = conf['mn-cse']['cbport'];
            usecbname = conf['mn-cse']['cbname'];
            usecbcseid = conf['mn-cse']['cbcseid'];


            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(bodyParser.json({limit: '1mb', type: 'application/*+json' }));
            app.use(bodyParser.text({limit: '1mb', type: 'application/*+xml' }));

            http.globalAgent.maxSockets = 1000000;

            pool = DB.connect(usedbhost, 3306, 'root', usedbpass);

            http.createServer(app).listen({port: usecseport, agent: false}, function () {
                //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('server running at ' + usecseport + ' port');
                console.log('server (' + ip.address() + ') running at ' + usecseport + ' port');

                IC.create(pool);

                if(usecbtype == 'mn') {
                    MN.build_mn(pool, 0);
                }
            });
        }
    });
}



/**
 *
 * @param request
 * @param response
 * @param resourcename0
 * @param resourcename1
 * @param resourcename2
 * @param resourcename3
 * @param resourcename4
 * @param level
 */
function lookup_create(request, response, resourcename0, resourcename1, resourcename2, resourcename3, resourcename4, level) {
    if (request.headers.nmtype == null) {
        request.headers.nmtype = defaultnmtype;
    }

    if (request.headers.accept == null) {
        request.headers.usebodytype = defaultbodytype;
        request.headers.accept = 'application/' + defaultbodytype;
    }
    else {
        if (request.headers.accept.split('/')[1] == 'json') {
            request.headers.usebodytype = 'json';
        }
        else {
            request.headers.usebodytype = 'xml';
        }
    }

    if( (request.headers['x-m2m-origin'] == null) ) {
        // x-m2m-origin has AE-ID or CSE-ID.
        // when created first, x-m2m-origin can be none.
        // so, do not check to be x-m2m-origin
        //console.log('Bad Request : X-M2M-Origin');
        //response.setHeader('X-M2M-RSC', '4000');
        //response.status(400).end('<h1>Bad Request : X-M2M-Origin</h1>');
        //return;
    }

    if( (request.headers['x-m2m-ri'] == null) ) {
        console.log('Bad Request : X-M2M-RI');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : X-M2M-RI\"}' : '<rsp>Bad Request : X-M2M-RI</rsp>');
        return;
    }

    response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);

    var content_type = '';
    var ty = '';
    if( (request.headers['content-type'].split(';')[0] == 'application/vnd.onem2m-res+xml') || (request.headers['content-type'].split(';')[0] == 'application/vnd.onem2m-res+json') ) {
        content_type = request.headers['content-type'].split(';')[0];
        ty = request.headers['content-type'].split(';')[1];
    }
    else {
        content_type = request.headers['content-type'].split(';')[1];
        ty = request.headers['content-type'].split(';')[0];
    }

    if((content_type != 'application/vnd.onem2m-res+xml') && (content_type != 'application/vnd.onem2m-res+json')) {
        console.log('Bad Request : content-type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : content-type\"}' : '<rsp>Bad Request : content-type</rsp>');
        return;
    }

    if (content_type.split('+')[1] == 'json') {
        request.headers.usebodytype = 'json';
    }
    else {
        request.headers.usebodytype = 'xml';
    }

    if(ty == null) {
        console.log('Bad Request : ty');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : ty\"}' : '<rsp>Bad Request : ty</rsp>');

        return;
    }

    ty = ty.split('=')[1];

    var path = url.parse(request.url).pathname.toLowerCase();
    var sql = util.format("select * from lv%s where path = \'%s\'", level, path);
    DB.getResult(pool, sql, function(err, results) {
        if(!err) {
            if (results.length == 1) {
                if ((ty == 16) && (results[0].resourcetype == 5)) { // remoteCSE
                    RC.create(request, response, pool, results[0].resourceid, content_type, level, path);
                }
                else if ((ty == 2) && (results[0].resourcetype == 5 || results[0].resourcetype == 16)) { // AE
                    AE.create(request, response, pool, results[0].resourceid, content_type, level, path);
                }
                else if ((ty == 3) && (results[0].resourcetype == 5 || results[0].resourcetype == 16 || results[0].resourcetype == 2 || results[0].resourcetype == 3)) { // container
                    var creator = results[0].creator;
                    CO.create(request, response, pool, results[0].resourceid, creator, content_type, level, path);
                }
                else if ((ty == 23) && (results[0].resourcetype == 5 || results[0].resourcetype == 16 || results[0].resourcetype == 2 || results[0].resourcetype == 3 || results[0].resourcetype == 24)) { // subscription
                    creator = results[0].creator;
                    SS.create(request, response, pool, results[0].resourceid, creator, content_type, level, path);
                }
                else if ((ty == 4) && (results[0].resourcetype == 3)) { // contentInstance
                    creator = results[0].creator;
                    CI.create(request, response, pool, results[0].resourceid, creator, results[0].currentnrofinstances, results[0].currentbytesize, content_type, level, path);
                }
                else if ((ty == 24) && (results[0].resourcetype == 2 || results[0].resourcetype == 3 || results[0].resourcetype == 4)) { // semanticDescriptor
                    creator = results[0].creator;
                    SD.create(request, response, pool, results[0].resourceid, creator, content_type, level, path);
                }
                else {
                    console.log('Bad Request : resourcetype error');
                    response.setHeader('X-M2M-RSC', '4000');
                    response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : resourcetype error\"}' : '<rsp>Bad Request : resourcetype error</rsp>');
                }
            }
            else {
                console.log('parent resource do not exist');
                response.setHeader('X-M2M-RSC', '5000');
                response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"parent resource do not exist\"}' : '<rsp>parent resource do not exist</rsp>');
            }
        }
        else {
            if(results.code == 'ER_DUP_ENTRY') {
                response.setHeader('X-M2M-RSC', '4105');
                response.status(409).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
            }
            else {
                console.log('query error: ' + results.code);
                response.setHeader('X-M2M-RSC', '5000');
                response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
            }
        }
    });
}

function lookup_retrieve( request, response, resourcename0, resourcename1, resourcename2, resourcename3, resourcename4, level) {
    if (request.headers.nmtype == null) {
        request.headers.nmtype = defaultnmtype;
    }

    if (request.headers.accept == null) {
        request.headers.usebodytype = defaultbodytype;
        request.headers.accept = 'application/' + defaultbodytype;
    }
    else {
        if (request.headers.accept.split('/')[1] == 'json') {
            request.headers.usebodytype = 'json';
        }
        else {
            request.headers.usebodytype = 'xml';
        }
    }

    if( (request.headers['x-m2m-origin'] == null) ) {
        console.log('[app.js] Bad Request : X-M2M-Origin');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : X-M2M-Origin\"}' : '<rsp>Bad Request : X-M2M-Origin</rsp>');
        return;
    }

    if( (request.headers['x-m2m-ri'] == null) ) {
        console.log('[app.js] Bad Request : X-M2M-RI');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : X-M2M-RI\"}' : '<rsp>Bad Request : X-M2M-RI</rsp>');
        return;
    }

    response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);

    if(resourcename2 == 'latest' || resourcename3 == 'latest' || resourcename4 == 'latest' || resourcename2 == 'la' || resourcename3 == 'la' || resourcename4 == 'la') {
        if(resourcename2 == 'latest' || resourcename3 == 'latest' || resourcename4 == 'latest') {
            var path = url.parse(request.url).pathname.replace('/latest', '');
        }
        else {
            path = url.parse(request.url).pathname.replace('/la', '');
        }

        var sql = util.format("select * from lv%s where parentpath = \'%s\' and resourcetype = '4' order by resourceid desc limit 1", level, path);
        DB.getResult(pool, sql, function (err, results) {
            if(!err) {

                if (results.length == 1) {
                    response.setHeader('X-M2M-RSC', '2000');
                    CI.retrieve(request, response, pool, results, 200, level, path);
                }
                else {
                    response.setHeader('X-M2M-RSC', '4004');
                    response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                }
            }
            else {
                console.log('[app.js] query error: ' + results.code);
                response.setHeader('X-M2M-RSC', '5000');
                response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
            }
        });
    }
    else {
        path = url.parse(request.url).pathname;
        sql = util.format("select * from lv%s where path = \'%s\'", level, path);
        DB.getResult(pool, sql, function (err, results) {
            if(!err) {
                if (results.length == 1) {
                    response.setHeader('X-M2M-RSC', '2000');
                    if (results[0].resourcetype == 5) {
                        IC.retrieve(request, response, pool, results, 200, level, path);
                    }
                    else if (results[0].resourcetype == 16) {
                        RC.retrieve(request, response, pool, results, 200, level, path);
                    }
                    else if (results[0].resourcetype == 2) {
                        AE.retrieve(request, response, pool, results, 200, level, path);
                    }
                    else if (results[0].resourcetype == 3) {
                        CO.retrieve(request, response, pool, results, 200, level, path);
                    }
                    else if (results[0].resourcetype == 23) {
                        SS.retrieve(request, response, pool, results, 200, level, path);
                    }
                    else if (results[0].resourcetype == 4) {
                        CI.retrieve(request, response, pool, results, 200, level, path);
                    }
                    else if (results[0].resourcetype == 24) {
                        SD.retrieve(request, response, pool, results, 200, level, path);
                    }
                    else {
                        console.log('[app.js retrieve] Bad Request : resourcetype error');
                        response.setHeader('X-M2M-RSC', '4000');
                        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : resourcetype error\"}' : '<rsp>Bad Request : resourcetype error</rsp>');
                    }
                }
                else {
                    console.log('[app.js retrieve] resource do not exist');
                    response.setHeader('X-M2M-RSC', '4004');
                    response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                }
            }
            else {
                console.log('[app.js retrieve] query error: ' + results.code);
                response.setHeader('X-M2M-RSC', '5000');
                response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
            }
        });
    }
}

function lookup_update( request, response, resourcename0, resourcename1, resourcename2, resourcename3, resourcename4, level) {
    if (request.headers.nmtype == null) {
        request.headers.nmtype = defaultnmtype;
    }

    if (request.headers.accept == null) {
        request.headers.usebodytype = defaultbodytype;
        request.headers.accept = 'application/' + defaultbodytype;
    }
    else {
        if (request.headers.accept.split('/')[1] == 'json') {
            request.headers.usebodytype = 'json';
        }
        else {
            request.headers.usebodytype = 'xml';
        }
    }

    if( (request.headers['x-m2m-origin'] == null) ) {
        console.log('Bad Request : X-M2M-Origin');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : X-M2M-Origin\"}' : '<rsp>Bad Request : X-M2M-Origin</rsp>');
        return;
    }

    if( (request.headers['x-m2m-ri'] == null) ) {
        console.log('Bad Request : X-M2M-RI');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : X-M2M-RI\"}' : '<rsp>Bad Request : X-M2M-RI</rsp>');
        return;
    }

    response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);

    var content_type = '';
    if( (request.headers['content-type'].split(';')[0] == 'application/vnd.onem2m-res+xml') || (request.headers['content-type'].split(';')[0] == 'application/vnd.onem2m-res+json') ) {
        content_type = request.headers['content-type'].split(';')[0];
        var ty = request.headers['content-type'].split(';')[1];
    }
    else {
        content_type = request.headers['content-type'].split(';')[1];
        ty = request.headers['content-type'].split(';')[0];
    }

    if((content_type != 'application/vnd.onem2m-res+xml') && (content_type != 'application/vnd.onem2m-res+json')) {
        console.log('Bad Request : content-type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : content-type\"}' : '<rsp>Bad Request : content-type</rsp>');
        return;
    }

    if (content_type.split('+')[1] == 'json') {
        request.headers.usebodytype = 'json';
    }
    else {
        request.headers.usebodytype = 'xml';
    }

/*    if(ty == null) {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : ty</h1>');
        return;
    }

    ty = ty.split('=')[1];*/

    var path = url.parse(request.url).pathname;
    var sql = util.format("select * from lv%s where path = \'%s\'", level, path);
    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            if (results.length == 1) {
                if ( results[0].resourcetype == 16 ) { // remoteCSE
                    RC.update(request, response, pool, results, content_type, level, path);
                }
                else if ( results[0].resourcetype == 2 ) { // AE
                    AE.update(request, response, pool, results, content_type, level, path);
                }
                else if ( results[0].resourcetype == 3 ) { // container
                    CO.update(request, response, pool, results, content_type, level, path);
                }
                else if ( results[0].resourcetype == 23 ) { // subscription
                    SS.update(request, response, pool, results, content_type, level, path);
                }
                else if ( results[0].resourcetype == 24 ) { // semanticDescriptor
                    SD.update(request, response, pool, results, content_type, level, path);
                }
                else {
                    console.log('[app.js update] Bad Request : resourcetype error');
                    response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);
                    response.setHeader('X-M2M-RSC', '4000');
                    response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : resourcetype error\"}' : '<rsp>Bad Request : resourcetype error</rsp>');
                }
            }
            else {
                console.log('resource do not exist');
                response.setHeader('X-M2M-RSC', '4004');
                response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
            }
        }
        else {
            console.log('query error: ' + results.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
        }
    });
}

function lookup_delete(request, response, resourcename0, resourcename1, resourcename2, resourcename3, resourcename4, level) {
    if (request.headers.nmtype == null) {
        request.headers.nmtype = defaultnmtype;
    }

    if (request.headers.accept == null) {
        request.headers.usebodytype = defaultbodytype;
        request.headers.accept = 'application/' + defaultbodytype;
    }
    else {
        if (request.headers.accept.split('/')[1] == 'json') {
            request.headers.usebodytype = 'json';
        }
        else {
            request.headers.usebodytype = 'xml';
        }
    }

    if( (request.headers['x-m2m-origin'] == null) ) {
        console.log('Bad Request : X-M2M-Origin');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : X-M2M-Origin\"}' : '<rsp>Bad Request : X-M2M-Origin</rsp>');
        return;
    }

    if( (request.headers['x-m2m-ri'] == null) ) {
        console.log('Bad Request : X-M2M-RI');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : X-M2M-RI\"}' : '<rsp>Bad Request : X-M2M-RI</rsp>');
        return;
    }

    response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);

    var path = url.parse(request.url).pathname;
    var sql = util.format("select * from lv%s where path = \'%s\'", level, path);
    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            if (results.length == 1) {
                if (results[0].resourcetype == 16) { // remoteCSE
                    RC.delete(request, response, pool, results, 200, level, path);
                }
                else if (results[0].resourcetype == 2) { // AE
                    AE.delete(request, response, pool, results, 200, level, path);
                }
                else if (results[0].resourcetype == 3) { // container
                    CO.delete(request, response, pool, results, 200, level, path);
                }
                else if ((results[0].resourcetype == 23)) { // subscription
                    SS.delete(request, response, pool, results, 200, level, path);
                }
                else if ((results[0].resourcetype == 4)) { // contentInstance
                    CI.delete(request, response, pool, results, 200, level, path);
                }
                else if ((results[0].resourcetype == 24)) { // semanticDescriptor
                    SD.delete(request, response, pool, results, 200, level, path);
                }
                else {
                    console.log('Bad Request : resourcetype error');
                    response.setHeader('X-M2M-RSC', '4000');
                    response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : resourcetype error\"}' : '<rsp>Bad Request : resourcetype error</rsp>');
                }
            }
            else {
                console.log('resource do not exist');
                response.setHeader('X-M2M-RSC', '4004');
                response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
            }
        }
        else {
            console.log('query error: ' + results.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
        }
    });
}


//var xmlParser = bodyParser.text({ limit: '1mb', type: 'application/onem2m-resource+xml;application/xml;application/json;application/vnd.onem2m-prsp+xml;application/vnd.onem2m-prsp+json' });
var xmlParser = bodyParser.text({ limit: '1mb', type: '*/*' });

app.get('/:resourcename0', xmlParser, function(request, response) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        if ( request.query.rc == 0 ) {
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end('<h1>Bad Request : rc query is not be zero when request</h1>');
            response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : rc query is not be zero when request\"}' : '<rsp>Bad Request : rc query is not be zero when request</rsp>');
        }
        else {
            lookup_retrieve(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 0);
        }
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

// remoteCSE, AE, CO
app.post('/:resourcename0', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_create(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 0);
    }
    else if(request.params.resourcename0.toLowerCase() == 'indication') { // for subscription test temporally
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CO notification <--]');
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CO notification] Accept: ' + request.headers.accept);
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CO notification] Content-Type: ' + request.headers['content-type']);
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CO notification] x-m2m-ri: ' + request.headers['x-m2m-ri']);
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CO notification] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CO notification] locale: ' + request.headers.locale);

        NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.body);

        response.setHeader('X-M2M-RSC', '2000');
        response.status(200).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"success to receive notification\"}' : '<rsp>success to receive notification</rsp>');
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.get('/:resourcename0/:resourcename1', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        if (request.query.rc == 0) {
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end('<h1>Bad Request : rc query is not be zero when request</h1>');
        }
        else {
            lookup_retrieve(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 1);
        }
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.put('/:resourcename0/:resourcename1', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_update(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 1);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.delete('/:resourcename0/:resourcename1', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_delete(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 1);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

// AE, CO, CI, MC
app.post('/:resourcename0/:resourcename1', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_create(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 1);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.get('/:resourcename0/:resourcename1/:resourcename2', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        if (request.query.rc == 0) {
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end('<h1>Bad Request : rc query is not be zero when request</h1>');
        }
        else {
            lookup_retrieve(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 2);
        }
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.put('/:resourcename0/:resourcename1/:resourcename2', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_update(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 2);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.delete('/:resourcename0/:resourcename1/:resourcename2', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_delete(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 2);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

// CO, CI
app.post('/:resourcename0/:resourcename1/:resourcename2', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_create(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 2);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.delete('/:resourcename0/:resourcename1/:resourcename2/:resourcename3', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_delete(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 3);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.get('/:resourcename0/:resourcename1/:resourcename2/:resourcename3', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        if (request.query.rc == 0) {
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end('<h1>Bad Request : rc query is not be 0 when request</h1>');
        }
        else if (request.query.rc == 2) {
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end('<h1>Bad Request : rc query is not be 2 when request</h1>');
        }
        else if (request.query.rc == 3) {
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end('<h1>Bad Request : rc query is not be 3 when request</h1>');
        }
        else {
            lookup_retrieve(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 3);
        }
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.put('/:resourcename0/:resourcename1/:resourcename2/:resourcename3', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_update(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 3);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.post('/:resourcename0/:resourcename1/:resourcename2/:resourcename3', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_create(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 3);

    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.get('/:resourcename0/:resourcename1/:resourcename2/:resourcename3/:resourcename4', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        if (request.query.rc == 0) {
            response.setHeader('X-M2M-RSC', '4000');
            response.status(400).end('<h1>Bad Request : rc query is not be zero when request</h1>');
        }
        else {
            lookup_retrieve(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 4);
        }
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});

app.delete('/:resourcename0/:resourcename1/:resourcename2/:resourcename3/:resourcename4', xmlParser, function(request, response, next) {
    if(request.params.resourcename0.toLowerCase() == usecsebase) {
        lookup_delete(request, response, request.params.resourcename0, request.params.resourcename1, request.params.resourcename2, request.params.resourcename3, request.params.resourcename4, 4);
    }
    else {
        if(usecbtype == 'mn') {
            MN.forward_request(request, response, pool);
        }
        else {
            response.setHeader('X-M2M-RSC', '4004');
            response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
        }
    }
});


/* create server for https
var privateKey = fs.readFileSync('privatekey.pem').toString();
var certificate = fs.readFileSync('certificate.pem').toString();

var credentials = crypto.createCredentials({key: privateKey, cert: certificate});

var handler = function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
};

var server = http.createServer();
server.setSecure(credentials);
server.addListener("request", handler);
server.listen(8000);
*/


