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
var util = require('util');
var DB = require('./db_action');

var _this = this;

var max_lim = 1000;

exports.addele_ic = function ( request, node, results_ic ) {
    if(request.headers.nmtype == 'long') {
        node.ele('resourceType', results_ic.resourcetype);
        node.ele('resourceID', results_ic.resourceid);
        node.att('resourceName', results_ic.resourcename);
        node.ele('creationTime', results_ic.creationtime);
        node.ele('lastModifiedTime', results_ic.lastmodifiedtime);
        if(results_ic.accesscontrolpolicyids != null && results_ic.accesscontrolpolicyids != '') {
            node.ele('accessControlPolicyIDs', results_ic.accesscontrolpolicyids);
        }
        if(results_ic.labels != null && results_ic.labels != '') {
            node.ele('labels', results_ic.labels);
        }
        if(results_ic.csetype != null && results_ic.csetype != '') {
            node.ele('cseType', results_ic.csetype);
        }
        node.ele('CSE-ID', results_ic.cseid);
        node.ele('supportResourceType', results_ic.supportedresourcetype);
        node.ele('pointOfAccess', results_ic.pointofaccess);
        if(results_ic.nodelink != null && results_ic.nodelink != '') {
            node.ele('nodeLink', results_ic.nodelink);
        }
        if(results_ic.notificationcongestionpolicy != null && results_ic.notificationcongestionpolicy != '') {
            node.ele('notificationCongestionPolicy', results_ic.notificationcongestionpolicy);
        }
    }
    else {
        node.ele('ty', results_ic.resourcetype);
        node.ele('ri', results_ic.resourceid);
        node.att('rn', results_ic.resourcename);
        node.ele('ct', results_ic.creationtime);
        node.ele('lt', results_ic.lastmodifiedtime);
        if(results_ic.accesscontrolpolicyids != null && results_ic.accesscontrolpolicyids != '') {
            node.ele('acpi', results_ic.accesscontrolpolicyids);
        }
        if(results_ic.labels != null && results_ic.labels != '') {
            node.ele('lbl', results_ic.labels);
        }
        if(results_ic.csetype != null && results_ic.csetype != '') {
            node.ele('cst', results_ic.csetype);
        }
        node.ele('csi', results_ic.cseid);
        node.ele('srt', results_ic.supportedresourcetype);
        node.ele('poa', results_ic.pointofaccess);
        if(results_ic.nodelink != null && results_ic.nodelink != '') {
            node.ele('nl', results_ic.nodelink);
        }
        if(results_ic.notificationcongestionpolicy != null && results_ic.notificationcongestionpolicy != '') {
            node.ele('ncp', results_ic.notificationcongestionpolicy);
        }
    }
};

exports.addele_rc = function ( request, node, results_rc ) {
    if(request.headers.nmtype == 'long') {
        node.ele('resourceType', results_rc.resourcetype);
        node.ele('resourceID', results_rc.resourceid);
        node.att('resourceName', results_rc.resourcename);
        node.ele('parentID', results_rc.parentid);
        node.ele('creationTime', results_rc.creationtime);
        node.ele('lastModifiedTime', results_rc.lastmodifiedtime);
        node.ele('expirationTime', results_rc.expirationtime);
        if(results_rc.accesscontrolpolicyids != null && results_rc.accesscontrolpolicyids != '') {
            node.ele('accessControlPolicyIDs', results_rc.accesscontrolpolicyids);
        }
        if(results_rc.labels != null && results_rc.labels != '') {
            node.ele('labels', results_rc.labels);
        }
        if(results_rc.announceto != null && results_rc.announceto != '') {
            node.ele('announceTo', results_rc.announceto);
        }
        if(results_rc.announcedattribute != null && results_rc.announcedattribute != '') {
            node.ele('announcedAttribute', results_rc.announcedattribute);
        }
        if(results_rc.csetype != null && results_rc.csetype != '') {
            node.ele('cseType', results_rc.csetype);
        }
        if(results_rc.pointofaccess != null && results_rc.pointofaccess != '') {
            node.ele('pointOfAccess', results_rc.pointofaccess);
        }
        node.ele('CSEBase', results_rc.csebase);
        node.ele('CSE-ID', results_rc.cseid);
        if(results_rc.m2mextid != null && results_rc.m2mextid != '') {
            node.ele('M2M-Ext-ID', results_rc.m2mextid);
        }
        if(results_rc.triggerrecipientid != null && results_rc.triggerrecipientid != '') {
            node.ele('Trigger-Recipient-ID', results_rc.triggerrecipientid);
        }
        node.ele('requestReachability', results_rc.requestreachability);
        if(results_rc.nodelink != null && results_rc.nodelink != '') {
            node.ele('nodeLink', results_rc.nodelink);
        }
    }
    else {
        node.ele('ty', results_rc.resourcetype);
        node.ele('ri', results_rc.resourceid);
        node.att('rn', results_rc.resourcename);
        node.ele('pi', results_rc.parentid);
        node.ele('ct', results_rc.creationtime);
        node.ele('lt', results_rc.lastmodifiedtime);
        node.ele('et', results_rc.expirationtime);
        if(results_rc.accesscontrolpolicyids != null && results_rc.accesscontrolpolicyids != '') {
            node.ele('acpi', results_rc.accesscontrolpolicyids);
        }
        if(results_rc.labels != null && results_rc.labels != '') {
            node.ele('lbl', results_rc.labels);
        }
        if(results_rc.announceto != null && results_rc.announceto != '') {
            node.ele('at', results_rc.announceto);
        }
        if(results_rc.announcedattribute != null && results_rc.announcedattribute != '') {
            node.ele('aa', results_rc.announcedattribute);
        }
        if(results_rc.csetype != null && results_rc.csetype != '') {
            node.ele('cst', results_rc.csetype);
        }
        if(results_rc.pointofaccess != null && results_rc.pointofaccess != '') {
            node.ele('poa', results_rc.pointofaccess);
        }
        node.ele('cb', results_rc.csebase);
        node.ele('csi', results_rc.cseid);
        if(results_rc.m2mextid != null && results_rc.m2mextid != '') {
            node.ele('mei', results_rc.m2mextid);
        }
        if(results_rc.triggerrecipientid != null && results_rc.triggerrecipientid != '') {
            node.ele('tri', results_rc.triggerrecipientid);
        }
        node.ele('rr', results_rc.requestreachability);
        if(results_rc.nodelink != null && results_rc.nodelink != '') {
            node.ele('nl', results_rc.nodelink);
        }
    }
};

exports.addele_ae = function ( request, node, results_ae ) {
    if(request.headers.nmtype == 'long') {
        node.ele('resourceType', results_ae.resourcetype);
        node.ele('resourceID', results_ae.resourceid);
        node.att('resourceName', results_ae.resourcename);
        node.ele('parentID', results_ae.parentid);
        node.ele('creationTime', results_ae.creationtime);
        node.ele('lastModifiedTime', results_ae.lastmodifiedtime);
        node.ele('expirationTime', results_ae.expirationtime);
        if(results_ae.accesscontrolpolicyids != null && results_ae.accesscontrolpolicyids != '') {
            node.ele('accessControlPolicyIDs', results_ae.accesscontrolpolicyids);
        }
        if(results_ae.labels != null && results_ae.labels != '') {
            node.ele('labels', results_ae.labels);
        }
        if(results_ae.announceto != null && results_ae.announceto != '') {
            node.ele('announceTo', results_ae.announceto);
        }
        if(results_ae.announcedattribute != null && results_ae.announcedattribute != '') {
            node.ele('announcedAttribute', results_ae.announcedattribute);
        }
        if(results_ae.appname != null && results_ae.appname != '') {
            node.ele('appName', results_ae.appname);
        }
        node.ele('App-ID', results_ae.appid);
        node.ele('AE-ID', results_ae.aeid);
        if(results_ae.pointofaccess != null && results_ae.pointofaccess != '') {
            node.ele('pointOfAccess', results_ae.pointofaccess);
        }
        if(results_ae.ontologyref != null && results_ae.ontologyref != '') {
            node.ele('ontologyRef', results_ae.ontologyref);
        }
        if(results_ae.nodelink != null && results_ae.nodelink != '') {
            node.ele('nodeLink', results_ae.nodelink);
        }
        if(results_ae.requestreachability != null && results_ae.requestreachability != '') {
            node.ele('requestReachability', results_ae.requestreachability == null ? '' : results_ae.requestreachability);
        }
    }
    else {
        node.ele('ty', results_ae.resourcetype);
        node.ele('ri', results_ae.resourceid);
        node.att('rn', results_ae.resourcename);
        node.ele('pi', results_ae.parentid);
        node.ele('ct', results_ae.creationtime);
        node.ele('lt', results_ae.lastmodifiedtime);
        node.ele('et', results_ae.expirationtime);
        if(results_ae.accesscontrolpolicyids != null && results_ae.accesscontrolpolicyids != '') {
            node.ele('acpi', results_ae.accesscontrolpolicyids);
        }
        if(results_ae.labels != null && results_ae.labels != '') {
            node.ele('lbl', results_ae.labels);
        }
        if(results_ae.announceto != null && results_ae.announceto != '') {
            node.ele('at', results_ae.announceto);
        }
        if(results_ae.announcedattribute != null && results_ae.announcedattribute != '') {
            node.ele('aa', results_ae.announcedattribute);
        }
        if(results_ae.appname != null && results_ae.appname != '') {
            node.ele('apn', results_ae.appname);
        }
        node.ele('api', results_ae.appid);
        node.ele('aei', results_ae.aeid);
        if(results_ae.pointofaccess != null && results_ae.pointofaccess != '') {
            node.ele('poa', results_ae.pointofaccess);
        }
        if(results_ae.ontologyref != null && results_ae.ontologyref != '') {
            node.ele('or', results_ae.ontologyref);
        }
        if(results_ae.nodelink != null && results_ae.nodelink != '') {
            node.ele('nl', results_ae.nodelink);
        }
        if(results_ae.requestreachability != null && results_ae.requestreachability != '') {
            node.ele('rr', results_ae.requestreachability == null ? '' : results_ae.requestreachability);
        }
    }
};

exports.addele_co = function ( request, node, results_co ) {
    if(request.headers.nmtype == 'long') {
        node.ele('resourceType', results_co.resourcetype);
        node.ele('resourceID', results_co.resourceid);
        node.att('resourceName', results_co.resourcename);
        node.ele('parentID', results_co.parentid);
        node.ele('creationTime', results_co.creationtime);
        node.ele('lastModifiedTime', results_co.lastmodifiedtime);
        node.ele('expirationTime', results_co.expirationtime);
        if(results_co.accesscontrolpolicyids != null && results_co.accesscontrolpolicyids !=  '') {
            node.ele('accessControlPolicyIDs', results_co.accesscontrolpolicyids);
        }
        if(results_co.labels != null && results_co.labels !=  '') {
            node.ele('labels', results_co.labels);
        }
        node.ele('stateTag', results_co.statetag);
        if(results_co.announceto != null && results_co.announceto !=  '') {
            node.ele('announceTo', results_co.announceto == null ? '' : results_co.announceto);
        }
        if(results_co.announcedattribute != null && results_co.announcedattribute !=  '') {
            node.ele('announcedAttribute', results_co.announcedattribute);
        }
        if(results_co.creator != null && results_co.creator !=  '') {
            node.ele('creator', results_co.creator);
        }
        if(results_co.maxnrofinstances != null && results_co.maxnrofinstances !=  '') {
            node.ele('maxNrOfInstance', results_co.maxnrofinstances);
        }
        if(results_co.maxbytesize != null && results_co.maxbytesize !=  '') {
            node.ele('maxByteSize', results_co.maxbytesize);
        }
        if(results_co.maxinstanceage != null && results_co.maxinstanceage !=  '') {
            node.ele('maxInstanceAge', results_co.maxinstanceage);
        }
        node.ele('currentNrOfInstances', results_co.currentnrofinstances);
        node.ele('currentByteSize', results_co.currentbytesize);
        if(results_co.locationid != null && results_co.locationid !=  '') {
            node.ele('locationID', results_co.locationid);
        }
        if(results_co.ontologyref != null && results_co.ontologyref !=  '') {
            node.ele('ontologyRef', results_co.ontologyref);
        }
    }
    else {
        node.ele('ty', results_co.resourcetype);
        node.ele('ri', results_co.resourceid);
        node.att('rn', results_co.resourcename);
        node.ele('pi', results_co.parentid);
        node.ele('ct', results_co.creationtime);
        node.ele('lt', results_co.lastmodifiedtime);
        node.ele('et', results_co.expirationtime);
        if(results_co.accesscontrolpolicyids != null && results_co.accesscontrolpolicyids !=  '') {
            node.ele('acpi', results_co.accesscontrolpolicyids);
        }
        if(results_co.labels != null && results_co.labels !=  '') {
            node.ele('lbl', results_co.labels);
        }
        node.ele('st', results_co.statetag);
        if(results_co.announceto != null && results_co.announceto !=  '') {
            node.ele('at', results_co.announceto == null ? '' : results_co.announceto);
        }
        if(results_co.announcedattribute != null && results_co.announcedattribute !=  '') {
            node.ele('aa', results_co.announcedattribute);
        }
        if(results_co.creator != null && results_co.creator !=  '') {
            node.ele('cr', results_co.creator);
        }
        if(results_co.maxnrofinstances != null && results_co.maxnrofinstances !=  '') {
            node.ele('mni', results_co.maxnrofinstances);
        }
        if(results_co.maxbytesize != null && results_co.maxbytesize !=  '') {
            node.ele('mbs', results_co.maxbytesize);
        }
        if(results_co.maxinstanceage != null && results_co.maxinstanceage !=  '') {
            node.ele('mia', results_co.maxinstanceage);
        }
        node.ele('cni', results_co.currentnrofinstances);
        node.ele('cbs', results_co.currentbytesize);
        if(results_co.locationid != null && results_co.locationid !=  '') {
            node.ele('li', results_co.locationid);
        }
        if(results_co.ontologyref != null && results_co.ontologyref !=  '') {
            node.ele('or', results_co.ontologyref);
        }
    }
};

exports.addele_ss = function ( request, node, results_ss ) {
    if(request.headers.nmtype == 'long') {
        node.ele('resourceType', results_ss.resourcetype);
        node.ele('resourceID', results_ss.resourceid);
        node.att('resourceName', results_ss.resourcename);
        node.ele('parentID', results_ss.parentid);
        node.ele('creationTime', results_ss.creationtime);
        node.ele('lastModifiedTime', results_ss.lastmodifiedtime);
        node.ele('expirationTime', results_ss.expirationtime);
        if(results_ss.accesscontrolpolicyids != null && results_ss.accesscontrolpolicyids !=  '') {
            node.ele('accessControlPolicyIDs', results_ss.accesscontrolpolicyids);
        }
        if(results_ss.labels != null && results_ss.labels !=  '') {
            node.ele('labels', results_ss.labels);
        }
        if(results_ss.eventnotificationcriteria != null && results_ss.eventnotificationcriteria !=  '') {
            node.ele('eventNotificationCriteria', results_ss.eventnotificationcriteria);
        }
        if(results_ss.expirationcounter != null && results_ss.expirationcounter !=  '') {
            node.ele('expirationCounter', results_ss.expirationcounter);
        }
        if(results_ss.notificationuri != null && results_ss.notificationuri !=  '') {
            node.ele('notificationURI', results_ss.notificationuri);
        }
        if(results_ss.groupid != null && results_ss.groupid !=  '') {
            node.ele('groupID', results_ss.groupid);
        }
        if(results_ss.notificationforwardinguri != null && results_ss.notificationforwardinguri !=  '') {
            node.ele('notificationForwardingURI', results_ss.notificationforwardinguri);
        }
        if(results_ss.batchnotify != null && results_ss.batchnotify !=  '') {
            node.ele('batchNotify', results_ss.batchnotify);
        }
        if(results_ss.ratelimit != null && results_ss.ratelimit !=  '') {
            node.ele('rateLimit', results_ss.ratelimit);
        }
        if(results_ss.presubscriptionnotify != null && results_ss.presubscriptionnotify !=  '') {
            node.ele('preSubscriptionNotify', results_ss.presubscriptionnotify);
        }
        if(results_ss.pendingnotification != null && results_ss.pendingnotification !=  '') {
            node.ele('pendingNotification', results_ss.pendingnotification);
        }
        if(results_ss.notificationstroagepriority != null && results_ss.notificationstroagepriority !=  '') {
            node.ele('notificationStroagePriority', results_ss.notificationstroagepriority);
        }
        if(results_ss.latestnotify != null && results_ss.latestnotify !=  '') {
            node.ele('latestNotify', results_ss.latestnotify);
        }
        if(results_ss.notificationcontenttype != null && results_ss.notificationcontenttype !=  '') {
            node.ele('notificationContentType', results_ss.notificationcontenttype);
        }
        if(results_ss.notificationeventcat != null && results_ss.notificationeventcat !=  '') {
            node.ele('notificationEventCat', results_ss.notificationeventcat);
        }
        if(results_ss.creator != null && results_ss.creator !=  '') {
            node.ele('creator', results_ss.creator);
        }
        if(results_ss.subscriberuri != null && results_ss.subscriberuri !=  '') {
            node.ele('subscriberURI', results_ss.subscriberuri);
        }
    }
    else {
        node.ele('ty', results_ss.resourcetype);
        node.ele('ri', results_ss.resourceid);
        node.att('rn', results_ss.resourcename);
        node.ele('pi', results_ss.parentid);
        node.ele('ct', results_ss.creationtime);
        node.ele('lt', results_ss.lastmodifiedtime);
        node.ele('et', results_ss.expirationtime);
        if(results_ss.accesscontrolpolicyids != null && results_ss.accesscontrolpolicyids !=  '') {
            node.ele('acpi', results_ss.accesscontrolpolicyids);
        }
        if(results_ss.labels != null && results_ss.labels !=  '') {
            node.ele('lbl', results_ss.labels);
        }
        if(results_ss.eventnotificationcriteria != null && results_ss.eventnotificationcriteria !=  '') {
            node.ele('enc', results_ss.eventnotificationcriteria);
        }
        if(results_ss.expirationcounter != null && results_ss.expirationcounter !=  '') {
            node.ele('exc', results_ss.expirationcounter);
        }
        if(results_ss.notificationuri != null && results_ss.notificationuri !=  '') {
            node.ele('nu', results_ss.notificationuri);
        }
        if(results_ss.groupid != null && results_ss.groupid !=  '') {
            node.ele('gpi', results_ss.groupid);
        }
        if(results_ss.notificationforwardinguri != null && results_ss.notificationforwardinguri !=  '') {
            node.ele('nfu', results_ss.notificationforwardinguri);
        }
        if(results_ss.batchnotify != null && results_ss.batchnotify !=  '') {
            node.ele('bn', results_ss.batchnotify);
        }
        if(results_ss.ratelimit != null && results_ss.ratelimit !=  '') {
            node.ele('rl', results_ss.ratelimit);
        }
        if(results_ss.presubscriptionnotify != null && results_ss.presubscriptionnotify !=  '') {
            node.ele('psn', results_ss.presubscriptionnotify);
        }
        if(results_ss.pendingnotification != null && results_ss.pendingnotification !=  '') {
            node.ele('pn', results_ss.pendingnotification);
        }
        if(results_ss.notificationstroagepriority != null && results_ss.notificationstroagepriority !=  '') {
            node.ele('nsp', results_ss.notificationstroagepriority);
        }
        if(results_ss.latestnotify != null && results_ss.latestnotify !=  '') {
            node.ele('ln', results_ss.latestnotify);
        }
        if(results_ss.notificationcontenttype != null && results_ss.notificationcontenttype !=  '') {
            node.ele('nct', results_ss.notificationcontenttype);
        }
        if(results_ss.notificationeventcat != null && results_ss.notificationeventcat !=  '') {
            node.ele('nec', results_ss.notificationeventcat);
        }
        if(results_ss.creator != null && results_ss.creator !=  '') {
            node.ele('cr', results_ss.creator);
        }
        if(results_ss.subscriberuri != null && results_ss.subscriberuri !=  '') {
            node.ele('su', results_ss.subscriberuri);
        }
    }
};

exports.addele_ci = function ( request, node, results_ci ) {
    if(request.headers.nmtype == 'long') {
        node.ele('resourceType', results_ci.resourcetype);
        node.ele('resourceID', results_ci.resourceid);
        node.att('resourceName', results_ci.resourcename);
        node.ele('parentID', results_ci.parentid);
        node.ele('creationTime', results_ci.creationtime);
        node.ele('lastModifiedTime', results_ci.lastmodifiedtime);
        node.ele('expirationTime', results_ci.expirationtime);
        if(results_ci.labels != null && results_ci.labels !=  '') {
            node.ele('labels', results_ci.labels);
        }
        node.ele('stateTag', results_ci.statetag);
        if(results_ci.announceto != null && results_ci.announceto !=  '') {
            node.ele('announceTo', results_ci.announceto);
        }
        if(results_ci.announcedattribute != null && results_ci.announcedattribute !=  '') {
            node.ele('announcedAttribute', results_ci.announcedattribute);
        }
        if(results_ci.creator != null && results_ci.creator !=  '') {
            node.ele('creator', results_ci.creator);
        }
        if(results_ci.contentinfo != null && results_ci.contentinfo !=  '') {
            node.ele('contentInfo', results_ci.contentinfo);
        }
        node.ele('contentSize', results_ci.contentsize);
        node.ele('content', results_ci.content);
        if(results_ci.ontologyref != null && results_ci.ontologyref !=  '') {
            node.ele('ontologyRef', results_ci.ontologyref);
        }
    }
    else {
        node.ele('ty', results_ci.resourcetype);
        node.ele('ri', results_ci.resourceid);
        node.att('rn', results_ci.resourcename);
        node.ele('pi', results_ci.parentid);
        node.ele('ct', results_ci.creationtime);
        node.ele('lt', results_ci.lastmodifiedtime);
        node.ele('et', results_ci.expirationtime);
        if(results_ci.labels != null && results_ci.labels !=  '') {
            node.ele('lbl', results_ci.labels);
        }
        node.ele('st', results_ci.statetag);
        if(results_ci.announceto != null && results_ci.announceto !=  '') {
            node.ele('at', results_ci.announceto);
        }
        if(results_ci.announcedattribute != null && results_ci.announcedattribute !=  '') {
            node.ele('aa', results_ci.announcedattribute);
        }
        if(results_ci.creator != null && results_ci.creator !=  '') {
            node.ele('cr', results_ci.creator);
        }
        if(results_ci.contentinfo != null && results_ci.contentinfo !=  '') {
            node.ele('cnf', results_ci.contentinfo);
        }
        node.ele('cs', results_ci.contentsize);
        node.ele('con', results_ci.content);
        if(results_ci.ontologyref != null && results_ci.ontologyref !=  '') {
            node.ele('or', results_ci.ontologyref);
        }
    }
};


exports.addele_sd = function ( request, node, results_sd ) {
    if(request.headers.nmtype == 'long') {
        node.ele('resourceType', results_sd.resourcetype);
        node.ele('resourceID', results_sd.resourceid);
        node.att('resourceName', results_sd.resourcename);
        node.ele('parentID', results_sd.parentid);
        node.ele('creationTime', results_sd.creationtime);
        node.ele('lastModifiedTime', results_sd.lastmodifiedtime);
        node.ele('expirationTime', results_sd.expirationtime);
        if(results_sd.accesscontrolpolicyids != null && results_sd.accesscontrolpolicyids !=  '') {
            node.ele('accessControlPolicyIDs', results_sd.accesscontrolpolicyids);
        }
        if(results_sd.labels != null && results_sd.labels !=  '') {
            node.ele('labels', results_sd.labels);
        }
        node.ele('descriptor', results_sd.descriptor);
        if(results_sd.creator != null && results_sd.creator !=  '') {
            node.ele('creator', results_sd.creator);
        }
        if(results_sd.ontologyref != null && results_sd.ontologyref !=  '') {
            node.ele('ontologyRef', results_sd.ontologyref);
        }
    }
    else {
        node.ele('ty', results_sd.resourcetype);
        node.ele('ri', results_sd.resourceid);
        node.att('rn', results_sd.resourcename);
        node.ele('pi', results_sd.parentid);
        node.ele('ct', results_sd.creationtime);
        node.ele('lt', results_sd.lastmodifiedtime);
        node.ele('et', results_sd.expirationtime);
        if(results_sd.accesscontrolpolicyids != null && results_sd.accesscontrolpolicyids !=  '') {
            node.ele('acpi', results_sd.accesscontrolpolicyids);
        }
        if(results_sd.labels != null && results_sd.labels !=  '') {
            node.ele('lbl', results_sd.labels);
        }
        node.ele('dspt', results_sd.descriptor);
        if(results_sd.creator != null && results_sd.creator !=  '') {
            node.ele('cr', results_sd.creator);
        }
        if(results_sd.ontologyref != null && results_sd.ontologyref !=  '') {
            node.ele('or', results_sd.ontologyref);
        }
    }
};

exports.addele_ic_path = function ( request, node, results_ic_path ) {
    if(request.headers.nmtype == 'long') {
        node.ele('m2m:CSEBase', results_ic_path);
    }
    else {
        node.ele('m2m:cb', results_ic_path);

    }
};

exports.addele_rc_path = function ( request, node, results_rc_path ) {
    if(request.headers.nmtype == 'long') {
        node.ele('m2m:remoteCSE', results_rc_path);
    }
    else {
        node.ele('m2m:csr', results_rc_path);
    }
};

exports.addele_ae_path = function ( request, node, results_ae_path ) {
    if(request.headers.nmtype == 'long') {
        node.ele('m2m:AE', results_ae_path);
    }
    else {
        node.ele('m2m:ae', results_ae_path);
    }
};

exports.addele_co_path = function ( request, node, results_co_path ) {
    if(request.headers.nmtype == 'long') {
        node.ele('m2m:container', results_co_path);
    }
    else {
        node.ele('m2m:cnt', results_co_path);
    }
};

exports.addele_ci_path = function ( request, node, results_ci_path ) {
    if(request.headers.nmtype == 'long') {
        node.ele('m2m:contentInstance', results_ci_path);
    }
    else {
        node.ele('m2m:cin', results_ci_path);
    }
};

exports.addele_ss_path = function ( request, node, results_ss_path ) {
    if(request.headers.nmtype == 'long') {
        node.ele('m2m:subscription', results_ss_path);
    }
    else {
        node.ele('m2m:sub', results_ss_path);
    }
};

var retrieve_result = function (request, response, node, status, ty, rn) {
    var xmlString = node.end({ pretty: true, indent: '  ', newline: '\n'}).toString();

    if(request.headers.locale != null) {
        response.setHeader('locale', request.headers.locale);
    }

    if (request.headers['x-m2m-ri'] != null) {
        response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);
    }

    response.setHeader('Content-Type', 'application/vnd.onem2m-res+xml');

    response.status(status).send(xmlString);
};


function pathaction(request, node, results_lv, list_path) {
    var cur_node = node[0];
    for (var i = 0; i < results_lv.length; i++) {
        if(request.query.lim != null) {
            if(request.query.lim > i) {
                list_path += results_lv[i].path;
                /*if (results_lv[i].resourcetype == '5') {
                 //_this.addele_ic_path(cur_node, results_lv[i].path);
                 list_path += results_lv[i].path;
                 }
                 else if (results_lv[i].resourcetype == '3') {
                 //_this.addele_co_path(cur_node, results_lv[i].path);
                 list_path += results_lv[i].path;
                 }
                 else if (results_lv[i].resourcetype == '4') {
                 //_this.addele_ci_path(cur_node, results_lv[i].path);
                 list_path += results_lv[i].path;
                 }
                 else if (results_lv[i].resourcetype == '16') {
                 //_this.addele_rc_path(cur_node, results_lv[i].path);
                 list_path += results_lv[i].path;
                 }
                 else if (results_lv[i].resourcetype == '2') {
                 //_this.addele_ae_path(cur_node, results_lv[i].path);
                 list_path += results_lv[i].path;
                 }
                 else if (results_lv[i].resourcetype == '23') {
                 //_this.addele_ss_path(cur_node, results_lv[i].path);
                 list_path += results_lv[i].path;
                 }*/
                list_path += ' ';
            }
        }
        else {
            list_path += results_lv[i].path;
            list_path += ' ';
        }
    }

    return list_path;
}

function xmlaction(request, node, results_lv, pp_list) {
    for(var i = 0; i < results_lv.length; i++) {
        if (results_lv[i].resourcetype == '16') {
            node[results_lv[i].resourceid] = ((request.headers.nmtype == 'long') ? node[results_lv[i].parentid].ele('m2m:remoteCSE') : node[results_lv[i].parentid].ele('m2m:csr'));
            _this.addele_rc(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '2') {
            node[results_lv[i].resourceid] = ((request.headers.nmtype == 'long') ? node[results_lv[i].parentid].ele('m2m:AE') : node[results_lv[i].parentid].ele('m2m:ae'));
            _this.addele_ae(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '3') {
            node[results_lv[i].resourceid] = ((request.headers.nmtype == 'long') ? node[results_lv[i].parentid].ele('m2m:container') : node[results_lv[i].parentid].ele('m2m:cnt'));
            _this.addele_co(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '23') {
            node[results_lv[i].resourceid] = ((request.headers.nmtype == 'long') ? node[results_lv[i].parentid].ele('m2m:subscription') : node[results_lv[i].parentid].ele('m2m:sub'));
            _this.addele_ss(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '4') {
            node[results_lv[i].resourceid] = ((request.headers.nmtype == 'long') ? node[results_lv[i].parentid].ele('m2m:contentInstance') : node[results_lv[i].parentid].ele('m2m:cin'));
            _this.addele_ci(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '24') {
            node[results_lv[i].resourceid] = ((request.headers.nmtype == 'long') ? node[results_lv[i].parentid].ele('m2m:semanticDescriptor') : node[results_lv[i].parentid].ele('m2m:sd'));
            _this.addele_sd(request, node[results_lv[i].resourceid], results_lv[i]);
        }

        var parentpath_str = util.format('\'%s\'', results_lv[i].path);
        pp_list.push(parentpath_str);
    }
}


function rc4_child_action(pool, request, response, node, query_where, level, parentpath_list, callback) {
    var sql = util.format("select * from lv%s where parentpath in (%s)", level, parentpath_list);
    sql += query_where;
    DB.getResult(pool, sql, function (err, results_lv1) {
        if(!err) {
            if(results_lv1.length > 0) {
                var parentpath_list = [];
                xmlaction(request, node, results_lv1, parentpath_list);

                rc4_child_action(pool, request, response, node, query_where, level+1, parentpath_list, callback);
            }
            else {
                callback(node);
            }
        }
        else {
            console.log('query error: ' + results_lv1.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_lv1.code + '\"}' : '<rsp>' + results_lv1.code + '</rsp>');
        }
    });
}

exports.request_rc4 = function(request, response, pool, node, resourceid, resourcetype, resourcename, status, level, parentpath) {
    var query_where = '';
    if(request.query.lbl != null) {
        query_where = ' and ';
        if(request.query.lbl.toString().split(',')[1] == null) {
            query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl);
        }
        else {
            for(var i = 0; i < request.query.lbl.length; i++) {
                query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl[i]);

                if(i < request.query.lbl.length-1) {
                    query_where += ' or ';
                }
            }
        }
    }

    if(request.query.rty != null) {
        query_where += ' and ';
        query_where += util.format('resourcetype = \'%s\'', request.query.rty);
    }

    if(request.query.cra != null) {
        query_where += ' and ';
        query_where += util.format('\'%s\' <= creationtime', request.query.cra);
    }

    if(request.query.crb != null) {
        query_where += ' and ';
        query_where += util.format(' creationtime <= \'%s\'', request.query.crb);
    }

    if(request.query.lim != null) {
        if(request.query.lim > max_lim) {
            request.query.lim = max_lim;
        }
        query_where += util.format(' order by resourceid desc limit %s', request.query.lim);
    }
    else {
        query_where += util.format(' order by resourceid desc limit ' + max_lim);
    }

    var parentpath_list = [];
    var parentpath_str = util.format('\'%s\'', parentpath);
    parentpath_list.push(parentpath_str);
    rc4_child_action(pool, request, response, node, query_where, level+1, parentpath_list, function(node) {
        retrieve_result(request, response, node[resourceid], status, resourcetype, resourcename);
    });
};



function fu1_child_action(pool, request, response, node, query_where, level, level_count, list_path, callback) {
    var sql = util.format("select * from lv%s ", level);
    sql += query_where;

    DB.getResult(pool, sql, function (err, results_lv1) {
        if(!err) {
            list_path = pathaction(request, node, results_lv1, list_path);

            level_count++;
            if(level_count <= 4) {
                fu1_child_action(pool, request, response, node, query_where, level+1, level_count, list_path, callback);
            }
            else {
                callback(node, list_path);
            }
        }
        else {
            console.log('query error: ' + results_lv1.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_lv1.code + '\"}' : '<rsp>' + results_lv1.code + '</rsp>');
        }
    });
}

exports.request_fu1 = function(request, response, pool, node, resourceid, resourcetype, resourcename, status, level, parentpath) {
    var list_path = '';
    var query_where = '';
    var query_count = 0;
    if(request.query.lbl != null) {
        query_where = ' where ';
        if(request.query.lbl.toString().split(',')[1] == null) {
            query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl);
        }
        else {
            for(var i = 0; i < request.query.lbl.length; i++) {
                query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl[i]);

                if(i < request.query.lbl.length-1) {
                    query_where += ' or ';
                }
            }
        }
        query_count++;
    }

    if(request.query.rty != null) {
        if(query_count == 0) {
            query_where = ' where ';
        }
        else if(query_count > 0) {
            query_where += ' and ';
        }
        query_where += util.format('resourcetype = \'%s\'', request.query.rty);
        query_count++;
    }

    if(request.query.cra != null) {
        if(query_count == 0) {
            query_where = ' where ';
        }
        else if(query_count > 0) {
            query_where += ' and ';
        }
        query_where += util.format('\'%s\' <= creationtime', request.query.cra);
        query_count++;
    }

    if(request.query.crb != null) {
        if(query_count == 0) {
            query_where = ' where ';
        }
        else if(query_count > 0) {
            query_where += ' and ';
        }
        query_where += util.format(' creationtime <= \'%s\'', request.query.crb);
        query_count++;
    }

    if(query_count == 0) {
        query_where = ' where ';
    }
    else if(query_count > 0) {
        query_where += ' and ';
    }
    query_where += util.format('path like \'%s/%%\'', parentpath);
    query_count++;

    if(request.query.lim != null) {
        if(request.query.lim > max_lim) {
            request.query.lim = max_lim;
        }
        query_where += util.format(' order by resourceid desc limit %s', request.query.lim);
    }
    else {
        query_where += util.format(' order by resourceid desc limit ' + max_lim);
        //query_where += util.format(' order by resourceid desc');
    }

    var level_count = 0;

    fu1_child_action(pool, request, response, node, query_where, level+1, level_count, list_path, function(node, result_list_path) {
        node[0].txt(result_list_path);
        retrieve_result(request, response, node[0], status, resourcetype, resourcename);
    });
};


exports.request = function(request, response, pool, node, resourceid, resourcetype, resourcename, status) {
    retrieve_result(request, response, node[resourceid], status, resourcetype, resourcename);
};




















exports.addele_ic_json = function (request, node, results_ic) {
    if(request.headers.nmtype == 'long') {
        node.resourceType = results_ic.resourcetype;
        node.resourceID = results_ic.resourceid;
        node.resourceName = results_ic.resourcename;
        node.creationTime = results_ic.creationtime;
        node.lastModifiedTime = results_ic.lastmodifiedtime;
        if(results_ic.accesscontrolpolicyids != null && results_ic.accesscontrolpolicyids != '') {
            node.accessControlPolicyIDs = results_ic.accesscontrolpolicyids;
        }
        if(results_ic.labels != null && results_ic.labels != '') {
            node.labels = results_ic.labels;
        }
        if(results_ic.csetype != null && results_ic.csetype != '') {
            node.cseType = results_ic.csetype;
        }
        node['CSE-ID'] = results_ic.cseid;
        node.supportResourceType = results_ic.supportedresourcetype;
        node.pointOfAccess = results_ic.pointofaccess;
        if(results_ic.nodelink != null && results_ic.nodelink != '') {
            node.nodeLink = results_ic.nodelink;
        }
        if(results_ic.notificationcongestionpolicy != null && results_ic.notificationcongestionpolicy != '') {
            node.notificationCongestionPolicy = results_ic.notificationcongestionpolicy;
        }
    }
    else {
        node.ty = results_ic.resourcetype;
        node.ri = results_ic.resourceid;
        node.rn = results_ic.resourcename;
        node.ct = results_ic.creationtime;
        node.lt = results_ic.lastmodifiedtime;
        if(results_ic.accesscontrolpolicyids != null && results_ic.accesscontrolpolicyids != '') {
            node.acpi = results_ic.accesscontrolpolicyids;
        }
        if(results_ic.labels != null && results_ic.labels != '') {
            node.lbl = results_ic.labels;
        }
        if(results_ic.csetype != null && results_ic.csetype != '') {
            node.cst = results_ic.csetype;
        }
        node.csi = results_ic.cseid;
        node.srt = results_ic.supportedresourcetype;
        node.poa = results_ic.pointofaccess;
        if(results_ic.nodelink != null && results_ic.nodelink != '') {
            node.nl = results_ic.nodelink;
        }
        if(results_ic.notificationcongestionpolicy != null && results_ic.notificationcongestionpolicy != '') {
            node.ncp = results_ic.notificationcongestionpolicy;
        }
    }
};




exports.addele_rc_json = function ( request, node, results_rc ) {
    if(request.headers.nmtype == 'long') {
        node.resourceType = results_rc.resourcetype;
        node.resourceID = results_rc.resourceid;
        node.resourceName = results_rc.resourcename;
        node.parentID = results_rc.parentid;
        node.creationTime = results_rc.creationtime;
        node.lastModifiedTime = results_rc.lastmodifiedtime;
        node.expirationTime = results_rc.expirationtime;
        if(results_rc.accesscontrolpolicyids != null && results_rc.accesscontrolpolicyids != '') {
            node.accessControlPolicyIDs = results_rc.accesscontrolpolicyids;
        }
        if(results_rc.labels != null && results_rc.labels != '') {
            node.labels = results_rc.labels;
        }
        if(results_rc.announceto != null && results_rc.announceto != '') {
            node.announceTo = results_rc.announceto;
        }
        if(results_rc.announcedattribute != null && results_rc.announcedattribute != '') {
            node.announcedAttribute = results_rc.announcedattribute;
        }
        if(results_rc.csetype != null && results_rc.csetype != '') {
            node.cseType = results_rc.csetype;
        }
        if(results_rc.pointofaccess != null && results_rc.pointofaccess != '') {
            node.pointOfAccess = results_rc.pointofaccess;
        }
        node.CSEBase = results_rc.csebase;
        node['CSE-ID'] = results_rc.cseid;
        if(results_rc.m2mextid != null && results_rc.m2mextid != '') {
            node['M2M-Ext-ID'] = results_rc.m2mextid;
        }
        if(results_rc.triggerrecipientid != null && results_rc.triggerrecipientid != '') {
            node['Trigger-Recipient-ID'] = results_rc.triggerrecipientid;
        }
        node.requestReachability = results_rc.requestreachability;
        if(results_rc.nodelink != null && results_rc.nodelink != '') {
            node.nodeLink = results_rc.nodelink;
        }
    }
    else {
        node.ty = results_rc.resourcetype;
        node.ri = results_rc.resourceid;
        node.rn = results_rc.resourcename;
        node.pi = results_rc.parentid;
        node.ct = results_rc.creationtime;
        node.lt = results_rc.lastmodifiedtime;
        node.et = results_rc.expirationtime;
        if(results_rc.accesscontrolpolicyids != null && results_rc.accesscontrolpolicyids != '') {
            node.acpi = results_rc.accesscontrolpolicyids;
        }
        if(results_rc.labels != null && results_rc.labels != '') {
            node.lbl = results_rc.labels;
        }
        if(results_rc.announceto != null && results_rc.announceto != '') {
            node.at = results_rc.announceto;
        }
        if(results_rc.announcedattribute != null && results_rc.announcedattribute != '') {
            node.aa = results_rc.announcedattribute;
        }
        if(results_rc.csetype != null && results_rc.csetype != '') {
            node.cst = results_rc.csetype;
        }
        if(results_rc.pointofaccess != null && results_rc.pointofaccess != '') {
            node.poa = results_rc.pointofaccess;
        }
        node.cb = results_rc.csebase;
        node.csi = results_rc.cseid;
        if(results_rc.m2mextid != null && results_rc.m2mextid != '') {
            node.mei = results_rc.m2mextid;
        }
        if(results_rc.triggerrecipientid != null && results_rc.triggerrecipientid != '') {
            node.tri = results_rc.triggerrecipientid;
        }
        node.rr = results_rc.requestreachability;
        if(results_rc.nodelink != null && results_rc.nodelink != '') {
            node.nl = results_rc.nodelink;
        }
    }
};



exports.addele_ae_json = function ( request, node, results_ae ) {
    if(request.headers.nmtype == 'long') {
        node.resourceType = results_ae.resourcetype;
        node.resourceID = results_ae.resourceid;
        node.resourceName = results_ae.resourcename;
        node.parentID = results_ae.parentid;
        node.creationTime = results_ae.creationtime;
        node.lastModifiedTime = results_ae.lastmodifiedtime;
        node.expirationTime = results_ae.expirationtime;
        if(results_ae.accesscontrolpolicyids != null && results_ae.accesscontrolpolicyids != '') {
            node.accessControlPolicyIDs = results_ae.accesscontrolpolicyids;
        }
        if(results_ae.labels != null && results_ae.labels != '') {
            node.labels = results_ae.labels;
        }
        if(results_ae.announceto != null && results_ae.announceto != '') {
            node.announceTo = results_ae.announceto;
        }
        if(results_ae.announcedattribute != null && results_ae.announcedattribute != '') {
            node.announcedAttribute = results_ae.announcedattribute;
        }
        if(results_ae.appname != null && results_ae.appname != '') {
            node.appName = results_ae.appname;
        }
        node['App-ID'] = results_ae.appid;
        node['AE-ID'] = results_ae.aeid;
        if(results_ae.pointofaccess != null && results_ae.pointofaccess != '') {
            node.pointOfAccess = results_ae.pointofaccess == null ? '' : results_ae.pointofaccess;
        }
        if(results_ae.ontologyref != null && results_ae.ontologyref != '') {
            node.ontologyRef = results_ae.ontologyref == null ? '' : results_ae.ontologyref;
        }
        if(results_ae.nodelink != null && results_ae.nodelink != '') {
            node.nodeLink = results_ae.nodelink == null ? '' : results_ae.nodelink;
        }
        if(results_ae.requestreachability != null && results_ae.requestreachability != '') {
            node.requestReachability = results_ae.requestreachability == null ? '' : results_ae.requestreachability;
        }
    }
    else {
        node.ty = results_ae.resourcetype;
        node.ri = results_ae.resourceid;
        node.rn = results_ae.resourcename;
        node.pi = results_ae.parentid;
        node.ct = results_ae.creationtime;
        node.lt = results_ae.lastmodifiedtime;
        node.et = results_ae.expirationtime;
        if(results_ae.accesscontrolpolicyids != null && results_ae.accesscontrolpolicyids != '') {
            node.acpi = results_ae.accesscontrolpolicyids;
        }
        if(results_ae.labels != null && results_ae.labels != '') {
            node.lbl = results_ae.labels;
        }
        if(results_ae.announceto != null && results_ae.announceto != '') {
            node.at = results_ae.announceto;
        }
        if(results_ae.announcedattribute != null && results_ae.announcedattribute != '') {
            node.aa = results_ae.announcedattribute;
        }
        if(results_ae.appname != null && results_ae.appname != '') {
            node.apn = results_ae.appname;
        }
        node.api = results_ae.appid;
        node.aei = results_ae.aeid;
        if(results_ae.pointofaccess != null && results_ae.pointofaccess != '') {
            node.poa = results_ae.pointofaccess;
        }
        if(results_ae.ontologyref != null && results_ae.ontologyref != '') {
            node.or = results_ae.ontologyref;
        }
        if(results_ae.nodelink != null && results_ae.nodelink != '') {
            node.nl = results_ae.nodelink;
        }
        if(results_ae.requestreachability != null && results_ae.requestreachability != '') {
            node.rr = results_ae.requestreachability;
        }
    }
};


exports.addele_co_json = function ( request, node, results_co ) {
    if(request.headers.nmtype == 'long') {
        node.resourceType = results_co.resourcetype;
        node.resourceID = results_co.resourceid;
        node.resourceName = results_co.resourcename;
        node.parentID = results_co.parentid;
        node.creationTime = results_co.creationtime;
        node.lastModifiedTime = results_co.lastmodifiedtime;
        node.expirationTime = results_co.expirationtime;
        if(results_co.accesscontrolpolicyids != null && results_co.accesscontrolpolicyids !=  '') {
            node.accessControlPolicyIDs = results_co.accesscontrolpolicyids;
        }
        if(results_co.labels != null && results_co.labels !=  '') {
            node.labels = results_co.labels;
        }
        node.stateTag = results_co.statetag;
        if(results_co.announceTo != null && results_co.announceTo !=  '') {
            node.announceTo = results_co.announceto;
        }
        if(results_co.announcedattribute != null && results_co.announcedattribute !=  '') {
            node.announcedAttribute = results_co.announcedattribute;
        }
        if(results_co.creator != null && results_co.creator !=  '') {
            node.creator = results_co.creator;
        }
        if(results_co.maxnrofinstances != null && results_co.maxnrofinstances !=  '') {
            node.maxNrOfInstance = results_co.maxnrofinstances;
        }
        if(results_co.maxbytesize != null && results_co.maxbytesize !=  '') {
            node.maxByteSize = results_co.maxbytesize;
        }
        if(results_co.maxinstanceage != null && results_co.maxinstanceage !=  '') {
            node.maxInstanceAge = results_co.maxinstanceage;
        }
        node.currentNrOfInstances = results_co.currentnrofinstances;
        node.currentByteSize = results_co.currentbytesize;
        if(results_co.locationid != null && results_co.locationid !=  '') {
            node.locationID = results_co.locationid;
        }
        if(results_co.ontologyref != null && results_co.ontologyref !=  '') {
            node.ontologyRef = results_co.ontologyref;
        }
    }
    else {
        node.ty = results_co.resourcetype;
        node.ri = results_co.resourceid;
        node.rn = results_co.resourcename;
        node.pi = results_co.parentid;
        node.ct = results_co.creationtime;
        node.lt = results_co.lastmodifiedtime;
        node.et = results_co.expirationtime;
        if(results_co.accesscontrolpolicyids != null && results_co.accesscontrolpolicyids !=  '') {
            node.acpi = results_co.accesscontrolpolicyids;
        }
        if(results_co.labels != null && results_co.labels !=  '') {
            node.lbl = results_co.labels;
        }
        node.st = results_co.statetag;
        if(results_co.announceto != null && results_co.announceto !=  '') {
            node.at = results_co.announceto;
        }
        if(results_co.announcedattribute != null && results_co.announcedattribute !=  '') {
            node.aa = results_co.announcedattribute;
        }
        if(results_co.creator != null && results_co.creator !=  '') {
            node.cr = results_co.creator;
        }
        if(results_co.maxnrofinstances != null && results_co.maxnrofinstances !=  '') {
            node.mni = results_co.maxnrofinstances;
        }
        if(results_co.maxbytesize != null && results_co.maxbytesize !=  '') {
            node.mbs = results_co.maxbytesize;
        }
        if(results_co.maxinstanceage != null && results_co.maxinstanceage !=  '') {
            node.mia = results_co.maxinstanceage;
        }
        node.cni = results_co.currentnrofinstances;
        node.cbs = results_co.currentbytesize;
        if(results_co.locationid != null && results_co.locationid !=  '') {
            node.li = results_co.locationid;
        }
        if(results_co.ontologyref != null && results_co.ontologyref !=  '') {
            node.or = results_co.ontologyref;
        }
    }
};

exports.addele_ss_json = function ( request, node, results_ss ) {
    if(request.headers.nmtype == 'long') {
        node.resourceType = results_ss.resourcetype;
        node.resourceID = results_ss.resourceid;
        node.resourceName = results_ss.resourcename;
        node.parentID = results_ss.parentid;
        node.creationTime = results_ss.creationtime;
        node.lastModifiedTime = results_ss.lastmodifiedtime;
        node.expirationTime = results_ss.expirationtime;
        if(results_ss.accesscontrolpolicyids != null && results_ss.accesscontrolpolicyids !=  '') {
            node.accessControlPolicyIDs = results_ss.accesscontrolpolicyids;
        }
        if(results_ss.labels != null && results_ss.labels !=  '') {
            node.labels = results_ss.labels;
        }
        if(results_ss.eventnotificationcriteria != null && results_ss.eventnotificationcriteria !=  '') {
            node.eventNotificationCriteria = results_ss.eventnotificationcriteria;
        }
        if(results_ss.expirationcounter != null && results_ss.expirationcounter !=  '') {
            node.expirationCounter = results_ss.expirationcounter;
        }
        if(results_ss.notificationuri != null && results_ss.notificationuri !=  '') {
            node.notificationURI = results_ss.notificationuri;
        }
        if(results_ss.groupid != null && results_ss.groupid !=  '') {
            node.groupID = results_ss.groupid;
        }
        if(results_ss.notificationforwardinguri != null && results_ss.notificationforwardinguri !=  '') {
            node.notificationForwardingURI = results_ss.notificationforwardinguri;
        }
        if(results_ss.batchnotify != null && results_ss.batchnotify !=  '') {
            node.batchNotify = results_ss.batchnotify;
        }
        if(results_ss.ratelimit != null && results_ss.ratelimit !=  '') {
            node.rateLimit = results_ss.ratelimit;
        }
        if(results_ss.presubscriptionnotify != null && results_ss.presubscriptionnotify !=  '') {
            node.preSubscriptionNotify = results_ss.presubscriptionnotify;
        }
        if(results_ss.pendingnotification != null && results_ss.pendingnotification !=  '') {
            node.pendingNotification = results_ss.pendingnotification;
        }
        if(results_ss.notificationstroagepriority != null && results_ss.notificationstroagepriority !=  '') {
            node.notificationStroagePriority = results_ss.notificationstroagepriority;
        }
        if(results_ss.latestnotify != null && results_ss.latestnotify !=  '') {
            node.latestNotify = results_ss.latestnotify;
        }
        if(results_ss.notificationcontenttype != null && results_ss.notificationcontenttype !=  '') {
            node.notificationContentType = results_ss.notificationcontenttype;
        }
        if(results_ss.notificationeventcat != null && results_ss.notificationeventcat !=  '') {
            node.notificationEventCat = results_ss.notificationeventcat;
        }
        if(results_ss.creator != null && results_ss.creator !=  '') {
            node.creator = results_ss.creator;
        }
        if(results_ss.subscriberuri != null && results_ss.subscriberuri !=  '') {
            node.subscriberURI = results_ss.subscriberuri;
        }
    }
    else {
        node.ty = results_ss.resourcetype;
        node.ri = results_ss.resourceid;
        node.rn = results_ss.resourcename;
        node.pi = results_ss.parentid;
        node.ct = results_ss.creationtime;
        node.lt = results_ss.lastmodifiedtime;
        node.et = results_ss.expirationtime;
        if(results_ss.accesscontrolpolicyids != null && results_ss.accesscontrolpolicyids !=  '') {
            node.acpi = results_ss.accesscontrolpolicyids;
        }
        if(results_ss.labels != null && results_ss.labels !=  '') {
            node.lbl = results_ss.labels;
        }
        if(results_ss.eventnotificationcriteria != null && results_ss.eventnotificationcriteria !=  '') {
            node.enc = results_ss.eventnotificationcriteria;
        }
        if(results_ss.expirationcounter != null && results_ss.expirationcounter !=  '') {
            node.exc = results_ss.expirationcounter;
        }
        if(results_ss.notificationuri != null && results_ss.notificationuri !=  '') {
            node.nu = results_ss.notificationuri;
        }
        if(results_ss.groupid != null && results_ss.groupid !=  '') {
            node.gpi = results_ss.groupid;
        }
        if(results_ss.notificationforwardinguri != null && results_ss.notificationforwardinguri !=  '') {
            node.nfu = results_ss.notificationforwardinguri;
        }
        if(results_ss.batchnotify != null && results_ss.batchnotify !=  '') {
            node.bn = results_ss.batchnotify;
        }
        if(results_ss.ratelimit != null && results_ss.ratelimit !=  '') {
            node.rl = results_ss.ratelimit;
        }
        if(results_ss.presubscriptionnotify != null && results_ss.presubscriptionnotify !=  '') {
            node.psn = results_ss.presubscriptionnotify;
        }
        if(results_ss.pendingnotification != null && results_ss.pendingnotification !=  '') {
            node.pn = results_ss.pendingnotification;
        }
        if(results_ss.notificationstroagepriority != null && results_ss.notificationstroagepriority !=  '') {
            node.nsp = results_ss.notificationstroagepriority;
        }
        if(results_ss.latestnotify != null && results_ss.latestnotify !=  '') {
            node.ln = results_ss.latestnotify;
        }
        if(results_ss.notificationcontenttype != null && results_ss.notificationcontenttype !=  '') {
            node.nct = results_ss.notificationcontenttype;
        }
        if(results_ss.notificationeventcat != null && results_ss.notificationeventcat !=  '') {
            node.nec = results_ss.notificationeventcat;
        }
        if(results_ss.creator != null && results_ss.creator !=  '') {
            node.cr = results_ss.creator;
        }
        if(results_ss.subscriberuri != null && results_ss.subscriberuri !=  '') {
            node.su = results_ss.subscriberuri;
        }
    }
};

exports.addele_ci_json = function ( request, node, results_ci ) {
    if(request.headers.nmtype == 'long') {
        node.resourceType = results_ci.resourcetype;
        node.resourceID = results_ci.resourceid;
        node.resourceName = results_ci.resourcename;
        node.parentID = results_ci.parentid;
        node.creationTime = results_ci.creationtime;
        node.lastModifiedTime = results_ci.lastmodifiedtime;
        node.expirationTime = results_ci.expirationtime;
        if(results_ci.labels != null && results_ci.labels !=  '') {
            node.labels = results_ci.labels;
        }
        node.stateTag = results_ci.statetag;
        if(results_ci.announceto != null && results_ci.announceto !=  '') {
            node.announceTo = results_ci.announceto;
        }
        if(results_ci.announcedattribute != null && results_ci.announcedattribute !=  '') {
            node.announcedAttribute = results_ci.announcedattribute;
        }
        if(results_ci.creator != null && results_ci.creator !=  '') {
            node.creator = results_ci.creator;
        }
        if(results_ci.contentinfo != null && results_ci.contentinfo !=  '') {
            node.contentInfo = results_ci.contentinfo;
        }
        node.contentSize = results_ci.contentsize;
        node.content = results_ci.content;
        if(results_ci.ontologyref != null && results_ci.ontologyref !=  '') {
            node.ontologyRef = results_ci.ontologyref;
        }
    }
    else {
        node.ty = results_ci.resourcetype;
        node.ri = results_ci.resourceid;
        node.rn = results_ci.resourcename;
        node.pi = results_ci.parentid;
        node.ct = results_ci.creationtime;
        node.lt = results_ci.lastmodifiedtime;
        node.et = results_ci.expirationtime;
        if(results_ci.labels != null && results_ci.labels !=  '') {
            node.lbl = results_ci.labels;
        }
        node.st = results_ci.statetag;
        if(results_ci.announceto != null && results_ci.announceto !=  '') {
            node.at = results_ci.announceto;
        }
        if(results_ci.announcedattribute != null && results_ci.announcedattribute !=  '') {
            node.aa = results_ci.announcedattribute;
        }
        if(results_ci.creator != null && results_ci.creator !=  '') {
            node.cr = results_ci.creator;
        }
        if(results_ci.contentinfo != null && results_ci.contentinfo !=  '') {
            node.cnf = results_ci.contentinfo;
        }
        node.cs = results_ci.contentsize;
        node.con = results_ci.content;
        if(results_ci.ontologyref != null && results_ci.ontologyref !=  '') {
            node.or = results_ci.ontologyref;
        }
    }
};


exports.addele_sd_json = function ( request, node, results_sd ) {
    if(request.headers.nmtype == 'long') {
        node.resourceType = results_sd.resourcetype;
        node.resourceID = results_sd.resourceid;
        node.resourceName = results_sd.resourcename;
        node.parentID = results_sd.parentid;
        node.creationTime = results_sd.creationtime;
        node.lastModifiedTime = results_sd.lastmodifiedtime;
        node.expirationTime = results_sd.expirationtime;
        if(results_sd.accesscontrolpolicyids != null && results_sd.accesscontrolpolicyids !=  '') {
            node.accessControlPolicyIDs = results_sd.accesscontrolpolicyids;
        }
        if(results_sd.labels != null && results_sd.labels !=  '') {
            node.labels = results_sd.labels;
        }
        if(results_sd.creator != null && results_sd.creator !=  '') {
            node.creator = results_sd.creator;
        }
        node.descriptor = results_sd.descriptor;
        if(results_sd.ontologyref != null && results_sd.ontologyref !=  '') {
            node.ontologyRef = results_sd.ontologyref;
        }
    }
    else {
        node.ty = results_sd.resourcetype;
        node.ri = results_sd.resourceid;
        node.rn = results_sd.resourcename;
        node.pi = results_sd.parentid;
        node.ct = results_sd.creationtime;
        node.lt = results_sd.lastmodifiedtime;
        node.et = results_sd.expirationtime;
        if(results_sd.accesscontrolpolicyids != null && results_sd.accesscontrolpolicyids !=  '') {
            node.acpi = results_sd.accesscontrolpolicyids;
        }
        if(results_sd.labels != null && results_sd.labels !=  '') {
            node.lbl = results_sd.labels;
        }
        if(results_sd.creator != null && results_sd.creator !=  '') {
            node.cr = results_sd.creator;
        }
        node.dspt = results_sd.descriptor;
        if(results_sd.ontologyref != null && results_sd.ontologyref !=  '') {
            node.or = results_sd.ontologyref;
        }
    }
};


var retrieve_result_json = function (request, response, node, status, ty, rn) {
    if(request.headers.locale != null) {
        response.setHeader('locale', request.headers.locale);
    }

    if (request.headers['x-m2m-ri'] != null) {
        response.setHeader('X-M2M-RI', request.headers['x-m2m-ri']);
    }

    response.setHeader('Content-Type', 'application/vnd.onem2m-res+json');

    response.status(status).send(node);
};

var rsc_count = 0;
var ae_count = 0;
var cnt_count = 0;
var sub_count = 0;
var cin_count = 0;
var sd_count = 0;

function xmlaction_json(request, node, results_lv, pp_list) {
    for(var i = 0; i < results_lv.length; i++) {
        if (results_lv[i].resourcetype == '16') {
            results_lv[i].pointofaccess = results_lv[i].pointofaccess.toString().split(' ');
            results_lv[i].labels = results_lv[i].labels.toString().split(' ');
            results_lv[i].accesscontrolpolicyids = results_lv[i].accesscontrolpolicyids.toString().split(' ');
            results_lv[i].announcedattribute = results_lv[i].announcedattribute.toString().split(' ');
            results_lv[i].announceto = results_lv[i].announceto.toString().split(' ');
            if(request.headers.nmtype == 'long') {
                if(node[results_lv[i].parentid]['m2m:remoteCSE'] == null) {
                    node[results_lv[i].parentid]['m2m:remoteCSE'] = [];
                    rsc_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:remoteCSE'][rsc_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:remoteCSE'][rsc_count++];
            }
            else { // request.headers.nmtype == 'short'
                if(node[results_lv[i].parentid]['m2m:csr'] == null) {
                    node[results_lv[i].parentid]['m2m:csr'] = [];
                    rsc_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:csr'][rsc_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:csr'][rsc_count++];
            }

            _this.addele_rc_json(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '2') {
            results_lv[i].pointofaccess = results_lv[i].pointofaccess.toString().split(' ');
            results_lv[i].labels = results_lv[i].labels.toString().split(' ');
            results_lv[i].accesscontrolpolicyids = results_lv[i].accesscontrolpolicyids.toString().split(' ');
            results_lv[i].announcedattribute = results_lv[i].announcedattribute.toString().split(' ');
            results_lv[i].announceto = results_lv[i].announceto.toString().split(' ');
            if(request.headers.nmtype == 'long') {
                if(node[results_lv[i].parentid]['m2m:AE'] == null) {
                    node[results_lv[i].parentid]['m2m:AE'] = [];
                    ae_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:AE'][ae_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:AE'][ae_count++];
            }
            else { // request.headers.nmtype == 'short'
                if(node[results_lv[i].parentid]['m2m:ae'] == null) {
                    node[results_lv[i].parentid]['m2m:ae'] = [];
                    ae_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:ae'][ae_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:ae'][ae_count++];
            }

            _this.addele_ae_json(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '3') {
            results_lv[i].labels = results_lv[i].labels.toString().split(' ');
            results_lv[i].accesscontrolpolicyids = results_lv[i].accesscontrolpolicyids.toString().split(' ');
            results_lv[i].announcedattribute = results_lv[i].announcedattribute.toString().split(' ');
            results_lv[i].announceto = results_lv[i].announceto.toString().split(' ');
            if(request.headers.nmtype == 'long') {
                if(node[results_lv[i].parentid]['m2m:container'] == null) {
                    node[results_lv[i].parentid]['m2m:container'] = [];
                    cnt_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:container'][cnt_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:container'][cnt_count++];
            }
            else { // request.headers.nmtype == 'short'
                if(node[results_lv[i].parentid]['m2m:cnt'] == null) {
                    node[results_lv[i].parentid]['m2m:cnt'] = [];
                    cnt_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:cnt'][cnt_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:cnt'][cnt_count++];
            }

            _this.addele_co_json(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '23') {
            results_lv[i].labels = results_lv[i].labels.toString().split(' ');
            results_lv[i].accesscontrolpolicyids = results_lv[i].accesscontrolpolicyids.toString().split(' ');
            results_lv[i].eventnotificationcriteria = results_lv[i].eventnotificationcriteria.toString().split(' ');
            results_lv[i].notificationuri = results_lv[i].notificationuri.toString().split(' ');

            if(request.headers.nmtype == 'long') {
                if(node[results_lv[i].parentid]['m2m:subscription'] == null) {
                    node[results_lv[i].parentid]['m2m:subscription'] = [];
                    sub_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:subscription'][sub_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:subscription'][sub_count++];
            }
            else { // request.headers.nmtype == 'short'
                if(node[results_lv[i].parentid]['m2m:sub'] == null) {
                    node[results_lv[i].parentid]['m2m:sub'] = [];
                    sub_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:sub'][sub_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:sub'][sub_count++];
            }

            _this.addele_ss_json(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '4') {
            results_lv[i].labels = results_lv[i].labels.toString().split(' ');
            results_lv[i].announcedattribute = results_lv[i].announcedattribute.toString().split(' ');
            results_lv[i].announceto = results_lv[i].announceto.toString().split(' ');
            if(request.headers.nmtype == 'long') {
                if(node[results_lv[i].parentid]['m2m:contentInstance'] == null) {
                    node[results_lv[i].parentid]['m2m:contentInstance'] = [];
                    cin_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:contentInstance'][cin_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:contentInstance'][cin_count++];
            }
            else { // request.headers.nmtype == 'short'
                if(node[results_lv[i].parentid]['m2m:cin'] == null) {
                    node[results_lv[i].parentid]['m2m:cin'] = [];
                    cin_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:cin'][cin_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:cin'][cin_count++];
            }

            _this.addele_ci_json(request, node[results_lv[i].resourceid], results_lv[i]);
        }
        else if (results_lv[i].resourcetype == '24') {
            results_lv[i].labels = results_lv[i].labels.toString().split(' ');
            results_lv[i].accesscontrolpolicyids = results_lv[i].accesscontrolpolicyids.toString().split(' ');
            if(request.headers.nmtype == 'long') {
                if(node[results_lv[i].parentid]['m2m:semanticDescriptor'] == null) {
                    node[results_lv[i].parentid]['m2m:semanticDescriptor'] = [];
                    sd_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:semanticDescriptor'][sd_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:semanticDescriptor'][sd_count++];
            }
            else { // request.headers.nmtype == 'short'
                if(node[results_lv[i].parentid]['m2m:sd'] == null) {
                    node[results_lv[i].parentid]['m2m:sd'] = [];
                    sd_count = 0;
                }
                node[results_lv[i].resourceid] = {};
                node[results_lv[i].parentid]['m2m:sd'][sd_count] = {};
                node[results_lv[i].resourceid] = node[results_lv[i].parentid]['m2m:sd'][sd_count++];
            }

            _this.addele_sd_json(request, node[results_lv[i].resourceid], results_lv[i]);
        }

        var parentpath_str = util.format('\'%s\'', results_lv[i].path);
        pp_list.push(parentpath_str);
    }
}

function pathaction_json(request, node, results_lv) {
    for (var i = 0; i < results_lv.length; i++) {
        if (request.headers.nmtype == 'long') {
            if(request.query.lim != null) {
                if(request.query.lim > i) {
                    node['m2m:URIList'].push(results_lv[i].path);
                }
            }
            else {
                node['m2m:URIList'].push(results_lv[i].path);
            }
        }
        else { // request.headers.nmtype == 'short'
            if(request.query.lim != null) {
                if(request.query.lim > i) {
                    node['m2m:uril'].push(results_lv[i].path);
                }
            }
            else {
                node['m2m:uril'].push(results_lv[i].path);
            }
        }
    }
}


function fu1_child_action_json(pool, request, response, node, query_where, level, level_count, callback) {
    var sql = util.format("select * from lv%s ", level);
    sql += query_where;

    DB.getResult(pool, sql, function (err, results_lv1) {
        if(!err) {
            pathaction_json(request, node, results_lv1);

            level_count++;
            if(level_count <= 4) {
                fu1_child_action_json(pool, request, response, node, query_where, level+1, level_count, callback);
            }
            else {
                callback(node);
            }
        }
        else {
            console.log('query error: ' + results_lv1.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_lv1.code + '\"}' : '<rsp>' + results_lv1.code + '</rsp>');
        }
    });
}

exports.request_fu1_json = function(request, response, pool, node, resourceid, resourcetype, resourcename, status, level, parentpath) {
    var query_where = '';
    var query_count = 0;
    if(request.query.lbl != null) {
        query_where = ' where ';
        if(request.query.lbl.toString().split(',')[1] == null) {
            query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl);
        }
        else {
            for(var i = 0; i < request.query.lbl.length; i++) {
                query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl[i]);

                if(i < request.query.lbl.length-1) {
                    query_where += ' or ';
                }
            }
        }
        query_count++;
    }

    if(request.query.rty != null) {
        if(query_count == 0) {
            query_where = ' where ';
        }
        else if(query_count > 0) {
            query_where += ' and ';
        }
        query_where += util.format('resourcetype = \'%s\'', request.query.rty);
        query_count++;
    }

    if(request.query.cra != null) {
        if(query_count == 0) {
            query_where = ' where ';
        }
        else if(query_count > 0) {
            query_where += ' and ';
        }
        query_where += util.format('\'%s\' <= creationtime', request.query.cra);
        query_count++;
    }

    if(request.query.crb != null) {
        if(query_count == 0) {
            query_where = ' where ';
        }
        else if(query_count > 0) {
            query_where += ' and ';
        }
        query_where += util.format(' creationtime <= \'%s\'', request.query.crb);
        query_count++;
    }

    if(query_count == 0) {
        query_where = ' where ';
    }
    else if(query_count > 0) {
        query_where += ' and ';
    }
    query_where += util.format('path like \'%s/%%\'', parentpath);
    query_count++;

    if(request.query.lim != null) {
        if(request.query.lim > max_lim) {
            request.query.lim = max_lim;
        }
        query_where += util.format(' order by resourceid desc limit %s', request.query.lim);
    }
    else {
        query_where += util.format(' order by resourceid desc limit ' + max_lim);
        //query_where += util.format(' order by resourceid desc');
    }

    var level_count = 0;

    fu1_child_action_json(pool, request, response, node, query_where, level+1, level_count, function(node) {
        retrieve_result_json(request, response, node, status, resourcetype, resourcename);
    });
};


function rc4_child_action_json(pool, request, response, node, query_where, level, parentpath_list, callback) {
    var sql = util.format("select * from lv%s where parentpath in (%s)", level, parentpath_list);
    sql += query_where;
    DB.getResult(pool, sql, function (err, results_lv1) {
        if(!err) {
            if(results_lv1.length > 0) {
                var parentpath_list = [];
                xmlaction_json(request, node, results_lv1, parentpath_list);

                rc4_child_action_json(pool, request, response, node, query_where, level+1, parentpath_list, callback);
            }
            else {
                callback(node);
            }
        }
        else {
            console.log('query error: ' + results_lv1.code);
            response.setHeader('X-M2M-RSC', '5000');
            response.status(500).end((request.headers.usebodytype == 'json') ? '{\"rsp\":\"' + results_lv1.code + '\"}' : '<rsp>' + results_lv1.code + '</rsp>');
        }
    });
}

exports.request_rc4_json = function(request, response, pool, node, rootnm, resourceid, resourcetype, resourcename, status, level, parentpath) {
    var query_where = '';
    if(request.query.lbl != null) {
        query_where = ' and ';
        if(request.query.lbl.toString().split(',')[1] == null) {
            query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl);
        }
        else {
            for(var i = 0; i < request.query.lbl.length; i++) {
                query_where += util.format(' labels like \'%%%s%%\'', request.query.lbl[i]);

                if(i < request.query.lbl.length-1) {
                    query_where += ' or ';
                }
            }
        }
    }

    if(request.query.rty != null) {
        query_where = ' and ';
        query_where += util.format('resourcetype = \'%s\'', request.query.rty);
    }

    if(request.query.cra != null) {
        query_where = ' and ';
        query_where += util.format('\'%s\' <= creationtime', request.query.cra);
    }

    if(request.query.crb != null) {
        query_where = ' and ';
        query_where += util.format(' creationtime <= \'%s\'', request.query.crb);
    }

    if(request.query.lim != null) {
        if(request.query.lim > max_lim) {
            request.query.lim = max_lim;
        }
        query_where += util.format(' order by resourceid desc limit %s', request.query.lim);
    }
    else {
        query_where += util.format(' order by resourceid desc limit ' + max_lim);
    }

    var parentpath_list = [];
    var parentpath_str = util.format('\'%s\'', parentpath);
    parentpath_list.push(parentpath_str);
    rc4_child_action_json(pool, request, response, node, query_where, level+1, parentpath_list, function(node) {
        retrieve_result_json(request, response, node[rootnm], status, resourcetype, resourcename);
    });
};

exports.request_json = function(request, response, pool, node, resourceid, resourcetype, resourcename, status) {
    retrieve_result_json(request, response, node, status, resourcetype, resourcename);
};
