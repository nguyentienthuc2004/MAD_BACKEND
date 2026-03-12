import Music from "../models/Music.model.js";
export const getAllMusics = async (req, res) => {
  try {
    // Fetch music data from the database
    const musics = await Music.find(); // Assuming you have a Music model
    res.status(200).json({ success: true, data: musics });
  } catch (error) {
    console.error("Error fetching musics:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}