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
export interface IControllers {
    getController(con: string): Controller | null;
}
export declare class Request {
    parent: Request;
    readonly controller: string;
    readonly action: string;
    readonly path: string;
    args: {
        [key: string]: any;
    };
    beCache: boolean;
    url?: string;
    constructor(parent: Request, controller: string, action: string, path?: string, args?: {
        [key: string]: any;
    });
    toUrl(toAmd?: boolean, noArgs?: boolean): string;
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
export declare function MRouting(req: http.IncomingMessage, res: http.ServerResponse, next: (error?: Error) => void): void;
export declare function MEntrance(req: IHttpRequest, res: http.ServerResponse, next: (error?: Error) => void): void;
export declare class AMD {
    id: string;
    dependencies: any[];
    callback: any;
    constructor(callback: any);
    constructor(id: string, callback: any);
    constructor(dependencies: any[], callback: any);
    constructor(id: string, dependencies: any[], callback: any);
}
export declare function setConfig(options: {
    core?: Core;
    amdPaths?: {
        [key: string]: string;
    };
    amdCaches?: {
        [key: string]: any;
    };
}): void;
export declare class Core {
    protected readonly _controllers: IControllers;
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
    checkPermission(request: Request): boolean;
    executeRequest<T>(request: Request, internal: boolean, success?: (data: T) => void, failure?: (error: Error) => void): Promise<T>;
    executeRequestToData<T>(request: Request, internal: boolean, toAmd: boolean, success?: (data: T) => void, failure?: (error: Error) => void): Promise<T>;
    entrance(req: IHttpRequest, res: http.ServerResponse, resolve: (data: any) => void, reject: (error: Error) => void): void;
    toUrl(request: Request, toAmd?: boolean, noArgs?: boolean): string;
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
