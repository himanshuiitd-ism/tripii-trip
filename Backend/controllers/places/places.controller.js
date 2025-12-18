import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Place } from "../../models/places/searchedPlaces.model.js";
import { getNewsFromApi } from "./news.controller.js";
import { getHeroImageFromApi } from "./images.controller.js";

/* -------------------------------------------------
 * CACHE CHECK
 * ------------------------------------------------- */
const presentInDb = async (place, field) => {
  try {
    const cachedPlace = await Place.findOne({ place });
    if (cachedPlace && cachedPlace[field]) {
      console.log(`✅ Cache hit: ${field} for ${place}`);
      return { isFound: true, data: cachedPlace };
    }
    return { isFound: false, data: null };
  } catch (err) {
    console.error("DB error:", err);
    return { isFound: false, data: null };
  }
};

/* -------------------------------------------------
 * GET PLACE NEWS
 * ------------------------------------------------- */
export const getNews = asyncHandler(async (req, res) => {
  const placeRaw = req.query.place;
  if (!placeRaw) {
    throw new ApiError(400, "Place parameter is required");
  }

  const place = placeRaw.trim().toLowerCase();

  const { isFound, data } = await presentInDb(place, "newsData");

  // 🔁 CACHE HIT
  if (isFound && data.newsData) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, data.newsData, `Place news fetched from cache`)
      );
  }

  // 🌍 API FETCH + FILTER
  const apiResponse = await getNewsFromApi(place);

  // 💾 CACHE FILTERED DATA
  await Place.findOneAndUpdate(
    { place },
    { newsData: apiResponse },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, apiResponse, `Place news fetched successfully`));
});

/* -------------------------------------------------
 * GET HERO IMAGE
 * ------------------------------------------------- */
export const getHeroImage = asyncHandler(async (req, res) => {
  const placeRaw = req.query.place;
  if (!placeRaw) {
    throw new ApiError(400, "Place parameter is required");
  }

  const place = placeRaw.trim().toLowerCase();

  const { isFound, data } = await presentInDb(place, "heroImageUrl");

  if (isFound && data.heroImageUrl) {
    return res
      .status(200)
      .json(new ApiResponse(200, data.heroImageUrl, "Hero image from cache"));
  }

  const apiResponse = await getHeroImageFromApi(place);

  await Place.findOneAndUpdate(
    { place },
    { heroImageUrl: apiResponse },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, apiResponse, "Hero image fetched successfully"));
});
