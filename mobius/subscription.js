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

var util = require('util');
var url = require('url');
var http = require('http');
var js2xmlparser = require('js2xmlparser');
var xmlbuilder = require('xmlbuilder');
var DB = require('./db_action');

var get_retrieve = require('./retrieve');

var ss_fail_count = {};

exports.check = function(request, pool, results_noti, level, parentpath) {
    var sql = util.format('select resourceid, eventnotificationcriteria, notificationcontenttype, notificationuri, path from lv%s where parentpath = \'%s\' and resourcetype = \'23\' order by resourceid desc limit 20', level + 1, parentpath);
    DB.getResult(pool, sql, function (err, results_ss) {
        if(!err) {
            for (var i = 0; i < results_ss.length; i++) {
                if (ss_fail_count[results_ss[i].resourceid] == null) {
                    ss_fail_count[results_ss[i].resourceid] = 0;
                }
                ss_fail_count[results_ss[i].resourceid]++;
                if (ss_fail_count[results_ss[i].resourceid] >= 16) {
                    delete ss_fail_count[results_ss[i].resourceid];
                    delete_SS(results_ss[i].path);
                }
                else {
                    var eventnotificationcriteria_jsonObj = JSON.parse(results_ss[i].eventnotificationcriteria);
                    if (eventnotificationcriteria_jsonObj.eventType == 3 || eventnotificationcriteria_jsonObj.evt == 3) { // Create_of_Direct_Child_Resource
                        var notificationuri = results_ss[i].notificationuri;
                        var sub_nu = url.parse(notificationuri);
                        var notificationcontenttype = results_ss[i].notificationcontenttype;

                        var node = {};
                        if (notificationcontenttype == 2) {
                            node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'] = {};
                            node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'subscriptionReference' : 'sur'] = results_ss[i].path;
                            node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'] = {};
                            node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'] = {};
                            rootnm = '';
                            if(results_noti[0].resourcetype == 16) {
                                rootnm = (request.headers.nmtype == 'long') ? 'remoteCSE' : 'csr';
                                node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm] = {};
                                get_retrieve.addele_rc_json(request, node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm], results_noti[0]);
                            }
                            else if(results_noti[0].resourcetype == 2) {
                                rootnm = (request.headers.nmtype == 'long') ? 'AE' : 'ae';
                                node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm] = {};
                                get_retrieve.addele_ae_json(request, node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm], results_noti[0]);
                            }
                            else if(results_noti[0].resourcetype == 3) {
                                rootnm = (request.headers.nmtype == 'long') ? 'container' : 'cnt';
                                node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm] = {};
                                get_retrieve.addele_co_json(request, node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm], results_noti[0]);
                            }
                            else if(results_noti[0].resourcetype == 4) {
                                rootnm = (request.headers.nmtype == 'long') ? 'contentInstance' : 'cin';
                                node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm] = {};
                                get_retrieve.addele_ci_json(request, node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm], results_noti[0]);
                            }
                            else if(results_noti[0].resourcetype == 23) {
                                rootnm = (request.headers.nmtype == 'long') ? 'subscription' : 'sub';
                                node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm] = {};
                                get_retrieve.addele_ss_json(request, node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'][(request.headers.nmtype == 'long') ? 'notificationEvent' : 'nev'][(request.headers.nmtype == 'long') ? 'representation' : 'rep'][rootnm], results_noti[0]);
                            }
                            else {

                            }

                            if(request.headers.usebodytype == 'xml') {
                                if(sub_nu.protocol == 'http:') {
                                    node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn']['@'] = {
                                        "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
                                        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
                                    };

                                    var xmlString = js2xmlparser((request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn', node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn']);
                                    request_SS(notificationuri, results_ss[i].resourceid, xmlString, request.headers.usebodytype, results_ss[i].path);
                                }
                                else { // mqtt:
                                    var jsonString = {};
                                    jsonString[(request.headers.nmtype == 'long') ? 'singleNotification' : 'sgn'] = node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'];
                                    request_SS_mqtt(sub_nu.hostname, notificationuri, results_ss[i].resourceid, JSON.stringify(jsonString), request.headers.usebodytype, results_ss[i].path);
                                }
                            }
                            else { // defaultbodytype == 'json')
                                if(sub_nu.protocol == 'http:') {
                                    request_SS(notificationuri, results_ss[i].resourceid, JSON.stringify(node), request.headers.usebodytype, results_ss[i].path);
                                }
                                else { // mqtt:
                                    jsonString = {};
                                    jsonString[(request.headers.nmtype == 'long') ? 'singleNotification' : 'sgn'] = node[(request.headers.nmtype == 'long') ? 'm2m:singleNotification' : 'm2m:sgn'];
                                    request_SS_mqtt(sub_nu.hostname, notificationuri, results_ss[i].resourceid, JSON.stringify(jsonString), request.headers.usebodytype, results_ss[i].path);
                                }
                            }
                        }
                        else {
                            console.log('notificationContentType except 2 do not support');
                        }
                    }
                    else {
                        console.log('eventNotificationCriteria-eventType except 3 do not support');
                    }
                }
            }
        }
        else {
            console.log('query error: ' + results_ss.code);
        }
    });
};

function request_SS(notificationuri, ri, xmlString, bodytype, path) {
    var options = {
        hostname: url.parse(notificationuri).hostname,
        port: url.parse(notificationuri).port,
        path: url.parse(notificationuri).path,
        method: 'POST',
        headers: {
            'locale': 'ko',
            'X-M2M-RI': ri,
            'Accept': 'application/'+bodytype,
            'X-M2M-Origin': path,
            'Content-Type': 'application/vnd.onem2m-ntfy+'+bodytype
        }
    };

    var bodyStr = '';
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            bodyStr += chunk;
        });

        res.on('end', function (chunk) {
            if(res.statusCode == 200 || res.statusCode == 201) {
                console.log('----> response for notification ' + res.headers['x-m2m-rsc'] + ' - ' + path);
                ss_fail_count[res.headers['x-m2m-ri']] = 0;
            }
        });
    });

    req.on('error', function (e) {
        if(e.message != 'read ECONNRESET') {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        }
    });

    // write data to request body
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log(xmlString);
    req.write(xmlString);
    req.end();
}

function delete_SS(path) {
    var options = {
        hostname: 'localhost',
        port: '7579',
        path: path,
        method: 'delete',
        headers: {
            'locale': 'ko',
            'X-M2M-RI': '12345',
            'Accept': 'application/'+defaultbodytype,
            'X-M2M-Origin': usecseid
        }
    };

    var bodyStr = '';
    var req = http.request(options, function(res) {
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('STATUS: ' + res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            bodyStr += chunk;
        });

        res.on('end', function () {
            if(res.statusCode == 200 || res.statusCode == 201) {
                console.log('delete subscription of ' + path + ' for no response');
            }
        });

    });

    req.on('error', function (e) {
        if(e.message != 'read ECONNRESET') {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        }
    });

    // write data to request body
    req.write('');
    req.end();
}

function request_SS_mqtt(serverip, notificationuri, ri, xmlString, bodytype, path) {
    var options = {
        hostname: usemqttproxy,
        port: usemqttproxyport,
        path: '/notification',
        method: 'POST',
        headers: {
            'locale': 'ko',
            'X-M2M-RI': ri,
            'Accept': 'application/'+bodytype,
            'X-M2M-Origin': usecseid,
            'Content-Type': 'application/vnd.onem2m-ntfy+'+bodytype,
            'nu': notificationuri,
            'bodytype': bodytype
        }
    };

    var bodyStr = '';
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            bodyStr += chunk;
        });

        res.on('end', function () {
            if(res.statusCode == 200 || res.statusCode == 201) {
                console.log('----> response for notification ' + res.headers['x-m2m-rsc']);
                ss_fail_count[res.headers['x-m2m-ri']] = 0;
            }
        });
    });

    req.on('error', function (e) {
        if(e.message != 'read ECONNRESET') {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        }
    });

    req.write(xmlString);
    req.end();

//    if(url.parse(notificationuri).pathname != null) {
//        var aeid = url.parse(notificationuri).pathname.replace('/', '');
//    }
//
//    var noti_topic = util.format('/oneM2M/req/%s/%s/%s', usecseid.replace('/', ':'), aeid, bodytype);
////    var resp_topic = util.format('/oneM2M/resp%s/%s', appid, path.toString().split('/')[3]);
//
//    //mqtt_client.on('connect', function () {
//
//
//    for(var i = 0; i < req_mqtt_client_arr.length; i++) {
//        var mqtt_client = req_mqtt_client_arr[i];
//
//
//        //mqtt_client.subscribe(resp_topic);
//
//        req_mqtt_ri_arr.push(ri);
//        if (bodytype == 'xml') {
//            var noti_message = {};
//            noti_message.op = 5; // notification
//            noti_message.to = aeid;
//            noti_message.fr = usecseid;
//            noti_message.ri = ri;
//            noti_message.pc = inpc;
//
//            noti_message['@'] = {
//                "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
//                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
//            };
//
//            var xmlString = js2xmlparser("m2m:rqp", noti_message);
//
//            console.log(noti_topic);
//            mqtt_client.publish(noti_topic, xmlString);
//        }
//        else { // defaultbodytpye == 'json'
//            noti_message = {};
//            noti_message['m2m:rqp'] = {};
//            noti_message['m2m:rqp'].op = 5; // notification
//            noti_message['m2m:rqp'].to = aeid;
//            noti_message['m2m:rqp'].fr = usecseid;
//            noti_message['m2m:rqp'].ri = ri;
//            noti_message['m2m:rqp'].pc = JSON.parse(inpc);
//            mqtt_client.publish(noti_topic, JSON.stringify(noti_message));
//            console.log(noti_topic);
//        }
//        // });
//
//        ss_fail_count[ri] = 0;
//    }
//
//    //
//    //mqtt_client.on('message', function (topic, message) {
//    //    // message is Buffer
//    //    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(message.toString());
//    //    var message_str = JSON.stringify(message.toString());
//    //    var message_obj = JSON.parse(message.toString());
//    //    ss_fail_count[message_obj.ri] = 0;
//    //    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('mqtt publish - ' + noti_topic);
//    //
//    //    mqtt_client.end();
//    //});
}


