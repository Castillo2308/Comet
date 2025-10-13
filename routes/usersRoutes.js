import express from "express";
import usersController, { listAllUsers } from "../controllers/usersController.js";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = express.Router();
// POST /api/users - Register a new user
router.post("/", usersController.registerUser);
router.post("/login", usersController.loginUser); // Assuming you have a loginUser method in usersController
// PUT /api/users/:cedula - Update user information
router.put("/:cedula", requireAuth, requireRole('admin'), usersController.updateUserInfo);
// DELETE /api/users/:cedula - Delete user
router.delete("/:cedula", requireAuth, requireRole('admin'), usersController.deleteUserAccount);
// GET /api/users - List all users
router.get('/', requireAuth, requireRole('admin','security','news','reports'), listAllUsers);

export default router;
