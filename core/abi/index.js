"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.abis = void 0;
const AirdropNFT_json_1 = __importDefault(require("./AirdropNFT.json"));
const Allo_json_1 = __importDefault(require("./Allo.json"));
const AlloRegistry_json_1 = __importDefault(require("./AlloRegistry.json"));
const CommunityResolverABI_json_1 = __importDefault(require("./CommunityResolverABI.json"));
const Donations_json_1 = __importDefault(require("./Donations.json"));
const EAS_json_1 = __importDefault(require("./EAS.json"));
const MultiAttester_json_1 = __importDefault(require("./MultiAttester.json"));
const ProjectResolver_json_1 = __importDefault(require("./ProjectResolver.json"));
const SchemaRegistry_json_1 = __importDefault(require("./SchemaRegistry.json"));
exports.abis = {
    AirdropNFT: AirdropNFT_json_1.default,
    Allo: Allo_json_1.default,
    AlloRegistry: AlloRegistry_json_1.default,
    CommunityResolverABI: CommunityResolverABI_json_1.default,
    Donations: Donations_json_1.default,
    EAS: EAS_json_1.default,
    MultiAttester: MultiAttester_json_1.default,
    ProjectResolver: ProjectResolver_json_1.default,
    SchemaRegistry: SchemaRegistry_json_1.default,
};
