import api from "./axios";

export const createTrip = (formData) =>
  api.post("/api/trip/createTrip", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

/**
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} params.search
 */
export const getAllUserTripData = ({
  page = 1,
  limit = 15,
  search = "",
} = {}) =>
  api.get("/api/trip/myTrips/data", {
    withCredentials: true,
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  });
