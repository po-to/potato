export interface IRequest{
    parent: IRequest;
    controller: string;
    action: string;
    path?: string;
    args:{ [key: string]: any };
    beCache:boolean;
    url?:string;
    toUrl(toAmd?:boolean, noArgs?:boolean): string;
    getCore():ICore;
    getRoot():IRequest;
    setResponse(data:any);
    setHeader(name:string,value:string|string[]);

}

export interface IAMD{
    id:string;
    dependencies:IRequest|string|any[];
    callback:Function|any;    
}
export interface IApiRequest {
    context: IRequest;
}
export interface IController {
    __args_Item?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    __args_Update?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    __args_Create?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    __args_Delete?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    __args_ItemList?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    __args_UpdateList?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    __args_CreateList?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    __args_DeleteList?(ars: {[key: string]: any}, request: IRequest): { [key: string]: any };
    Item?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
    Update?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
    Create?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
    Delete?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
    ItemList?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
    UpdateList?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
    CreateList?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
    DeleteList?(request: IRequest, args: any, resolve: (data: any) => void, reject: (error: Error) => void);
}

export interface ICore {
    routing(str: string, method: string, data?: any): {controller:string, action:string, path:string, args:any} | null;
    hasController(path: string, isInternal: boolean): boolean;
    hasAction(controller: string, action: string, isInternal: boolean): boolean;
    getController(path: string, isInternal: boolean): IController | null;
    checkPermission(request: IRequest): boolean;
    executeRequest<T>(request: IRequest, internal:boolean, success?: (data:T) => void, failure?: (error: Error) => void);
    executeRequestToData<T>(request: IRequest, internal:boolean, toAmd:boolean, success?: (data:T) => void, failure?: (error: Error) => void);
    toUrl(request: IRequest, toAmd?:boolean, noArgs?:boolean): string;
    callApi<T>(requestOptions: IApiRequest, succss?: (data: T) => void, fail?: (error: Error) => void)
}
