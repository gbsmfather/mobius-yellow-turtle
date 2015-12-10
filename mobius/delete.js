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
var DB = require('./db_action');

function delete_result(request, response, status, count) {
    if(request.headers.locale != null) {
        response.setHeader('locale', request.headers.locale);
    }

    response.setHeader('Content-Type', request.headers.accept);
    response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);

    if (request.headers.accept.split('/')[1] == 'json') {
        response.setHeader('Content-Type', 'application/vnd.onem2m-res+json');
        response.setHeader('X-M2M-RSC', '2002');
        response.status(status).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + count + ' deleted\"}' : '<rsp>' + count + ' deleted</rsp>');
    }
    else {
        response.setHeader('Content-Type', 'application/vnd.onem2m-res+xml');
        NOPRINT == 'true' ? NOPRINT = 'true' : console.log(count + ' deleted');
        response.setHeader('X-M2M-RSC', '2002');
        response.status(status).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + count + ' deleted\"}' : '<rsp>' + count + ' deleted</rsp>');
    }
}

function parentaction (results_lv, pp_list) {
    for(var i = 0; i < results_lv.length; i++) {
        var parentpath_str = util.format('\'%s\'', results_lv[i].path);
        pp_list.push(parentpath_str);
    }
}

function delete_child_action(pool, request, response, status, count, level, parentpath_list) {
    var sql = util.format("select * from lv%s where parentpath in (%s)", level, parentpath_list);
    DB.getResult(pool, sql, function (err, results_lv1) {
        if(!err) {
            if (results_lv1.length > 0) {
                sql = util.format("delete from lv%s where parentpath in (%s)", level, parentpath_list);
                DB.getResult(pool, sql, function (err, results) {
                    if(!err) {
                        count += results.affectedRows;
                        var parentpath_list = [];
                        parentaction(results_lv1, parentpath_list);
                        delete_child_action(pool, request, response, status, count, level+1, parentpath_list);
                    }
                    else {
                        console.log('query error: ' + results.code);
                        response.setHeader('X-M2M-RSC', '5000');
                        response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
                    }
                });
            }
            else {
                delete_result(request, response, status, count);
            }
        }
        else {
            console.log('query error: ' + results_lv1.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_lv1.code + '\"}' : '<rsp>' + results_lv1.code + '</rsp>');
        }
    });
}

exports.request = function(request, response, pool, status, level, parentpath) {
    var count = 0;
    var sql = util.format("delete from lv%s where path = \'%s\'", level, parentpath);
    DB.getResult(pool, sql, function (err, results) {
        if(!err) {
            count = results.affectedRows;
            var parentpath_list = [];
            var parentpath_str = util.format('\'%s\'', parentpath);
            parentpath_list.push(parentpath_str);
            delete_child_action(pool, request, response, status, count, level+1, parentpath_list);
        }
        else {
            console.log('[delete] query error: ' + results.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results.code + '\"}' : '<rsp>' + results.code + '</rsp>');
        }
    });
};
