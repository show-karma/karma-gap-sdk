"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Facade = void 0;
// | "arbitrum"
// | 'sepolia';y
/**
 * Generic GAP Facade interface.
 * This supplies the GAP class with the necessary properties.
 */
class Facade {
    static get eas() {
        return this._eas;
    }
}
exports.Facade = Facade;
