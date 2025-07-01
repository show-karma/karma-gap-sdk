"use strict";
/**
 * Basic SDK functionality test
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ethers_1 = require("ethers");
var viem_1 = require("viem");
var chains_1 = require("viem/chains");
var GAP_1 = require("./core/class/GAP");
function testBasicFunctionality() {
    return __awaiter(this, void 0, void 0, function () {
        var gap, projectSchema, grantSchema, ethersProvider, ethersSigner, multicallEthers, viemClient, multicallViem, addressesMatch, _a, isAddress, formatUnits, testAddress, oneEth, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("🧪 Testing Karma GAP SDK Basic Functionality\n");
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    // Test 1: GAP instance creation
                    console.log("1. Creating GAP instance...");
                    gap = new GAP_1.GAP({
                        globalSchemas: false,
                        network: "optimism-sepolia",
                    });
                    console.log("\u2705 GAP instance created for network: ".concat(gap.network));
                    console.log("\u2705 Loaded ".concat(gap.schemas.length, " schemas"));
                    // Test 2: Schema finding
                    console.log("\n2. Testing schema operations...");
                    projectSchema = gap.findSchema("Project");
                    console.log("\u2705 Found Project schema: ".concat(projectSchema.uid));
                    grantSchema = gap.findSchema("Grant");
                    console.log("\u2705 Found Grant schema: ".concat(grantSchema.uid));
                    // Test 3: Contract creation with ethers
                    console.log("\n3. Testing contract creation with ethers...");
                    ethersProvider = new ethers_1.ethers.JsonRpcProvider("https://sepolia.optimism.io");
                    ethersSigner = new ethers_1.ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000001", ethersProvider);
                    return [4 /*yield*/, GAP_1.GAP.getMulticall(ethersSigner)];
                case 2:
                    multicallEthers = _b.sent();
                    console.log("\u2705 Multicall contract created with ethers");
                    console.log("   Address: ".concat(multicallEthers.contractAddress));
                    // Test 4: Contract creation with viem
                    console.log("\n4. Testing contract creation with viem...");
                    viemClient = (0, viem_1.createPublicClient)({
                        chain: chains_1.optimismSepolia,
                        transport: (0, viem_1.http)("https://sepolia.optimism.io"),
                    });
                    return [4 /*yield*/, GAP_1.GAP.getMulticall(viemClient)];
                case 3:
                    multicallViem = _b.sent();
                    console.log("\u2705 Multicall contract created with viem");
                    console.log("   Address: ".concat(multicallViem.contractAddress));
                    // Test 5: Verify addresses match
                    console.log("\n5. Verifying contract addresses...");
                    addressesMatch = multicallEthers.contractAddress === multicallViem.contractAddress;
                    console.log("\u2705 Contract addresses match: ".concat(addressesMatch));
                    // Test 6: Type conversions
                    console.log("\n6. Testing type utilities...");
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("./core/utils/migration-helpers")); })];
                case 4:
                    _a = _b.sent(), isAddress = _a.isAddress, formatUnits = _a.formatUnits;
                    testAddress = "0x1234567890123456789012345678901234567890";
                    console.log("\u2705 isAddress(\"".concat(testAddress, "\"): ").concat(isAddress(testAddress)));
                    console.log("\u2705 isAddress(\"invalid\"): ".concat(isAddress("invalid")));
                    oneEth = "1000000000000000000";
                    console.log("\u2705 formatUnits(".concat(oneEth, ", 18): ").concat(formatUnits(oneEth, 18), " ETH"));
                    console.log("\n✅ All tests passed!");
                    return [2 /*return*/, true];
                case 5:
                    error_1 = _b.sent();
                    console.error("\n❌ Test failed:", error_1);
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testBasicFunctionality()
    .then(function (success) {
    process.exit(success ? 0 : 1);
})
    .catch(function (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
});
