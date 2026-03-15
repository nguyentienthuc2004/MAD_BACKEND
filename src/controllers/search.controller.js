import searchService from "../services/search.service.js";

/**
 * Search users by username, full name, or keywords
 * GET /search/users?q=keyword
 */
export const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user?.userId;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await searchService.searchUsers(q, page, limit, currentUserId);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Search posts by caption, hashtags, or content
 * GET /search/posts?q=keyword
 */
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20, sortBy = "relevant" } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await searchService.searchPosts(q, page, limit, sortBy);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Search posts by hashtag
 * GET /search/hashtag?hashtag=keyword
 */
export const searchPostsByHashtag = async (req, res) => {
  try {
    const { hashtag, page = 1, limit = 20 } = req.query;

    if (!hashtag || hashtag.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Hashtag is required",
      });
    }

    const result = await searchService.searchPostsByHashtag(hashtag, page, limit);

    res.status(200).json({
      success: true,
      data: result.data,
      hashtag: result.hashtag,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error searching posts by hashtag:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get trending hashtags
 * GET /search/trending-hashtags
 */
export const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const data = await searchService.getTrendingHashtags(limit);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Global search (users, posts, hashtags)
 * GET /search/global?q=keyword
 */
export const globalSearch = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    const currentUserId = req.user?.userId;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const data = await searchService.globalSearch(q, limit, currentUserId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in global search:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export default {
  searchUsers,
  searchPosts,
  searchPostsByHashtag,
  getTrendingHashtags,
  globalSearch,
};
