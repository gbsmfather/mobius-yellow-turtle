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
 * @file
 * @copyright KETI Korea 2015, OCEAN
 * @author Il Yeup Ahn [iyahn@keti.re.kr]
 */

var url = require('url');
var xml2js = require('xml2js');
var delete_delete = require('./delete');
var xmlbuilder = require('xmlbuilder');
var subscription = require('./subscription');
var get_retrieve = require('./retrieve');
var util = require('util');
var DB = require('./db_action');

var _this = this;

function create_action( request, response, pool, parentid, resourcename, creator, expirationtime, labels, announceto, announcedattribute, contentinfo, content, ontologyref, parent_currentnrofinstances, parent_currentbytesize, creationtime, level, parentpath) {
    // build contentInstance
    var resourcetype = 4;
    //var resourceid = randomValuehex(12);
    var cur_d = new Date();
    //var cur_o = cur_d.getTimezoneOffset()/(-60);
    //cur_d.setHours(cur_d.getHours() + cur_o);
    var msec = '';
    if((parseInt(cur_d.getMilliseconds(), 10)<10)) {
        msec = ('00'+cur_d.getMilliseconds());
    }
    else if((parseInt(cur_d.getMilliseconds(), 10)<100)) {
        msec = ('0'+cur_d.getMilliseconds());
    }
    else {
        msec = cur_d.getMilliseconds();
    }
    var resourceid = 'CI' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);

    var lastmodifiedtime = creationtime;

    if(expirationtime == '')
    {
        cur_d.setMonth(cur_d.getMonth() + 1);
        //if( cur_o < 10) {
        //    expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
        //}
        //else {
            expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
        //}
    }

    var statetag = 0;
    var contentsize = Buffer.byteLength(content, 'utf8');

    var path = url.parse(request.url).pathname + '/' + resourcename;
    var sql = util.format('insert into lv%s (resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, labels, statetag, announceto, ' +
        'announcedattribute, creator, contentinfo, contentsize, ontologyref, content, path, parentpath) ' +
        'VALUE (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
        level + 1,
        resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, labels, statetag, announceto,
        announcedattribute, creator, contentinfo, contentsize, ontologyref, content, path, parentpath);

    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            sql = util.format("select * from lv%s where path = \'%s\'", level + 1, path);
            DB.getResult(pool, sql, function (err, results_ci) {
                if(!err) {
                    if (results_ci.length == 1) {
                        var currentnrofinstances = (parseInt(parent_currentnrofinstances, 10) + 1).toString();
                        var currentbytesize = (parseInt(contentsize, 10) +  parseInt(parent_currentbytesize, 10)).toString();
                        sql = util.format("update lv%s set currentnrofinstances = \'%s\', currentbytesize = \'%s\', lastmodifiedtime = \'%s\' where path = \'%s\'", level, currentnrofinstances, currentbytesize, lastmodifiedtime, parentpath);
                        DB.getResult(pool, sql, function (err, results) {
                            if(!err) {
                                subscription.check(request, pool, results_ci, level, parentpath);

                                response.setHeader('Content-Location', path);
                                response.setHeader('X-M2M-RSC', '2001');
                                _this.retrieve(request, response, pool, results_ci, 201, level, path);
                            }
                            else {
                                console.log('query error: ' + results.code);
                                response.setHeader('X-M2M-RSC', '5000');
                                response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
                            }
                        });
                    }
                    else {
                        console.log('resource do not exist');
                        response.setHeader('X-M2M-RSC', '4004');
                        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                    }
                }
                else {
                    console.log('query error: ' + results_ci.code);
                    response.setHeader('X-M2M-RSC', '5000');
                    response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_ci.code + '\"}' : '<rsp>' + results_ci.code + '</rsp>');
                }
            });
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

function parse_create_action(request, response, pool, parentid, creator, parent_currentnrofinstances, parent_currentbytesize, jsonObj, creationtime, level, parentpath) {
    //if ((request.headers.nmtype == 'long') && (jsonObj[rootnm] != null)) { // long name
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:contentInstance') : ('m2m:cin');

    if(jsonObj[rootnm] != null) {
        if(request.headers.nmtype == 'long') {
            // check NP
            if ((jsonObj[rootnm]['resourceType'] != null) || (jsonObj[rootnm]['resourceID'] != null) || (jsonObj[rootnm]['parentID'] != null) ||
                (jsonObj[rootnm]['creationTime'] != null) || (jsonObj[rootnm]['lastModifiedTime'] != null) || (jsonObj[rootnm]['stateTag'] != null) ||
                (jsonObj[rootnm]['contentSize'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if ((jsonObj[rootnm]['content'] == null)) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                var expirationtime = jsonObj[rootnm]['expirationTime'] == null ? '' : jsonObj[rootnm]['expirationTime'];
                var labels = jsonObj[rootnm]['labels'] == null ? '' : jsonObj[rootnm]['labels'].toString().replace(/,/g, ' ');
                var announceto = jsonObj[rootnm]['announceTo'] == null ? '' : jsonObj[rootnm]['announceTo'].toString().replace(/,/g, ' ');
                var announcedattribute = jsonObj[rootnm]['announcedAttribute'] == null ? '' : jsonObj[rootnm]['announcedAttribute'].toString().replace(/,/g, ' ');
                var contentinfo = jsonObj[rootnm]['contentInfo'] == null ? '' : jsonObj[rootnm]['contentInfo'];
                var content = jsonObj[rootnm]['content'] == null ? '' : jsonObj[rootnm]['content'];
                var ontologyref = jsonObj[rootnm]['ontologyRef'] == null ? '' : jsonObj[rootnm]['ontologyRef'];
                creator = jsonObj[rootnm]['creator'] == null ? '' : jsonObj[rootnm]['creator'];

                if (expirationtime != '') {
                    cur_d = new Date();
                    //var cur_o = cur_d.getTimezoneOffset()/(-60);
                    //cur_d.setHours(cur_d.getHours() + cur_o);

                    var currenttime = '';
                    //if( cur_o < 10) {
                    //    currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
                    //}
                    //else {
                    currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
                    //}

                    if (expirationtime < currenttime) {
                        console.log('Bad Request : expiration is before now');
                        response.setHeader('X-M2M-RSC', '4000');
                        response.status(400).end('<h1>Bad Request : expiration is before now</h1>');
                        return;
                    }
                }

                var cur_d = new Date();
                var msec = (parseInt(cur_d.getMilliseconds(), 10)<10) ? ('00'+cur_d.getMilliseconds()) : ((parseInt(cur_d.getMilliseconds(), 10)<100) ? ('0'+cur_d.getMilliseconds()) : cur_d.getMilliseconds());
                var resourcename = 'cin-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if ((request.headers['x-m2m-nm'] != null) && (request.headers['x-m2m-nm'] != '')) {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if ((jsonObj[rootnm]['resourceName'] != null) && (jsonObj[rootnm]['resourceName'] != '')) {
                    resourcename = jsonObj[rootnm]['resourceName'];
                }

                create_action(request, response, pool, parentid, resourcename, creator, expirationtime, labels, announceto, announcedattribute, contentinfo, content, ontologyref, parent_currentnrofinstances, parent_currentbytesize, creationtime, level, parentpath);
            }
        }
        else { // request.headers.nmtype = 'short'
            // check NP
            if ((jsonObj[rootnm]['ty'] != null) || (jsonObj[rootnm]['ri'] != null) || (jsonObj[rootnm]['pi'] != null) ||
                (jsonObj[rootnm]['ct'] != null) || (jsonObj[rootnm]['lt'] != null) || (jsonObj[rootnm]['st'] != null) || (jsonObj[rootnm]['cr'] != null) ||
                (jsonObj[rootnm]['cs'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if ((jsonObj[rootnm]['con'] == null)) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                expirationtime = jsonObj[rootnm]['et'] == null ? '' : jsonObj[rootnm]['et'];
                labels = jsonObj[rootnm]['lbl'] == null ? '' : jsonObj[rootnm]['lbl'].toString().replace(/,/g, ' ');
                announceto = jsonObj[rootnm]['at'] == null ? '' : jsonObj[rootnm]['at'].toString().replace(/,/g, ' ');
                announcedattribute = jsonObj[rootnm]['aa'] == null ? '' : jsonObj[rootnm]['aa'].toString().replace(/,/g, ' ');
                contentinfo = jsonObj[rootnm]['cnf'] == null ? '' : jsonObj[rootnm]['cnf'];
                content = jsonObj[rootnm]['con'] == null ? '' : jsonObj[rootnm]['con'];
                ontologyref = jsonObj[rootnm]['or'] == null ? '' : jsonObj[rootnm]['or'];
                creator = jsonObj[rootnm]['cr'] == null ? '' : jsonObj[rootnm]['cr'];

                if (expirationtime != '') {
                    cur_d = new Date();
                    //cur_o = cur_d.getTimezoneOffset()/(-60);
                    //cur_d.setHours(cur_d.getHours() + cur_o);

                    currenttime = '';
                    //if( cur_o < 10) {
                    //    currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
                    //}
                    //else {
                    currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
                    //}

                    if (expirationtime < currenttime) {
                        console.log('Bad Request : expiration is before now');
                        response.setHeader('X-M2M-RSC', '4000');
                        response.status(400).end('<h1>Bad Request : expiration is before now</h1>');
                        return;
                    }
                }

                cur_d = new Date();
                msec = (parseInt(cur_d.getMilliseconds(), 10)<10) ? ('00'+cur_d.getMilliseconds()) : ((parseInt(cur_d.getMilliseconds(), 10)<100) ? ('0'+cur_d.getMilliseconds()) : cur_d.getMilliseconds());
                resourcename = 'cin-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if ((request.headers['x-m2m-nm'] != null) && (request.headers['x-m2m-nm'] != '')) {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if ((jsonObj[rootnm]['rn'] != null) && (jsonObj[rootnm]['rn'] != '')) {
                    resourcename = jsonObj[rootnm]['rn'];
                }

                create_action(request, response, pool, parentid, resourcename, creator, expirationtime, labels, announceto, announcedattribute, contentinfo, content, ontologyref, parent_currentnrofinstances, parent_currentbytesize, creationtime, level, parentpath);
            }
        }
    }
    else {
        console.log('bad request body : different with name type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : Body : different with name type\"}' : '<rsp>Bad Request : Body : different with name type</rsp>');
    }
}

exports.create = function(request, response, pool, parentid, creator, parent_currentnrofinstances, parent_currentbytesize, content_type, level, parentpath) {
    /*
     if( (request.headers.accept == null) || (request.headers.accept != 'application/onem2m-resource+xml') ) {
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if( (request.headers['content-type'] == null) || (request.headers['content-type'] != 'application/onem2m-resource+xml') ) {
     response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
     return;
     }
     */

    //if( (request.headers['x-m2m-origin'] == null) ) {
    //    response.setHeader('X-M2M-RSC', '4000');
    //    response.status(400).end('<h1>Bad Request : X-M2M-Origin</h1>');
    //    return;
    //}
    //
    //if( (request.headers['x-m2m-ri'] == null) ) {
    //    response.setHeader('X-M2M-RSC', '4000');
    //    response.status(400).end('<h1>Bad Request : X-M2M-RI</h1>');
    //    return;
    //}

    creator = request.headers['x-m2m-origin'];

    /*if( (request.headers['x-m2m-nm'] == null) ) {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : X-M2M-NM</h1>');
        return;
    }*/

    if(request.body == "") {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : body is empty</h1>');
        return;
    }

//    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create] locale: ' + request.headers.locale);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create] X-M2M-RI: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create] X-M2M-NM: ' + request.headers['x-m2m-nm']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create] ' + request.body);

    var cur_d = new Date();
    //var cur_o = cur_d.getTimezoneOffset()/(-60);
    //cur_d.setHours(cur_d.getHours() + cur_o);
    var msec = '';
    if((parseInt(cur_d.getMilliseconds(), 10)<10)) {
        msec = ('00'+cur_d.getMilliseconds());
    }
    else if((parseInt(cur_d.getMilliseconds(), 10)<100)) {
        msec = ('0'+cur_d.getMilliseconds());
    }
    else {
        msec = cur_d.getMilliseconds();
    }

    var creationtime = '';
    //if( cur_o < 10) {
    //    creationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}
    //else {
        creationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}

    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.create]' + creationtime + ' - ' + resourcename);

    if( content_type.split('+')[1] == 'xml' ) {
        var parser = new xml2js.Parser({explicitArray : false});
        parser.parseString(request.body, function (err, result) {
            if(err) {
                console.log('bad request body ');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end('<h1>Bad Request : Body</h1>');
            }
            else {
                var jsonString = JSON.stringify(result);
                var jsonObj = JSON.parse(jsonString);

                parse_create_action(request, response, pool, parentid, creator, parent_currentnrofinstances, parent_currentbytesize, jsonObj, creationtime, level, parentpath);
            }
        });
    }
    else if( content_type.split('+')[1] == 'json' ) {
        var jsonObj = {};
        var rootnm = (request.headers.nmtype == 'long') ? ('m2m:contentInstance') : ('m2m:cin');

        if(JSON.parse(request.body.toString())['cin'] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())['cin']) : (jsonObj[rootnm] = JSON.parse(request.body.toString())['cin']);
        }
        else if(JSON.parse(request.body.toString())[rootnm] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]) : (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]);
        }
        else {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())) : (jsonObj[rootnm] = JSON.parse(request.body.toString()));
        }

        parse_create_action(request, response, pool, parentid, creator, parent_currentnrofinstances, parent_currentbytesize, jsonObj, creationtime, level, parentpath);
    }
    else {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : do not support content-type</h1>');
    }
};

exports.retrieve = function(request, response, pool, results_ci, status, level, path) {
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.retrieve]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.retrieve] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.retrieve] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.retrieve] x-m2m-ri: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.retrieve] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.retrieve] locale: ' + request.headers.locale);

    /*    if(request.headers.accept != 'application/onem2m-resource+xml') {
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if(request.headers['content-type'] != 'application/onem2m-resource+xml') {
     response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
     return;
     }
     */

    var node = {};
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:contentInstance') : ('m2m:cin');
    var listnm = (request.headers.nmtype == 'long') ? ('m2m:URIList') : ('m2m:uril');
    if(request.headers.usebodytype == 'json') {
        results_ci[0].labels = results_ci[0].labels.toString().split(' ');
        results_ci[0].announcedattribute = results_ci[0].announcedattribute.toString().split(' ');
        results_ci[0].announceto = results_ci[0].announceto.toString().split(' ');

        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[listnm] = [];
            node[listnm].push(results_ci[0].path);

            get_retrieve.request_fu1_json(request, response, pool, node, results_ci[0].resourceid, results_ci[0].resourcetype, results_ci[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ci[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ci[0].resourceid];
            get_retrieve.addele_ci_json(request, node[results_ci[0].resourceid], results_ci[0]);

            get_retrieve.request_rc4_json(request, response, pool, node, rootnm, results_ci[0].resourceid, results_ci[0].resourcetype, results_ci[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ci[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ci[0].resourceid];
            get_retrieve.addele_ci_json(request, node[results_ci[0].resourceid], results_ci[0]);

            get_retrieve.request_json(request, response, pool, node[rootnm], results_ci[0].resourceid, results_ci[0].resourcetype, results_ci[0].resourcename, status);
        }
    }
    else { // request.headers.usebodytype == 'xml'
        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[0] = xmlbuilder.create(listnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.request_fu1(request, response, pool, node, results_ci[0].resourceid, results_ci[0].resourcetype, results_ci[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[results_ci[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ci(request, node[results_ci[0].resourceid], results_ci[0]);

            response.setHeader('X-M2M-RSC', '2000');
            get_retrieve.request_rc4(request, response, pool, node, results_ci[0].resourceid, results_ci[0].resourcetype, results_ci[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[results_ci[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ci(request, node[results_ci[0].resourceid], results_ci[0]);

            get_retrieve.request(request, response, pool, node, results_ci[0].resourceid, results_ci[0].resourcetype, results_ci[0].resourcename, status);
        }
    }
};


exports.delete = function(request, response, pool, results_ci, status, level, path) {
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.delete]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.delete] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.delete] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.delete] x-m2m-ri: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.delete] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[CI.delete] locale: ' + request.headers.locale);

    /*    if(request.headers.accept != 'application/onem2m-resource+xml') {
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if(request.headers['content-type'] != 'application/onem2m-resource+xml') {
     response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
     return;
     }
     */

    var sql = util.format("select * from lv%s where path = \'%s\'", level - 1, results_ci[0].parentpath);
    DB.getResult(pool, sql, function (err, results_co) {
        if(!err) {
            if (results_co.length == 1) {
                var cur_d = new Date();
                var lastmodifiedtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
                var contentsize = Buffer.byteLength(results_ci[0].content, 'utf8');
                var currentnrofinstances = (parseInt(results_co[0].currentnrofinstances, 10) - 1).toString();
                var currentbytesize = (parseInt(results_co[0].currentbytesize, 10) - parseInt(contentsize, 10)).toString();
                sql = util.format("update lv%s set currentnrofinstances = \'%s\', currentbytesize = \'%s\', lastmodifiedtime = \'%s\' where path = \'%s\'", level - 1, currentnrofinstances, currentbytesize, lastmodifiedtime, results_ci[0].parentpath);
                DB.getResult(pool, sql, function (err, results) {
                    if(!err) {
                        delete_delete.request(request, response, pool, status, level, path);
                    }
                    else {
                        console.log('query error: ' + results.code);
                        response.setHeader('X-M2M-RSC', '5000');
                        response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
                    }
                });
            }
            else {
                console.log('resource do not exist');
                response.setHeader('X-M2M-RSC', '4004');
                response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
            }
        }
        else {
            console.log('query error: ' + results_co.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_co.code + '\"}' : '<rsp>' + results_co.code + '</rsp>');
        }
    });
};

