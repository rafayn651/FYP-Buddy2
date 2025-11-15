import express from "express";
import {
  sendRequest,
  getRequestsForSupervisor,
  updateRequestStatus,
  getMyGroups,
} from "../controllers/supervisorRequestController.js";
import { isAuthenticated , authorizeRoles} from "../middleware/isAuthenticated.js"

const router = express.Router();

router.post("/send-request",isAuthenticated, authorizeRoles("student"), sendRequest);
router.get("/get-requests", isAuthenticated, authorizeRoles("supervisor"), getRequestsForSupervisor);
router.put("/respond/:requestId",isAuthenticated,authorizeRoles("supervisor"), updateRequestStatus);
router.get("/my-groups", isAuthenticated, authorizeRoles("supervisor"), getMyGroups);

export default router;
