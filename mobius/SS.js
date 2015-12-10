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
var util = require('util');
var DB = require('./db_action');

var _this = this;

function create_action( request, response, pool, parentid, resourcename, expirationtime, labels, creator, accesscontrolpolicyids, eventnotificationcriteria, expirationcounter, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, presubscriptionnotify, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, notificationeventcat, subscriberuri, creationtime, level, parentpath) {
    // build subscription
    var resourcetype = 23;
    //var resourceid = randomValuehex(12);
    var cur_d = new Date();
    var cur_o = cur_d.getTimezoneOffset()/(-60);
    cur_d.setHours(cur_d.getHours() + cur_o);
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
    var resourceid = 'SS' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);

    var lastmodifiedtime = creationtime;

    if(expirationtime == '')
    {
        cur_d.setMonth(cur_d.getMonth() + 1);
        //if( cur_o < 10) {
        //    expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
        // }
        //else {
            expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
        //}
    }

    var path = url.parse(request.url).pathname + '/' + resourcename;
    var sql = util.format('insert into lv%s (resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, labels, creator, accesscontrolpolicyids, ' +
        'eventnotificationcriteria, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, ' +
        'notificationeventcat, expirationcounter, presubscriptionnotify, subscriberuri, path, parentpath) ' +
        'VALUE (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
        level + 1,
        resourcetype, resourceid, resourcename, parentid, creationtime, lastmodifiedtime, expirationtime, labels, creator, accesscontrolpolicyids,
        eventnotificationcriteria, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype,
        notificationeventcat, expirationcounter, presubscriptionnotify, subscriberuri, path, parentpath);

    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            sql = util.format("select * from lv%s where path = \'%s\'", level + 1, path);
            DB.getResult(pool, sql, function (err, results_ss) {
                if(!err) {
                    if (results_ss.length == 1) {
                        response.setHeader('Content-Location', path);
                        response.setHeader('X-M2M-RSC', '2001');
                        _this.retrieve(request, response, pool, results_ss, 201, level, path);
                    }
                    else {
                        console.log('resource do not exist');
                        response.setHeader('X-M2M-RSC', '4004');
                        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                    }
                }
                else {
                    console.log('query error: ' + results_ss.code);
                    response.setHeader('X-M2M-RSC', '5000');
                    response.status(500).end('<h1>' + results_ss.code + '</h1>');
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

function parse_create_action(request, response, pool, parentid, creator, jsonObj, creationtime, level, parentpath) {
    //if ((request.headers.nmtype == 'long') && (jsonObj[rootnm] != null)) { // long name
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:subscription') : ('m2m:sub');
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
            else if ((jsonObj[rootnm]['notificationURI'] == null)) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                var accesscontrolpolicyids = jsonObj[rootnm]['accessControlPolicyIDs'] == null ? '' : jsonObj[rootnm]['accessControlPolicyIDs'].toString().replace(/,/g, ' ');
                var expirationtime = jsonObj[rootnm]['expirationTime'] == null ? '' : jsonObj[rootnm]['expirationTime'];
                var labels = jsonObj[rootnm]['labels'] == null ? '' : jsonObj[rootnm]['labels'].toString().replace(/,/g, ' ');
                var eventnotificationcriteria = jsonObj[rootnm]['eventNotificationCriteria'] == null ? '' : JSON.stringify(jsonObj[rootnm]['eventNotificationCriteria']);
                var expirationcounter = jsonObj[rootnm]['expirationCounter'] == null ? '' : jsonObj[rootnm]['expirationCounter'];
                var notificationuri = jsonObj[rootnm]['notificationURI'] == null ? '' : jsonObj[rootnm]['notificationURI'];
                var groupid = jsonObj[rootnm]['groupID'] == null ? '' : jsonObj[rootnm]['groupID'];
                var notificationforwardinguri = jsonObj[rootnm]['notificationForwardingURI'] == null ? '' : jsonObj[rootnm]['notificationForwardingURI'].toString().replace(/,/g, ' ');
                var batchnotify = jsonObj[rootnm]['batchNotify'] == null ? '' : jsonObj[rootnm]['batchNotify'];
                var ratelimit = jsonObj[rootnm]['rateLimit'] == null ? '' : jsonObj[rootnm]['rateLimit'];
                var presubscriptionnotify = jsonObj[rootnm]['preSubscriptionNotify'] == null ? '' : jsonObj[rootnm]['preSubscriptionNotify'];
                var pendingnotification = jsonObj[rootnm]['pendingNotification'] == null ? '' : jsonObj[rootnm]['pendingNotification'];
                var notificationstoragepriority = jsonObj[rootnm]['notificationStoragePriority'] == null ? '' : jsonObj[rootnm]['notificationStoragePriority'];
                var latestnotify = jsonObj[rootnm]['latestNotify'] == null ? '' : jsonObj[rootnm]['latestNotify'];
                var notificationcontenttype = jsonObj[rootnm]['notificationContentType'] == null ? '2' : jsonObj[rootnm]['notificationContentType'];
                var notificationeventcat = jsonObj[rootnm]['notificationEventCat'] == null ? '' : jsonObj[rootnm]['notificationEventCat'];
                var subscriberuri = jsonObj[rootnm]['subscriberURI'] == null ? '' : jsonObj[rootnm]['subscriberURI'];
                creator = jsonObj[rootnm]['creator'] == null ? '' : jsonObj[rootnm]['creator'];

                if (labels == '') {
                    labels = 'subscription';
                }

                var cur_d = new Date();
                var msec = (parseInt(cur_d.getMilliseconds(), 10)<10) ? ('00'+cur_d.getMilliseconds()) : ((parseInt(cur_d.getMilliseconds(), 10)<100) ? ('0'+cur_d.getMilliseconds()) : cur_d.getMilliseconds());
                var resourcename = 'sub-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if (request.headers['x-m2m-nm'] != null && request.headers['x-m2m-nm'] != '') {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if (jsonObj[rootnm]['resourceName'] != null && jsonObj[rootnm]['resourceName'] != '') {
                    resourcename = jsonObj[rootnm]['resourceName'];
                }

                create_action(request, response, pool, parentid, resourcename, expirationtime, labels, creator, accesscontrolpolicyids, eventnotificationcriteria, expirationcounter, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, presubscriptionnotify, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, notificationeventcat, subscriberuri, creationtime, level, parentpath);
            }
        }
        else { // request.headers.nmtype == 'short'
            // check NP
            if ((jsonObj[rootnm]['ty'] != null) || (jsonObj[rootnm]['ri'] != null) || (jsonObj[rootnm]['pi'] != null) ||
                (jsonObj[rootnm]['ct'] != null) || (jsonObj[rootnm]['lt'] != null) || (jsonObj[rootnm]['cr'] != null)) {
                console.log('Bad Request : NP Tag in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : NP Tag in body\"}' : '<rsp>Bad Request : NP Tag in body</rsp>');
            }
            // check M
            else if ((jsonObj[rootnm]['nu'] == null)) {
                console.log('Bad Request : M Tag is none in body');
                response.setHeader('X-M2M-RSC', '4000');
                response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : M Tag is none in body\"}' : '<rsp>Bad Request : M Tag is none in body</rsp>');
            }
            else {
                accesscontrolpolicyids = jsonObj[rootnm]['acpi'] == null ? '' : jsonObj[rootnm]['acpi'].toString().replace(/,/g, ' ');
                expirationtime = jsonObj[rootnm]['et'] == null ? '' : jsonObj[rootnm]['et'];
                labels = jsonObj[rootnm]['lbl'] == null ? '' : jsonObj[rootnm]['lbl'].toString().replace(/,/g, ' ');
                eventnotificationcriteria = jsonObj[rootnm]['enc'] == null ? '' : JSON.stringify(jsonObj[rootnm]['enc']);
                expirationcounter = jsonObj[rootnm]['exc'] == null ? '' : jsonObj[rootnm]['exc'];
                notificationuri = jsonObj[rootnm]['nu'] == null ? '' : jsonObj[rootnm]['nu'].toString().replace(/,/g, ' ');
                groupid = jsonObj[rootnm]['gpi'] == null ? '' : jsonObj[rootnm]['gpi'];
                notificationforwardinguri = jsonObj[rootnm]['nfu'] == null ? '' : jsonObj[rootnm]['nfu'];
                batchnotify = jsonObj[rootnm]['bn'] == null ? '' : jsonObj[rootnm]['bn'];
                ratelimit = jsonObj[rootnm]['rl'] == null ? '' : jsonObj[rootnm]['rl'];
                presubscriptionnotify = jsonObj[rootnm]['psn'] == null ? '' : jsonObj[rootnm]['psn'];
                pendingnotification = jsonObj[rootnm]['pn'] == null ? '' : jsonObj[rootnm]['pn'];
                notificationstoragepriority = jsonObj[rootnm]['nsp'] == null ? '' : jsonObj[rootnm]['nsp'];
                latestnotify = jsonObj[rootnm]['ln'] == null ? '' : jsonObj[rootnm]['ln'];
                notificationcontenttype = jsonObj[rootnm]['nct'] == null ? '2' : jsonObj[rootnm]['nct'];
                notificationeventcat = jsonObj[rootnm]['nec'] == null ? '' : jsonObj[rootnm]['nec'];
                subscriberuri = jsonObj[rootnm]['su'] == null ? '' : jsonObj[rootnm]['su'];
                creator = jsonObj[rootnm]['cr'] == null ? '' : jsonObj[rootnm]['cr'];

                if (labels == '') {
                    labels = 'subscription';
                }

                cur_d = new Date();
                msec = (parseInt(cur_d.getMilliseconds(), 10)<10) ? ('00'+cur_d.getMilliseconds()) : ((parseInt(cur_d.getMilliseconds(), 10)<100) ? ('0'+cur_d.getMilliseconds()) : cur_d.getMilliseconds());
                resourcename = 'sub-' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);
                if (request.headers['x-m2m-nm'] != null && request.headers['x-m2m-nm'] != '') {
                    resourcename = request.headers['x-m2m-nm'];
                }
                if (jsonObj[rootnm]['rn'] != null && jsonObj[rootnm]['rn'] != '') {
                    resourcename = jsonObj[rootnm]['rn'];
                }

                create_action(request, response, pool, parentid, resourcename, expirationtime, labels, creator, accesscontrolpolicyids, eventnotificationcriteria, expirationcounter, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, presubscriptionnotify, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, notificationeventcat, subscriberuri, creationtime, level, parentpath);
            }
        }
    }
    else {
        console.log('bad request body : different with name type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : Body : different with name type\"}' : '<rsp>Bad Request : Body : different with name type</rsp>');
    }
}
exports.create = function(request, response, pool, parentid, creator, content_type, level, parentpath) {
//    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create] locale: ' + request.headers.locale);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create] X-M2M-RI: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create] X-M2M-NM: ' + request.headers['x-m2m-nm']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create] Content-Type: ' + request.headers['content-type']);

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

    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.create] ' + request.body);

    var cur_d = new Date();
    var cur_o = cur_d.getTimezoneOffset()/(-60);
    cur_d.setHours(cur_d.getHours() + cur_o);
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

                parse_create_action(request, response, pool, parentid, creator, jsonObj, creationtime, level, parentpath);
            }
        });
    }
    else if( content_type.split('+')[1] == 'json' ) {
        var jsonObj = {};
        var rootnm = (request.headers.nmtype == 'long') ? ('m2m:subscription') : ('m2m:sub');

        if(JSON.parse(request.body.toString())['sub'] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())['sub']) : (jsonObj[rootnm] = JSON.parse(request.body.toString())['sub']);
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


exports.retrieve = function(request, response, pool, results_ss, status, level, path) {
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.retrieve]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.retrieve] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.retrieve] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.retrieve] x-m2m-ri: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.retrieve] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.retrieve] locale: ' + request.headers.locale);

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
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:subscription') : ('m2m:sub');
    var listnm = (request.headers.nmtype == 'long') ? ('m2m:URIList') : ('m2m:uril');
    if(request.headers.usebodytype == 'json') {
        results_ss[0].labels = results_ss[0].labels.toString().split(' ');
        results_ss[0].accesscontrolpolicyids = results_ss[0].accesscontrolpolicyids.toString().split(' ');
        results_ss[0].eventnotificationcriteria = JSON.parse(results_ss[0].eventnotificationcriteria);
        results_ss[0].notificationuri = results_ss[0].notificationuri.toString().split(' ');

        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[listnm] = [];
            node[listnm].push(results_ss[0].path);

            get_retrieve.request_fu1_json(request, response, pool, node, results_ss[0].resourceid, results_ss[0].resourcetype, results_ss[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ss[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ss[0].resourceid];
            get_retrieve.addele_ss_json(request, node[results_ss[0].resourceid], results_ss[0]);

            get_retrieve.request_rc4_json(request, response, pool, node, rootnm, results_ss[0].resourceid, results_ss[0].resourcetype, results_ss[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ss[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ss[0].resourceid];
            get_retrieve.addele_ss_json(request, node[results_ss[0].resourceid], results_ss[0]);

            get_retrieve.request_json(request, response, pool, node[rootnm], results_ss[0].resourceid, results_ss[0].resourcetype, results_ss[0].resourcename, status);
        }
    }
    else { // request.headers.usebodytype == 'xml'
        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[0] = xmlbuilder.create(listnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.request_fu1(request, response, pool, node, results_ss[0].resourceid, results_ss[0].resourcetype, results_ss[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[results_ss[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ss(request, node[results_ss[0].resourceid], results_ss[0]);

            response.setHeader('X-M2M-RSC', '2000');
            get_retrieve.request_rc4(request, response, pool, node, results_ss[0].resourceid, results_ss[0].resourcetype, results_ss[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[results_ss[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ss(request, node[results_ss[0].resourceid], results_ss[0]);

            get_retrieve.request(request, response, pool, node, results_ss[0].resourceid, results_ss[0].resourcetype, results_ss[0].resourcename, status);
        }
    }
};


function update_action( request, response, pool, expirationtime, labels, accesscontrolpolicyids, eventnotificationcriteria, expirationcounter, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, notificationeventcat, level, path) {
    // build subscription
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

    var sql = util.format('update lv%s set lastmodifiedtime = \'%s\', expirationtime = \'%s\', labels = \'%s\', accesscontrolpolicyids = \'%s\', eventnotificationcriteria = \'%s\', notificationuri = \'%s\', groupid = \'%s\', notificationforwardinguri = \'%s\', ' +
        'batchnotify = \'%s\', ratelimit = \'%s\', pendingnotification = \'%s\', notificationstoragepriority = \'%s\', latestnotify = \'%s\', notificationcontenttype = \'%s\', notificationeventcat = \'%s\', expirationcounter = \'%s\' ' +
        'where path = \'%s\'',
        level,
        lastmodifiedtime, expirationtime, labels, accesscontrolpolicyids, eventnotificationcriteria, notificationuri, groupid, notificationforwardinguri,
        batchnotify, ratelimit, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, notificationeventcat, expirationcounter, path);

    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            sql = util.format("select * from lv%s where path = \'%s\'", level, path);
            DB.getResult(pool, sql, function (err, results_ss) {
                if(!err) {
                    if (results_ss.length == 1) {
                        response.setHeader('Content-Location', path);
                        response.setHeader('X-M2M-RSC', '2004');
                        _this.retrieve(request, response, pool, results_ss, 200, level, path);
                    }
                    else {
                        console.log('resource do not exist');
                        response.setHeader('X-M2M-RSC', '4004');
                        response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
                    }
                }
                else {
                    console.log('query error: ' + results_ss.code);
                    response.setHeader('X-M2M-RSC', '5000');
                    response.status(500).end('<h1>' + results_ss.code + '</h1>');
                    response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_ss.code + '\"}' : '<rsp>' + results_ss.code + '</rsp>');
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

function parse_update_action(request, response, pool, results_ss, jsonObj, level, path) {
    //if ((request.headers.nmtype == 'long') && (jsonObj[rootnm] != null)) { // long name
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:subscription') : ('m2m:sub');
    if(jsonObj[rootnm] != null) {
        if(request.headers.nmtype == 'long') {
            // check NP
            if ((jsonObj[rootnm]['resourceName'] != null) || (jsonObj[rootnm]['resourceType'] != null) || (jsonObj[rootnm]['resourceID'] != null) || (jsonObj[rootnm]['parentID'] != null) ||
                (jsonObj[rootnm]['creationTime'] != null) || (jsonObj[rootnm]['lastModifiedTime'] != null) || (jsonObj[rootnm]['creator'] != null) || (jsonObj[rootnm]['preSubscriptionNotify'] != null) ||
                (jsonObj[rootnm]['creator'] != null) || (jsonObj[rootnm]['subscriberURI'] != null)) {
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
                var accesscontrolpolicyids = jsonObj[rootnm]['accessControlPolicyIDs'] == null ? results_ss[0].accesscontrolpolicyids : jsonObj[rootnm]['accessControlPolicyIDs'].toString().replace(/,/g, ' ');
                var expirationtime = jsonObj[rootnm]['expirationTime'] == null ? results_ss[0].expirationtime : jsonObj[rootnm]['expirationTime'];
                var labels = jsonObj[rootnm]['labels'] == null ? results_ss[0].labels : jsonObj[rootnm]['labels'].toString().replace(/,/g, ' ');
                var eventnotificationcriteria = jsonObj[rootnm]['eventNotificationCriteria'] == null ? results_ss[0].eventnotificationcriteria : JSON.stringify(jsonObj[rootnm]['eventNotificationCriteria']);
                var expirationcounter = jsonObj[rootnm]['expirationCounter'] == null ? results_ss[0].expirationcounter : jsonObj[rootnm]['expirationCounter'];
                var notificationuri = jsonObj[rootnm]['notificationURI'] == null ? results_ss[0].notificationuri : jsonObj[rootnm]['notificationURI'];
                var groupid = jsonObj[rootnm]['groupID'] == null ? results_ss[0].groupid : jsonObj[rootnm]['groupID'];
                var notificationforwardinguri = jsonObj[rootnm]['notificationForwardingURI'] == null ? results_ss[0].notificationforwardinguri : jsonObj[rootnm]['notificationForwardingURI'].toString().replace(/,/g, ' ');
                var batchnotify = jsonObj[rootnm]['batchNotify'] == null ? results_ss[0].batchnotify : jsonObj[rootnm]['batchNotify'];
                var ratelimit = jsonObj[rootnm]['rateLimit'] == null ? results_ss[0].ratelimit : jsonObj[rootnm]['rateLimit'];
                var pendingnotification = jsonObj[rootnm]['pendingNotification'] == null ? results_ss[0].pendingnotification : jsonObj[rootnm]['pendingNotification'];
                var notificationstoragepriority = jsonObj[rootnm]['notificationStoragePriority'] == null ? results_ss[0].notificationstoragepriority : jsonObj[rootnm]['notificationStoragePriority'];
                var latestnotify = jsonObj[rootnm]['latestNotify'] == null ? results_ss[0].latestnotify : jsonObj[rootnm]['latestNotify'];
                var notificationcontenttype = jsonObj[rootnm]['notificationContentType'] == null ? results_ss[0].notificationcontenttype : jsonObj[rootnm]['notificationContentType'];
                var notificationeventcat = jsonObj[rootnm]['notificationEventCat'] == null ? results_ss[0].notificationeventcat : jsonObj[rootnm]['notificationEventCat'];

                if (labels == '') {
                    labels = 'subscription';
                }

                update_action(request, response, pool, expirationtime, labels, accesscontrolpolicyids, eventnotificationcriteria, expirationcounter, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, notificationeventcat, level, path);
            }
        }
        else { // request.headers.nmtype == 'short'
            // check NP
            if ((jsonObj[rootnm]['rn'] != null) || (jsonObj[rootnm]['ty'] != null) || (jsonObj[rootnm]['ri'] != null) || (jsonObj[rootnm]['pi'] != null) ||
                (jsonObj[rootnm]['ct'] != null) || (jsonObj[rootnm]['lt'] != null) || (jsonObj[rootnm]['cr'] != null) || (jsonObj[rootnm]['psn'] != null) ||
                (jsonObj[rootnm]['su'] != null)) {
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
                accesscontrolpolicyids = jsonObj[rootnm]['acpi'] == null ? results_ss[0].accesscontrolpolicyids : jsonObj[rootnm]['acpi'].toString().replace(/,/g, ' ');
                expirationtime = jsonObj[rootnm]['et'] == null ? results_ss[0].expirationtime : jsonObj[rootnm]['et'];
                labels = jsonObj[rootnm]['lbl'] == null ? results_ss[0].labels : jsonObj[rootnm]['lbl'].toString().replace(/,/g, ' ');
                eventnotificationcriteria = jsonObj[rootnm]['enf'] == null ? results_ss[0].eventnotificationcriteria : JSON.stringify(jsonObj[rootnm]['enc']);
                expirationcounter = jsonObj[rootnm]['exc'] == null ? results_ss[0].expirationcounter : jsonObj[rootnm]['exc'];
                notificationuri = jsonObj[rootnm]['nu'] == null ? results_ss[0].notificationuri : jsonObj[rootnm]['nu'].toString().replace(/,/g, ' ');
                groupid = jsonObj[rootnm]['gpi'] == null ? results_ss[0].groupid : jsonObj[rootnm]['gpi'];
                notificationforwardinguri = jsonObj[rootnm]['nfu'] == null ? results_ss[0].notificationforwardinguri : jsonObj[rootnm]['nfu'];
                batchnotify = jsonObj[rootnm]['bn'] == null ? results_ss[0].batchnotify : jsonObj[rootnm]['bn'];
                ratelimit = jsonObj[rootnm]['rl'] == null ? results_ss[0].ratelimit : jsonObj[rootnm]['rl'];
                pendingnotification = jsonObj[rootnm]['pn'] == null ? results_ss[0].pendingnotification : jsonObj[rootnm]['pn'];
                notificationstoragepriority = jsonObj[rootnm]['nsp'] == null ? results_ss[0].notificationstoragepriority : jsonObj[rootnm]['nsp'];
                latestnotify = jsonObj[rootnm]['ln'] == null ? results_ss[0].latestnotify : jsonObj[rootnm]['ln'];
                notificationcontenttype = jsonObj[rootnm]['nct'] == null ? results_ss[0].notificationcontenttype : jsonObj[rootnm]['nct'];
                notificationeventcat = jsonObj[rootnm]['nec'] == null ? results_ss[0].notificationeventcat : jsonObj[rootnm]['nec'];

                if (labels == '') {
                    labels = 'subscription';
                }

                update_action(request, response, pool, expirationtime, labels, accesscontrolpolicyids, eventnotificationcriteria, expirationcounter, notificationuri, groupid, notificationforwardinguri, batchnotify, ratelimit, pendingnotification, notificationstoragepriority, latestnotify, notificationcontenttype, notificationeventcat, level, path);
            }
        }
    }
    else {
        console.log('bad request body : different with name type');
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"Bad Request : Body : different with name type\"}' : '<rsp>Bad Request : Body : different with name type</rsp>');
    }
}

exports.update = function(request, response, pool, results_ss, content_type, level, path) {
//    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.update]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.update] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.update] locale: ' + request.headers.locale);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.update] X-M2M-RI: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.update] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.update] Content-Type: ' + request.headers['content-type']);

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

    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.update] ' + request.body);

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

                parse_update_action(request, response, pool, results_ss, jsonObj, level, path);
            }
        });
    }
    else if( content_type.split('+')[1] == 'json' ) {
        var jsonObj = {};
        var rootnm = (request.headers.nmtype == 'long') ? ('m2m:subscription') : ('m2m:sub');

        if(JSON.parse(request.body.toString())['sub'] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())['sub']) : (jsonObj[rootnm] = JSON.parse(request.body.toString())['sub']);
        }
        else if(JSON.parse(request.body.toString())[rootnm] != null) {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]) : (jsonObj[rootnm] = JSON.parse(request.body.toString())[rootnm]);
        }
        else {
            (request.headers.nmtype == 'long') ? (jsonObj[rootnm] = JSON.parse(request.body.toString())) : (jsonObj[rootnm] = JSON.parse(request.body.toString()));
        }

        parse_update_action(request, response, pool, results_ss, jsonObj, level, path);
    }
    else {
        response.setHeader('X-M2M-RSC', '4000');
        response.status(400).end('<h1>Bad Request : do not support content-type</h1>');
    }
};

exports.delete = function(request, response, pool, results_ss, status, level, path) {
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.delete]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.delete] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.delete] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.delete] x-m2m-ri: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.delete] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[SS.delete] locale: ' + request.headers.locale);

    /*    if(request.headers.accept != 'application/onem2m-resource+xml') {
     response.status(400).end('<h1>Bad Request : accept</h1>');
     return;
     }

     if(request.headers['content-type'] != 'application/onem2m-resource+xml') {
     response.status(404).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"resource do not exist\"}' : '<rsp>resource do not exist</rsp>');
     return;
     }
     */

    delete_delete.request(request, response, pool, status, level, path);
};

