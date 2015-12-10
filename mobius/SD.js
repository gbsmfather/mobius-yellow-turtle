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
var get_retrieve = require('./retrieve');
var delete_delete = require('./delete');
var xmlbuilder = require('xmlbuilder');
var subscription = require('./subscription');
var util = require('util');
var DB = require('./db_action');

var _this = this;

function create_action( request, response, pool, parentid, resourcename, creator, accesscontrolpolicyids, expirationtime, labels, descriptor, ontologyref, creationtime, level, parentpath) {
    // build semanticDescriptor
    var resourcetype = 24;
    var cur_d = new Date();
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
    var resourceid = 'CO' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);

    var lastmodifiedtime = creationtime;

    if(expirationtime == '')
    {
        cur_d.setMonth(cur_d.getMonth() + 1);
        expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    }

    var path = url.parse(request.url).pathname + '/' + resourcename;
    var sql = util.format('insert into lv%s (resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, accesscontrolpolicyids, labels, creator, descriptor, ontologyref, ' +
        'path, parentpath) ' +
        'VALUE (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
        level + 1,
        resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, accesscontrolpolicyids, labels, creator, descriptor, ontologyref,
        path, parentpath);

    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            sql = util.format("select * from lv%s where path = \'%s\'", level + 1, path);
            DB.getResult(pool, sql, function (err, results_sd) {
                if(!err) {
                    if (results_sd.length == 1) {
                        subscription.check(request, pool, results_sd, level, parentpath);

                        response.setHeader('Content-Location', path);
                        response.setHeader('X-M2M-RSC', '2001');
                        _this.retrieve(request, response, pool, results_sd, 201, level, path);
                    }
                    else {
                        console.log('[SD.create] resource do not exist');
                        response.setHeader('X-M2M-RSC', '4004');
                        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                    }
                }
                else {
                    console.log('[SD.create] query error: ' + results_sd.code);
                    response.setHeader('X-M2M-RSC', '5000');
                    response.status(500).end('<h1>' + results_sd.code + '</h1>');
                }
            });
        }
        else {
            if(results.code == 'ER_DUP_ENTRY') {
                response.setHeader('X-M2M-RSC', '4105');
                response.status(409).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
            }
            else {
                console.log('[SD.create] query error: ' + results.code);
                response.setHeader('X-M2M-RSC', '5000');
                response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
            }
        }
    });
}

function parse_create_action(request, response, pool, parentid, creator, jsonObj, creationtime, level, parentpath) {
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:semanticDescriptor') : ('m2m:sd');

    if(jsonObj[rootnm] != null) {
        if(request.headers.nmtype == 'long') {
            // check NP
            if ((jsonObj[rootnm]['resourceType'] != null) || (jsonObj[rootnm]['resourceID'] != null) || (jsonObj[rootnm]['parentID'] != null) ||
                (jsonObj[rootnm]['creationTime'] != null) || (jsonObj[rootnm]['lastModifiedTime'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if ((jsonObj[rootnm]['descriptor'] == null)) {
                console.log('[SD.create] Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                var accesscontrolpolicyids = jsonObj[rootnm]['accessControlPolicyIDs'] == null ? '' : jsonObj[rootnm]['accessControlPolicyIDs'].toString().replace(/,/g, ' ');
                var expirationtime = jsonObj[rootnm]['expirationTime'] == null ? '' : jsonObj[rootnm]['expirationTime'];
                var labels = jsonObj[rootnm]['labels'] == null ? '' : jsonObj[rootnm]['labels'].toString().replace(/,/g, ' ');
                creator = jsonObj[rootnm]['creator'] == null ? '' : jsonObj[rootnm]['creator'];
                var descriptor = jsonObj[rootnm]['descriptor'] == null ? '' : jsonObj[rootnm]['descriptor'];
                var ontologyref = jsonObj[rootnm]['ontologyRef'] == null ? '' : jsonObj[rootnm]['ontologyRef'];

                if (expirationtime != '') {
                    cur_d = new Date();
                    var currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');

                    if (expirationtime < currenttime) {
                        console.log('[SD.create] Bad Request : expiration is before now');
                        response.setHeader('X-M2M-RSC', '4000');
                        response.status(400).end('<h1>Bad Request : expiration is before now</h1>');
                        return;
                    }
                }

                var cur_d = new Date();
                var msec = (parseInt(cur_d.getMilliseconds(), 10)<10) ? ('00'+cur_d.getMilliseconds()) : ((parseInt(cur_d.getMilliseconds(), 10)<100) ? ('0'+cur_d.getMilliseconds()) : cur_d.getMilliseconds());
                var resourcename = 'sd-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if (request.headers['x-m2m-nm'] != null && request.headers['x-m2m-nm'] != '') {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if (jsonObj[rootnm]['resourceName'] != null && jsonObj[rootnm]['resourceName'] != '') {
                    resourcename = jsonObj[rootnm]['resourceName'];
                }

                create_action(request, response, pool, parentid, resourcename, creator, accesscontrolpolicyids, expirationtime, labels, descriptor, ontologyref, creationtime, level, parentpath);
            }
        }
        else { // request.headers.nmtype == 'short'
            // check NP
            if ((jsonObj[rootnm]['ty'] != null) || (jsonObj[rootnm]['ri'] != null) || (jsonObj[rootnm]['pi'] != null) ||
                (jsonObj[rootnm]['ct'] != null) || (jsonObj[rootnm]['lt'] != null)) {
                console.log('[SD.create] Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if (jsonObj[rootnm]['dspt'] == null) {
                console.log('[SD.create] Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                accesscontrolpolicyids = jsonObj[rootnm]['acpi'] == null ? '' : jsonObj[rootnm]['acpi'].toString().replace(/,/g, ' ');
                expirationtime = jsonObj[rootnm]['et'] == null ? '' : jsonObj[rootnm]['et'];
                labels = jsonObj[rootnm]['lbl'] == null ? '' : jsonObj[rootnm]['lbl'].toString().replace(/,/g, ' ');
                creator = jsonObj[rootnm]['cr'] == null ? '' : jsonObj[rootnm]['cr'];
                descriptor = jsonObj[rootnm]['dspt'] == null ? '' : jsonObj[rootnm]['dspt'];
                ontologyref = jsonObj[rootnm]['or'] == null ? '' : jsonObj[rootnm]['or'];

                if (expirationtime != '') {
                    cur_d = new Date();
                    currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');

                    if (expirationtime < currenttime) {
                        console.log('[SD.create] Bad Request : expiration is before now');
                        response.setHeader('X-M2M-RSC', '4000');
                        response.status(400).end('<h1>Bad Request : expiration is before now</h1>');
                        return;
                    }
                }

                cur_d = new Date();
                msec = (parseInt(cur_d.getMilliseconds(), 10)<10) ? ('00'+cur_d.getMilliseconds()) : ((parseInt(cur_d.getMilliseconds(), 10)<100) ? ('0'+cur_d.getMilliseconds()) : cur_d.getMilliseconds());
                resourcename = 'sd-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if (request.headers['x-m2m-nm'] != null && request.headers['x-m2m-nm'] != '') {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if (jsonObj[rootnm]['rn'] != null && jsonObj[rootnm]['rn'] != '') {
                    resourcename = jsonObj[rootnm]['rn'];
                }

                create_action(request, response, pool, parentid, resourcename, creator, accesscontrolpolicyids, expirationtime, labels, descriptor, ontologyref, creationtime, level, parentpath);
            }

        }
    }
    else {
        console.log('[SD.create] bad request body : different with name type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : Body : different with name type\"}' : '<rsp>Bad Request : Body : different with name type</rsp>');
    }
}

exports.create = function(request, response, pool, parentid, creator, content_type, level, parentpath) {
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SD.create]');

    if(request.body == "") {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : body is empty</h1>');
        return;
    }

    var cur_d = new Date();
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

    var creationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');

    if( content_type.split('+')[1] == 'xml' ) {
        var parser = new xml2js.Parser({explicitArray : false});
        parser.parseString(request.body, function (err, result) {
            if(err) {
                console.log('[SD.create] xml parser error : bad request body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end('<h1>Bad Request : Body</h1>');
            }
            else {
                var jsonString = JSON.stringify(result);
                var jsonObj = JSON.parse(jsonString);

                parse_create_action(request, response, pool, parentid, creator, jsonObj, creationtime, level, parentpath);
            }
        });
    }
    else if( content_type.split('+')[1] == 'json' ) {
        var jsonObj = {};
        var rootnm = (request.headers.nmtype == 'long') ? ('m2m:semanticDescriptor') : ('m2m:sd');

        if(JSON.parse(request.body.toString())['sd'] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())['sd']) : (jsonObj[rootnm] = JSON.parse(request.body.toString())['sd']);
        }
        else if(JSON.parse(request.body.toString())[rootnm] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]) : (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]);
        }
        else {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())) : (jsonObj[rootnm] = JSON.parse(request.body.toString()));
        }

        parse_create_action(request, response, pool, parentid, creator, jsonObj, creationtime, level, parentpath);
    }
    else {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : do not support content-type</h1>');
    }
};

exports.retrieve = function(request, response, pool, results_sd, status, level, path) {
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SD.retrieve]');

    var node = {};
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:semanticDescriptor') : ('m2m:sd');
    var listnm = (request.headers.nmtype == 'long') ? ('m2m:URIList') : ('m2m:uril');
    if(request.headers.usebodytype == 'json') {
        results_sd[0].labels = results_sd[0].labels.toString().split(' ');
        results_sd[0].accesscontrolpolicyids = results_sd[0].accesscontrolpolicyids.toString().split(' ');

        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[listnm] = [];

            get_retrieve.request_fu1_json(request, response, pool, node, results_sd[0].resourceid, results_sd[0].resourcetype, results_sd[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_sd[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_sd[0].resourceid];
            get_retrieve.addele_sd_json(request, node[results_sd[0].resourceid], results_sd[0]);

            get_retrieve.request_rc4_json(request, response, pool, node, rootnm, results_sd[0].resourceid, results_sd[0].resourcetype, results_sd[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_sd[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_sd[0].resourceid];
            get_retrieve.addele_sd_json(request, node[results_sd[0].resourceid], results_sd[0]);

            get_retrieve.request_json(request, response, pool, node[rootnm], results_sd[0].resourceid, results_sd[0].resourcetype, results_sd[0].resourcename, status);
        }
    }
    else { // request.headers.usebodytype == 'xml'
        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[0] = xmlbuilder.create(listnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.request_fu1(request, response, pool, node, results_sd[0].resourceid, results_sd[0].resourcetype, results_sd[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[results_sd[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_sd(request, node[results_sd[0].resourceid], results_sd[0]);

            response.setHeader('X-M2M-RSC', '2000');
            get_retrieve.request_rc4(request, response, pool, node, results_sd[0].resourceid, results_sd[0].resourcetype, results_sd[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[results_sd[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_sd(request, node[results_sd[0].resourceid], results_sd[0]);

            get_retrieve.request(request, response, pool, node, results_sd[0].resourceid, results_sd[0].resourcetype, results_sd[0].resourcename, status);
        }
    }
};


function update_action( request, response, pool, expirationtime, accesscontrolpolicyids, labels, descriptor, ontologyref, level, path ) {
    // build semanticDescriptor
    var cur_d = new Date();
    var lastmodifiedtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');

    if(expirationtime == '')
    {
        cur_d.setMonth(cur_d.getMonth() + 1);
        expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    }

    var sql = util.format('update lv%s set lastmodifiedtime = \'%s\', accesscontrolpolicyids = \'%s\', expirationtime = \'%s\', labels = \'%s\', descriptor = \'%s\', ontologyref = \'%s\' where path = \'%s\'',
        level,
        lastmodifiedtime, accesscontrolpolicyids, expirationtime, labels, descriptor, ontologyref, path);

    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            sql = util.format("select * from lv%s where path = \'%s\'", level, path);
            DB.getResult(pool, sql, function (err, results_sd) {
                if(!err) {
                    if (results_sd.length == 1) {
                        response.setHeader('Content-Location', path);
                        response.setHeader('X-M2M-RSC', '2004');
                        _this.retrieve(request, response, pool, results_sd, 200, level, path);
                    }
                    else {
                        console.log('[SD.update] resource do not exist');
                        response.setHeader('X-M2M-RSC', '4004');
                        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                    }
                }
                else {
                    console.log('[SD.update] query error: ' + results_sd.code);
                    response.setHeader('X-M2M-RSC', '5000');
                    response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_sd.code + '\"}' : '<rsp>' + results_sd.code + '</rsp>');
                }
            });
        }
        else {
            console.log('[SD.update] query error: ' + results.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
        }
    });
}

function parse_update_action(request, response, pool, results_sd, jsonObj, level, path) {
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:semanticDescriptor') : ('m2m:sd');
    if(jsonObj[rootnm] != null) {
        if(request.headers.nmtype == 'long') {
            // check NP
            if ((jsonObj[rootnm]['resourceName'] != null) || (jsonObj[rootnm]['resourceType'] != null) || (jsonObj[rootnm]['resourceID'] != null) || (jsonObj[rootnm]['parentID'] != null) ||
                (jsonObj[rootnm]['creationTime'] != null) || (jsonObj[rootnm]['lastModifiedTime'] != null) || (jsonObj[rootnm]['creator'] != null)) {
                console.log('[SD.update] Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if (0) {
                console.log('[SD.update] Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                var accesscontrolpolicyids = jsonObj[rootnm]['accessControlPolicyIDs'] == null ? results_sd[0].accesscontrolpolicyids : jsonObj[rootnm]['accessControlPolicyIDs'].toString().replace(/,/g, ' ');
                var expirationtime = jsonObj[rootnm]['expirationTime'] == null ? results_sd[0].expirationtime : jsonObj[rootnm]['expirationTime'];
                var labels = jsonObj[rootnm]['labels'] == null ? results_sd[0].labels : jsonObj[rootnm]['labels'].toString().replace(/,/g, ' ');
                var descriptor = jsonObj[rootnm]['descriptor'] == null ? results_sd[0].descriptor : jsonObj[rootnm]['descriptor'];
                var ontologyref = jsonObj[rootnm]['ontologyRef'] == null ? results_sd[0].ontologyref : jsonObj[rootnm]['ontologyRef'];

                if (expirationtime != '') {
                    var cur_d = new Date();
                    var currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');

                    if (expirationtime < currenttime) {
                        console.log('Bad Request : expiration is before now');
                        response.setHeader('X-M2M-RSC', '4000');
                        response.status(400).end('<h1>Bad Request : expiration is before now</h1>');
                        return;
                    }
                }

                update_action(request, response, pool, expirationtime, accesscontrolpolicyids, labels, descriptor, ontologyref, level, path);
            }
        }
        else { // request.headers.nmtype == 'short'
            // check NP
            if ((jsonObj[rootnm]['rn'] != null) || (jsonObj[rootnm]['ty'] != null) || (jsonObj[rootnm]['ri'] != null) || (jsonObj[rootnm]['pi'] != null) ||
                (jsonObj[rootnm]['ct'] != null) || (jsonObj[rootnm]['lt'] != null) || (jsonObj[rootnm]['st'] != null) || (jsonObj[rootnm]['cr'] != null)) {
                console.log('[SD.update] Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if (0) {
                console.log('[SD.update] Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                accesscontrolpolicyids = jsonObj[rootnm]['acpi'] == null ? results_sd[0].accesscontrolpolicyids : jsonObj[rootnm]['acpi'].toString().replace(/,/g, ' ');
                expirationtime = jsonObj[rootnm]['et'] == null ? results_sd[0].expirationtime : jsonObj[rootnm]['et'];
                labels = jsonObj[rootnm]['lbl'] == null ? results_sd[0].labels : jsonObj[rootnm]['lbl'].toString().replace(/,/g, ' ');
                descriptor = jsonObj[rootnm]['dspt'] == null ? results_sd[0].descriptor : jsonObj[rootnm]['dspt'];
                ontologyref = jsonObj[rootnm]['or'] == null ? results_sd[0].ontologyref : jsonObj[rootnm]['or'];

                if (expirationtime != '') {
                    cur_d = new Date();
                    currenttime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');

                    if (expirationtime < currenttime) {
                        console.log('Bad Request : expiration is before now');
                        response.setHeader('X-M2M-RSC', '4000');
                        response.status(400).end('<h1>Bad Request : expiration is before now</h1>');
                        return;
                    }
                }

                update_action(request, response, pool, expirationtime, accesscontrolpolicyids, labels, descriptor, ontologyref, level, path);
            }
        }
    }
    else {
        console.log('[SD.update] bad request body : different with name type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : Body : different with name type\"}' : '<rsp>Bad Request : Body : different with name type</rsp>');
    }
}

exports.update = function(request, response, pool, results_sd, content_type, level, path) {
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SD.update]');

    if(request.body == "") {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : body is empty</h1>');
        return;
    }

    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SD.update] ' + request.body);

    if( content_type.split('+')[1] == 'xml' ) {
        var parser = new xml2js.Parser({explicitArray : false});
        parser.parseString(request.body, function (err, result) {
            if(err) {
                console.log('[SD.update] bad request body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end('<h1>Bad Request : Body</h1>');
            }
            else {
                var jsonString = JSON.stringify(result);
                var jsonObj = JSON.parse(jsonString);

                parse_update_action(request, response, pool, results_sd, jsonObj, level, path);
            }
        });
    }
    else if( content_type.split('+')[1] == 'json' ) {
        var jsonObj = {};
        var rootnm = (request.headers.nmtype == 'long') ? ('m2m:semanticDescriptor') : ('m2m:sd');

        if(JSON.parse(request.body.toString())['sd'] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())['sd']) : (jsonObj[rootnm] = JSON.parse(request.body.toString())['sd']);
        }
        else if(JSON.parse(request.body.toString())[rootnm] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]) : (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]);
        }
        else {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())) : (jsonObj[rootnm] = JSON.parse(request.body.toString()));
        }

        parse_update_action(request, response, pool, results_sd, jsonObj, level, path);
    }
    else {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : do not support content-type</h1>');
    }
};

exports.delete = function(request, response, pool, results_sd, status, level, path) {
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SD.delete]');

    delete_delete.request(request, response, pool, status, level, path);
};


