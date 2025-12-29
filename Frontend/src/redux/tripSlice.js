import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  /* ---------------- META ---------------- */
  loading: false,
  error: null,

  pagination: {
    page: 1,
    limit: 15,
    hasMore: true,
    totalTrips: 0,
    search: "",
  },

  /* ---------------- TRIPS ---------------- */
  trips: {
    list: [], // paginated trips
    byId: {}, // normalized for O(1) access
  },

  activeTripId: null,

  /* ---------------- RELATED DATA ---------------- */
  expenses: {},
  tripPlans: {},
  tripActivities: {},
  tripChecklists: {},
  tripClosures: {},
  tripPhotos: {},
  tripPlaces: {},
  tripRoles: {},
  tripWallets: {},
};

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    /* ================= META ================= */
    setTripLoading(state, action) {
      state.loading = action.payload;
    },

    setTripError(state, action) {
      state.error = action.payload;
    },

    clearTripError(state) {
      state.error = null;
    },

    /* ================= PAGINATION ================= */
    resetPagination(state) {
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },

    setPaginationMeta(state, action) {
      const { page, hasMore, totalTrips, search } = action.payload;

      if (page !== undefined) state.pagination.page = page;
      if (hasMore !== undefined) state.pagination.hasMore = hasMore;
      if (totalTrips !== undefined) state.pagination.totalTrips = totalTrips;
      if (search !== undefined) state.pagination.search = search;
    },

    /* ================= TRIPS ================= */
    setTrips(state, action) {
      const trips = action.payload;

      state.trips.list = trips.map((t) => t._id);

      trips.forEach((trip) => {
        state.trips.byId[trip._id] = trip;
      });
    },

    appendTrips(state, action) {
      const trips = action.payload;

      trips.forEach((trip) => {
        if (!state.trips.byId[trip._id]) {
          state.trips.list.push(trip._id);
        }
        state.trips.byId[trip._id] = trip;
      });
    },

    addTrip(state, action) {
      const trip = action.payload;
      state.trips.list.unshift(trip._id);
      state.trips.byId[trip._id] = trip;
    },

    removeTrip(state, action) {
      const tripId = action.payload;
      state.trips.list = state.trips.list.filter((id) => id !== tripId);
      delete state.trips.byId[tripId];
    },

    /* ================= ACTIVE TRIP ================= */
    setActiveTrip(state, action) {
      state.activeTripId = action.payload;
    },

    clearActiveTrip(state) {
      state.activeTripId = null;
    },

    /* ================= RELATED DATA ================= */
    hydrateTripData(state, action) {
      const {
        expenses = [],
        tripPlans = [],
        tripActivities = [],
        tripChecklists = [],
        tripClosures = [],
        tripPhotos = [],
        tripPlaces = [],
        tripRoles = [],
        tripWallets = [],
      } = action.payload;

      const mapByTrip = (target, items) => {
        items.forEach((item) => {
          const tripId = item.trip;
          if (!target[tripId]) target[tripId] = [];
          target[tripId].push(item);
        });
      };

      mapByTrip(state.expenses, expenses);
      mapByTrip(state.tripPlans, tripPlans);
      mapByTrip(state.tripActivities, tripActivities);
      mapByTrip(state.tripChecklists, tripChecklists);
      mapByTrip(state.tripClosures, tripClosures);
      mapByTrip(state.tripPhotos, tripPhotos);
      mapByTrip(state.tripPlaces, tripPlaces);
      mapByTrip(state.tripRoles, tripRoles);

      tripWallets.forEach((wallet) => {
        state.tripWallets[wallet.trip] = wallet;
      });
    },

    clearTripState() {
      return initialState;
    },
  },
});

export const {
  setTripLoading,
  setTripError,
  clearTripError,
  resetPagination,
  setPaginationMeta,
  setTrips,
  appendTrips,
  addTrip,
  removeTrip,
  setActiveTrip,
  clearActiveTrip,
  hydrateTripData,
  clearTripState,
} = tripSlice.actions;

export default tripSlice.reducer;
