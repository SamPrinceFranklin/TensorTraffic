module.exports = {

"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"405bbe91130606ed9b9d33a6350719f17e88c55e52":"getPlaceDetails","40f6d396131894164369286ef0a548b72c587e6d6b":"findNearbySchools","703d691f6a2d8afc25d950676f09476be54bcf8a08":"autocompletePlaces"},"",""] */ __turbopack_context__.s({
    "autocompletePlaces": (()=>autocompletePlaces),
    "findNearbySchools": (()=>findNearbySchools),
    "getPlaceDetails": (()=>getPlaceDetails)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function autocompletePlaces(query, location, types) {
    const apiKey = ("TURBOPACK compile-time value", "AIzaSyALeVX7nnyw8fbIzPZLu-rkyMy5MlgWi5o");
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    }
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
    };
    const body = JSON.stringify({
        input: query,
        includedPrimaryTypes: types,
        ...location && {
            locationRestriction: {
                circle: {
                    center: {
                        latitude: location.lat,
                        longitude: location.lng
                    },
                    radius: 10000.0
                }
            }
        }
    });
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        const data = await response.json();
        if (data.error || !data.suggestions) {
            return {
                success: false,
                error: `Places Autocomplete error: ${data.error?.message || 'No results'}`
            };
        }
        const predictions = data.suggestions.map((prediction)=>({
                placeId: prediction.placeId,
                description: prediction.text.text
            }));
        return {
            success: true,
            data: predictions
        };
    } catch (e) {
        console.error("Error fetching autocomplete places:", e);
        return {
            success: false,
            error: 'An unknown error occurred while fetching autocomplete results.'
        };
    }
}
async function getPlaceDetails(placeId) {
    const apiKey = ("TURBOPACK compile-time value", "AIzaSyALeVX7nnyw8fbIzPZLu-rkyMy5MlgWi5o");
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    }
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,formattedAddress,location'
    };
    try {
        const response = await fetch(url, {
            headers
        });
        const data = await response.json();
        if (data.error) {
            return {
                success: false,
                error: `Place Details error: ${data.error?.message || 'Not found'}`
            };
        }
        const details = {
            name: data.displayName.text,
            address: data.formattedAddress,
            location: {
                lat: data.location.latitude,
                lng: data.location.longitude
            }
        };
        return {
            success: true,
            data: details
        };
    } catch (e) {
        console.error("Error fetching place details:", e);
        return {
            success: false,
            error: 'An unknown error occurred while fetching place details.'
        };
    }
}
async function findNearbySchools(location) {
    const apiKey = ("TURBOPACK compile-time value", "AIzaSyALeVX7nnyw8fbIzPZLu-rkyMy5MlgWi5o");
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    }
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
    };
    const body = JSON.stringify({
        includedTypes: [
            "school",
            "primary_school",
            "secondary_school"
        ],
        maxResultCount: 10,
        locationRestriction: {
            circle: {
                center: {
                    latitude: location.lat,
                    longitude: location.lng
                },
                radius: 5000.0
            }
        }
    });
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        const data = await response.json();
        if (data.error || !data.places) {
            return {
                success: false,
                error: `Places API error: ${data.error?.message || 'No results'}`
            };
        }
        const schools = data.places.map((school)=>({
                place_id: school.id,
                name: school.displayName.text,
                vicinity: school.formattedAddress,
                location: {
                    lat: school.location.latitude,
                    lng: school.location.longitude
                }
            }));
        return {
            success: true,
            data: schools
        };
    } catch (e) {
        console.error("Error fetching nearby schools:", e);
        return {
            success: false,
            error: 'An unknown error occurred while fetching schools.'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    autocompletePlaces,
    getPlaceDetails,
    findNearbySchools
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(autocompletePlaces, "703d691f6a2d8afc25d950676f09476be54bcf8a08", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getPlaceDetails, "405bbe91130606ed9b9d33a6350719f17e88c55e52", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(findNearbySchools, "40f6d396131894164369286ef0a548b72c587e6d6b", null);
}}),
"[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"605c475562d35e360b80be5744d708475ce6db66b6":"getDirections"},"",""] */ __turbopack_context__.s({
    "getDirections": (()=>getDirections)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
function getTrafficStatus(duration, durationInTraffic) {
    const ratio = durationInTraffic / duration;
    if (ratio < 1.2) return 'light';
    if (ratio < 1.6) return 'moderate';
    return 'heavy';
}
async function getDirections(origin, destination) {
    const apiKey = ("TURBOPACK compile-time value", "AIzaSyALeVX7nnyw8fbIzPZLu-rkyMy5MlgWi5o");
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    }
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', `${origin.lat},${origin.lng}`);
    url.searchParams.append('destination', `${destination.lat},${destination.lng}`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('departure_time', 'now');
    try {
        const response = await fetch(url.toString());
        const data = await response.json();
        if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
            return {
                success: false,
                error: `Directions API error: ${data.status} - ${data.error_message || 'No routes found.'}`
            };
        }
        const route = data.routes[0];
        const leg = route.legs[0];
        if (!leg.distance || !leg.duration || !leg.duration_in_traffic) {
            return {
                success: false,
                error: 'Directions response missing required fields.'
            };
        }
        const trafficStatus = getTrafficStatus(leg.duration.value, leg.duration_in_traffic.value);
        const details = {
            distance: leg.distance.text,
            duration: leg.duration.text,
            durationInTraffic: leg.duration_in_traffic.text,
            summary: route.summary,
            polyline: route.overview_polyline.points,
            trafficStatus
        };
        return {
            success: true,
            data: details
        };
    } catch (e) {
        console.error("Error fetching directions:", e);
        return {
            success: false,
            error: 'An unknown error occurred while fetching directions.'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getDirections
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getDirections, "605c475562d35e360b80be5744d708475ce6db66b6", null);
}}),
"[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/places-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)");
;
;
;
}}),
"[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/places-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$parental$2d$alerts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "405bbe91130606ed9b9d33a6350719f17e88c55e52": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPlaceDetails"]),
    "605c475562d35e360b80be5744d708475ce6db66b6": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDirections"]),
    "703d691f6a2d8afc25d950676f09476be54bcf8a08": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["autocompletePlaces"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/places-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$parental$2d$alerts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "405bbe91130606ed9b9d33a6350719f17e88c55e52": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$parental$2d$alerts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["405bbe91130606ed9b9d33a6350719f17e88c55e52"]),
    "605c475562d35e360b80be5744d708475ce6db66b6": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$parental$2d$alerts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["605c475562d35e360b80be5744d708475ce6db66b6"]),
    "703d691f6a2d8afc25d950676f09476be54bcf8a08": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$parental$2d$alerts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["703d691f6a2d8afc25d950676f09476be54bcf8a08"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$parental$2d$alerts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$parental$2d$alerts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$directions$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/parental-alerts/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/directions-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/app/parental-alerts/page.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/parental-alerts/page.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/parental-alerts/page.tsx <module evaluation>", "default");
}}),
"[project]/src/app/parental-alerts/page.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/parental-alerts/page.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/parental-alerts/page.tsx", "default");
}}),
"[project]/src/app/parental-alerts/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$parental$2d$alerts$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/parental-alerts/page.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$parental$2d$alerts$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/app/parental-alerts/page.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$parental$2d$alerts$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/parental-alerts/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/parental-alerts/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=_66594116._.js.map