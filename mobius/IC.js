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

var xml2js = require('xml2js');
var get_retrieve = require('./retrieve');
var xmlbuilder = require('xmlbuilder');
var util = require('util');
var ip = require('ip');

var DB = require('./db_action');

var _this = this;

exports.create = function(pool) {
    // build in-cse
    var resourcetype = 5;
    var cur_d = new Date();
    //var cur_o = cur_d.getTimezoneOffset()/(-60);
    //cur_d.setHours(cur_d.getHours() + cur_o);
    var msec = (parseInt(cur_d.getMilliseconds(), 10)<100) ? ('0'+cur_d.getMilliseconds()) : cur_d.getMilliseconds();
    var resourceid = 'IC' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);


    var resourcename = usecsebase;
    var creationtime = '';
    var expirationtime = '';

    cur_d = new Date();
    //cur_o = cur_d.getTimezoneOffset()/(-60);
    //cur_d.setHours(cur_d.getHours() + cur_o);

    //if( cur_o < 10) {
    //    creationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}
    //else {
    creationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}

    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[IC create] - ' + creationtime);

    cur_d.setFullYear(cur_d.getFullYear() + 100);
    //if( cur_o < 10) {
    //    expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}
    //else {
    expirationtime = cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '');
    //}
    var lastmodifiedtime = creationtime;

    //cur_d = new Date();
    ////cur_o = cur_d.getTimezoneOffset() / (-60);
    ////cur_d.setHours(cur_d.getHours() + cur_o);
    //msec = '';
    //if((parseInt(cur_d.getMilliseconds(), 10)<10)) {
    //    msec = ('00'+cur_d.getMilliseconds());
    //}
    //else if((parseInt(cur_d.getMilliseconds(), 10)<100)) {
    //    msec = ('0'+cur_d.getMilliseconds());
    //}
    //else {
    //    msec = cur_d.getMilliseconds();
    //}
    //var cseid = '0.2.481.1.9999.999.' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec;

    var cseid = usecseid;
    if(cseid[0] != '/') {
        console.log('The first character of CSE-ID should be \'/\'. append \'/\' to front of cseid tag in conf.json.');
        return;
    }

    var supportedresourcetype = [];
    supportedresourcetype [0] = '2';
    supportedresourcetype [1] = '3';
    supportedresourcetype [2] = '4';
    supportedresourcetype [3] = '16';
    supportedresourcetype [4] = '23';

    var pointofaccess = [];
    pointofaccess[0] = 'http://' + ip.address() + ':' + usecseport;

    var csetype = 1;

    var path = '/' + resourcename;

    var sql = util.format('SELECT * FROM lv0 WHERE resourcename = \'%s\'', resourcename);

    DB.getResult(pool, sql, function(err, results) {
        if(!err) {
            if(results.length == 0) {
                sql = util.format('INSERT INTO lv0 (resourcetype, resourceid, resourcename, creationtime, lastmodifiedtime, accesscontrolpolicyids, labels, csetype, cseid, supportedresourcetype, pointofaccess, nodelink, notificationcongestionpolicy, path) ' +
                    'VALUE (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
                    resourcetype, resourceid, resourcename, creationtime, lastmodifiedtime, '', '', csetype, cseid, supportedresourcetype.toString().replace(/,/g, ' '), pointofaccess.toString().replace(/,/g, ' '), '', '', path);
                DB.getResult(pool, sql, function (err, results) {
                    if(!err) {

                    }
                    else {
                        console.log('query error: ' + results.code);
                    }
                });
            }
            else {
                sql = util.format('UPDATE lv0 SET cseid = \'%s\', lastmodifiedtime = \'%s\', path = \'%s\', supportedresourcetype = \'%s\', csetype = \'%s\', pointofaccess = \'%s\' WHERE resourcename = \'%s\'',
                    cseid, creationtime, path, supportedresourcetype.toString().replace(/,/g, ' '), csetype, pointofaccess.toString().replace(/,/g, ' '), resourcename);
                DB.getResult(pool, sql, function (err, results) {
                    if(!err) {

                    }
                    else {
                        console.log('query error: ' + results.code);
                    }
                });
            }
        }
        else {
            console.log('query error: ' + results.code);
        }
    });
};

exports.retrieve = function(request, response, pool, results_ic, status, level, path) {
    NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[IC.retrieve]');
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[IC.retrieve] Accept: ' + request.headers.accept);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[IC.retrieve] Content-Type: ' + request.headers['content-type']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[IC.retrieve] x-m2m-ri: ' + request.headers['x-m2m-ri']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[IC.retrieve] X-M2M-Origin: ' + request.headers['x-m2m-origin']);
    //NOPRINT == 'true' ? NOPRINT = 'true' : console.log('[IC.retrieve] locale: ' + request.headers.locale);

//    if(request.headers.accept != 'application/onem2m-resource+xml') {
/*
    if(request.headers.accept == null) {
        response.status(400).end('<h1>Bad Request : accept</h1>');
        return;
    }
 */

    var node = {};
    var rootnm = (request.headers.nmtype == 'long') ? ('m2m:CSEBase') : ('m2m:cb');
    var listnm = (request.headers.nmtype == 'long') ? ('m2m:URIList') : ('m2m:uril');
    if(request.headers.usebodytype == 'json') {
        results_ic[0].supportedresourcetype = results_ic[0].supportedresourcetype.toString().split(' ');
        results_ic[0].pointofaccess = results_ic[0].pointofaccess.toString().split(' ');
        results_ic[0].labels = results_ic[0].labels.toString().split(' ');
        results_ic[0].accesscontrolpolicyids = results_ic[0].accesscontrolpolicyids.toString().split(' ');
        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[listnm] = [];
            node[listnm].push(results_ic[0].path);

            get_retrieve.request_fu1_json(request, response, pool, node, results_ic[0].resourceid, results_ic[0].resourcetype, results_ic[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ic[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ic[0].resourceid];
            get_retrieve.addele_ic_json(request, node[results_ic[0].resourceid], results_ic[0]);

            get_retrieve.request_rc4_json(request, response, pool, node, rootnm, results_ic[0].resourceid, results_ic[0].resourcetype, results_ic[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[rootnm] = {};
            node[rootnm][rootnm] = {};
            node[results_ic[0].resourceid] = {};
            node[rootnm][rootnm] = node[results_ic[0].resourceid];
            get_retrieve.addele_ic_json(request, node[results_ic[0].resourceid], results_ic[0]);

            get_retrieve.request_json(request, response, pool, node[rootnm], results_ic[0].resourceid, results_ic[0].resourcetype, results_ic[0].resourcename, status);
        }
    }
    else { // request.headers.usebodytype == 'xml'
        if ((request.query.fu != null) && (request.query.fu == 1)) {
            node[0] = xmlbuilder.create(listnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.request_fu1(request, response, pool, node, results_ic[0].resourceid, results_ic[0].resourcetype, results_ic[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 4) || (request.query.lbl != null) || (request.query.cra != null) || (request.query.crb != null) || (request.query.lim != null)) { // discovery
            node[results_ic[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ic(request, node[results_ic[0].resourceid], results_ic[0]);

            response.setHeader('X-M2M-RSC', '2000');
            get_retrieve.request_rc4(request, response, pool, node, results_ic[0].resourceid, results_ic[0].resourcetype, results_ic[0].resourcename, status, level, path);
        }
        else if ((request.query.rc == 0) || (request.query.rc == 2)) {
            response.setHeader('X-M2M-RSC', '2000');
            response.status(status).end('');
        }
        else {
            node[results_ic[0].resourceid] = xmlbuilder.create(rootnm, {version: '1.0', encoding: 'UTF-8', standalone: true},
                {pubID: null, sysID: null}, {allowSurrogateChars: false, skipNullAttributes: false, headless: false, ignoreDecorators: false, stringify: {}}
            ).att('xmlns:m2m', 'http://www.onem2m.org/xml/protocols').att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

            get_retrieve.addele_ic(request, node[results_ic[0].resourceid], results_ic[0]);

            get_retrieve.request(request, response, pool, node, results_ic[0].resourceid, results_ic[0].resourcetype, results_ic[0].resourcename, status);
        }
    }
};

