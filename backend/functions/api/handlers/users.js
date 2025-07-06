// Fixed users.js - Using proper CORS responses
const { getCurrentUser } = require("../middleware/auth");
const { successResponse, errorResponse } = require("../utils/responses");  // 🔧 ADDED: Import CORS responses

const handleGetUser = async (queryParams, event, user = null) => {
    const currentUser = user || await getCurrentUser(event);
    if (!currentUser) {
        return errorResponse("Unauthorized", 401);  // 🔧 FIXED: Use errorResponse with CORS
    }
    return successResponse({ user: currentUser });  // 🔧 FIXED: Use successResponse with CORS
};

const handleUpdateUser = async (body, event, user = null) => {
    const currentUser = user || await getCurrentUser(event);
    if (!currentUser) {
        return errorResponse("Unauthorized", 401);  // 🔧 FIXED: Use errorResponse with CORS
    }
    return successResponse({ message: "Update not implemented" });  // 🔧 FIXED: Use successResponse with CORS
};

const handleGetUserProtocols = async (queryParams, event, user = null) => {
    const currentUser = user || await getCurrentUser(event);
    if (!currentUser) {
        return errorResponse("Unauthorized", 401);  // 🔧 FIXED: Use errorResponse with CORS
    }
    return successResponse({ protocols: [] });  // 🔧 FIXED: Use successResponse with CORS
};

const handleGetUserPreferences = async (queryParams, event, user = null) => {
    const currentUser = user || await getCurrentUser(event);
    if (!currentUser) {
        return errorResponse("Unauthorized", 401);  // 🔧 FIXED: Use errorResponse with CORS
    }
    return successResponse({ preferences: {} });  // 🔧 FIXED: Use successResponse with CORS
};

const handleUpdateUserPreferences = async (body, event, user = null) => {
    const currentUser = user || await getCurrentUser(event);
    if (!currentUser) {
        return errorResponse("Unauthorized", 401);  // 🔧 FIXED: Use errorResponse with CORS
    }
    return successResponse({ message: "Preferences updated" });  // 🔧 FIXED: Use successResponse with CORS
};

module.exports = {
    handleGetUser,
    handleUpdateUser,
    handleGetUserProtocols,
    handleGetUserPreferences,
    handleUpdateUserPreferences
};