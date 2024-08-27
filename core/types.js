"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_TYPE = exports.Facade = void 0;
/**
 * Generic GAP Facade interface.
 * This supplies the GAP class with the necessary properties.
 */
class Facade {
    get eas() {
        return this._eas;
    }
}
exports.Facade = Facade;
/**
 * Valid remote storage types
 */
var STORAGE_TYPE;
(function (STORAGE_TYPE) {
    STORAGE_TYPE[STORAGE_TYPE["IPFS"] = 0] = "IPFS";
    STORAGE_TYPE[STORAGE_TYPE["ARWEAVE"] = 1] = "ARWEAVE";
    STORAGE_TYPE[STORAGE_TYPE["SWARM"] = 2] = "SWARM";
    STORAGE_TYPE[STORAGE_TYPE["UNKNOWN"] = 3] = "UNKNOWN";
})(STORAGE_TYPE || (exports.STORAGE_TYPE = STORAGE_TYPE = {}));
