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
var xmlbuilder = require('xmlbuilder');
var get_retrieve = require('./retrieve');
var delete_delete = require('./delete');
var subscription = require('./subscription');
var util = require('util');
var DB = require('./db_action');

var _this = this;

function create_action( request, response, pool, parentid, resourcename, accesscontrolpolicyids, expirationtime, labels, announceto, announcedattribute, appname, appid, pointofaccess, ontologyref, requestreachability, creationtime, level, parentpath) {
    // build AE
    var resourcetype = 2;
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
    var resourceid = 'AE' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
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

    if(appid == '') {
        appid = resourceid;
    }

    cur_d = new Date();
    //cur_o = cur_d.getTimezoneOffset()/(-60);
    //cur_d.setHours(cur_d.getHours() + cur_o);
    //var aeid = '0.2.481.1.9999.999.' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + cur_d.getMilliseconds();

    if(usecbtype == 'in') {
        var aeid = 'S' + '0.2.481.1.1.1.' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec;
    }
    else {
        aeid = 'C' + + '0.2.481.1.1.1.' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec;
    }

    var path = url.parse(request.url).pathname + '/' + resourcename;
    var sql = util.format('insert into lv%s (resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, accesscontrolpolicyids, labels, announceto, ' +
        'announcedattribute, appname, appid, aeid, pointofaccess, ontologyref, requestreachability, path, parentpath) ' +
        'VALUE (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
        level + 1,
        resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, accesscontrolpolicyids, labels, announceto,
        announcedattribute, appname, appid, aeid, pointofaccess, ontologyref, requestreachability, path, parentpath);

    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            sql = util.format("select * from lv%s where path = \'%s\'", level + 1, path);
            DB.getResult(pool, sql, function (err, results_ae) {
                if(!err) {
                    if (results_ae.length == 1) {
                        subscription.check(request, pool, results_ae, level, parentpath);

                        response.setHeader('Content-Location', path);

                        response.setHeader('X-M2M-RSC', '2001');
                        _this.retrieve(request, response, pool, results_ae, 201, level, path);
                    }
                    else {
                        console.log('resource do not exist');
                        response.setHeader('X-M2M-RSC', '4004');
                        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                    }
                }
                else {
                    console.log('query error: ' + results_ae.code);
                    response.setHeader('X-M2M-RSC', '5000');
                    response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_ae.code + '\"}' : '<rsp>' + results_ae.code + '</rsp>');
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

function parse_create_action(request, response, pool, parentid, jsonObj, creationtime, level, parentpath) {
    //if ((request.headers.nmtype == 'long') && (jsonObj[rootnm] != null)) { // long name

    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:AE') : ('m2m:ae');

    if(jsonObj[rootnm] != null) {
        if(request.headers.nmtype == 'long') {
            // check NP
            if ((jsonObj[rootnm]['resourceType'] != null) || (jsonObj[rootnm]['resourceID'] != null) || (jsonObj[rootnm]['parentID'] != null) ||
                (jsonObj[rootnm]['creationTime'] != null) || (jsonObj[rootnm]['lastModifiedTime'] != null) || (jsonObj[rootnm]['AE-ID'] != null) || (jsonObj[rootnm]['nodeLink'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            //else if ((jsonObj[rootnm]['App-ID'] == null) || (jsonObj[rootnm]['requestReachability'] == null)) {
            else if ((jsonObj[rootnm]['App-ID'] == null)) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                var accesscontrolpolicyids = jsonObj[rootnm]['accessControlPolicyIDs'] == null ? '' : jsonObj[rootnm]['accessControlPolicyIDs'].toString().replace(/,/g, ' ');
                var expirationtime = jsonObj[rootnm]['expirationTime'] == null ? '' : jsonObj[rootnm]['expirationTime'];
                var labels = jsonObj[rootnm]['labels'] == null ? '' : jsonObj[rootnm]['labels'].toString().replace(/,/g, ' ');
                var announceto = jsonObj[rootnm]['announceTo'] == null ? '' : jsonObj[rootnm]['announceTo'].toString().replace(/,/g, ' ');
                var announcedattribute = jsonObj[rootnm]['announcedAttribute'] == null ? '' : jsonObj[rootnm]['announcedAttribute'].toString().replace(/,/g, ' ');
                var appname = jsonObj[rootnm]['appName'] == null ? '' : jsonObj[rootnm]['appName'];
                var appid = jsonObj[rootnm]['App-ID'] == null ? '' : jsonObj[rootnm]['App-ID'];
                var pointofaccess = jsonObj[rootnm]['pointOfAccess'] == null ? '' : jsonObj[rootnm]['pointOfAccess'].toString().replace(/,/g, ' ');
                var ontologyref = jsonObj[rootnm]['ontologyRef'] == null ? '' : jsonObj[rootnm]['ontologyRef'];
                var requestreachability = jsonObj[rootnm]['requestReachability'] == null ? '' : jsonObj[rootnm]['requestReachability'];

                if (expirationtime != '') {
                    cur_d = new Date();
                    //var cur_o = cur_d.getTimezoneOffset() / (-60);
                    //cur_d.setHours(cur_d.getHours() + cur_o);

                    var currenttime = '';
                    //if (cur_o < 10) {
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
                var resourcename = 'ae-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if (request.headers['x-m2m-nm'] != null && request.headers['x-m2m-nm'] != '') {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if (jsonObj[rootnm]['resourceName'] != null && jsonObj[rootnm]['resourceName'] != '') {
                    resourcename = jsonObj[rootnm]['resourceName'];
                }

                create_action(request, response, pool, parentid, resourcename, accesscontrolpolicyids, expirationtime, labels, announceto, announcedattribute, appname, appid, pointofaccess, ontologyref, requestreachability, creationtime, level, parentpath);
            }
        }
        else { // request.headers.nmtype == 'short';
            // check NP
            if ((jsonObj[rootnm]['ty'] != null) || (jsonObj[rootnm]['ri'] != null) || (jsonObj[rootnm]['pi'] != null) ||
                (jsonObj[rootnm]['ct'] != null) || (jsonObj[rootnm]['lt'] != null) || (jsonObj[rootnm]['aei'] != null) || (jsonObj[rootnm]['nl'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            //else if ((jsonObj[rootnm]['api'] == null) || (jsonObj[rootnm]['rr'] == null)) {
            else if ((jsonObj[rootnm]['api'] == null)) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                accesscontrolpolicyids = jsonObj[rootnm]['acpi'] == null ? '' : jsonObj[rootnm]['acpi'].toString().replace(/,/g, ' ');
                expirationtime = jsonObj[rootnm]['et'] == null ? '' : jsonObj[rootnm]['et'];
                labels = jsonObj[rootnm]['lbl'] == null ? '' : jsonObj[rootnm]['lbl'].toString().replace(/,/g, ' ');
                announceto = jsonObj[rootnm]['at'] == null ? '' : jsonObj[rootnm]['at'].toString().replace(/,/g, ' ');
                announcedattribute = jsonObj[rootnm]['aa'] == null ? '' : jsonObj[rootnm]['aa'].toString().replace(/,/g, ' ');
                appname = jsonObj[rootnm]['apn'] == null ? '' : jsonObj[rootnm]['apn'];
                appid = jsonObj[rootnm]['api'] == null ? '' : jsonObj[rootnm]['api'];
                pointofaccess = jsonObj[rootnm]['poa'] == null ? '' : jsonObj[rootnm]['poa'].toString().replace(/,/g, ' ');
                ontologyref = jsonObj[rootnm]['or'] == null ? '' : jsonObj[rootnm]['or'];
                requestreachability = jsonObj[rootnm]['rr'] == null ? '' : jsonObj[rootnm]['rr'];

                if (expirationtime != '') {
                    cur_d = new Date();
                    //cur_o = cur_d.getTimezoneOffset() / (-60);
                    //cur_d.setHours(cur_d.getHours() + cur_o);

                    currenttime = '';
                    //if (cur_o < 10) {
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
                resourcename = 'ae-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if (request.headers['x-m2m-nm'] != null && request.headers['x-m2m-nm'] != '') {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if (jsonObj[rootnm]['rn'] != null && jsonObj[rootnm]['rn'] != '') {
                    resourcename = jsonObj[rootnm]['rn'];
                }

                create_action(request, response, pool, parentid, resourcename, accesscontrolpolicyids, expirationtime, labels, announceto, announcedattribute, appname, appid, pointofaccess, ontologyref, requestreachability, creationtime, level, parentpath);
            }
        }
    }
    else {
        console.log('bad request body : different with name type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : Body : different with name type\"}' : '<rsp>Bad Request : Body : different with name type</rsp>');
    }
}

exports.create = function(request, response, pool, parentid, content_type, level, parentpath) {
//    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create] locale: ' + request.headers.locale);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create] X-M2M-RI: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create] X-M2M-NM: ' + request.headers['x-m2m-nm']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create] Content-Type: ' + request.headers['content-type']);

    /*
     if( (request.headers.accept == null) || (request.headers.accept != 'application/onem2m-resource+xml') ) {
     response.setHeader('X-M2M-RSC', '4000');
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if( (request.headers['content-type'] == null) || (request.headers['content-type'] != 'application/onem2m-resource+xml') ) {
     response.setHeader('X-M2M-RSC', '4000');
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

    /*
     if( (request.headers['x-m2m-nm'] == null) ) {
     response.setHeader('X-M2M-RSC', '4000');
     response.status(400).end('<h1>Bad Request : X-M2M-NM</h1>');
     return;
     }
     */

    if(request.body == "") {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : body is empty</h1>');
        return;
    }

    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.create] ' + request.body);

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

    if( content_type.split('+')[1] == 'xml' ) {
        var parser = new xml2js.Parser({explicitArray : false});
        parser.parseString(request.body, function (err, result) {
            if(err) {
                console.log('bad request body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end('<h1>Bad Request : Body</h1>');
            }
            else {
                var jsonString = JSON.stringify(result);
                var jsonObj = JSON.parse(jsonString);

                parse_create_action(request, response, pool, parentid, jsonObj, creationtime, level, parentpath);
            }
        });
    }
    else if( content_type.split('+')[1] == 'json' ) {
        var jsonObj = {};
        var rootnm = (request.headers.nmtype == 'long') ? ('m2m:AE') : ('m2m:ae');

        if(JSON.parse(request.body.toString())['ae'] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())['ae']) : (jsonObj[rootnm] = JSON.parse(request.body.toString())['ae']);
        }
        else if(JSON.parse(request.body.toString())[rootnm] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]) : (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]);
        }
        else {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())) : (jsonObj[rootnm] = JSON.parse(request.body.toString()));
        }

        parse_create_action(request, response, pool, parentid, jsonObj, creationtime, level, parentpath);
    }
    else {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : do not support content-type</h1>');
    }
};

exports.retrieve = function(request, response, pool, results_ae, status, level, path) {
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.retrieve]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.retrieve] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.retrieve] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.retrieve] x-m2m-ri: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.retrieve] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.retrieve] locale: ' + request.headers.locale);

    /*    if(request.headers.accept != 'application/onem2m-resource+xml') {
     response.setHeader('X-M2M-RSC', '4000');
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if(request.headers['content-type'] != 'application/onem2m-resource+xml') {
     response.setHeader('X-M2M-RSC', '4000');
     response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
     return;
     }
     */

    var node = {};
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:AE') : ('m2m:ae');
    var listnm = (request.headers.nmtype == 'long') ? ('m2m:URIList') : ('m2m:uril');
     if(request.headers.usebodytype == 'json') {
        results_ae[0].pointofaccess = results_ae[0].pointofaccess.toString().split(' ');
        results_ae[0].labels = results_ae[0].labels.toString().split(' ');
        results_ae[0].accesscontrolpolicyids = results_ae[0].accesscontrolpolicyids.toString().split(' ');
        results_ae[0].announcedattribute = results_ae[0].announcedattribute.toString().split(' ');
        results_ae[0].announceto = results_ae[0].announceto.toString().split(' ');

        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[listnm] = [];
            node[listnm].push(results_ae[0].path);

            get_retrieve.request_fu1_json(request, response, pool, node, results_ae[0].resourceid, results_ae[0].resourcetype, results_ae[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ae[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ae[0].resourceid];
            get_retrieve.addele_ae_json(request, node[results_ae[0].resourceid], results_ae[0]);

            get_retrieve.request_rc4_json(request, response, pool, node, rootnm, results_ae[0].resourceid, results_ae[0].resourcetype, results_ae[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ae[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ae[0].resourceid];
            get_retrieve.addele_ae_json(request, node[results_ae[0].resourceid], results_ae[0]);

            get_retrieve.request_json(request, response, pool, node[rootnm], results_ae[0].resourceid, results_ae[0].resourcetype, results_ae[0].resourcename, status);
        }
    }
    else { // request.headers.usebodytype == 'xml'
        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[0] = xmlbuilder.create(listnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.request_fu1(request, response, pool, node, results_ae[0].resourceid, results_ae[0].resourcetype, results_ae[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[results_ae[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ae(request, node[results_ae[0].resourceid], results_ae[0]);

            response.setHeader('X-M2M-RSC', '2000');
            get_retrieve.request_rc4(request, response, pool, node, results_ae[0].resourceid, results_ae[0].resourcetype, results_ae[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[results_ae[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ae(request, node[results_ae[0].resourceid], results_ae[0]);

            get_retrieve.request(request, response, pool, node, results_ae[0].resourceid, results_ae[0].resourcetype, results_ae[0].resourcename, status);
        }
    }
};


function update_action( request, response, pool, accesscontrolpolicyids, expirationtime, labels, announceto, announcedattribute, appname, pointofaccess, ontologyref, requestreachability, level, path) {
    // build AE
    var lastmodifiedtime = '';

    var cur_d = new Date();
    //var cur_o = cur_d.getTimezoneOffset()/(-60);
    //cur_d.setHours(cur_d.getHours() + cur_o);

    //if( cur_o < 10) {
    //    lastmodifiedtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}
    //else {
        lastmodifiedtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}

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

    var sql = util.format('update lv%s set lastmodifiedtime = \'%s\', accesscontrolpolicyids = \'%s\', expirationtime = \'%s\', labels = \'%s\', announceto = \'%s\', announcedattribute = \'%s\', appname = \'%s\', pointofaccess = \'%s\', ontologyref = \'%s\', requestreachability = \'%s\' ' +
        'where path = \'%s\'',
        level,
        lastmodifiedtime, accesscontrolpolicyids, expirationtime, labels, announceto, announcedattribute, appname, pointofaccess, ontologyref, requestreachability,
        path);
    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            sql = util.format("select * from lv%s where path = \'%s\'", level, path);
            DB.getResult(pool, sql, function (err, results_ae) {
                if(!err) {
                    if (results_ae.length == 1) {
                        response.setHeader('Content-Location', path);
                        response.setHeader('X-M2M-RSC', '2004');
                        _this.retrieve(request, response, pool, results_ae, 200, level, path);
                    }
                    else {
                        console.log('resource do not exist');
                        response.setHeader('X-M2M-RSC', '4004');
                        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                    }
                }
                else {
                    console.log('query error: ' + results_ae.code);
                    response.setHeader('X-M2M-RSC', '5000');
                    response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_ae.code + '\"}' : '<rsp>' + results_ae.code + '</rsp>');
                }
            });
        }
        else {
            console.log('query error: ' + results.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
        }
    });
}

function parse_update_action(request, response, pool, results_ae, jsonObj, level, path) {
    //if ((request.headers.nmtype == 'long') && (jsonObj[rootnm] != null)) { // long name

    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:AE') : ('m2m:ae');

    if(jsonObj[rootnm] != null) {
        if(request.headers.nmtype == 'long') {
            // check NP
            if ((jsonObj[rootnm]['resourceName'] != null) || (jsonObj[rootnm]['resourceType'] != null) || (jsonObj[rootnm]['resourceID'] != null) || (jsonObj[rootnm]['parentID'] != null) ||
                (jsonObj[rootnm]['creationTime'] != null) || (jsonObj[rootnm]['lastModifiedTime'] != null) || (jsonObj[rootnm]['App-ID'] != null) || (jsonObj[rootnm]['AE-ID'] != null) || (jsonObj[rootnm]['nodeLink'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if (0) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                var accesscontrolpolicyids = jsonObj[rootnm]['accessControlPolicyIDs'] == null ? results_ae[0].accesscontrolpolicyids : jsonObj[rootnm]['accessControlPolicyIDs'].toString().replace(/,/g, ' ');
                var expirationtime = jsonObj[rootnm]['expirationTime'] == null ? results_ae[0].expirationtime : jsonObj[rootnm]['expirationTime'];
                var labels = jsonObj[rootnm]['labels'] == null ? results_ae[0].labels : jsonObj[rootnm]['labels'].toString().replace(/,/g, ' ');
                var announceto = jsonObj[rootnm]['announceTo'] == null ? results_ae[0].announceto : jsonObj[rootnm]['announceTo'].toString().replace(/,/g, ' ');
                var announcedattribute = jsonObj[rootnm]['announcedAttribute'] == null ? results_ae[0].announcedattribute : jsonObj[rootnm]['announcedAttribute'].toString().replace(/,/g, ' ');
                var appname = jsonObj[rootnm]['appName'] == null ? results_ae[0].appname : jsonObj[rootnm]['appName'];
                var pointofaccess = jsonObj[rootnm]['pointOfAccess'] == null ? results_ae[0].pointofaccess : jsonObj[rootnm]['pointOfAccess'].toString().replace(/,/g, ' ');
                var ontologyref = jsonObj[rootnm]['ontologyRef'] == null ? results_ae[0].ontologyref : jsonObj[rootnm]['ontologyRef'];
                var requestreachability = jsonObj[rootnm]['requestReachability'] == null ? results_ae[0].requestreachability : jsonObj[rootnm]['requestReachability'];

                update_action(request, response, pool, accesscontrolpolicyids, expirationtime, labels, announceto, announcedattribute, appname, pointofaccess, ontologyref, requestreachability, level, path);
            }
        }
        else { // request.headers.nmtype == 'short'
            // check NP
            if ((jsonObj[rootnm]['rn'] != null) || (jsonObj[rootnm]['ty'] != null) || (jsonObj[rootnm]['ri'] != null) || (jsonObj[rootnm]['pi'] != null) ||
                (jsonObj[rootnm]['ct'] != null) || (jsonObj[rootnm]['lt'] != null) || (jsonObj[rootnm]['api'] != null) || (jsonObj[rootnm]['aei'] != null) || (jsonObj[rootnm]['nl'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if (0) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                accesscontrolpolicyids = jsonObj[rootnm]['acpi'] == null ? results_ae[0].accesscontrolpolicyids : jsonObj[rootnm]['acpi'].toString().replace(/,/g, ' ');
                expirationtime = jsonObj[rootnm]['et'] == null ? results_ae[0].expirationtime : jsonObj[rootnm]['et'];
                labels = jsonObj[rootnm]['lbl'] == null ? results_ae[0].labels : jsonObj[rootnm]['lbl'.toString().replace(/,/g, ' ')];
                announceto = jsonObj[rootnm]['at'] == null ? results_ae[0].announceto : jsonObj[rootnm]['at'].toString().replace(/,/g, ' ');
                announcedattribute = jsonObj[rootnm]['aa'] == null ? results_ae[0].announcedattribute : jsonObj[rootnm]['aa'].toString().replace(/,/g, ' ');
                appname = jsonObj[rootnm]['an'] == null ? results_ae[0].appname : jsonObj[rootnm]['an'];
                pointofaccess = jsonObj[rootnm]['poa'] == null ? results_ae[0].pointofaccess : jsonObj[rootnm]['poa'].toString().replace(/,/g, ' ');
                ontologyref = jsonObj[rootnm]['or'] == null ? results_ae[0].ontologyref : jsonObj[rootnm]['or'];
                requestreachability = jsonObj[rootnm]['rr'] == null ? results_ae[0].requestreachability : jsonObj[rootnm]['rr'];

                update_action(request, response, pool, accesscontrolpolicyids, expirationtime, labels, announceto, announcedattribute, appname, pointofaccess, ontologyref, requestreachability, level, path);
            }
        }
    }
    else {
        console.log('bad request body : different with name type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : Body : different with name type\"}' : '<rsp>Bad Request : Body : different with name type</rsp>');
    }
}
exports.update = function(request, response, pool, results_ae, content_type, level, path) {
//    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.update]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.update] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.update] locale: ' + request.headers.locale);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.update] X-M2M-RI: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.update] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.update] Content-Type: ' + request.headers['content-type']);

    /*
     if( (request.headers.accept == null) || (request.headers.accept != 'application/onem2m-resource+xml') ) {
     response.setHeader('X-M2M-RSC', '4000');
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if( (request.headers['content-type'] == null) || (request.headers['content-type'] != 'application/onem2m-resource+xml') ) {
     response.setHeader('X-M2M-RSC', '4000');
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

    if(request.body == "") {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : body is empty</h1>');
        return;
    }

    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.update] ' + request.body);

    if( content_type.split('+')[1] == 'xml' ) {
        var parser = new xml2js.Parser({explicitArray : false});
        parser.parseString(request.body, function (err, result) {
            if(err) {
                console.log('bad request body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end('<h1>Bad Request : Body</h1>');
            }
            else {
                var jsonString = JSON.stringify(result);
                var jsonObj = JSON.parse(jsonString);

                response.setHeader('X-M2M-RSC', '2004');
                parse_update_action(request, response, pool, results_ae, jsonObj, level, path);
            }
        });
    }
    else if( content_type.split('+')[1] == 'json' ) {
        response.setHeader('X-M2M-RSC', '2004');

        var jsonObj = {};
        var rootnm = (request.headers.nmtype == 'long') ? ('m2m:AE') : ('m2m:ae');

        if(JSON.parse(request.body.toString())['ae'] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())['ae']) : (jsonObj[rootnm] = JSON.parse(request.body.toString())['ae']);
        }
        else if(JSON.parse(request.body.toString())[rootnm] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]) : (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]);
        }
        else {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())) : (jsonObj[rootnm] = JSON.parse(request.body.toString()));
        }

        parse_update_action(request, response, pool, results_ae, jsonObj, level, path);
    }
    else {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : do not support content-type</h1>');
    }
};


exports.delete = function(request, response, pool, results_ae, status, level, path) {
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.delete]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.delete] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.delete] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.delete] x-m2m-ri: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.delete] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[AE.delete] locale: ' + request.headers.locale);

    /*    if(request.headers.accept != 'application/onem2m-resource+xml') {
     response.setHeader('X-M2M-RSC', '4000');
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if(request.headers['content-type'] != 'application/onem2m-resource+xml') {
     response.setHeader('X-M2M-RSC', '4000');
     response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
     return;
     }
     */

    delete_delete.request(request, response, pool, status, level, path);
};

