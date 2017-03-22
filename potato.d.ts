/// <reference types="node" />
import * as http from 'http';
export interface IHttpRequest extends http.IncomingMessage {
    body: {
        [key: string]: any;
    };
    routing: {
        controller: string;
        action: string;
        path: string;
        args: any;
    };
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
    args: {
        [key: string]: any;
    };
    url?: string;
}
export interface IViewTpl {
    namespace: string;
    path: string;
}
export interface IViewSource {
    namespace: string;
    source: IViewRenderer;
}
export interface IViewRenderer {
    namespace: string;
    template: string | IViewTpl;
    data: any;
}
export declare const IRequestNamespace: string;
export declare const IViewRendererNamespace: string;
export declare const IViewTplNamespace: string;
export declare const IViewSourceNamespace: string;
export declare function isIViewRenderer(data: Object): data is IViewRenderer;
export declare function isIRequest(data: Object): data is IRequest;
export declare function isIViewTpl(data: Object): data is IViewTpl;
export declare function isIViewSource(data: Object): data is IViewSource;
export declare class ViewTpl implements IViewTpl {
    readonly path: string;
    readonly namespace: string;
    constructor(path: string);
}
export declare class ViewSource implements IViewSource {
    readonly source: IViewRenderer;
    readonly namespace: string;
    constructor(source: IViewRenderer);
}
export declare class ViewRenderer implements IViewRenderer {
    template: string | IViewTpl;
    data: any;
    renderer: string;
    readonly namespace: string;
    constructor(template: string | IViewTpl, data?: any, renderer?: string);
}
export declare function makeView(template: string | IViewTpl, data?: any, options?: {
    [key: string]: any;
}, renderer?: string): ViewSource | ViewRenderer;
export declare class Request implements IRequest {
    parent: Request;
    readonly controller: string;
    readonly action: string;
    readonly path: string;
    args: {
        [key: string]: any;
    };
    readonly namespace: string;
    beCache: boolean;
    url?: string;
    constructor(parent: Request, controller: string, action: string, path?: string, args?: {
        [key: string]: any;
    });
    toUrl(toAmd: boolean): string;
    getCore(): Core;
    getRoot(): Request;
    getIP(): string;
    getCookie(): null | {
        [key: string]: any;
    };
    setCookie(name: string, val?: string, options?: any): void;
    assignCookie(key: string, val: string): void;
    setHeader(name: string, value: string | string[]): void;
    setResponse(data: any): void;
}
export declare class PError extends Error {
    readonly eid: string;
    readonly info: any;
    constructor(eid: string, info?: any);
}
export declare class Controller {
    protected filter<T>(target: T, ...objs: any[]): T;
    __args_Action(ars: {
        [key: string]: any;
    }, request: Request): {
        [key: string]: any;
    };
    Action(request: Request, args: {
        [key: string]: any;
    }, resolve: (data: any) => void, reject: (error: Error) => void): void;
}
export declare class Core {
    protected readonly _views: IViews;
    protected readonly _controllers: IControllers;
    protected readonly _renderer: (namespace: string, {template: string, data: any}) => string;
    MRouting(req: http.IncomingMessage, res: http.ServerResponse, next: (error?: Error) => void): void;
    routing(str: string, method: string, data?: any): {
        controller: string;
        action: string;
        path: string;
        args: any;
    } | null;
    getController(path: string, isInternal: boolean): Controller | null;
    hasController(path: string, isInternal: boolean): boolean;
    getAction(controller: string, action: string, isInternal: boolean): {
        controller: Controller;
        action: string;
    } | null;
    hasAction(controller: string, action: string, isInternal: boolean): boolean;
    checkPermission(request: IRequest): boolean;
    executeRequest<T>(request: Request, internal: boolean, success?: (data: T) => void, failure?: (error: Error) => void): Promise<T>;
    executeRequestToData<T>(request: Request, internal: boolean, toAmd: boolean, success?: (data: T) => void, failure?: (error: Error) => void): Promise<T>;
    parseResult(request: Request, data: any, toAmd: boolean): {
        deps: string[];
        callback: Function;
        atta: Request[];
    };
    renderToData(request: Request, data: any, toAmd: boolean, success?: (str: string) => void, failure?: (error: Error) => void): Promise<any>;
    loadUrl(url: string): Promise<any> | any;
    entrance(req: IHttpRequest, res: http.ServerResponse, resolve: (data: any) => void, reject: (error: Error) => void): void;
    MEntrance(req: IHttpRequest, res: http.ServerResponse, next: (error?: Error) => void): void;
    toUrl(request: IRequest | IViewTpl, toAmd: boolean): string;
}
export declare class Model {
}
export declare class ApiRequest {
    readonly context: Request;
    url: string;
    method: string;
    data: {
        [key: string]: any;
    } | string;
    headers: {
        [key: string]: string;
    };
    render: (data: any) => any;
    constructor(context: Request, url: string, method?: string, data?: {
        [key: string]: any;
    } | string, headers?: {
        [key: string]: string;
    }, render?: (data: any) => any);
}
export declare function callApi<T>(requestOptions: ApiRequest, succss?: (data: T) => void, fail?: (error: Error) => void): Promise<T>;
