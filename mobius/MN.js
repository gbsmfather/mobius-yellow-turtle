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

var http = require('http');
var util = require('util');
var xml2js = require('xml2js');
var xmlbuilder = require('xmlbuilder');
var fs = require('fs');
var url = require('url');
var DB = require('./db_action');

_this = this;


exports.forward_request = function(request, response, pool) {
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[Forward]');

    var forwardcbhost = '';
    var forwardcbport = '';
    var forwardcbmqtt = '';
    var forwardcbname = '';

    var path = util.format('/%s/%s', usecsebase.toLowerCase(), request.params.resourcename0.toString().toLowerCase());
    var sql = util.format("select * from lv1 where path = \'%s\'", path);
    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            if (results.length == 1) {
                forwardcbname = results[0].resourcename;
                forwardcbname = forwardcbname.replace('/', '');
                var poa_arr = results[0].pointofaccess.split(' ');
                for (var i = 0; i < poa_arr.length; i++) {
                    if (url.parse(poa_arr[i]).protocol == 'http:') {
                        forwardcbhost = url.parse(poa_arr[i]).hostname;
                        forwardcbport = url.parse(poa_arr[i]).port;

                        forward_http(forwardcbhost, forwardcbport, request, response);
                    }
                    else if (url.parse(poa_arr[i]).protocol == 'mqtt:') {
                        forwardcbmqtt = url.parse(poa_arr[i]).hostname;
                    }
                }
            }
            else {
                console.log('csebase forwarding do not exist');
                response.setHeader('X-M2M-RSC', '4004');
                response.status(404).end('<h1>csebase forwarding do not exist</h1>');
            }
        }
        else {
            console.log('query error: ' + results.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
        }
    });
};

function forward_http(forwardcbhost, forwardcbport, request, response) {
    var options = {
        hostname: forwardcbhost,
        port: forwardcbport,
        path: url.parse(request.url).path,
        //path: '/mobius',
        method: request.method,
        headers: request.headers
    };

    var req = http.request(options, function (res) {
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[Forward response : ' + res.statusCode);
        //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');

        response.headers = res.headers;

        if (request.headers.locale != null) {
            response.setHeader('locale', request.headers.locale);
        }
        response.setHeader('Content-Type', request.headers.accept);
        response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);
        response.setHeader('X-M2M-RSC', res.headers['x-m2m-rsc']);
        if(res.headers['content-location'] != null) {
            response.setHeader('Content-Location', res.headers['content-location']);
        }

        res.on('data', function (chunk) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('body: ' + chunk);
            if (request.headers.accept.split('/')[1] == 'json') {
                response.setHeader('Content-Type', 'application/vnd.onem2m-res+json');
            }
            else {
                response.setHeader('Content-Type', 'application/vnd.onem2m-res+xml');
            }

            response.statusCode = res.statusCode;
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log(res.headers);
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log(response.headers);
            response.send(chunk);
        });
    });

    req.on('error', function(e) {
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
    });

    // write data to request body
    if((request.method.toLowerCase() == 'get') || (request.method.toLowerCase() == 'delete')) {
        req.write('');
    }
    else {
        req.write(request.body);
    }
    req.end();

    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.headers);
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log(request.body);
}


function self_create_remoteCSE(ic_jsonObj, pool) {
    var node = {};
    if(defaultbodytype == 'xml') {
        if (defaultnmtype == 'long') {
            node[0] = xmlbuilder.create('m2m:remoteCSE', {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            node[0].ele('cseType', ic_jsonObj['m2m:CSEBase']['cseType']);
            node[0].ele('CSE-ID', ic_jsonObj['m2m:CSEBase']['CSE-ID']);
            node[0].ele('pointOfAccess', ic_jsonObj['m2m:CSEBase']['pointOfAccess']);
            node[0].ele('requestReachability', 'true');
            node[0].ele('CSEBase', '/' + usecsebase);
            var poa_arr = ic_jsonObj['m2m:CSEBase']['pointOfAccess'].split(' ');
        }
        else { // defaultnmtype == 'short'
            node[0] = xmlbuilder.create('m2m:csr', {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            node[0].ele('cst', ic_jsonObj['m2m:cb']['cst']);
            node[0].ele('csi', ic_jsonObj['m2m:cb']['csi']);
            node[0].ele('poa', ic_jsonObj['m2m:cb']['poa']);
            node[0].ele('rr', 'true');
            node[0].ele('cb', '/' + usecsebase);
            poa_arr = ic_jsonObj['m2m:cb']['poa'].split(' ');
        }

        // make comment because already know for information of IN-CSE
        //for (var i = 0; i < poa_arr.length; i++) {
        //    if (url.parse(poa_arr[i]).protocol == 'http:') {
        //        usecbhost = url.parse(poa_arr[i]).hostname;
        //        usecbport = url.parse(poa_arr[i]).port;
        //    }
        //    else if (url.parse(poa_arr[i]).protocol == 'mqtt:') {
        //        usecsemqtt = url.parse(poa_arr[i]).hostname;
        //
        //        pxymqtt.connect(usecsemqtt, pool);
        //    }
        //}

        var xmlString = node[0].end({pretty: true, indent: '  ', newline: '\n'}).toString();

        var options = {
            hostname: 'localhost',
            port: usecseport,
            path: '/' + usecsebase,
            //path: '/mobius',
            method: 'post',
            headers: {
                'locale': 'ko',
                'X-M2M-RI': '12345',
                'Accept': 'application/xml',
                'X-M2M-Origin': 'Origin',
                'X-M2M-NM': usecbname,
                'Content-Type': 'application/vnd.onem2m-res+xml; ty=16'
            }
        };

        var req = http.request(options, function (res) {
            if(res.statusCode == 200) {
                NOPRINT == 'true' ? NOPRINT = 'true' : console.log('success to MN-CSE. csetype is MN-CSE');
            }
        });

        req.on('error', function (e) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(xmlString);
        req.end();
    }
    else { // defaultbodytype == 'json'
        if (defaultnmtype == 'long') {
            node['m2m:remoteCSE'] = {};
            node['m2m:remoteCSE']['cseType'] = ic_jsonObj['m2m:CSEBase']['cseType'];
            node['m2m:remoteCSE']['CSE-ID'] = ic_jsonObj['m2m:CSEBase']['CSE-ID'];
            node['m2m:remoteCSE']['pointOfAccess'] = ic_jsonObj['m2m:CSEBase']['pointOfAccess'];
            node['m2m:remoteCSE']['requestReachability'] = 'true';
            node['m2m:remoteCSE']['CSEBase'] = '/' + usecsebase;
        }
        else { // defaultnmtype == 'short'
            node['m2m:csr'] = {};
            node['m2m:csr']['cst'] = ic_jsonObj['m2m:CSEBase']['cseType'];
            node['m2m:csr']['csi'] = ic_jsonObj['m2m:CSEBase']['CSE-ID'];
            node['m2m:csr']['poa'] = ic_jsonObj['m2m:CSEBase']['pointOfAccess'];
            node['m2m:csr']['rr'] = 'true';
            node['m2m:csr']['cb'] = '/' + usecsebase;
        }

        options = {
            hostname: 'localhost',
            port: usecseport,
            path: '/' + usecsebase,
            //path: '/mobius',
            method: 'post',
            headers: {
                'locale': 'ko',
                'X-M2M-RI': '12345',
                'Accept': 'application/json',
                'X-M2M-Origin': 'Origin',
                'X-M2M-NM': usecbname,
                'Content-Type': 'application/vnd.onem2m-res+json; ty=16'
            }
        };

        req = http.request(options, function (res) {
            if(res.statusCode == 200) {
                NOPRINT == 'true' ? NOPRINT = 'true' : console.log('success to MN-CSE. csetype is MN-CSE');
            }
        });

        req.on('error', function (e) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(node);
        req.end();
    }
}

function retrieve_CSEBase(pool) {
    if (defaultbodytype == 'xml') {
        var path = '/' + usecbname;
        var options = {
            hostname: usecbhost,
            port: usecbport,
            path: path,
            //path: '/mobius',
            method: 'get',
            headers: {
                'locale': 'ko',
                'X-M2M-RI': '12345',
                'Accept': 'application/xml',
                'X-M2M-Origin': 'Origin',
                'nmtype': defaultnmtype
            }
        };

        var req = http.request(options, function (res) {
            if (res.statusCode == 200) {
                res.on('data', function (chunk) {
                    var parser = new xml2js.Parser({explicitArray: false});
                    parser.parseString(chunk, function (err, result) {
                        if (err) {
                            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[retrieve_CSEBase] fail to set csetype to MN-CSE. csetype is IN-CSE');
                        }
                        else {
                            var jsonString = JSON.stringify(result);
                            var jsonObj = JSON.parse(jsonString);

                            self_create_remoteCSE(jsonObj, pool);
                        }
                    });
                });
            }
        });

        req.on('error', function (e) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write('');
        req.end();
    }
    else { // defaultbodytype == 'json'
        path = '/' + usecbname;
        options = {
            hostname: usecbhost,
            port: usecbport,
            path: path,
            //path: '/mobius',
            method: 'get',
            headers: {
                'locale': 'ko',
                'X-M2M-RI': '12345',
                'Accept': 'application/json',
                'X-M2M-Origin': 'Origin',
                'nmtype': defaultnmtype
            }
        };

        req = http.request(options, function (res) {
            if (res.statusCode == 200) {
                res.on('data', function (chunk) {
                    var jsonString = JSON.stringify(result);
                    var jsonObj = JSON.parse(jsonString);

                    self_create_remoteCSE(jsonObj, pool);
                });
            }
        });

        req.on('error', function (e) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write('');
        req.end();
    }
}

function create_remoteCSE(results_ic, pool) {
    var node = {};
    if(defaultbodytype == 'xml') {
        if (defaultnmtype == 'long') {
            node[results_ic[0].resourceid] = xmlbuilder.create('m2m:remoteCSE', {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            node[results_ic[0].resourceid].ele('cseType', results_ic[0].csetype);
            node[results_ic[0].resourceid].ele('CSE-ID', results_ic[0].cseid);
            node[results_ic[0].resourceid].ele('pointOfAccess', results_ic[0].pointofaccess);
            node[results_ic[0].resourceid].ele('requestReachability', 'true');
            node[results_ic[0].resourceid].ele('CSEBase', '/' + usecsebase);
        }
        else { // defaultnmtype == 'short'
            node[results_ic[0].resourceid] = xmlbuilder.create('m2m:csr', {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            node[results_ic[0].resourceid].ele('cst', results_ic[0].csetype);
            node[results_ic[0].resourceid].ele('csi', results_ic[0].cseid);
            node[results_ic[0].resourceid].ele('poa', results_ic[0].pointofaccess);
            node[results_ic[0].resourceid].ele('rr', 'true');
            node[results_ic[0].resourceid].ele('cb', '/' + usecsebase);
        }

        var xmlString = node[results_ic[0].resourceid].end({pretty: true, indent: '  ', newline: '\n'}).toString();

        var path = '/' + usecbname;
        var options = {
            hostname: usecbhost,
            port: usecbport,
            path: path,
            //path: '/mobius',
            method: 'post',
            headers: {
                'locale': 'ko',
                'X-M2M-RI': '12345',
                'Accept': 'application/xml',
                'X-M2M-Origin': 'Origin',
                'X-M2M-NM': usecsebase,
                'Content-Type': 'application/vnd.onem2m-res+xml; ty=16',
                'nmtype': defaultnmtype
            }
        };

        var req = http.request(options, function (res) {
            if (res.statusCode == 200 || res.statusCode == 201 || res.statusCode == 403 || res.statusCode == 409) {
                retrieve_CSEBase(res, pool);
            }
            else {
                NOPRINT == 'true' ? NOPRINT = 'true' : console.log('MN : response status code error for create remoteCSE : ' + res.statusCode);
            }
        });

        req.on('error', function (e) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(xmlString);
        req.end();
    }
    else { // defaultbodytype == 'json'
        results_ic[0].supportedresourcetype = results_ic[0].supportedresourcetype.toString().split(' ');
        results_ic[0].pointofaccess = results_ic[0].pointofaccess.toString().split(' ');
        results_ic[0].labels = results_ic[0].labels.toString().split(' ');
        results_ic[0].accesscontrolpolicyids = results_ic[0].accesscontrolpolicyids.toString().split(' ');

        if (defaultnmtype == 'long') {
            node['m2m:remoteCSE'] = {};
            node['m2m:remoteCSE']['cseType'] = results_ic[0].csetype;
            node['m2m:remoteCSE']['CSE-ID'] = results_ic[0].cseid;
            node['m2m:remoteCSE']['pointOfAccess'] = results_ic[0].pointofaccess;
            node['m2m:remoteCSE']['requestReachability'] = 'true';
            node['m2m:remoteCSE']['CSEBase'] = '/' + usecsebase;
        }
        else { // defaultnmtype == 'short'
            node['m2m:csr']['cst'] = results_ic[0].csetype;
            node['m2m:csr']['csi'] = results_ic[0].cseid;
            node['m2m:csr']['poa'] = results_ic[0].pointofaccess;
            node['m2m:csr']['rr'] = 'true';
            node['m2m:csr']['cb'] = '/' + usecsebase;
        }

        path = '/' + usecbname;
        options = {
            hostname: usecbhost,
            port: usecbport,
            path: path,
            //path: '/mobius',
            method: 'post',
            headers: {
                'locale': 'ko',
                'X-M2M-RI': '12345',
                'Accept': 'application/json',
                'X-M2M-Origin': 'Origin',
                'X-M2M-NM': usecsebase,
                'Content-Type': 'application/vnd.onem2m-res+json; ty=16',
                'nmtype': defaultnmtype
            }
        };

        req = http.request(options, function (res) {
            if (res.statusCode == 200 || res.statusCode == 201 || res.statusCode == 403 || res.statusCode == 409) {
                retrieve_CSEBase(res, pool);
            }
            else {
                NOPRINT == 'true' ? NOPRINT = 'true' : console.log('MN : response status code error for create remoteCSE : ' + res.statusCode);
            }
        });

        req.on('error', function (e) {
            NOPRINT == 'true' ? NOPRINT = 'true' : console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(node);
        req.end();
    }
}

exports.build_mn = function(pool, level) {
    // check remotecse if parent cse exist
    var path = util.format('/%s/%s', usecsebase, usecbname);
    var sql = util.format("select * from lv%s where path = \'%s\'", level + 1, path);
    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            if (results.length == 0) {
                sql = util.format("select * from lv%s where resourcename = \'%s\'", level, usecsebase);
                DB.getResult(pool, sql, function (err, results_ic) {
                    if(!err) {
                        if (results_ic.length == 1) {
                            create_remoteCSE(results_ic, pool);
                        }
                        else {
                            console.log('[MN: csebase do not exist');
                        }
                    }
                    else {
                        console.log('query error: ' + results_ic.code);
                        response.setHeader('X-M2M-RSC', '5000');
                        response.status(500).end('<h1>' + results_ic.code + '</h1>');
                    }
                });
            }
        }
        else {
            console.log('query error: ' + results.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
        }
    });
};
