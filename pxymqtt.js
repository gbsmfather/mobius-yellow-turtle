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

var fs = require('fs');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var mqtt = require('mqtt');
var util = require('util');
var xml2js = require('xml2js');
var url = require('url');
var xmlbuilder = require('xmlbuilder');
var js2xmlparser = require("js2xmlparser");

var ip = require("ip");

var resp_mqtt_client_arr = [];
var req_mqtt_client_arr = [];
var resp_mqtt_ri_arr = [];

var http_reponse_q = {};

var usemqttcseid = '';
var usemqttcbhost = '';
var usemqttcbname = '';
var usemqttcbport = '';
var usemqttbroker = '';
var usemqttport = '';
var usemqttbodytype = '';
var usemqttnmtype = '';

global.NOPRINT = 'true';


var _this = this;


// ������ �����մϴ�.
var mqtt_app = express();


fs.readFile('mqtt_conf.json', 'utf-8', function (err, data) {
    if (err) {
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log("FATAL An error occurred trying to read in the file: " + err);
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log("error : set to default for configuration")
    }
    else {
        var conf = JSON.parse(data)['m2m:mqtt_conf'];

        usemqttnmtype = conf['nmtype'];
        usemqttbodytype = conf['bodytype'];
        usemqttport = conf['port'];
        usemqttcbhost = conf['cbhost'];
        usemqttcbport = conf['cbport'];
        usemqttcbname = conf['cbname'];
        usemqttbroker = conf['broker'];

        mqtt_app.use(bodyParser.urlencoded({extended: true}));
        mqtt_app.use(bodyParser.json({limit: '1mb', type: 'application/*+json'}));
        mqtt_app.use(bodyParser.text({limit: '1mb', type: 'application/*+xml'}));

        http.globalAgent.maxSockets = 1000000;

        http.createServer(mqtt_app).listen({port: usemqttport, agent: false}, function () {
            console.log('server (' + ip.address() + ') running at ' + usemqttport + ' port');

            http_retrieve_CSEBase(function(status, res_body) {
                if (status == 2000) {
                    if (usemqttbodytype == 'xml') {
                        var parser = new xml2js.Parser({explicitArray: false});
                        parser.parseString(res_body.toString(), function (err, result) {
                            if (err) {
                                NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[retrieve_CSEBase parsing error]');
                            }
                            else {
                                var jsonString = JSON.stringify(result);
                                var jsonObj = JSON.parse(jsonString);

                                self_create_remoteCSE(jsonObj, pool);
                            }
                        });
                    }
                    else {
                        var jsonObj = JSON.parse(res_body);
                        usemqttcseid = (jsonObj['m2m:cb'] == null) ? jsonObj['m2m:CSEBase']['CSE-ID'] : jsonObj['m2m:cb']['csi'];
                    }

                    _this.req_connect(usemqttbroker);
                    _this.reg_req_connect(usemqttbroker);
                    _this.resp_connect(usemqttbroker);
                }
                else {
                    console.log('Target CSE(' + usemqttcbhost + ') is not ready');
                    process.exit();
                }
            });
        });
    }
});


// for notification
var xmlParser = bodyParser.text({ limit: '1mb', type: '*/*' });

var noti_count = 0;
mqtt_app.post('/notification', xmlParser, function(request, response, next) {
    var aeid = url.parse(request.headers.nu).pathname.replace('/', '');

    if(aeid == '') {
        console.log('aeid of notification url is none');
        return;
    }

    var noti_topic = util.format('/oneM2M/req/%s/%s/%s', usemqttcseid.replace('/', ':'), aeid, request.headers.bodytype);

    for(var i = 0; i < resp_mqtt_client_arr.length; i++) {
        var mqtt_client = resp_mqtt_client_arr[i];

        var ri = request.headers['x-m2m-ri'];
        resp_mqtt_ri_arr.push(ri);
        http_reponse_q[ri] = response;

        var pc = JSON.parse(request.body);

        var noti_message = {};
        noti_message['m2m:rqp'] = {};
        noti_message['m2m:rqp'].op = 5; // notification
        noti_message['m2m:rqp'].to = (pc['sgn'] != null) ? pc.sgn.sur : pc.singleNotification.subscriptionReference;
        noti_message['m2m:rqp'].fr = usemqttcseid;
        noti_message['m2m:rqp'].ri = ri;
        noti_message['m2m:rqp'].pc = pc;

        if (request.headers.bodytype == 'xml') {
            noti_message['m2m:rqp']['@'] = {
                "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
            };

            var xmlString = js2xmlparser("m2m:rqp", noti_message['m2m:rqp']);

            mqtt_client.publish(noti_topic, xmlString);
            console.log('<---- ' + noti_topic);
        }
        else { // 'json'
            mqtt_client.publish(noti_topic, JSON.stringify(noti_message));
            console.log('<---- ' + noti_topic);
        }
    }

    //
    //mqtt_client.on('message', function (topic, message) {
    //    // message is Buffer
    //    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(message.toString());
    //    var message_str = JSON.stringify(message.toString());
    //    var message_obj = JSON.parse(message.toString());
    //    ss_fail_count[message_obj.ri] = 0;
    //    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('mqtt publish - ' + noti_topic);
    //
    //    mqtt_client.end();
    //});
});

function response_mqtt(mqtt_client, rsp_topic, rsc, to, fr, ri, inpc, bodytype) {
    var rsp_message = {};
    rsp_message['m2m:rsp'] = {};
    rsp_message['m2m:rsp'].rsc = rsc;
    rsp_message['m2m:rsp'].to = to;
    rsp_message['m2m:rsp'].fr = fr;
    rsp_message['m2m:rsp'].ri = ri;
    rsp_message['m2m:rsp'].pc = inpc;

    if(bodytype == 'xml') {
        rsp_message['m2m:rsp']['@'] = {
            "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
            "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
        };

        var xmlString = js2xmlparser("m2m:rsp", rsp_message['m2m:rsp']);

        mqtt_client.publish(rsp_topic, xmlString.toString());
    }
    else { // 'json'
        mqtt_client.publish(rsp_topic, JSON.stringify(rsp_message));
    }
}

exports.resp_connect = function(serverip) {
    //var mqtt_client  = mqtt.connect('mqtt://test.mosquitto.org');
//var mqtt_client  = mqtt.connect('mqtt://203.253.128.150');
//var mqtt_client  = mqtt.connect( 'mqtt://localhost',{ protocolId: 'MQIsdp', protocolVersion: 3 } );
    var resp_topic = util.format('/oneM2M/resp/%s/#', usemqttcseid.replace('/', ':'));

    var mqtt_client = mqtt.connect('mqtt://' + serverip);
    resp_mqtt_client_arr.push(mqtt_client);

    mqtt_client.on('connect', function () {
        mqtt_client.subscribe(resp_topic);

        console.log('subscribe resp_topic as ' + resp_topic);
    });

    mqtt_client.on('message', function (topic, message) {
        var topic_arr = topic.split("/");
        if(topic_arr[5] != null) {
            var bodytype = (topic_arr[5] == 'xml') ? topic_arr[5] : ((topic_arr[5] == 'json') ? topic_arr[5] : 'json');
        }

        if(topic_arr[1] == 'oneM2M' && topic_arr[2] == 'resp' && topic_arr[3].replace(':', '/') == usemqttcseid) {
            if(bodytype == 'xml') {
                parser = new xml2js.Parser({explicitArray: false});
                parser.parseString(message.toString(), function (err, jsonObj) {
                    if (err) {
                        console.log('[pxymqtt-resp xml2js parser error]');
                    }
                    else {
                        if (jsonObj['m2m:rsp'] != null) {
                            for (var i = 0; i < resp_mqtt_ri_arr.length; i++) {
                                if (resp_mqtt_ri_arr[i] == jsonObj['m2m:rsp'].ri) {
                                    console.log('----> ' + jsonObj['m2m:rsp'].rsc);

                                    http_reponse_q[resp_mqtt_ri_arr[i]].setHeader('X-M2M-RSC', '2001');
                                    http_reponse_q[resp_mqtt_ri_arr[i]].setHeader('X-M2M-RI', resp_mqtt_ri_arr[i]);

                                    http_reponse_q[resp_mqtt_ri_arr[i]].status(201).end('<rsp>success to receive notification</rsp>');

                                    delete http_reponse_q[resp_mqtt_ri_arr[i]];
                                    resp_mqtt_ri_arr.splice(i, 1);

                                    break;
                                }
                            }
                        }
                    }
                });
            }
            else { // 'json'
                var jsonObj = JSON.parse(message.toString());

                if (jsonObj['m2m:rsp'] != null) {
                    for (var i = 0; i < resp_mqtt_ri_arr.length; i++) {
                        if (resp_mqtt_ri_arr[i] == jsonObj['m2m:rsp'].ri) {
                            console.log('----> ' + jsonObj['m2m:rsp'].rsc);

                            http_reponse_q[resp_mqtt_ri_arr[i]].setHeader('X-M2M-RSC', '2001');
                            http_reponse_q[resp_mqtt_ri_arr[i]].setHeader('X-M2M-RI', resp_mqtt_ri_arr[i]);

                            http_reponse_q[resp_mqtt_ri_arr[i]].status(201).end('{\"rsp\":\"success to receive notification\"}');

                            delete http_reponse_q[resp_mqtt_ri_arr[i]];
                            resp_mqtt_ri_arr.splice(i, 1);

                            break;
                        }
                    }
                }
            }
        }
        else {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('topic is not supported');
        }
    });
};


function mqtt_req_action(mqtt_client, topic_arr, bodytype, jsonObj) {
    if (jsonObj['m2m:rqp'] != null) {
        var op = (jsonObj['m2m:rqp'].op == null) ? '' : jsonObj['m2m:rqp'].op;
        var to = (jsonObj['m2m:rqp'].to == null) ? '' : jsonObj['m2m:rqp'].to;
        var fr = (jsonObj['m2m:rqp'].fr == null) ? '' : jsonObj['m2m:rqp'].fr;
        var ri = (jsonObj['m2m:rqp'].ri == null) ? '' : jsonObj['m2m:rqp'].ri;
        var ty = (jsonObj['m2m:rqp'].ty == null) ? '' : jsonObj['m2m:rqp'].ty;
        var pc = (jsonObj['m2m:rqp'].pc == null) ? '' : jsonObj['m2m:rqp'].pc;

        if (to.split('/')[1] == usemqttcbname) {
            mqtt_binding(mqtt_client, topic_arr[3], op, to, fr, ri, ty, pc, bodytype, function(res, res_body) {
                if(bodytype == 'xml') {
                    var parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: true});
                    parser.parseString(res_body.toString(), function (err, result) {
                        if (err) {
                            console.log('[mqtt_binding parser error]');
                        }
                        else {
                            var rsp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                            response_mqtt(mqtt_client, rsp_topic, res.headers['x-m2m-rsc'], to, usemqttcseid, ri, result, bodytype);
                        }
                    });
                }
                else { // 'json
                    var rsp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                    response_mqtt(mqtt_client, rsp_topic, res.headers['x-m2m-rsc'], to, usemqttcseid, ri, JSON.parse(res_body), bodytype);
                }
            });
        }
        else {
            if (usecbtype == 'mn') {
                mqtt_forwarding(mqtt_client, topic_arr[3], op, to, fr, ri, ty, nm, pc, pool);
            }
            else {
                var rsp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                response_mqtt(mqtt_client, rsp_topic, 4004, fr, usemqttcseid, ri, '<h1>MN-CSE is not, csebase do not exist</h1>');
            }
        }
    }
    else {
        console.log('mqtt message tag is not fit');
    }
}

exports.req_connect = function(serverip) {
    var req_topic = util.format('/oneM2M/req/+/%s/#', usemqttcseid.replace('/', ':'));

    var mqtt_client = mqtt.connect('mqtt://' + serverip);

    mqtt_client.on('connect', function () {
        mqtt_client.subscribe(req_topic);
        console.log('subscribe req_topic as ' + req_topic);

        req_mqtt_client_arr.push(mqtt_client);
    });

    mqtt_client.on('message', function (topic, message) {
        var topic_arr = topic.split("/");

        if(topic_arr[5] != null) {
            var bodytype = (topic_arr[5] == 'xml') ? topic_arr[5] : ((topic_arr[5] == 'json') ? topic_arr[5] : 'json');
        }

        if(topic_arr[1] == 'oneM2M' && topic_arr[2] == 'req' && topic_arr[4].replace(':', '/') == usemqttcseid) {
            if(bodytype == 'xml') {
                var parser = new xml2js.Parser({explicitArray: false});
                parser.parseString(message.toString(), function (err, result) {
                    if (err) {
                        console.log('[pxymqtt-rqp xml2js parser error]');
                    }
                    else {
                        mqtt_req_action(mqtt_client, topic_arr, bodytype, result);
                    }
                });
            }
            else { // 'json'
                mqtt_req_action(mqtt_client, topic_arr, bodytype, JSON.parse(message.toString()));
            }
        }
        else {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('topic is not supported');
        }
    });
};



exports.reg_req_connect = function(serverip) {
    var reg_req_topic = util.format('/oneM2M/reg_req/+/%s/#', usemqttcseid.replace('/', ':'));

    var mqtt_client = mqtt.connect('mqtt://' + serverip);

    mqtt_client.on('connect', function () {
        mqtt_client.subscribe(reg_req_topic);
        console.log('subscribe reg_req_topic as ' + reg_req_topic);

        req_mqtt_client_arr.push(mqtt_client);
    });

    mqtt_client.on('message', function (topic, message) {
        var topic_arr = topic.split("/");

        if(topic_arr[5] != null) {
            var bodytype = (topic_arr[5] == 'xml') ? topic_arr[5] : ((topic_arr[5] == 'json') ? topic_arr[5] : 'json');
        }

        if(topic_arr[1] == 'oneM2M' && topic_arr[2] == 'reg_req' && topic_arr[4].replace(':', '/') == usemqttcseid) {
            if(bodytype == 'xml') {
                var parser = new xml2js.Parser({explicitArray: false});
                parser.parseString(message.toString(), function (err, result) {
                    if (err) {
                        console.log('[pxymqtt-rqp xml2js parser error]');
                    }
                    else {
                        mqtt_req_action(mqtt_client, topic_arr, bodytype, result);
                    }
                });
            }
            else { // 'json'
                mqtt_req_action(mqtt_client, topic_arr, bodytype, JSON.parse(message.toString()));
            }
        }
        else {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('topic is not supported');
        }
    });
};


function http_retrieve_CSEBase(callback) {
    var path = '/' + usemqttcbname;
    var options = {
        hostname: usemqttcbhost,
        port: usemqttcbport,
        path: path,
        method: 'get',
        headers: {
            'locale': 'ko',
            'X-M2M-RI': '12345',
            'Accept': 'application/' + usemqttbodytype,
            'X-M2M-Origin': 'Origin',
            'nmtype': usemqttnmtype
        }
    };

    var responseBody = '';
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            responseBody += chunk;
        });

        res.on('end', function() {
            callback(res.headers['x-m2m-rsc'], responseBody);
        });
    });

    req.on('error', function (e) {
        if(e.message != 'read ECONNRESET') {
            console.log('problem with request: ' + e.message);
        }
    });

    // write data to request body
    req.write('');
    req.end();
}

function mqtt_binding(mqtt_client, resp_cseid, op, to, fr, ri, ty, pc, bodytype, callback) {
    var content_type = 'application/vnd.onem2m-res+' + bodytype;

    switch (op) {
        case '1':
            op = 'post';
            content_type += ('; ty=' + ty);
            break;
        case '2':
            op = 'get';
            break;
        case '3':
            op = 'put';
            break;
        case '4':
            op = 'delete';
            break;
    }

    var reqBodyString = '';
    if( op == 'post' || op == 'put') {
        var jsonObj = {};
        if(bodytype == 'xml') {
            switch (ty) {
            case '16':
                jsonObj = (pc.csr == null) ? pc['remoteCSE'] : pc['csr'];
                jsonObj['@'] = {"xmlns:m2m": "http://www.onem2m.org/xml/protocols", "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"};
                reqBodyString = (pc.csr == null) ? js2xmlparser('m2m:remoteCSE', JSON.stringify(jsonObj)) : js2xmlparser('m2m:csr', JSON.stringify(jsonObj));
                break;
            case '2':
                jsonObj = (pc.ae == null) ? pc['AE'] : pc['ae'];
                jsonObj['@'] = {"xmlns:m2m": "http://www.onem2m.org/xml/protocols", "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"};
                reqBodyString = (pc.ae == null) ? js2xmlparser('m2m:AE', JSON.stringify(jsonObj)) : js2xmlparser('m2m:ae', JSON.stringify(jsonObj));
                break;
            case '3':
                jsonObj = (pc.cnt == null) ? pc['container'] : pc['cnt'];
                jsonObj['@'] = {"xmlns:m2m": "http://www.onem2m.org/xml/protocols", "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"};
                reqBodyString = (pc.cnt == null) ? js2xmlparser('m2m:container', JSON.stringify(jsonObj)) : js2xmlparser('m2m:cnt', JSON.stringify(jsonObj));
                break;
            case '4':
                jsonObj = (pc.cin == null) ? pc['contentInstance'] : pc['cin'];
                jsonObj['@'] = {"xmlns:m2m": "http://www.onem2m.org/xml/protocols", "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"};
                reqBodyString = (pc.cin == null) ? js2xmlparser('m2m:contentInstance', JSON.stringify(jsonObj)) : js2xmlparser('m2m:cin', JSON.stringify(jsonObj));
                break;
            case '23':
                jsonObj = (pc.sub == null) ? pc['subscription'] : pc['sub'];
                jsonObj['@'] = {"xmlns:m2m": "http://www.onem2m.org/xml/protocols", "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"};
                reqBodyString = (pc.sub == null) ? js2xmlparser('m2m:subscription', JSON.stringify(jsonObj)) : js2xmlparser('m2m:sub', JSON.stringify(jsonObj));
                break;
            case '24':
                jsonObj = (pc.sd == null) ? pc['semanticDescriptor'] : pc['sd'];
                jsonObj['@'] = {"xmlns:m2m": "http://www.onem2m.org/xml/protocols", "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"};
                reqBodyString = (pc.sd == null) ? js2xmlparser('m2m:semanticDescriptor', JSON.stringify(jsonObj)) : js2xmlparser('m2m:sd', JSON.stringify(jsonObj));
                break;
            }
        }
        else {
            switch (ty) {
            case '16':
                (pc.csr == null) ? jsonObj['m2m:remoteCSE'] = pc['remoteCSE'] : jsonObj['m2m:csr'] = pc['csr'];
                break;
            case '2':
                (pc.ae == null) ? jsonObj['m2m:AE'] = pc['AE'] : jsonObj['m2m:ae'] = pc['ae'];
                break;
            case '3':
                (pc.cnt == null) ? jsonObj['m2m:container'] = pc['container'] : jsonObj['m2m:cnt'] = pc['cnt'];
                break;
            case '4':
                (pc.cin == null) ? jsonObj['m2m:contentInstance'] = pc['contentInstance'] : jsonObj['m2m:cin'] = pc['cin'];
                break;
            case '23':
                (pc.sub == null) ? jsonObj['m2m:subscription'] = pc['subscription'] : jsonObj['m2m:sub'] = pc['sub'];
                break;
            case '24':
                (pc.sd == null) ? jsonObj['m2m:semanticDescriptor'] = pc['semanticDescriptor'] : jsonObj['m2m:sd'] = pc['sd'];
                break;
            }

            reqBodyString = JSON.stringify(jsonObj);
        }
    }

    var options = {
        hostname: usemqttcbhost,
        port: usemqttcbport,
        path: to,
        method: op,
        headers: {
            'locale': 'ko',
            'X-M2M-RI': ri,
            'Accept': 'application/' + bodytype,
            'X-M2M-Origin': fr,
            'Content-Type': content_type
        }
    };

    var bodyStr = '';
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            bodyStr += chunk;
        });

        res.on('end', function () {
            callback(res, bodyStr);
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });

    // write data to request body
    req.write(reqBodyString);
    req.end();
}



function mqtt_forwarding(mqtt_client, resp_cseid, op, to, fr, ri, ty, nm, pc, pool) {
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[mqtt_forwarding]');

    var path = util.format('/%s/%s', usecsebase, to);
    var sql = util.format("select * from lv1 where path = \'%s\'", path);
    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            if (results.length == 1) {
                if(results[0].resourcetype == 16) {
                    var forward_cseid = results[0].cseid;
                }
                else if(results[0].resourcetype == 2) {
                    forward_cseid = results[0].aeid;
                }
                forward_mqtt(forward_cseid, op, to, fr, ri, ty, nm, pc);
            }
            else {
                NOPRINT == 'true' ? NOPRINT = 'true' : console.log('csebase forwarding do not exist');
                var rsp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                response_mqtt(mqtt_client, rsp_topic, 4004, fr, usemqttcseid, ri, '<h1>csebase forwarding do not exist</h1>');
            }
        }
        else {
            console.log('query error: ' + results.code);
        }
    });
}


function forward_mqtt(forward_cseid, op, to, fr, ri, ty, nm, inpc) {
    var forward_message = {};
    forward_message.op = op;
    forward_message.to = to;
    forward_message.fr = fr;
    forward_message.ri = ri;
    forward_message.ty = ty;
    forward_message.nm = nm;
    forward_message.pc = inpc;

    forward_message['@'] = {
        "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
    };

    var xmlString = js2xmlparser("m2m:rqp", forward_message);

    var forward_topic = util.format('/oneM2M/req/%s/%s', usemqttcseid.replace('/', ':'), forward_cseid);

    for(var i = 0; i < mqtt_client_arr.length; i++) {
        mqtt_client_arr[i].publish(forward_topic, xmlString);
    }
}
