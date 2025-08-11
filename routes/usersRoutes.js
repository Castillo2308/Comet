import express from "express";
import usersController from "../controllers/usersController.js";

const router = express.Router();
// POST /api/users - Register a new user
router.post("/", usersController.registerUser);

export default router;
