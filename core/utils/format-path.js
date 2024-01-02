"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPath = void 0;
function formatPath(path, params) {
    if (!Object.keys(params))
        return path;
    let basePath = `${path}?`;
    for (const param of Object.keys(params)) {
        basePath += `${param}=${params[param]}&`;
    }
    return basePath;
}
exports.formatPath = formatPath;
