import * as url from 'url';
import * as http from 'http';
import cookie = require('cookie');
import queryString = require("querystring");
import fs = require('fs');
import request = require('request');
import path = require('path');

export interface IHttpRequest extends http.IncomingMessage{
    body : {[key:string]:any},
    routing : {controller:string, action:string, path:string, args:any}
}
export interface IViews {
    getView(con: string): string | null;
    hasView(con: string): boolean;
}
export interface IControllers {
    getController(con: string): Controller | null;
    hasController(con: string): boolean;
}
export interface IRequest {
    readonly namespace: string;
    readonly controller: string;
    readonly action: string;
    readonly path?: string;
    args:{ [key: string]: any };
    url?:string;
}
export interface IViewTpl {
    namespace: string;
    path:string;
}
export interface IViewSource {
    namespace: string;
    source:IViewRenderer;
}
export interface IViewRenderer{
    namespace: string;
    template: string|IViewTpl;
    data: any;
}

export const IRequestNamespace: string = "com.po-to/IRequest";
export const IViewRendererNamespace: string = "com.po-to/IViewRenderer";
export const IViewTplNamespace: string = "com.po-to/IViewTpl";
export const IViewSourceNamespace: string = "com.po-to/IViewSource";

export function isIViewRenderer(data:Object):data is IViewRenderer{
    return data['namespace'] == IViewRendererNamespace;
}
export function isIRequest(data:Object):data is IRequest{
    return data['namespace'] == IRequestNamespace;
}
export function isIViewTpl(data:Object):data is IViewTpl{
    return data['namespace'] == IViewTplNamespace;
}
export function isIViewSource(data:Object):data is IViewSource{
    return data['namespace'] == IViewSourceNamespace;
}

export class ViewTpl implements IViewTpl {
    public readonly namespace = IViewTplNamespace;
    constructor(public readonly path: string) {}
}
export class ViewSource implements IViewSource {
    public readonly namespace = IViewSourceNamespace;
    constructor(public readonly source: IViewRenderer) {}
}
export class ViewRenderer implements IViewRenderer {
    public readonly namespace: string = IViewRendererNamespace;
    constructor(public template: string | IViewTpl, public data: any = '', public renderer: string = 'renderer') {}

}
export function makeView(template: string | IViewTpl, data: any = '', options?:{[key:string]:any} ,renderer: string = 'renderer'):ViewSource|ViewRenderer{
    let viewRenderer = new ViewRenderer(template,data,renderer);
    if(options){
        let viewSource = new ViewSource(viewRenderer);
        Object.assign(viewSource, options);
        return viewSource;
    }else{
        return viewRenderer;
    }
}
export class Request implements IRequest {
    public readonly namespace: string = IRequestNamespace;
    public beCache:boolean = false;
    public url?:string;
    constructor(public parent: Request, public readonly controller: string, public readonly action: string, public readonly path?: string, public args:{ [key: string]: any }={}) {}
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
    toUrl(toAmd:boolean): string {
        return this.getCore().toUrl(this,toAmd);
    }
    // getAction() {
    //     return this.getCore().getAction(this.controller, this.action, this.isInternal);
    // }
    getCore():Core{
        return this.parent.getCore();
    }
    getRoot():Request{
        return this.parent.getRoot();
    }
    getIP(): string {
        return this.parent.getIP();
    }
    getCookie(): null | { [key: string]: any } {
        return this.parent.getCookie();
    }
    setCookie(name: string, val?: string, options?): void {
        this.parent.setCookie(name,val,options);
    }
    assignCookie(key:string, val:string){
        this.parent.assignCookie(key,val);
    }
    setHeader(name:string,value:string|string[]){
        this.parent.setHeader(name,value);
    }
    setResponse(data:any){
        this.parent.setResponse(data);
    }
    // isViewRequest(): boolean {
    //     let con = this.root.core.getController(this.controller, this.isRoot());
    //     return !!(con && con instanceof ViewController);
    // }
}

class RootRequest extends Request {
    constructor(controller: string, action: string, path: string, args: any,  private core: Core, private request: http.IncomingMessage, private response: http.ServerResponse) {
        super({} as any, controller, action, path, args);
        this.parent = this;
        this.url = request.url;
    }
    getRoot():Request{
        return this;
    }
    getCore():Core{
        return this.core;
    }
    setResponse(data:any){
        if(this.beCache){
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
    setHeader(name:string,value:string|string[]){
        this.response.setHeader(name,value);
    }
    setCookie(name: string, val?: string, options?) {
        //var signed = 's:' + signature.sign(val, secret);
        let data
        if (val === undefined) {
            data = name;
        } else {
            options = options || { path: "/" };
            data = cookie.serialize(name, val, options);
        }
        let prev: any = this.response.getHeader('set-cookie') || [];
        var header = Array.isArray(prev) ? prev.concat(data)
            : Array.isArray(data) ? [prev].concat(data)
                : [prev, data];
        this.response.setHeader('set-cookie', header);
    }
    assignCookie(key:string, val:string){
        this.request['cookies'][key] = val;
    }
    getCookie(): null | { [key: string]: any } {
        return this.request['cookies'];
    }
    getIP(): string {
        let req = this.request;
        return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '0.0.0.0';
    }
}
export class PError extends Error{
    constructor(public readonly eid: string, public readonly info?: any) {
        super(eid+' '+info.toString());
    }
}


export class Controller {
    protected filter<T>(target: T, ...objs) :T{
        let data = {};
        function copy(target, data, obj){
            for(let key in target){
                if(data.hasOwnProperty(key)){
                    if(typeof target[key] == "object"){
                        copy(target[key],data[key], obj);
                    }else{
                        obj[key] = data[key];
                    }
                }
            }
        }
        for (let obj of objs) {
            copy(target,obj,data)
        }
        return data as T;
    }
    __args_Action(ars:{[key:string]:any},request:Request):{[key:string]:any}{
        return {};
    }
    Action(request: Request, args:{[key:string]:any}, resolve: (data: any) => void, reject: (error: Error) => void){

    }
};

export class Core {
    protected readonly _views: IViews;
    protected readonly _controllers: IControllers;
    protected readonly _renderer: (namespace:string ,{template: string, data: any}) => string;
    
    MRouting(req: http.IncomingMessage, res: http.ServerResponse, next: (error?: Error) => void) { 
        let data = this.routing(req.url||'', req.method||'', {}); 
        if(data){
            req['routing'] = data;
            next();
        }else{
            next(new Error('404 not found!'));
        }
    }
    routing(str: string, method: string, data?: any): {controller:string, action:string, path:string, args:any} | null {
        let urlData = url.parse(str, true);
        let pathname = urlData.pathname || '';
        pathname = pathname.replace(/(^\/+|\/+$)/g,'');
        let query = urlData.query;
        let controller: string = '';
        let hasController: boolean = false;
        if (pathname) {
            let id: string | undefined;
            let path: string = '';
            let action: string = '';
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
                let operating:string = '';
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
                if (id === undefined && this.hasAction(controller, operating+"List", true)) {
                    path = "";
                    action = operating+"List";
                } else {
                    path = id || "";
                    action = operating;
                }
                if (this.hasAction(controller, action, true)) {
                    return {controller:controller, action:action, path:path, args:Object.assign(query,data)};
                }
            }
        }
        return null;
    }
    getController(path: string, isInternal: boolean): Controller | null {
        if (path) {
            let arr = path.split("/");
            let conName = arr[arr.length - 1];
            arr[arr.length - 1] = "_" + conName;
            let path2 = arr.join("/");
            if (isInternal) {
                return this._controllers.getController(path) || this._controllers.getController(path2);
            } else {
                if (conName.startsWith("_")) {
                    return null;
                } else {
                    return this._controllers.getController(path);
                }
            }
        } else {
            return null;
        }
    }
    hasController(path: string, isInternal: boolean): boolean {
        //console.log(path);
        return !!this.getController(path, isInternal);
    }
    getAction(controller: string, action: string, isInternal: boolean): { controller: Controller, action: string } | null {
        let obj = this.getController(controller, isInternal);
        if (!obj) { return null };
        if (isInternal) {
            if (typeof (obj[action]) != "function") {
                action = '_' + action;
            }
            if (typeof (obj[action]) != "function") {
                return null;
            }
        } else {
            if (action.startsWith("_") || typeof (obj[action]) != "function") {
                return null;
            }
        }
        return { controller: obj, action: action };
    }
    hasAction(controller: string, action: string, isInternal: boolean): boolean {
        return !!this.getAction(controller, action, isInternal);
    }
    checkPermission(request: IRequest): boolean {
        return true;
    }
    executeRequest<T>(request: Request, internal:boolean, success?: (data:T) => void, failure?: (error: Error) => void): Promise<T> {
        return new Promise((resolve:(data:any)=>void, reject:(error:Error)=>void)=>{
            let obj = this.getAction(request.controller, request.action, internal);
            if (obj) {
                //request.beCache = obj.controller.__beCache(request);
                if (internal || this.checkPermission(request)) {
                    if(obj.controller['__args_'+obj.action]){
                        request.args = obj.controller['__args_'+obj.action](request.args,request);
                    }else{
                        request.args = {};
                    }
                    obj.controller[obj.action](request, request.args, resolve, reject);
                } else {
                    reject(new Error('403'));
                }
            } else {
                reject(new Error('404'));
            }
        }).then(success,failure).catch(failure);
    }
    executeRequestToData<T>(request: Request, internal:boolean, toAmd:boolean, success?: (data:T) => void, failure?: (error: Error) => void): Promise<T> {
        return this.executeRequest<any>(request,internal).then(
            (data)=>{
                return this.renderToData(request,data,toAmd)
            }
        ).then(success,failure).catch(failure);
    }
    parseResult(request:Request,data:any,toAmd:boolean){
        var atta:Request[] = [];
        var str = JSON.stringify(data, (key, value) => {
            if(isIRequest(value)){
                if (toAmd) {
                    let tempUrl = value.controller;
                    return 'import!' + this.toUrl(value, toAmd);
                } else {
                    atta.push((value instanceof Request)?value:new Request(request,value.controller,value.action,value.path,value.args));
                    return 'import!req://' + (atta.length-1);
                }
            }else if(isIViewTpl(value)){
                if (toAmd) {
                    return 'import!' + this.toUrl(value, toAmd);
                } else {
                    return 'import!view://' + value.path;
                }
            }else if(isIViewRenderer(value)){
                return ['import!^',{template:value.template,data:value.data},'import!$'];
            }else if(isIViewSource(value)){
                return ['import!^',{template:value.source.template,data:value.source.data},'import!$'];
            }else{
                return value;
            }
        });
        str = str.replace(/\["import!\^",/g,'r("'+IViewRendererNamespace+'",').replace(/,"import!\$"\]/g,")");
        
        var deps = {}, i = 0;
        var args0 = ['renderer'], args1 = ['r'];
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

        let fbody = 'return '+ str;
        args1.push(fbody);

        return { deps: args0, callback: new Function(...args1), atta: atta };
    }
    renderToData(request:Request, data:any, toAmd:boolean, success?: (str: string) => void, failure?: (error: Error) => void): Promise<any>{
        return new Promise((resolve:(data:any)=>void, reject:(error:Error)=>void)=>{
            let {deps, callback, atta} = this.parseResult(request, data, toAmd);
            if (toAmd) {
                if (deps.length) {
                    resolve('define(["' + deps.join('","') + '"],' + callback.toString() + ');');
                } else {
                    resolve('define(' + callback.toString() + ');');
                }
            } else {
                let depsValue = deps.map((url)=>{
                    if (url == 'renderer') {
                        return this._renderer;
                    } else if (url.startsWith("view://")) {
                        return this._views.getView(url) || url + ' not found!';
                    } else if (url.startsWith("req://")) {
                        let index = parseInt(url.substr("req://".length));
                        return this.executeRequestToData(atta[index], true, toAmd);
                    } else {
                        return this.loadUrl(url);
                    }
                })
                Promise.all(depsValue).then(function (values: any[]) {
                    resolve(callback(...values));
                }).catch(function (error) {
                    reject(error);
                })
            }
        }).then(success,failure).catch(failure);
        
    }
    loadUrl(url: string): Promise<any> | any {
        return '111';
    }
    
    entrance(req: IHttpRequest, res: http.ServerResponse,  resolve: (data:any) => void, reject: (error: Error) => void){
        let {controller,action,path,args} = req.routing;
        Object.assign(args,req.body);
        let request = new RootRequest(controller, action, path, args, this, req, res);
        let amd = request.args.__rq__=='amd';
        delete request.args.__rq__;
        this.executeRequestToData(request, false, amd ,resolve, reject);
    }
    MEntrance(req: IHttpRequest, res: http.ServerResponse, next: (error?: Error) => void){
        this.entrance(req, res, function(result){
            res.end(result);
        },next);
    }
    toUrl(request: IRequest | IViewTpl, toAmd:boolean): string {
        if (request instanceof ViewTpl) {
            return request.path + ".js";
        } else {
            if(!request.url){
                let pathStr:string;
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
                        if (obj && obj.controller['__args_'+obj.action]) {
                            args = obj.controller['__args_'+obj.action](request.args,request);
                        }
                        break;
                }
                request.url = url.format({ pathname: pathStr, query: request.args });
            }
            return request.url;       
        }
    }


    
    
    
    
    
    
    
    // entrance(req: IHttpRequest, res: http.ServerResponse, success: (data: any) => void, failure?: (error: Error) => void) {
    //     let {controller,action,path,args} = req.routing;
    //     Object.assign(args,req.body);
    //     //let isAmd = args && args[this.requestArgName] == this.requestAmdName;
    //     let request = new RootRequest(controller, action, path, args, this, req, res);
        
    //     this.executeRequest(request, false ,(data) => {

    //         //isAmd && request.setHeader('Content-Type','application/javascript');//:'text/html; charset=utf-8'
    //         if (data instanceof ViewRendererData) {
    //             this.render(data, request.isAmd(), function (str) {
    //                 request.setResponse(str);
    //                 callback(request);
    //             }, function (error: Error) {
    //                 callback(error);
    //             });
    //         } else {
    //             request.setResponse(data);
    //             callback(request);
    //         }
    //     }, (error) => {
    //         callback(error);
    //     })
    // }




    

}










export class Model {
};


export class ApiRequest {
    constructor(public readonly context: Request, public url: string, public method?: string, public data?: { [key: string]: any } | string, public headers?: { [key: string]: string }, public render?: (data: any) => any) {

    }
}

export function callApi<T>(requestOptions: ApiRequest, succss?: (data: T) => void, fail?: (error: Error) => void): Promise<T> {
    return new Promise(function (resolve, reject) {
        let method: string = requestOptions.method || "GET";
        let url = requestOptions.url;
        let form: any;
        if (requestOptions.data && method == "GET") {
            url += (url.indexOf("?") > -1 ? '&' : '?') + (typeof (requestOptions.data) == "string" ? requestOptions.data : queryString.stringify(requestOptions.data));
        } else {
            form = requestOptions.data || null;
        }
        let arr = url.match(/\/\/(.+?)\//);
        let hostname = arr ? arr[1] : "";
        let cookies = requestOptions.context.getCookie();
        let headers = Object.assign({}, requestOptions.headers);
        if (cookies) {
            let cookiesArr: string[] = [];
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
            } else {
                succss && succss(result);
                resolve(result);
            }
        }
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
                let arr: string[] | null = response.headers['set-cookie'];
                if (arr) {
                    arr.forEach(function (cookie) {
                        if (/(^.*)(domain=)(.*)(; .*$)/.test(cookie)) {
                            cookie = cookie.replace(/(^.*)(domain=)(.*)(; .*$)/, function ($0, $1, $2, $3, $4) { return $3 + "$" + $1 + $2 + $4; });
                        } else {
                            cookie = response['request']['uri'].hostname + "$" + cookie;
                        }
                        requestOptions.context.setCookie(cookie);
                    })
                }
                returnResult(body);
                // body = JSON.parse(body);
                // body.succ = parseInt(body.succ);
                // if (body.succ) {
                //     returnResult(body);
                // } else {
                //     returnResult(new PError("error"));
                // }
            } else {
                returnResult(error || new Error((response?response.statusCode:403) + ""));
            }
        });
    }).catch(function () {

    });
}