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
export const getMusicById = async (req, res) => {
  try {
    const { id } = req.params;
    const music = await Music.findById(id);
    if (!music) {
      return res.status(404).json({ success: false, message: "Music not found" });
    }
      res.status(200).json({ success: true, data: music });
  } catch (error) {
    console.error("Error fetching music by ID:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}