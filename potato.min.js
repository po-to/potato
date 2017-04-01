"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const cookie = require("cookie");
const queryString = require("querystring");
const fs = require("fs");
const request = require("request");
const path = require("path");
const vm = require("vm");
class Request {
    constructor(parent, controller, action, path, args = {}) {
        this.parent = parent;
        this.controller = controller;
        this.action = action;
        this.path = path;
        this.args = args;
        this.beCache = false;
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
    toUrl(toAmd, noArgs) {
        return this.getCore().toUrl(this, toAmd, noArgs);
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
        this.url = (request.url || "").replace(/^\//, '').replace(/__rq__=.*?(&|$)/g, '').replace(/[?&]$/, '');
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
class Controller {
    filter(target, ...objs) {
        let data = {};
        function copy(target, data, obj) {
            for (let key in target) {
                if (data.hasOwnProperty(key)) {
                    if (typeof target[key] == "object") {
                        copy(target[key], data[key], obj);
                    }
                    else {
                        obj[key] = data[key];
                    }
                }
            }
        }
        for (let obj of objs) {
            copy(target, obj, data);
        }
        return data;
    }
    __args_Action(ars, request) {
        return {};
    }
    Action(request, args, resolve, reject) {
    }
}
exports.Controller = Controller;
;
function MRouting(req, res, next) {
    let data = core.routing(req.url || '', req.method || '', {});
    if (data) {
        req['routing'] = data;
        next();
    }
    else {
        next(new Error('404 not found!'));
    }
}
exports.MRouting = MRouting;
function MEntrance(req, res, next) {
    core.entrance(req, res, function (result) {
        res.end(result);
    }, next);
}
exports.MEntrance = MEntrance;
function responseNotFound(res) {
    res.statusCode = 404;
}
function responseError(res) {
}
class AMD {
    constructor(...args) {
        if (args.length === 3) {
            this.id = args[0];
            this.dependencies = args[1];
            this.callback = args[2];
        }
        else if (args.length === 2) {
            if (typeof args[0] == "string") {
                this.id = args[0];
                this.dependencies = [];
            }
            else {
                this.id = '';
                this.dependencies = args[0];
            }
            this.callback = args[1];
        }
        else if (args.length = 1) {
            this.id = '';
            this.dependencies = [];
            this.callback = args[0];
        }
        else {
            this.id = '';
            this.dependencies = [];
            this.callback = '';
        }
    }
}
exports.AMD = AMD;
function define(...args) {
    let id, dependencies, callback, result;
    if (args.length === 3) {
        id = args[0];
        dependencies = args[1];
        callback = args[2];
    }
    else if (args.length === 2) {
        if (typeof args[0] == "string") {
            id = args[0];
            dependencies = [];
        }
        else {
            id = '';
            dependencies = args[0];
        }
        callback = args[1];
    }
    else if (args.length = 1) {
        id = '';
        dependencies = [];
        callback = args[0];
    }
    else {
        id = '';
        dependencies = [];
        callback = function () { };
    }
    if (typeof callback == "function") {
        if (dependencies.length) {
            let deps = dependencies.map((item) => {
                if (item instanceof Request) {
                    return core.executeRequestToData(item, true, false);
                }
                else if (typeof item == "string") {
                    return requireAmd(item);
                }
                else {
                    return item;
                }
            });
            if (deps.some(function (item) {
                return item instanceof Promise;
            })) {
                result = Promise.all(deps).then(function (values) {
                    let result = callback(...values);
                    if (id) {
                        amdCaches[id] = result;
                    }
                    return result;
                }, function (error) {
                    if (id) {
                        delete amdCaches[id];
                    }
                    throw error;
                });
            }
            else {
                result = callback(...deps);
            }
        }
        else {
            result = callback();
        }
    }
    else {
        result = callback;
    }
    amdCaches['.'] = result;
    if (id) {
        amdCaches[id] = result;
    }
}
define['amd'] = true;
let core;
let amdCaches = {};
let amdPaths = {};
function setConfig(options) {
    if (options.core) {
        core = options.core;
    }
    ;
    if (options.amdPaths) {
        amdPaths = options.amdPaths;
    }
    if (options.amdCaches) {
        Object.assign(amdCaches, options.amdCaches);
    }
}
exports.setConfig = setConfig;
let amdSandbox = vm.createContext({ define: define, requireAmd: requireAmd, amdCaches: amdCaches, amdPaths: amdPaths, console: console });
function requireAmd(id) {
    for (let key in amdPaths) {
        if (id.startsWith(key)) {
            id = id.replace(key, amdPaths[key]);
        }
    }
    if (amdCaches[id]) {
        return amdCaches[id];
    }
    else {
        return new Promise(function (resolve, reject) {
            request(id, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    vm.runInContext(body, amdSandbox);
                    resolve(amdCaches['.']);
                }
                else {
                    reject(new Error(id + " is not found!"));
                }
            });
        });
    }
}
class Core {
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
                    if (obj.controller['__args_' + obj.action]) {
                        request.args = obj.controller['__args_' + obj.action](request.args, request);
                    }
                    else {
                        request.args = {};
                    }
                    obj.controller[obj.action](request, request.args, resolve, reject);
                }
                else {
                    reject(new Error('403'));
                }
            }
            else {
                reject(new Error('404'));
            }
        }).then(success, failure);
    }
    executeRequestToData(request, internal, toAmd, success, failure) {
        return this.executeRequest(request, internal).then((data) => {
            if (data instanceof AMD) {
                if (toAmd) {
                    let funs = 'define(' + (data.id ? '"' + data.id + '",' : '');
                    if (data.dependencies.length) {
                        if (typeof data.callback == 'function') {
                            let arr = data.callback.toString().match(/(^[^(]+\()([^)]+)([^{]+\{)([\s\S]+$)/);
                            if (arr) {
                                let oargs = arr[2].split(',');
                                let args = [];
                                let deps = data.dependencies.map(function (item, index) {
                                    if (typeof item == "string") {
                                        return item;
                                    }
                                    else if (item instanceof Request) {
                                        return item.toUrl(true, false);
                                    }
                                    else {
                                        args.push(oargs[index] + '=' + JSON.stringify(item));
                                        return '';
                                    }
                                });
                                args.push("");
                                funs += JSON.stringify(deps) + ",";
                                funs += arr[1] + arr[2] + arr[3] + "\r\n" + args.join(";\r\n") + arr[4];
                            }
                        }
                        else {
                            funs += JSON.stringify(data.callback);
                        }
                    }
                    else {
                        funs += (typeof data.callback == 'function') ? data.callback.toString() : JSON.stringify(data.callback);
                    }
                    return funs;
                }
                else {
                    define(data.id, data.dependencies, data.callback);
                    return amdCaches['.'];
                }
            }
            else {
                if (toAmd) {
                    return 'define(' + JSON.stringify(data) + ')';
                }
                else {
                    return data;
                }
            }
        }).then(success, failure);
    }
    entrance(req, res, resolve, reject) {
        let { controller, action, path, args } = req.routing;
        Object.assign(args, req.body);
        let request = new RootRequest(controller, action, path, args, this, req, res);
        let amd = request.args.__rq__ == 'amd';
        delete request.args.__rq__;
        this.executeRequestToData(request, false, amd, resolve, reject);
    }
    toUrl(request, toAmd, noArgs) {
        if (!request.url) {
            let pathStr;
            pathStr = request.controller;
            if (request.path) {
                pathStr += '/' + request.path;
            }
            pathStr += "/";
            let args = {};
            switch (request.action) {
                case "Item":
                case "ItemList":
                    let obj = this.getAction(request.controller, request.action, true);
                    if (obj && obj.controller['__args_' + obj.action]) {
                        args = obj.controller['__args_' + obj.action](request.args, request);
                    }
                    break;
            }
            request.url = url.format({ pathname: pathStr, query: request.args });
        }
        let str = request.url;
        if (noArgs) {
            str = str.split("?")[0];
        }
        if (toAmd) {
            return str + (str.indexOf("?") > -1 ? "&" : "?") + "__rq__=amd";
        }
        else {
            return str;
        }
    }
}
exports.Core = Core;
class Model {
}
exports.Model = Model;
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
                if (site && hostname.indexOf(site) > -1) {
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
