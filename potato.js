"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const cookie = require("cookie");
const queryString = require("querystring");
const fs = require("fs");
const request = require("request");
const path = require("path");
exports.IRequestNamespace = "com.po-to/IRequest";
exports.IViewRendererNamespace = "com.po-to/IViewRenderer";
exports.IViewTplNamespace = "com.po-to/IViewTpl";
exports.IViewSourceNamespace = "com.po-to/IViewSource";
function isIViewRenderer(data) {
    return data['namespace'] == exports.IViewRendererNamespace;
}
exports.isIViewRenderer = isIViewRenderer;
function isIRequest(data) {
    return data['namespace'] == exports.IRequestNamespace;
}
exports.isIRequest = isIRequest;
function isIViewTpl(data) {
    return data['namespace'] == exports.IViewTplNamespace;
}
exports.isIViewTpl = isIViewTpl;
function isIViewSource(data) {
    return data['namespace'] == exports.IViewSourceNamespace;
}
exports.isIViewSource = isIViewSource;
class ViewTpl {
    constructor(path) {
        this.path = path;
        this.namespace = exports.IViewTplNamespace;
    }
}
exports.ViewTpl = ViewTpl;
class ViewSource {
    constructor(source, data) {
        this.source = source;
        this.data = data;
        this.namespace = exports.IViewSourceNamespace;
    }
}
exports.ViewSource = ViewSource;
class ViewRenderer {
    constructor(template, data = '', renderer = 'renderer') {
        this.template = template;
        this.data = data;
        this.renderer = renderer;
        this.namespace = exports.IViewRendererNamespace;
    }
}
exports.ViewRenderer = ViewRenderer;
class Request {
    constructor(parent, controller, action, path, args, url) {
        this.parent = parent;
        this.controller = controller;
        this.action = action;
        this.path = path;
        this.args = args;
        this.url = url;
        this.namespace = exports.IRequestNamespace;
        this.beCache = false;
        if (!args || !Object.keys(args).length) {
            this.args = undefined;
        }
        else {
            this.args = args;
        }
    }
    // createViewRender(data?: { [key: string]: any }): { [key: string]: any } {
    //     return Object.assign({
    //         VPID: this.root.core.toUrl(this)
    //     }, data);
    // }
    // isRoot(): boolean {
    //     return this.root == (this as any);
    // }
    // isAmd(): boolean{
    //     let args = this.args || {};
    //     return args["__request__"] == "amd";
    // }
    toUrl(toAmd) {
        return this.getCore().toUrl(this, toAmd);
    }
    // getAction() {
    //     return this.getCore().getAction(this.controller, this.action, this.isInternal);
    // }
    getCore() {
        return this.parent.getCore();
    }
    getRoot() {
        return this.parent.getRoot();
    }
    getIP() {
        return this.parent.getIP();
    }
    getCookie() {
        return this.parent.getCookie();
    }
    setCookie(name, val, options) {
        this.parent.setCookie(name, val, options);
    }
    assignCookie(key, val) {
        this.parent.assignCookie(key, val);
    }
    setHeader(name, value) {
        this.parent.setHeader(name, value);
    }
    setResponse(data) {
        this.parent.setResponse(data);
    }
}
exports.Request = Request;
class RootRequest extends Request {
    constructor(controller, action, path, args, core, request, response) {
        super({}, controller, action, path, args);
        this.core = core;
        this.request = request;
        this.response = response;
        this.parent = this;
    }
    getRoot() {
        return this;
    }
    getCore() {
        return this.core;
    }
    setResponse(data) {
        if (this.beCache) {
            // let dir = path.join(process.cwd(), 'caches/');
            // if (!fs.existsSync(dir)) {
            //     fs.mkdirSync(dir);
            // }
            // fs.writeFile(path.join()+".js", data);
            // console.log(this.toUrl(),data);
        }
        // if(this.isAmd){
        //     this.response.setHeader('Content-Type','application/javascript');
        // }else if(typeof data=="string"){
        //     this.response.setHeader('Content-Type','text/html; charset=utf-8');
        // }else{
        //     this.response.setHeader('Content-Type','application/json');
        //     data = JSON.stringify(data);
        // }
        this.response.end(data);
    }
    setHeader(name, value) {
        this.response.setHeader(name, value);
    }
    setCookie(name, val, options) {
        //var signed = 's:' + signature.sign(val, secret);
        let data;
        if (val === undefined) {
            data = name;
        }
        else {
            options = options || { path: "/" };
            data = cookie.serialize(name, val, options);
        }
        let prev = this.response.getHeader('set-cookie') || [];
        var header = Array.isArray(prev) ? prev.concat(data)
            : Array.isArray(data) ? [prev].concat(data)
                : [prev, data];
        this.response.setHeader('set-cookie', header);
    }
    assignCookie(key, val) {
        this.request['cookies'][key] = val;
    }
    getCookie() {
        return this.request['cookies'];
    }
    getIP() {
        let req = this.request;
        return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '0.0.0.0';
    }
}
class PError extends Error {
    constructor(eid, info) {
        super(eid + ' ' + info.toString());
        this.eid = eid;
        this.info = info;
    }
}
exports.PError = PError;
class Core {
    MRouting(req, res, next) {
        let data = this.routing(req.url || '', req.method || '', {});
        if (data) {
            req['routing'] = data;
            next();
        }
        else {
            next(new Error('404 not found!'));
        }
    }
    routing(str, method, data) {
        let urlData = url.parse(str, true);
        let pathname = urlData.pathname || '';
        pathname = pathname.replace(/(^\/+|\/+$)/g, '');
        let query = urlData.query;
        let controller = '';
        let hasController = false;
        if (pathname) {
            let id;
            let path = '';
            let action = '';
            controller = pathname;
            hasController = this.hasController(controller, true);
            if (!hasController) {
                controller = pathname + '/Index';
                hasController = this.hasController(controller, true);
            }
            if (!hasController) {
                let arr = pathname.split('/');
                id = arr.pop();
                controller = arr.join("/");
                hasController = this.hasController(controller, true);
            }
            if (hasController) {
                let operating = '';
                switch (method) {
                    case "GET":
                        operating = "Item";
                        break;
                    case "POST":
                        operating = "Update";
                        break;
                    case "PUT":
                        operating = "Create";
                        break;
                    case "DELETE":
                        operating = "Delete";
                        break;
                }
                if (id === undefined && this.hasAction(controller, operating + "List", true)) {
                    path = "";
                    action = operating + "List";
                }
                else {
                    path = id || "";
                    action = operating;
                }
                if (this.hasAction(controller, action, true)) {
                    return { controller: controller, action: action, path: path, args: Object.assign(query, data) };
                }
            }
        }
        return null;
    }
    getController(path, isInternal) {
        if (path) {
            let arr = path.split("/");
            let conName = arr[arr.length - 1];
            arr[arr.length - 1] = "_" + conName;
            let path2 = arr.join("/");
            if (isInternal) {
                return this._controllers.getController(path) || this._controllers.getController(path2);
            }
            else {
                if (conName.startsWith("_")) {
                    return null;
                }
                else {
                    return this._controllers.getController(path);
                }
            }
        }
        else {
            return null;
        }
    }
    hasController(path, isInternal) {
        //console.log(path);
        return !!this.getController(path, isInternal);
    }
    getAction(controller, action, isInternal) {
        let obj = this.getController(controller, isInternal);
        if (!obj) {
            return null;
        }
        ;
        if (isInternal) {
            if (typeof (obj[action]) != "function") {
                action = '_' + action;
            }
            if (typeof (obj[action]) != "function") {
                return null;
            }
        }
        else {
            if (action.startsWith("_") || typeof (obj[action]) != "function") {
                return null;
            }
        }
        return { controller: obj, action: action };
    }
    hasAction(controller, action, isInternal) {
        return !!this.getAction(controller, action, isInternal);
    }
    checkPermission(request) {
        return true;
    }
    executeRequest(request, internal, success, failure) {
        return new Promise((resolve, reject) => {
            let obj = this.getAction(request.controller, request.action, internal);
            if (obj) {
                //request.beCache = obj.controller.__beCache(request);
                if (internal || this.checkPermission(request)) {
                    obj.controller[obj.action](request, resolve, reject);
                }
                else {
                    reject(new Error('403'));
                }
            }
            else {
                reject(new Error('404'));
            }
        }).then(success, failure).catch(failure);
    }
    executeRequestToData(request, internal, toAmd, success, failure) {
        return this.executeRequest(request, internal).then((data) => {
            return this.renderToData(request, data, toAmd);
        }).then(success, failure).catch(failure);
    }
    parseResult(request, data, toAmd) {
        var atta = [];
        var str = JSON.stringify(data, (key, value) => {
            if (isIRequest(value)) {
                if (toAmd) {
                    let tempUrl = value.controller;
                    return 'import!' + this.toUrl(value, toAmd);
                }
                else {
                    atta.push((value instanceof Request) ? value : new Request(request, value.controller, value.action, value.path, value.args));
                    return 'import!req://' + (atta.length - 1);
                }
            }
            else if (isIViewTpl(value)) {
                if (toAmd) {
                    return 'import!' + this.toUrl(value, toAmd);
                }
                else {
                    return 'import!view://' + value.path;
                }
            }
            else if (isIViewRenderer(value)) {
                return ['import!^', { template: value.template, data: value.data }, 'import!$'];
            }
            else {
                return value;
            }
        });
        str = str.replace(/\["import!\^",/g, 'r("' + exports.IViewRendererNamespace + '",').replace(/,"import!\$"\]/g, ")");
        var deps = {}, i = 0;
        var args0 = ['rendererManager'], args1 = ['r'];
        str = str.replace(/"import!(.+?)"/g, function ($0, $1) {
            if (!deps[$1]) {
                deps[$1] = "$" + i;
                i++;
            }
            return deps[$1];
        });
        for (let url in deps) {
            args0.push(url);
            args1.push(deps[url]);
        }
        let fbody = 'return ' + str;
        args1.push(fbody);
        return { deps: args0, callback: new Function(...args1), atta: atta };
    }
    renderToData(request, data, toAmd, success, failure) {
        return new Promise((resolve, reject) => {
            let { deps, callback, atta } = this.parseResult(request, data, toAmd);
            if (toAmd) {
                if (deps.length) {
                    resolve('define(["' + deps.join('","') + '"],' + callback.toString() + ');');
                }
                else {
                    resolve('define(' + callback.toString() + ');');
                }
            }
            else {
                let depsValue = deps.map((url) => {
                    if (url == 'rendererManager') {
                        return this._renderer;
                    }
                    else if (url.startsWith("view://")) {
                        return this._views.getView(url) || url + ' not found!';
                    }
                    else if (url.startsWith("req://")) {
                        let index = parseInt(url.substr("req://".length));
                        return this.executeRequestToData(atta[index], true, toAmd);
                    }
                    else {
                        return this.loadUrl(url);
                    }
                });
                Promise.all(depsValue).then(function (values) {
                    resolve(callback(...values));
                }).catch(function (error) {
                    reject(error);
                });
            }
        }).then(success, failure).catch(failure);
    }
    loadUrl(url) {
        return '111';
    }
    entrance(req, res, resolve, reject) {
        let { controller, action, path, args } = req.routing;
        Object.assign(args, req.body);
        let request = new RootRequest(controller, action, path, args, this, req, res);
        this.executeRequest(request, false, resolve, reject);
    }
    MEntrance(req, res, next) {
        this.entrance(req, res, function (result) {
            next();
        }, next);
    }
    toUrl(request, toAmd) {
        if (request instanceof ViewTpl) {
            return request.path + ".js";
        }
        else {
            let pathStr;
            if (request.url) {
                pathStr = request.url;
            }
            else {
                pathStr = request.controller;
                if (request.path) {
                    pathStr += '/' + request.path;
                }
                pathStr += "/";
                switch (request.action) {
                    case "Index":
                        break;
                    case "Item":
                        break;
                }
            }
            // if (request.isViewRequest()) {
            //     let obj = {};
            //     obj[this.pageArgName] = "";
            //     obj[this.requestArgName] = this.requestAmdName;
            //     args = Object.assign({}, (noArgs ? {} : request.args), obj)
            // }
            return url.format({ pathname: pathStr, query: request.args });
        }
    }
}
exports.Core = Core;
class Model {
}
exports.Model = Model;
;
class Controller {
    __beCache(request) {
        return false;
    }
}
exports.Controller = Controller;
;
class ApiRequest {
    constructor(context, url, method, data, headers, render) {
        this.context = context;
        this.url = url;
        this.method = method;
        this.data = data;
        this.headers = headers;
        this.render = render;
    }
}
exports.ApiRequest = ApiRequest;
function callApi(requestOptions, succss, fail) {
    return new Promise(function (resolve, reject) {
        let method = requestOptions.method || "GET";
        let url = requestOptions.url;
        let form;
        if (requestOptions.data && method == "GET") {
            url += (url.indexOf("?") > -1 ? '&' : '?') + (typeof (requestOptions.data) == "string" ? requestOptions.data : queryString.stringify(requestOptions.data));
        }
        else {
            form = requestOptions.data || null;
        }
        let arr = url.match(/\/\/(.+?)\//);
        let hostname = arr ? arr[1] : "";
        let cookies = requestOptions.context.getCookie();
        let headers = Object.assign({}, requestOptions.headers);
        if (cookies) {
            let cookiesArr = [];
            for (let key in cookies) {
                let site = key.substr(0, key.indexOf("$"));
                if (hostname.indexOf(site) > -1) {
                    let item = cookie.serialize(key.substr(key.indexOf("$") + 1), cookies[key]);
                    cookiesArr.push(item);
                }
            }
            if (cookiesArr.length) {
                if (headers["Cookie"]) {
                    cookiesArr.push(headers["Cookie"]);
                }
                headers["Cookie"] = cookiesArr.join("; ");
            }
        }
        let returnResult = function (data) {
            let result = requestOptions.render ? requestOptions.render(data) : data;
            if (result instanceof Error) {
                fail && fail(result);
                reject(result);
            }
            else {
                succss && succss(result);
                resolve(result);
            }
        };
        let stime = Date.now();
        request({ url: url, method: method, headers: headers, form: form }, function (error, response, body) {
            let consume = (Date.now() - stime) / 1000;
            console.log('curl ' + consume + ' ' + url);
            let filename = method + "_" + url.replace(hostname, "").replace(/\W/g, '_');
            let dir = path.join(process.cwd(), 'logs/' + hostname + '/');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            fs.writeFile((dir + filename).substr(0, 200) + ".json", consume + ' ' + JSON.stringify([form, response]));
            if (response && !error && response.statusCode == 200) {
                let arr = response.headers['set-cookie'];
                if (arr) {
                    arr.forEach(function (cookie) {
                        if (/(^.*)(domain=)(.*)(; .*$)/.test(cookie)) {
                            cookie = cookie.replace(/(^.*)(domain=)(.*)(; .*$)/, function ($0, $1, $2, $3, $4) { return $3 + "$" + $1 + $2 + $4; });
                        }
                        else {
                            cookie = response['request']['uri'].hostname + "$" + cookie;
                        }
                        requestOptions.context.setCookie(cookie);
                    });
                }
                returnResult(body);
                // body = JSON.parse(body);
                // body.succ = parseInt(body.succ);
                // if (body.succ) {
                //     returnResult(body);
                // } else {
                //     returnResult(new PError("error"));
                // }
            }
            else {
                returnResult(error || new Error((response ? response.statusCode : 403) + ""));
            }
        });
    }).catch(function () {
    });
}
exports.callApi = callApi;
