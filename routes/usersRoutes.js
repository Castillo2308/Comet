import express from "express";
import usersController from "../controllers/usersController.js";

const router = express.Router();
// POST /api/users - Register a new user
router.post("/", usersController.registerUser);
router.post("/login", usersController.loginUser); // Assuming you have a loginUser method in usersController

export default router;
