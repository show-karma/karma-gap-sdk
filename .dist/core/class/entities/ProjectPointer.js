"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectPointer = void 0;
const Attestation_1 = require("../Attestation");
const AllGapSchemas_1 = require("../AllGapSchemas");
const consts_1 = require("../../../core/consts");
class ProjectPointer extends Attestation_1.Attestation {
    static from(attestations, network) {
        return attestations.map((attestation) => {
            const projectUpdate = new ProjectPointer({
                ...attestation,
                data: {
                    ...attestation.data,
                },
                schema: new AllGapSchemas_1.AllGapSchemas().findSchema("ProjectUpdate", consts_1.chainIdToNetwork[attestation.chainID]),
                chainID: attestation.chainID,
            });
            return projectUpdate;
        });
    }
}
exports.ProjectPointer = ProjectPointer;
