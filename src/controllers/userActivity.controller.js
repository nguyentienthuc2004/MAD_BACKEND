import UserActivity from "../models/userActivity.model.js";

export const purgeViewActivities = async (req, res) => {
  try {
    const result = await UserActivity.deleteMany({ activity_type: "view" });
    return res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount ?? 0,
      },
    });
  } catch (error) {
    console.error("purgeViewActivities error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default {
  purgeViewActivities,
};
