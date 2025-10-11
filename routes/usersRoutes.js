import express from "express";
import usersController, { listAllUsers } from "../controllers/usersController.js";

const router = express.Router();
// POST /api/users - Register a new user
router.post("/", usersController.registerUser);
router.post("/login", usersController.loginUser); // Assuming you have a loginUser method in usersController
// PUT /api/users/:cedula - Update user information
router.put("/:cedula", usersController.updateUserInfo);
// DELETE /api/users/:cedula - Delete user
router.delete("/:cedula", usersController.deleteUserAccount);
// GET /api/users - List all users
router.get('/', listAllUsers);

export default router;
